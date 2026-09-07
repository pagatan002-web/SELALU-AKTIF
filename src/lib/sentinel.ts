import type { SupabaseProject, PingResult, HeartbeatMode } from '../types/sentinel';

// User-Agent pools simulating authentic modern desktop browsers
export const BROWSER_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
];

export function getRandomUserAgent(): string {
  const idx = Math.floor(Math.random() * BROWSER_USER_AGENTS.length);
  return BROWSER_USER_AGENTS[idx];
}

export function sanitizeSupabaseUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, '');
}

/**
 * Execute Organic Heartbeat on a Supabase Project
 * Produces real database activity to prevent the 7-day auto-pause.
 */
export async function executeHeartbeat(
  project: SupabaseProject,
  customMode?: HeartbeatMode
): Promise<PingResult> {
  const mode = customMode || project.targetMode || 'wal_mutation';
  const cleanUrl = sanitizeSupabaseUrl(project.url);
  const targetTable = (project.targetTable || '_heartbeat').trim();
  const apiKey = project.serviceRoleKey?.trim() || project.anonKey.trim();

  const timestamp = new Date().toISOString();
  const nonce = Math.random().toString(36).substring(2, 9);
  const startTime = performance.now();

  // Cache-busting headers
  const baseHeaders: Record<string, string> = {
    'apikey': apiKey,
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'X-Client-Info': 'selalu-aktif/1.0',
  };

  try {
    let response: Response;
    let details = '';

    if (mode === 'wal_mutation') {
      // WAL Mutation: Execute an UPSERT or PATCH to force PostgreSQL Write-Ahead Log generation
      const endpoint = `${cleanUrl}/rest/v1/${targetTable}`;
      
      const payload = {
        id: 'sentinel-heartbeat-pulse',
        updated_at: timestamp,
        heartbeat_source: 'SELALU_AKTIF_CLIENT',
        system_nonce: nonce,
      };

      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            ...baseHeaders,
            'Prefer': 'resolution=merge-duplicates, return=representation',
          },
          body: JSON.stringify(payload),
        });

        if (response.status === 404 || response.status === 401 || response.status === 403) {
          // If table does not exist or RLS blocks insert, smoothly fallback to dynamic engine count query
          details = `WAL mutation returned HTTP ${response.status}. Menjalankan fallback kueri hitung PostgreSQL...`;
          
          const fallbackEndpoint = `${cleanUrl}/rest/v1/${targetTable}?select=*&limit=1`;
          response = await fetch(fallbackEndpoint, {
            method: 'GET',
            headers: {
              ...baseHeaders,
              'Prefer': 'count=exact',
            },
          });
          details = `Fallback Dynamic Read ke tabel '${targetTable}' berhasil (Engine touched).`;
        } else if (response.ok) {
          details = `Transaksi WAL berhasil ditulis ke PostgreSQL (HTTP ${response.status}).`;
        } else {
          const resText = await response.text();
          details = `Status HTTP ${response.status}: ${resText.substring(0, 120)}`;
        }
      } catch (err: any) {
        throw err;
      }
    } else {
      // Dynamic Query Count: Bypasses CDN & executes count query on PostgreSQL engine
      const endpoint = `${cleanUrl}/rest/v1/${targetTable}?select=*&limit=1`;
      
      response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          ...baseHeaders,
          'Prefer': 'count=exact',
        },
      });

      if (response.ok) {
        const countHeader = response.headers.get('content-range');
        details = `Engine read berhasil. Baris data: ${countHeader || 'OK'}`;
      } else {
        const resText = await response.text();
        details = `Status HTTP ${response.status}: ${resText.substring(0, 120)}`;
      }
    }

    const latencyMs = Math.round(performance.now() - startTime);
    const isSuccess = response.ok || response.status === 204 || response.status === 201;

    return {
      projectId: project.id,
      projectName: project.name,
      success: isSuccess,
      statusCode: response.status,
      statusText: response.statusText || (isSuccess ? 'OK' : 'Error'),
      latencyMs,
      mode,
      timestamp,
      details,
      error: isSuccess ? undefined : `HTTP ${response.status} ${response.statusText}`,
    };
  } catch (error: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    const errorMsg = error?.message || 'Gagal menghubungi server Supabase (CORS / Network Error / Proyek Ter-pause)';
    
    return {
      projectId: project.id,
      projectName: project.name,
      success: false,
      statusCode: 0,
      statusText: 'Network / Offline',
      latencyMs,
      mode,
      timestamp,
      details: 'Gagal terhubung. Kemungkinan server sedang tertidur (paused) atau URL tidak valid.',
      error: errorMsg,
    };
  }
}
