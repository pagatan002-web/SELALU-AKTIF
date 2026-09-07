export type ProjectStatus = 'healthy' | 'warning' | 'paused' | 'unknown';

export type HeartbeatMode = 'wal_mutation' | 'query_count';

export interface SupabaseProject {
  id: string;
  name: string;
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  targetTable: string;
  targetMode: HeartbeatMode;
  status: ProjectStatus;
  lastPingAt?: string;
  lastLatencyMs?: number;
  lastStatusCode?: number;
  lastStatusText?: string;
  lastError?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PingResult {
  projectId: string;
  projectName: string;
  success: boolean;
  statusCode: number;
  statusText: string;
  latencyMs: number;
  mode: HeartbeatMode;
  timestamp: string;
  details: string;
  error?: string;
}

export interface PingLog extends PingResult {
  id: string;
}

export interface SentinelStats {
  total: number;
  healthy: number;
  warning: number;
  pausedOrError: number;
  averageLatencyMs: number;
  lastGlobalSync?: string;
}
