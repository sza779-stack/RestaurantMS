import React, { useCallback, useMemo, useState } from 'react';
import {
  Database,
  Download,
  ExternalLink,
  Loader2,
  Play,
  Power,
  RotateCcw,
  TestTube,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../services/api';

type ActionState = {
  running: boolean;
  message: string;
  isError: boolean;
};

const initialActionState: ActionState = {
  running: false,
  message: '',
  isError: false,
};

const WEB_HOST = 'localhost';

type WebAppLink = {
  key: string;
  appKey: string;
  label: string;
  path?: string;
};

/** Sequential local app ports. Walk-in stations reuse web-online on port 3002. */
const WEB_APP_OFFSETS: Record<string, number> = {
  'web-admin': 0,
  'web-online': 1,
  'web-kds': 2,
  'web-packing': 3,
  'web-osdu': 4,
  'web-driver': 5,
};

const WEB_APPS: WebAppLink[] = [
  { key: 'web-admin', appKey: 'web-admin', label: 'Admin / POS' },
  { key: 'web-online', appKey: 'web-online', label: 'Online Customer App' },
  { key: 'walkin-1', appKey: 'web-online', label: 'Walk-in Screen 1', path: '/menu?channel=walkin&station=front-1' },
  { key: 'walkin-2', appKey: 'web-online', label: 'Walk-in Screen 2', path: '/menu?channel=walkin&station=front-2' },
  { key: 'walkin-3', appKey: 'web-online', label: 'Walk-in Screen 3', path: '/menu?channel=walkin&station=front-3' },
  { key: 'web-kds', appKey: 'web-kds', label: 'Kitchen Display (KDS)' },
  { key: 'web-packing', appKey: 'web-packing', label: 'Packing Station' },
  { key: 'web-osdu', appKey: 'web-osdu', label: 'Customer Display (OSDU)' },
  { key: 'web-driver', appKey: 'web-driver', label: 'Driver App' },
];

const BASE_PORT_STORAGE_KEY = 'data-management-web-base-port';
const PORT_OVERRIDES_STORAGE_KEY = 'data-management-port-overrides-v3';
const DEFAULT_BASE_PORT = 3001;

const buildUrlForPort = (port: number) => `http://${WEB_HOST}:${port}`;

function readStoredOverrides(): Record<string, number> {
  try {
    const raw = localStorage.getItem(PORT_OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw) as unknown;
    if (typeof o !== 'object' || o === null) return {};
    const out: Record<string, number> = {};
    for (const k of Object.keys(o)) {
      const n = Number((o as Record<string, unknown>)[k]);
      if (Number.isFinite(n) && n >= 1024 && n <= 65535) out[k] = n;
    }
    return out;
  } catch {
    return {};
  }
}

function writeStoredOverrides(overrides: Record<string, number>) {
  localStorage.setItem(PORT_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
}

function readStoredBasePort(): number {
  try {
    const raw = localStorage.getItem(BASE_PORT_STORAGE_KEY);
    const n = raw ? parseInt(raw, 10) : DEFAULT_BASE_PORT;
    return Number.isFinite(n) && n >= 1024 && n <= 65535 ? n : DEFAULT_BASE_PORT;
  } catch {
    return DEFAULT_BASE_PORT;
  }
}

function effectivePort(
  app: WebAppLink,
  basePort: number,
  overrides: Record<string, number>,
): number {
  const o = overrides[app.key];
  if (o !== undefined) return o;
  return basePort + (WEB_APP_OFFSETS[app.appKey] ?? 0);
}

function buildInitialDraftPorts(base: number, overrides: Record<string, number>): Record<string, string> {
  const d: Record<string, string> = {};
  for (const app of WEB_APPS) {
    d[app.key] = String(effectivePort(app, base, overrides));
  }
  return d;
}

/** Tinted card shells: light mode uses soft fills; dark mode keeps gradient glass. */
const APP_CARD_THEME: Record<string, string> = {
  'web-admin':
    'border-cyan-500/40 bg-cyan-500/[0.08] dark:border-cyan-400/45 dark:bg-gradient-to-br dark:from-cyan-500/[0.14] dark:via-slate-900/50 dark:to-slate-950/80 dark:shadow-[inset_0_1px_0_0_rgba(34,211,238,0.12)]',
  'web-kds':
    'border-violet-500/40 bg-violet-500/[0.08] dark:border-violet-400/45 dark:bg-gradient-to-br dark:from-violet-500/[0.14] dark:via-slate-900/50 dark:to-slate-950/80 dark:shadow-[inset_0_1px_0_0_rgba(167,139,250,0.12)]',
  'web-packing':
    'border-teal-500/40 bg-teal-500/[0.08] dark:border-teal-400/45 dark:bg-gradient-to-br dark:from-teal-500/[0.14] dark:via-slate-900/50 dark:to-slate-950/80 dark:shadow-[inset_0_1px_0_0_rgba(45,212,191,0.12)]',
  'web-osdu':
    'border-amber-500/40 bg-amber-500/[0.08] dark:border-amber-400/45 dark:bg-gradient-to-br dark:from-amber-500/[0.14] dark:via-slate-900/50 dark:to-slate-950/80 dark:shadow-[inset_0_1px_0_0_rgba(251,191,36,0.12)]',
  'walkin-1':
    'border-rose-500/40 bg-rose-500/[0.08] dark:border-rose-400/45 dark:bg-gradient-to-br dark:from-rose-500/[0.14] dark:via-slate-900/50 dark:to-slate-950/80 dark:shadow-[inset_0_1px_0_0_rgba(251,113,133,0.12)]',
  'walkin-2':
    'border-orange-500/40 bg-orange-500/[0.08] dark:border-orange-400/45 dark:bg-gradient-to-br dark:from-orange-500/[0.14] dark:via-slate-900/50 dark:to-slate-950/80 dark:shadow-[inset_0_1px_0_0_rgba(251,146,60,0.12)]',
  'walkin-3':
    'border-fuchsia-500/40 bg-fuchsia-500/[0.08] dark:border-fuchsia-400/45 dark:bg-gradient-to-br dark:from-fuchsia-500/[0.14] dark:via-slate-900/50 dark:to-slate-950/80 dark:shadow-[inset_0_1px_0_0_rgba(232,121,249,0.12)]',
  'web-online':
    'border-emerald-500/40 bg-emerald-500/[0.08] dark:border-emerald-400/45 dark:bg-gradient-to-br dark:from-emerald-500/[0.14] dark:via-slate-900/50 dark:to-slate-950/80 dark:shadow-[inset_0_1px_0_0_rgba(52,211,153,0.12)]',
  'web-driver':
    'border-sky-500/40 bg-sky-500/[0.08] dark:border-sky-400/45 dark:bg-gradient-to-br dark:from-sky-500/[0.14] dark:via-slate-900/50 dark:to-slate-950/80 dark:shadow-[inset_0_1px_0_0_rgba(56,189,248,0.12)]',
};

const DataManagement: React.FC = () => {
  const [basePort] = useState(() => readStoredBasePort());
  const [portOverrides, setPortOverrides] = useState<Record<string, number>>(() => readStoredOverrides());
  const [draftPortByApp, setDraftPortByApp] = useState<Record<string, string>>(() =>
    buildInitialDraftPorts(readStoredBasePort(), readStoredOverrides()),
  );
  const [openingKey, setOpeningKey] = useState<string | null>(null);

  const [dockerState, setDockerState] = useState<ActionState>(initialActionState);
  const [backupState, setBackupState] = useState<ActionState>(initialActionState);
  const [seedState, setSeedState] = useState<ActionState>(initialActionState);
  const [resetState, setResetState] = useState<ActionState>(initialActionState);
  const [confirmText, setConfirmText] = useState('');

  const appLinks = useMemo(
    () =>
	      WEB_APPS.map((app) => {
	        const port = effectivePort(app, basePort, portOverrides);
	        return {
	          ...app,
	          port,
	          url: `${buildUrlForPort(port)}${app.path ?? ''}`,
	        };
	      }),
    [basePort, portOverrides],
  );

  const withState = async (
    setter: React.Dispatch<React.SetStateAction<ActionState>>,
    task: () => Promise<void>,
  ) => {
    setter({ running: true, message: '', isError: false });
    try {
      await task();
      setter((prev) => ({ ...prev, running: false }));
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Operation failed';
      setter({ running: false, message, isError: true });
    }
  };

  const stopDocker = async () => {
    await withState(setDockerState, async () => {
      const response = await apiClient.post('/admin/data-management/docker/stop');
      setDockerState({
        running: false,
        isError: false,
        message: response.data?.stdout || 'Docker services stopped.',
      });
    });
  };

  const startDocker = async () => {
    await withState(setDockerState, async () => {
      const response = await apiClient.post('/admin/data-management/docker/start');
      setDockerState({
        running: false,
        isError: false,
        message: response.data?.stdout || 'Docker services started.',
      });
    });
  };

  const backupDatabase = async () => {
    await withState(setBackupState, async () => {
      const response = await apiClient.post('/admin/data-management/backup', {}, {
        responseType: 'blob',
      });

      const contentDisposition = response.headers['content-disposition'] as string | undefined;
      const fileMatch = contentDisposition?.match(/filename="(.+)"/);
      const fileName = fileMatch?.[1] || `backup-${Date.now()}.json`;

      const blob = new Blob([response.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);

      setBackupState({
        running: false,
        isError: false,
        message: `Backup downloaded: ${fileName}`,
      });
    });
  };

  const loadTestData = async () => {
    await withState(setSeedState, async () => {
      const response = await apiClient.post('/admin/data-management/load-test-data');
      setSeedState({
        running: false,
        isError: false,
        message: response.data?.message || 'Test data loaded.',
      });
    });
  };

  const resetToCleanSlate = async () => {
    await withState(setResetState, async () => {
      const response = await apiClient.post('/admin/data-management/reset-clean-slate', {
        confirmText,
      });
      const message = response.data?.message || 'Database reset complete.';
      const isError = !String(message).toLowerCase().includes('clean slate');
      setResetState({
        running: false,
        isError,
        message,
      });
    });
  };

  const statusClass = (state: ActionState) =>
    state.isError
      ? 'border-destructive/30 bg-destructive/10 text-destructive'
      : 'border-success/30 bg-success/10 text-success';

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const applyCardPort = useCallback(
    (appKey: string) => {
      const raw = (draftPortByApp[appKey] ?? '').trim();
      if (!raw) {
        setPortOverrides((prev) => {
          const next: Record<string, number> = { ...prev };
          delete next[appKey];
          writeStoredOverrides(next);
          return next;
        });
	        setDraftPortByApp((d) => ({
	          ...d,
	          [appKey]: String(
	            effectivePort(WEB_APPS.find((app) => app.key === appKey) ?? WEB_APPS[0], basePort, {}),
	          ),
	        }));
        toast.success('Cleared override — using base + offset for this app.');
        return;
      }
      const num = parseInt(raw, 10);
      if (!Number.isFinite(num) || num < 1024 || num > 65535) {
        toast.error('Enter a valid port between 1024 and 65535.');
        return;
      }
      setPortOverrides((prev) => {
        const next = { ...prev, [appKey]: num };
        writeStoredOverrides(next);
        return next;
      });
      setDraftPortByApp((d) => ({ ...d, [appKey]: String(num) }));
      toast.success('Port updated.');
    },
    [draftPortByApp, basePort],
  );

  const startDevAndOpen = useCallback(async (key: string, url: string) => {
    setOpeningKey(key);
    try {
      const { data } = await apiClient.post<{
        message?: string;
        pid?: number;
      }>('/admin/data-management/web-dev/start', { appKey: key });
      toast.success(data?.message || 'Dev server start requested', {
        description: data?.pid ? `PID ${data.pid}` : undefined,
      });
      window.setTimeout(() => openLink(url), 900);
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Could not start dev server';
      toast.error(msg);
      openLink(url);
    } finally {
      setOpeningKey(null);
    }
  }, []);

  const openAllLinks = async () => {
    for (let i = 0; i < appLinks.length; i++) {
      const app = appLinks[i];
      try {
	        await apiClient.post('/admin/data-management/web-dev/start', { appKey: app.appKey });
      } catch {
        /* still open tab */
      }
      window.setTimeout(() => openLink(app.url), i * 350);
    }
    toast.message('Requested dev servers; opening tabs (may require allowing popups).');
  };

  return (
    <div className="p-6 text-foreground">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-3">
            <Database className="h-7 w-7 text-cyan-600 dark:text-cyan-300" />
            <h1 className="text-2xl font-bold text-foreground">Data Management</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage Docker runtime, backup snapshots, test dataset loading, and clean-slate reset.
          </p>
        </header>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Web App Quick Links</h2>
              <p className="text-sm text-muted-foreground">
	                Walk-in stations reuse the same <strong className="text-foreground">web-online</strong> ordering app with station URLs, so all customer screens stay synced to one menu and checkout flow. Use <strong className="text-foreground">Update Port</strong> only if you run a screen on a custom host port.{' '}
                <strong className="text-foreground">Open</strong> asks the API to run <code className="text-cyan-700 dark:text-cyan-200/90">npm run dev</code> for that app (on the API machine), then opens the URL.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void openAllLinks()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500"
            >
              <ExternalLink className="h-4 w-4" />
              Open All
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {appLinks.map((app) => (
              <div
                key={app.key}
                className={`rounded-xl border p-3 ${APP_CARD_THEME[app.key] ?? 'border-border bg-muted/50 dark:border-slate-600 dark:bg-slate-900/60'}`}
              >
                <p className="text-sm font-medium text-foreground">{app.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{app.url}</p>
                <button
                  type="button"
                  disabled={openingKey === app.key}
	                  onClick={() => void startDevAndOpen(app.appKey, app.url)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-60 dark:border-slate-600 dark:bg-transparent dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  {openingKey === app.key ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ExternalLink className="h-3.5 w-3.5" />
                  )}
                  Open
                </button>
                <div className="mt-3 space-y-2">
                  <label className="sr-only">Port override for {app.label}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Port for this app"
                    value={draftPortByApp[app.key] ?? ''}
                    onChange={(e) =>
                      setDraftPortByApp((d) => ({
                        ...d,
                        [app.key]: e.target.value.replace(/[^\d]/g, ''),
                      }))
                    }
                    className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500/40 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => applyCardPort(app.key)}
                    className="w-full rounded-md border border-border bg-muted px-2 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/80 dark:border-slate-500 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Update Port
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-foreground">Docker Ports / Services</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Start or stop restaurant platform containers from Settings.
            </p>
            <div className="flex gap-3">
              <button
                onClick={startDocker}
                disabled={dockerState.running}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {dockerState.running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Start
              </button>
              <button
                onClick={stopDocker}
                disabled={dockerState.running}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {dockerState.running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                Stop
              </button>
            </div>
            {dockerState.message && (
              <div className={`mt-4 rounded-lg border px-3 py-2 text-xs ${statusClass(dockerState)}`}>
                {dockerState.message}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-foreground">Backup Database</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Export full public schema data to JSON and download immediately.
            </p>
            <button
              onClick={backupDatabase}
              disabled={backupState.running}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 font-semibold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {backupState.running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Backup & Download
            </button>
            {backupState.message && (
              <div className={`mt-4 rounded-lg border px-3 py-2 text-xs ${statusClass(backupState)}`}>
                {backupState.message}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-foreground">Load Test Data</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Runs Prisma seed to repopulate a complete demo dataset.
            </p>
            <button
              onClick={loadTestData}
              disabled={seedState.running}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {seedState.running ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
              Load Test Data
            </button>
            {seedState.message && (
              <div className={`mt-4 rounded-lg border px-3 py-2 text-xs ${statusClass(seedState)}`}>
                {seedState.message}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-amber-500/50 bg-amber-50 p-5 dark:border-amber-500/40 dark:bg-amber-950/30">
            <h2 className="mb-3 text-lg font-semibold text-amber-900 dark:text-amber-200">Reset To Clean Slate</h2>
            <p className="mb-3 text-sm text-amber-800 dark:text-amber-100/90">
              Destructive action. Clears all data and recreates schema for fresh testing.
            </p>
            <div className="mb-3">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                Type RESET to confirm
              </label>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="RESET"
                className="w-full rounded-lg border border-amber-500/50 bg-white px-3 py-2 text-sm text-amber-950 placeholder:text-amber-700/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-50 dark:placeholder:text-amber-200/50"
              />
            </div>
            <button
              onClick={resetToCleanSlate}
              disabled={resetState.running}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetState.running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              Reset Data
            </button>
            {resetState.message && (
              <div className={`mt-4 rounded-lg border px-3 py-2 text-xs ${statusClass(resetState)}`}>
                {resetState.message}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DataManagement;
