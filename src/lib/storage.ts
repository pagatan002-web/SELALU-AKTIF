import type { SupabaseProject, PingLog, SentinelStats, ProjectStatus } from '../types/sentinel';

const PROJECTS_STORAGE_KEY = 'selalu_aktif_projects_v1';
const LOGS_STORAGE_KEY = 'selalu_aktif_logs_v1';
const MAX_LOGS = 60;

// Template demo proyek awal
const DEFAULT_SAMPLE_PROJECTS: SupabaseProject[] = [
  {
    id: 'proj-kawal',
    name: 'KAWAL - Monitoring System',
    url: 'https://glkawfdtyzhujiimaigf.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_kawal_sample',
    targetTable: 'kawal_system_settings',
    targetMode: 'wal_mutation',
    status: 'healthy',
    lastPingAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 jam lalu
    lastLatencyMs: 142,
    lastStatusCode: 200,
    lastStatusText: 'OK',
    notes: 'Sistem KAWAL Utama',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proj-simdik',
    name: 'SIMDIK V3 - DARAMAN',
    url: 'https://ixklnvfrtqyubnmapzxc.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_simdik_sample',
    targetTable: 'profiles',
    targetMode: 'query_count',
    status: 'healthy',
    lastPingAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 36 jam lalu
    lastLatencyMs: 185,
    lastStatusCode: 200,
    lastStatusText: 'OK',
    notes: 'Sistem Presensi Guru & Siswa',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proj-bakumpul',
    name: 'BAKUMPUL Hub',
    url: 'https://abczzzopqrstuvwxyzab.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_bakumpul_sample',
    targetTable: '_heartbeat',
    targetMode: 'wal_mutation',
    status: 'warning',
    lastPingAt: new Date(Date.now() - 1000 * 60 * 60 * 105).toISOString(), // 4.3 hari lalu (>4 hari)
    lastLatencyMs: 230,
    lastStatusCode: 200,
    lastStatusText: 'OK',
    notes: 'Komunitas Bakumpul',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export function getStoredProjects(): SupabaseProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) {
      // Seed default sample projects on first run
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(DEFAULT_SAMPLE_PROJECTS));
      return DEFAULT_SAMPLE_PROJECTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SAMPLE_PROJECTS;
  }
}

export function saveProjects(projects: SupabaseProject[]): void {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('Gagal menyimpan proyek ke LocalStorage:', err);
  }
}

export function calculateProjectHealth(project: SupabaseProject): ProjectStatus {
  if (project.lastStatusCode && (project.lastStatusCode === 0 || project.lastStatusCode >= 500)) {
    return 'paused';
  }
  if (!project.lastPingAt) {
    return 'unknown';
  }

  const lastPingTime = new Date(project.lastPingAt).getTime();
  const diffHours = (Date.now() - lastPingTime) / (1000 * 60 * 60);

  // Jika belum disapa lebih dari 96 jam (4 hari), jadikan 'warning' (mendekati 7 hari)
  if (diffHours > 96) {
    return 'warning';
  }
  return 'healthy';
}

export function getStoredLogs(): PingLog[] {
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function appendLog(log: PingLog): void {
  try {
    const existing = getStoredLogs();
    const updated = [log, ...existing].slice(0, MAX_LOGS);
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Gagal menyimpan log:', err);
  }
}

export function clearStoredLogs(): void {
  localStorage.removeItem(LOGS_STORAGE_KEY);
}

export function computeSentinelStats(projects: SupabaseProject[]): SentinelStats {
  let healthy = 0;
  let warning = 0;
  let pausedOrError = 0;
  let totalLatency = 0;
  let latencyCount = 0;
  let latestPing = '';

  for (const proj of projects) {
    const currentStatus = calculateProjectHealth(proj);
    if (currentStatus === 'healthy') healthy++;
    else if (currentStatus === 'warning') warning++;
    else if (currentStatus === 'paused') pausedOrError++;

    if (proj.lastLatencyMs && proj.lastLatencyMs > 0) {
      totalLatency += proj.lastLatencyMs;
      latencyCount++;
    }

    if (proj.lastPingAt && (!latestPing || new Date(proj.lastPingAt) > new Date(latestPing))) {
      latestPing = proj.lastPingAt;
    }
  }

  return {
    total: projects.length,
    healthy,
    warning,
    pausedOrError,
    averageLatencyMs: latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0,
    lastGlobalSync: latestPing,
  };
}
