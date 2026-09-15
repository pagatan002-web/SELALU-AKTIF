import type { SupabaseProject, PingLog, SentinelStats, ProjectStatus } from '../types/sentinel';

const PROJECTS_STORAGE_KEY = 'selalu_aktif_projects_v1';
const LOGS_STORAGE_KEY = 'selalu_aktif_logs_v1';
const MAX_LOGS = 60;

// Identifier akun dummy sampel bawaan untuk dibersihkan secara otomatis
const DUMMY_PROJECT_IDS = new Set(['proj-kawal', 'proj-simdik', 'proj-bakumpul']);

export function getStoredProjects(): SupabaseProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Hapus otomatis akun dummy bawaan agar antarmuka benar-benar bersih jika belum ada link
      const filtered = parsed.filter((p: SupabaseProject) => !DUMMY_PROJECT_IDS.has(p.id));
      if (filtered.length !== parsed.length) {
        saveProjects(filtered);
      }
      return filtered;
    }
    return [];
  } catch {
    return [];
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
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((l: PingLog) => !DUMMY_PROJECT_IDS.has(l.projectId));
    }
    return [];
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
