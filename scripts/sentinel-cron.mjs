#!/usr/bin/env node

/**
 * =============================================================================
 * SELALU AKTIF - Headless Cloud & Local Sentinel Runner
 * Eksekutor otomatis transaksi database WAL untuk mencegah auto-pause Supabase.
 * Mendukung sinkronisasi langsung dari Supabase Master Hub (sentinel_registry).
 * Dijalankan via GitHub Actions Cron atau lokal `npm run cron`.
 * =============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';

// Browser User-Agent pool simulating authentic desktop browsers
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function sanitizeUrl(raw) {
  let u = (raw || '').trim();
  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    u = `https://${u}`;
  }
  return u.replace(/\/+$/, '');
}

/**
 * Fetch projects from Master Hub (if configured)
 */
async function loadProjectsFromMasterHub(masterUrl, masterKey) {
  try {
    const cleanUrl = sanitizeUrl(masterUrl);
    const key = masterKey.trim();
    const endpoint = `${cleanUrl}/rest/v1/sentinel_registry?select=*`;

    console.log(`🌐 Mengambil daftar proyek dari Master Hub: ${cleanUrl}...`);

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'User-Agent': getRandomUserAgent(),
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const rows = await res.json();
    console.log(`✅ Berhasil memuat ${rows.length} proyek dari Master Hub.\n`);

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      url: r.url,
      anonKey: r.anon_key,
      serviceRoleKey: r.service_role_key || undefined,
      targetTable: r.target_table || '_heartbeat',
      targetMode: r.target_mode || 'wal_mutation',
    }));
  } catch (err) {
    console.error('❌ Gagal membaca dari Master Hub:', err.message);
    return null;
  }
}

/**
 * Update project health and latency back to Master Hub
 */
async function updateMasterHubStatus(masterUrl, masterKey, projectResult) {
  try {
    const cleanUrl = sanitizeUrl(masterUrl);
    const key = masterKey.trim();

    // 1. Update sentinel_registry
    const updateEndpoint = `${cleanUrl}/rest/v1/sentinel_registry?id=eq.${encodeURIComponent(projectResult.id)}`;
    await fetch(updateEndpoint, {
      method: 'PATCH',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: projectResult.ok ? 'healthy' : 'paused',
        last_ping_at: new Date().toISOString(),
        last_latency_ms: projectResult.latency,
        last_status_code: projectResult.status,
        last_status_text: projectResult.ok ? 'OK' : 'Error',
        last_error: projectResult.ok ? null : projectResult.detail,
        updated_at: new Date().toISOString(),
      }),
    });

    // 2. Insert to sentinel_logs
    const logEndpoint = `${cleanUrl}/rest/v1/sentinel_logs`;
    await fetch(logEndpoint, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        id: `log-cron-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        project_id: projectResult.id,
        project_name: projectResult.name,
        success: projectResult.ok,
        status_code: projectResult.status,
        latency_ms: projectResult.latency,
        mode: projectResult.mode,
        details: projectResult.detail,
        error_message: projectResult.ok ? null : projectResult.detail,
        created_at: new Date().toISOString(),
      }),
    });
  } catch (err) {
    // Non-blocking log update
    console.warn(`   ⚠️ Gagal mencatat status ke Master Hub untuk ${projectResult.name}:`, err.message);
  }
}

// Load project configurations
async function loadProjects() {
  // Auto-detect .env.local if present locally
  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    try {
      const envRaw = fs.readFileSync(envLocalPath, 'utf-8');
      for (const line of envRaw.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const k = trimmed.substring(0, idx).trim();
          const v = trimmed.substring(idx + 1).trim();
          if (!process.env[k]) process.env[k] = v;
        }
      }
    } catch {}
  }

  const masterUrl = process.env.MASTER_SUPABASE_URL || process.env.VITE_MASTER_SUPABASE_URL;
  const masterKey =
    process.env.MASTER_SUPABASE_KEY ||
    process.env.MASTER_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_MASTER_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.MASTER_SUPABASE_ANON_KEY ||
    process.env.VITE_MASTER_SUPABASE_ANON_KEY;

  // 1. Master Hub Mode (Recommended)
  if (masterUrl && masterKey) {
    const fromMaster = await loadProjectsFromMasterHub(masterUrl, masterKey);
    if (fromMaster && fromMaster.length > 0) {
      return { projects: fromMaster, masterUrl, masterKey };
    }
  }

  // 2. Fallback: Check environment variable SENTINEL_PROJECTS
  if (process.env.SENTINEL_PROJECTS) {
    try {
      console.log('📦 Membaca konfigurasi dari environment variable SENTINEL_PROJECTS...');
      return { projects: JSON.parse(process.env.SENTINEL_PROJECTS) };
    } catch (err) {
      console.error('❌ Gagal mem-parse JSON dari SENTINEL_PROJECTS:', err.message);
    }
  }

  // 3. Fallback: Check local file sentinel-config.json
  const localFile = path.resolve(process.cwd(), 'sentinel-config.json');
  if (fs.existsSync(localFile)) {
    try {
      console.log(`📁 Membaca konfigurasi lokal dari ${localFile}...`);
      const raw = fs.readFileSync(localFile, 'utf-8');
      return { projects: JSON.parse(raw) };
    } catch (err) {
      console.error('❌ Gagal membaca file sentinel-config.json:', err.message);
    }
  }

  console.warn('⚠️ Tidak ada konfigurasi proyek yang ditemukan.');
  console.warn('   Silakan setel MASTER_SUPABASE_URL & KEY, atau SENTINEL_PROJECTS.');
  return { projects: [] };
}

async function sendAlertIfConfigured(message) {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;
  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (telegramBotToken && telegramChatId) {
    try {
      const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });
    } catch (e) {
      console.error('Gagal mengirim Telegram alert:', e.message);
    }
  }

  if (discordWebhookUrl) {
    try {
      await fetch(discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message }),
      });
    } catch (e) {
      console.error('Gagal mengirim Discord alert:', e.message);
    }
  }
}

async function pingProject(project) {
  const cleanUrl = sanitizeUrl(project.url);
  const targetTable = (project.targetTable || '_heartbeat').trim();
  const apiKey = (project.serviceRoleKey || project.anonKey || '').trim();
  const userAgent = getRandomUserAgent();
  const nonce = Math.random().toString(36).substring(2, 9);
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  const headers = {
    'apikey': apiKey,
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'User-Agent': userAgent,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'X-Client-Info': 'selalu-aktif-cron/1.0',
  };

  const mode = project.targetMode || 'wal_mutation';

  try {
    let res;
    let detail = '';

    if (mode === 'wal_mutation') {
      const endpoint = `${cleanUrl}/rest/v1/${targetTable}`;
      const payload = {
        id: 'sentinel-heartbeat-pulse',
        updated_at: timestamp,
        heartbeat_source: 'GITHUB_ACTIONS_CRON',
        system_nonce: nonce,
      };

      res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'resolution=merge-duplicates, return=minimal',
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 404 || res.status === 401 || res.status === 403) {
        // Fallback to dynamic count read
        const fallbackEndpoint = `${cleanUrl}/rest/v1/${targetTable}?select=*&limit=1`;
        res = await fetch(fallbackEndpoint, {
          method: 'GET',
          headers: { ...headers, 'Prefer': 'count=exact' },
        });
        detail = `Fallback read '${targetTable}' (HTTP ${res.status})`;
      } else {
        detail = `WAL transaction recorded (HTTP ${res.status})`;
      }
    } else {
      const endpoint = `${cleanUrl}/rest/v1/${targetTable}?select=*&limit=1`;
      res = await fetch(endpoint, {
        method: 'GET',
        headers: { ...headers, 'Prefer': 'count=exact' },
      });
      detail = `Dynamic count read executed (HTTP ${res.status})`;
    }

    const latency = Date.now() - startTime;
    const ok = res.ok || res.status === 204 || res.status === 201;

    return {
      id: project.id,
      name: project.name,
      ok,
      status: res.status,
      latency,
      mode,
      detail,
    };
  } catch (err) {
    const latency = Date.now() - startTime;
    return {
      id: project.id,
      name: project.name,
      ok: false,
      status: 0,
      latency,
      mode,
      detail: `Koneksi gagal: ${err.message}`,
    };
  }
}

async function main() {
  console.log('\n===============================================================');
  console.log('🚀 SELALU AKTIF — Organic Heartbeat Sentinel Engine');
  console.log(`⏰ Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })} WITA`);
  console.log('===============================================================\n');

  const { projects, masterUrl, masterKey } = await loadProjects();
  if (!projects || projects.length === 0) {
    console.log('Selesai (tanpa target proyek).');
    process.exit(0);
  }

  console.log(`Menyapa ${projects.length} database target secara organik...\n`);

  let successCount = 0;
  let failCount = 0;
  const failedProjects = [];

  for (let i = 0; i < projects.length; i++) {
    const proj = projects[i];
    console.log(`[${i + 1}/${projects.length}] Memeriksa "${proj.name}"...`);

    const result = await pingProject(proj);

    if (result.ok) {
      successCount++;
      console.log(`   🟢 SEHAT | Latensi: ${result.latency}ms | ${result.detail}`);
    } else {
      failCount++;
      failedProjects.push(proj.name);
      console.log(`   🔴 GAGAL | HTTP ${result.status} | ${result.detail}`);
    }

    // If connected to Master Hub, update registry & write log
    if (masterUrl && masterKey) {
      await updateMasterHubStatus(masterUrl, masterKey, result);
    }

    // Jitter delay antara 500ms - 1500ms
    if (i < projects.length - 1) {
      const jitter = Math.floor(Math.random() * 1000) + 500;
      await new Promise((r) => setTimeout(r, jitter));
    }
  }

  console.log('\n===============================================================');
  console.log(`📊 Ringkasan: ${successCount} Berhasil, ${failCount} Gagal`);
  console.log('===============================================================\n');

  if (failCount > 0) {
    const alertMsg = `⚠️ <b>SELALU AKTIF Alert</b>\nTerdeteksi ${failCount} proyek Supabase tidak merespons:\n• ${failedProjects.join('\n• ')}\nSilakan periksa segera agar database tidak ter-pause!`;
    await sendAlertIfConfigured(alertMsg);
  }
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
