import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { SupabaseProject, PingLog } from './types/sentinel';
import type { MasterHubConfig } from './lib/masterHub';
import { 
  getStoredMasterHub, 
  fetchProjectsFromMaster, 
  upsertProjectToMaster, 
  deleteProjectFromMaster, 
  recordLogToMaster, 
  fetchLogsFromMaster 
} from './lib/masterHub';
import { 
  getStoredProjects, 
  saveProjects, 
  getStoredLogs, 
  appendLog, 
  clearStoredLogs, 
  computeSentinelStats, 
  calculateProjectHealth 
} from './lib/storage';
import { executeHeartbeat } from './lib/sentinel';
import { Navbar } from './components/Navbar';
import { ProjectCard } from './components/ProjectCard';
import { AddProjectModal } from './components/AddProjectModal';
import { ExportSecretModal } from './components/ExportSecretModal';
import { SqlSnippetModal } from './components/SqlSnippetModal';
import { MasterHubModal } from './components/MasterHubModal';
import { ActivityLogTable } from './components/ActivityLogTable';
import { 
  Shield, 
  Sparkles, 
  Search, 
  Plus, 
  HardDrive, 
  Clock,
  Layers
} from 'lucide-react';

export function App() {
  const [projects, setProjects] = useState<SupabaseProject[]>([]);
  const [logs, setLogs] = useState<PingLog[]>([]);
  const [activePingIds, setActivePingIds] = useState<Set<string>>(new Set());
  const [isPingingAll, setIsPingingAll] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<SupabaseProject | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isMasterHubModalOpen, setIsMasterHubModalOpen] = useState(false);

  // Master Hub Config
  const [masterConfig, setMasterConfig] = useState<MasterHubConfig | null>(() => getStoredMasterHub());

  const loadProjectsData = useCallback(async (hub: MasterHubConfig | null) => {
    if (hub) {
      try {
        const masterProjs = await fetchProjectsFromMaster(hub);
        if (masterProjs.length > 0) {
          const refreshed = masterProjs.map((p) => ({
            ...p,
            status: calculateProjectHealth(p),
          }));
          setProjects(refreshed);
          saveProjects(refreshed);
        } else {
          // Empty master registry, load local
          const local = getStoredProjects().map((p) => ({ ...p, status: calculateProjectHealth(p) }));
          setProjects(local);
        }

        const masterLogs = await fetchLogsFromMaster(hub);
        if (masterLogs.length > 0) {
          setLogs(masterLogs);
        } else {
          setLogs(getStoredLogs());
        }
        return;
      } catch (err) {
        console.warn('Gagal memuat dari Master Hub, menggunakan fallback lokal:', err);
      }
    }

    // Default Local Mode
    const local = getStoredProjects().map((p) => ({ ...p, status: calculateProjectHealth(p) }));
    setProjects(local);
    setLogs(getStoredLogs());
  }, []);

  // Load on mount and when masterConfig changes
  useEffect(() => {
    loadProjectsData(masterConfig);
  }, [masterConfig, loadProjectsData]);

  const stats = computeSentinelStats(projects);

  // Single Project Ping
  const handlePingProject = async (project: SupabaseProject) => {
    setActivePingIds((prev) => new Set(prev).add(project.id));

    try {
      const result = await executeHeartbeat(project);

      // Create log entry
      const newLog: PingLog = {
        ...result,
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      };
      appendLog(newLog);
      setLogs(getStoredLogs());

      // Update project state
      const updatedProjects = projects.map((p) => {
        if (p.id === project.id) {
          const updated: SupabaseProject = {
            ...p,
            lastPingAt: result.timestamp,
            lastLatencyMs: result.latencyMs,
            lastStatusCode: result.statusCode,
            lastStatusText: result.statusText,
            lastError: result.error,
            status: result.success ? 'healthy' : 'paused',
            updatedAt: new Date().toISOString(),
          };

          // Sync to Master Hub if connected
          if (masterConfig) {
            upsertProjectToMaster(masterConfig, updated).catch((e) =>
              console.warn('Gagal sync status ping ke Master Hub:', e)
            );
            recordLogToMaster(masterConfig, newLog).catch(() => {});
          }

          return updated;
        }
        return p;
      });

      setProjects(updatedProjects);
      saveProjects(updatedProjects);
    } finally {
      setActivePingIds((prev) => {
        const next = new Set(prev);
        next.delete(project.id);
        return next;
      });
    }
  };

  // Wake-Up All Projects (Concurrent with slight staggered delay)
  const handleWakeUpAll = async () => {
    if (projects.length === 0 || isPingingAll) return;
    setIsPingingAll(true);

    const promises = projects.map((proj, idx) => {
      return new Promise<void>((resolve) => {
        setTimeout(async () => {
          await handlePingProject(proj);
          resolve();
        }, idx * 400); // 400ms jitter between requests
      });
    });

    await Promise.all(promises);
    setIsPingingAll(false);

    // Trigger celebration confetti on completion!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.2 },
        colors: ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'],
      });
    } catch {}
  };

  // Save / Update Project
  const handleSaveProject = (data: Partial<SupabaseProject>) => {
    let updated: SupabaseProject[];
    let targetProject: SupabaseProject;

    if (editingProject) {
      targetProject = {
        ...editingProject,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      updated = projects.map((p) => (p.id === editingProject.id ? targetProject : p));
    } else {
      targetProject = {
        id: `proj-${Date.now()}`,
        name: data.name || 'Supabase Project',
        url: data.url || '',
        anonKey: data.anonKey || '',
        serviceRoleKey: data.serviceRoleKey,
        targetTable: data.targetTable || '_heartbeat',
        targetMode: data.targetMode || 'wal_mutation',
        status: 'unknown',
        notes: data.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updated = [targetProject, ...projects];
    }

    setProjects(updated);
    saveProjects(updated);
    setEditingProject(null);

    // Sync to Master Hub if connected
    if (masterConfig) {
      upsertProjectToMaster(masterConfig, targetProject).catch((err) => {
        console.error('Gagal menyimpan proyek ke Master Hub:', err);
      });
    }
  };

  // Delete Project
  const handleDeleteProject = (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;

    if (confirm(`Apakah Anda yakin ingin menghapus pemantauan untuk '${proj.name}'?`)) {
      const filtered = projects.filter((p) => p.id !== projectId);
      setProjects(filtered);
      saveProjects(filtered);

      // Delete from Master Hub if connected
      if (masterConfig) {
        deleteProjectFromMaster(masterConfig, projectId).catch((err) => {
          console.error('Gagal menghapus proyek dari Master Hub:', err);
        });
      }
    }
  };

  const handleClearLogs = () => {
    if (confirm('Bersihkan seluruh riwayat audit log?')) {
      clearStoredLogs();
      setLogs([]);
    }
  };

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    const matchQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.targetTable && p.targetTable.toLowerCase().includes(searchQuery.toLowerCase()));

    if (statusFilter === 'all') return matchQuery;
    return matchQuery && p.status === statusFilter;
  });

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navbar */}
      <Navbar
        stats={stats}
        isPingingAll={isPingingAll}
        masterConfig={masterConfig}
        onWakeUpAll={handleWakeUpAll}
        onOpenAddModal={() => {
          setEditingProject(null);
          setIsAddModalOpen(true);
        }}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
        onOpenMasterHubModal={() => setIsMasterHubModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {/* Hero Banner with Brutalism Glasses */}
        <section className="glass-brutal-panel rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Anti-Pause WAL Engine Active</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Jaga Seluruh Database Supabase <span className="text-cyan-400">Tetap Berdenyut</span>
              </h2>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                Supabase Free Tier mematikan database setelah 7 hari inaktif. SELALU AKTIF mengeksekusi 
                transaksi disk asli (Write-Ahead Log) berkecepatan tinggi agar server PostgreSQL Anda tidak 
                pernah tidur.
              </p>
            </div>

            {/* Quick Feature Badges Bento */}
            <div className="grid grid-cols-2 gap-3 w-full lg:w-auto font-mono text-xs">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">METODE</span>
                  <span className="font-bold text-white">WAL Mutation</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">BATAS AMAN</span>
                  <span className="font-bold text-white">&lt; 7 Hari</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">CLOUD CRON</span>
                  <span className="font-bold text-white">GitHub Actions</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">STORAGE</span>
                  <span className="font-bold text-white">Zero-Knowledge</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari proyek / tabel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs font-mono"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 focus:outline-none focus:border-cyan-400 text-xs font-mono"
              >
                <option value="all">Semua Status</option>
                <option value="healthy">🟢 Aktif & Sehat</option>
                <option value="warning">🟡 Perlu Perhatian</option>
                <option value="paused">🔴 Terhenti / Error</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                setEditingProject(null);
                setIsAddModalOpen(true);
              }}
              className="brutal-btn-primary px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Proyek Baru</span>
            </button>
          </div>
        </div>

        {/* Project Cards Grid */}
        {filteredProjects.length === 0 ? (
          <div className="glass-brutal-panel rounded-3xl p-12 text-center my-6">
            <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400 mb-4">
              <HardDrive className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              Tidak Ada Proyek yang Cocok
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
              {searchQuery
                ? 'Tidak ditemukan database yang cocok dengan kata kunci pencarian Anda.'
                : 'Belum ada proyek Supabase yang terdaftar di Sentinel ini.'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setIsAddModalOpen(true);
              }}
              className="brutal-btn-primary px-4 py-2.5 rounded-xl text-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Proyek Pertama</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isPinging={activePingIds.has(project.id)}
                onPing={handlePingProject}
                onEdit={(p) => {
                  setEditingProject(p);
                  setIsAddModalOpen(true);
                }}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}

        {/* Activity & WAL Logs Stream */}
        <ActivityLogTable logs={logs} onClearLogs={handleClearLogs} />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900/80 py-6 px-4 sm:px-8 text-center text-xs text-slate-500 font-mono">
        <p>
          SELALU AKTIF &bull; Organic Heartbeat Sentinel &bull; PostgreSQL WAL Generator &bull; Zero CDN Cache
        </p>
      </footer>

      {/* Modals */}
      <AddProjectModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        initialProject={editingProject}
      />

      <ExportSecretModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        projects={projects}
      />

      <SqlSnippetModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />

      <MasterHubModal
        isOpen={isMasterHubModalOpen}
        onClose={() => setIsMasterHubModalOpen(false)}
        currentConfig={masterConfig}
        onConfigChange={(newConf) => {
          setMasterConfig(newConf);
          loadProjectsData(newConf);
        }}
        localProjects={projects}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
      />
    </div>
  );
}

export default App;
