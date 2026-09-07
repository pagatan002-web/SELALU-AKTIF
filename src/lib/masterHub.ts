import type { SupabaseProject, PingLog } from '../types/sentinel';
import { sanitizeSupabaseUrl } from './sentinel';

const MASTER_HUB_STORAGE_KEY = 'selalu_aktif_master_hub_v1';

export interface MasterHubConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  connectedAt?: string;
  lastSyncAt?: string;
}

export function getStoredMasterHub(): MasterHubConfig | null {
  try {
    const raw = localStorage.getItem(MASTER_HUB_STORAGE_KEY);
    if (raw) return JSON.parse(raw);

    // Fallback: Check Vite environment variables (.env.local)
    const envUrl = import.meta.env.VITE_MASTER_SUPABASE_URL;
    const envKey = 
      import.meta.env.VITE_MASTER_SUPABASE_SERVICE_ROLE_KEY || 
      import.meta.env.VITE_MASTER_SUPABASE_ANON_KEY;

    if (envUrl && envKey) {
      return {
        url: envUrl.trim(),
        anonKey: envKey.trim(),
        serviceRoleKey: import.meta.env.VITE_MASTER_SUPABASE_SERVICE_ROLE_KEY?.trim() || undefined,
        connectedAt: new Date().toISOString(),
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function saveMasterHub(config: MasterHubConfig | null): void {
  try {
    if (config) {
      localStorage.setItem(MASTER_HUB_STORAGE_KEY, JSON.stringify(config));
    } else {
      localStorage.removeItem(MASTER_HUB_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Gagal menyimpan konfigurasi Master Hub:', err);
  }
}

// Convert SupabaseProject to PostgreSQL snake_case row
function toRegistryRow(project: SupabaseProject) {
  return {
    id: project.id,
    name: project.name,
    url: project.url,
    anon_key: project.anonKey,
    service_role_key: project.serviceRoleKey || null,
    target_table: project.targetTable || '_heartbeat',
    target_mode: project.targetMode || 'wal_mutation',
    status: project.status || 'healthy',
    last_ping_at: project.lastPingAt || null,
    last_latency_ms: project.lastLatencyMs || null,
    last_status_code: project.lastStatusCode || null,
    last_status_text: project.lastStatusText || null,
    last_error: project.lastError || null,
    notes: project.notes || null,
    updated_at: new Date().toISOString(),
  };
}

// Convert PostgreSQL snake_case row to SupabaseProject
function fromRegistryRow(row: any): SupabaseProject {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    anonKey: row.anon_key,
    serviceRoleKey: row.service_role_key || undefined,
    targetTable: row.target_table || '_heartbeat',
    targetMode: row.target_mode || 'wal_mutation',
    status: row.status || 'healthy',
    lastPingAt: row.last_ping_at || undefined,
    lastLatencyMs: row.last_latency_ms || undefined,
    lastStatusCode: row.last_status_code || undefined,
    lastStatusText: row.last_status_text || undefined,
    lastError: row.last_error || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function getMasterHeaders(apiKey: string): Record<string, string> {
  return {
    'apikey': apiKey,
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'X-Client-Info': 'selalu-aktif-master-hub/1.0',
  };
}

/**
 * Test if the Master Hub database is reachable and table sentinel_registry exists
 */
export async function testMasterConnection(
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string; tableReady: boolean }> {
  try {
    const cleanUrl = sanitizeSupabaseUrl(url);
    const key = anonKey.trim();
    
    // Valid PostgREST query: select=id&limit=1 (NO custom query params like _t to avoid PGRST100)
    const endpoint = `${cleanUrl}/rest/v1/sentinel_registry?select=id&limit=1`;

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        ...getMasterHeaders(key),
        'Prefer': 'count=exact',
      },
    });

    if (res.ok) {
      return {
        success: true,
        message: 'Koneksi ke Master Hub Berhasil! Tabel sentinel_registry siap digunakan.',
        tableReady: true,
      };
    } else if (res.status === 404) {
      return {
        success: false,
        message: 'Koneksi tersambung, tetapi tabel "sentinel_registry" belum dibuat di Supabase SQL Editor.',
        tableReady: false,
      };
    } else if (res.status === 401 || res.status === 403) {
      return {
        success: false,
        message: 'Kunci Anon Key tidak valid atau diblokir oleh RLS policy Supabase.',
        tableReady: false,
      };
    } else {
      const errText = await res.text();
      return {
        success: false,
        message: `HTTP ${res.status}: ${errText.substring(0, 100)}`,
        tableReady: false,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal terhubung: ${err.message || 'Network Error / URL salah'}`,
      tableReady: false,
    };
  }
}

/**
 * Fetch all projects from Master Hub central table
 */
export async function fetchProjectsFromMaster(
  config: MasterHubConfig
): Promise<SupabaseProject[]> {
  const cleanUrl = sanitizeSupabaseUrl(config.url);
  const key = (config.serviceRoleKey || config.anonKey).trim();
  const endpoint = `${cleanUrl}/rest/v1/sentinel_registry?select=*&order=created_at.desc`;

  const res = await fetch(endpoint, {
    method: 'GET',
    headers: getMasterHeaders(key),
  });

  if (!res.ok) {
    throw new Error(`Gagal memuat proyek dari Master Hub (HTTP ${res.status})`);
  }

  const data = await res.json();
  return (data || []).map(fromRegistryRow);
}

/**
 * Upsert project to Master Hub
 */
export async function upsertProjectToMaster(
  config: MasterHubConfig,
  project: SupabaseProject
): Promise<void> {
  const cleanUrl = sanitizeSupabaseUrl(config.url);
  const key = (config.serviceRoleKey || config.anonKey).trim();
  const endpoint = `${cleanUrl}/rest/v1/sentinel_registry`;

  const payload = toRegistryRow(project);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      ...getMasterHeaders(key),
      'Prefer': 'resolution=merge-duplicates, return=representation',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal menyimpan ke Master Hub: ${errText}`);
  }
}

/**
 * Delete project from Master Hub
 */
export async function deleteProjectFromMaster(
  config: MasterHubConfig,
  projectId: string
): Promise<void> {
  const cleanUrl = sanitizeSupabaseUrl(config.url);
  const key = (config.serviceRoleKey || config.anonKey).trim();
  const endpoint = `${cleanUrl}/rest/v1/sentinel_registry?id=eq.${encodeURIComponent(projectId)}`;

  const res = await fetch(endpoint, {
    method: 'DELETE',
    headers: getMasterHeaders(key),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal menghapus dari Master Hub: ${errText}`);
  }
}

/**
 * Save an audit log to Master Hub sentinel_logs table
 */
export async function recordLogToMaster(
  config: MasterHubConfig,
  log: PingLog
): Promise<void> {
  try {
    const cleanUrl = sanitizeSupabaseUrl(config.url);
    const key = (config.serviceRoleKey || config.anonKey).trim();
    const endpoint = `${cleanUrl}/rest/v1/sentinel_logs`;

    const payload = {
      id: log.id,
      project_id: log.projectId,
      project_name: log.projectName,
      success: log.success,
      status_code: log.statusCode,
      latency_ms: log.latencyMs,
      mode: log.mode,
      details: log.details || null,
      error_message: log.error || null,
      created_at: log.timestamp || new Date().toISOString(),
    };

    await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...getMasterHeaders(key),
        'Prefer': 'resolution=merge-duplicates, return=minimal',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Gagal mencatat log ke Master Hub:', err);
  }
}

/**
 * Fetch logs from Master Hub
 */
export async function fetchLogsFromMaster(
  config: MasterHubConfig
): Promise<PingLog[]> {
  try {
    const cleanUrl = sanitizeSupabaseUrl(config.url);
    const key = (config.serviceRoleKey || config.anonKey).trim();
    const endpoint = `${cleanUrl}/rest/v1/sentinel_logs?select=*&order=created_at.desc&limit=50`;

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: getMasterHeaders(key),
    });

    if (!res.ok) return [];
    const rows = await res.json();

    return (rows || []).map((r: any) => ({
      id: r.id,
      projectId: r.project_id,
      projectName: r.project_name,
      success: r.success,
      statusCode: r.status_code,
      statusText: r.success ? 'OK' : 'Error',
      latencyMs: r.latency_ms,
      mode: r.mode || 'wal_mutation',
      timestamp: r.created_at,
      details: r.details || '',
      error: r.error_message || undefined,
    }));
  } catch {
    return [];
  }
}

/**
 * Migrate local projects into Master Hub
 */
export async function migrateLocalToMaster(
  config: MasterHubConfig,
  projects: SupabaseProject[]
): Promise<number> {
  let count = 0;
  for (const proj of projects) {
    await upsertProjectToMaster(config, proj);
    count++;
  }
  return count;
}
