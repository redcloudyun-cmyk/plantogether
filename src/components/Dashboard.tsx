import { useMemo } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { computePlanHealth, detectConflicts, computeCriticalPath } from '../lib/planAnalysis';

const CONFLICT_ICONS: Record<string, string> = {
  schedule_conflict: '⚠',
  blocked_dependency: '⛔',
  overdue: '⏰',
  locked_critical: '🔒',
  dependency_cycle: '⚠',
};

const AUTONOMY_LABELS: Record<string, string> = {
  observe: 'Observe Mode',
  assist: 'Assist Mode',
  autonomous: 'Autonomous Mode',
};

function StatRow({ label, value, emphasis }: { label: string; value: number; emphasis?: 'agent' | 'human' }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-text-secondary">{label}</span>
      <span
        className={`text-sm font-semibold ${
          emphasis === 'agent' ? 'text-agent' : emphasis === 'human' ? 'text-human' : 'text-text-primary'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function Dashboard({ onOpenWorkspace }: { onOpenWorkspace: () => void }) {
  const items = useWorkspaceStore((s) => s.items);
  const activityLog = useWorkspaceStore((s) => s.activityLog);
  const proposals = useWorkspaceStore((s) => s.proposals);
  const webmcpAvailable = useWorkspaceStore((s) => s.webmcpAvailable);
  const autonomyMode = useWorkspaceStore((s) => s.autonomyMode);

  const health = useMemo(() => computePlanHealth(items), [items]);
  const conflicts = useMemo(() => detectConflicts(items), [items]);
  const criticalPath = useMemo(() => computeCriticalPath(items), [items]);

  const humanActions = activityLog.filter((e) => e.source === 'human').length;
  const agentActions = activityLog.filter((e) => e.source === 'webmcp').length;
  const proposalsTotal = proposals.length;
  const approved = proposals.filter((p) => p.status === 'applied').length;
  const rejected = proposals.filter((p) => p.status === 'rejected').length;
  const reverted = activityLog.filter((e) => e.action === 'Reverted').length;
  const pending = proposals.filter((p) => p.status === 'pending').length;

  const healthColor = health.score >= 80 ? 'text-green-600' : health.score >= 50 ? 'text-amber-600' : 'text-rose-600';

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-tertiary mt-0.5">Human-Agent collaboration summary — computed live from the workspace, not a fixed snapshot.</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Today's Collaboration */}
          <div className="bg-surface rounded-xl border border-border p-4">
            <h2 className="text-xs font-semibold text-text-secondary tracking-wide mb-2">TODAY'S COLLABORATION</h2>
            <StatRow label="Human Actions" value={humanActions} emphasis="human" />
            <StatRow label="Agent Actions" value={agentActions} emphasis="agent" />
            <div className="border-t border-border my-1.5" />
            <StatRow label="Proposals" value={proposalsTotal} />
            <StatRow label="Approved" value={approved} />
            <StatRow label="Rejected" value={rejected} />
            <StatRow label="Reverted" value={reverted} />
            {pending > 0 && (
              <p className="mt-2 text-xs text-agent bg-agent-light rounded-lg px-2 py-1.5">
                {pending} proposal{pending === 1 ? '' : 's'} still awaiting approval
              </p>
            )}
          </div>

          {/* Plan Health */}
          <div className="bg-surface rounded-xl border border-border p-4">
            <h2 className="text-xs font-semibold text-text-secondary tracking-wide mb-2">PLAN HEALTH</h2>
            <div className="flex items-baseline gap-1 mb-3">
              <span className={`text-3xl font-bold ${healthColor}`}>{health.score}</span>
              <span className="text-sm text-text-tertiary">/ 100</span>
            </div>
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-text-secondary">
                <span>⚠</span>
                <span>{health.conflicts} conflict{health.conflicts === 1 ? '' : 's'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-text-secondary">
                <span>⛔</span>
                <span>{health.blocked} blocked</span>
              </div>
              <div className="flex items-center gap-1.5 text-text-secondary">
                <span>🔒</span>
                <span>{health.protected} protected</span>
              </div>
            </div>
          </div>

          {/* Agent status */}
          <div className="bg-surface rounded-xl border border-border p-4">
            <h2 className="text-xs font-semibold text-text-secondary tracking-wide mb-2">AGENT</h2>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${webmcpAvailable ? 'bg-green-500' : 'bg-text-tertiary'}`} />
              <span className="text-sm text-text-primary font-medium">
                {webmcpAvailable ? 'WebMCP Connected' : 'WebMCP Unavailable'}
              </span>
            </div>
            <p className="text-sm text-text-secondary mb-1">{AUTONOMY_LABELS[autonomyMode]}</p>
            <p className="text-xs text-text-tertiary mb-3">5 Tools Available</p>
            <button
              onClick={onOpenWorkspace}
              className="w-full px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Open Workspace
            </button>
          </div>
        </div>

        {/* Conflicts detail */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-xs font-semibold text-text-secondary tracking-wide mb-3">
            CONFLICTS {conflicts.length > 0 && `(${conflicts.length})`}
          </h2>
          {conflicts.length === 0 ? (
            <p className="text-sm text-text-tertiary">No conflicts detected — the plan is clean.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {conflicts.map((c) => (
                <div key={c.id} className="flex items-start gap-2 text-sm border-l-2 border-amber-300 pl-3 py-0.5">
                  <span className="flex-shrink-0">{CONFLICT_ICONS[c.type] ?? '⚠'}</span>
                  <div>
                    <span className="font-medium text-text-primary">{c.title}</span>
                    <p className="text-text-secondary text-xs mt-0.5">{c.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Critical path */}
        {criticalPath.size > 1 && (
          <div className="bg-surface rounded-xl border border-border p-4">
            <h2 className="text-xs font-semibold text-text-secondary tracking-wide mb-3">CRITICAL PATH</h2>
            <div className="flex items-center flex-wrap gap-2 text-sm">
              {items
                .filter((i) => criticalPath.has(i.id))
                .sort((a, b) => Array.from(criticalPath).indexOf(a.id) - Array.from(criticalPath).indexOf(b.id))
                .reverse()
                .map((item, idx, arr) => (
                  <span key={item.id} className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-md bg-surface-secondary text-text-primary font-medium">
                      {item.title}
                    </span>
                    {idx < arr.length - 1 && <span className="text-text-tertiary">→</span>}
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
