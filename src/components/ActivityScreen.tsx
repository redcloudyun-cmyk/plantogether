import { useMemo, useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { getActivityIcon } from '../lib/activityIcon';
import type { ActivityLogEntry } from '../types/workspace';

type FilterId = 'all' | 'human' | 'agent' | 'blocked' | 'proposals';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'human', label: 'Human' },
  { id: 'agent', label: 'Agent' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'proposals', label: 'Proposals' },
];

const PROPOSAL_ACTIONS = new Set(['Proposed', 'Applied', 'Rejected']);

function matchesFilter(entry: ActivityLogEntry, filter: FilterId): boolean {
  switch (filter) {
    case 'human':
      return entry.source === 'human';
    case 'agent':
      return entry.source === 'webmcp';
    case 'blocked':
      return entry.status === 'blocked' || entry.status === 'error';
    case 'proposals':
      return PROPOSAL_ACTIONS.has(entry.action);
    default:
      return true;
  }
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const SOURCE_LABEL: Record<ActivityLogEntry['source'], string> = {
  human: 'Human',
  webmcp: 'Agent (WebMCP)',
  system: 'System',
};

function ActivityRow({ entry }: { entry: ActivityLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const { icon, className } = getActivityIcon(entry);
  const lines = entry.detail.split('\n');

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-surface-secondary transition-colors"
      >
        <span className={`mt-0.5 flex-shrink-0 ${className}`}>{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium text-text-primary">
              {entry.toolName || entry.action}
            </span>
            <span className="text-xs text-text-tertiary flex-shrink-0">{formatTimestamp(entry.timestamp)}</span>
          </div>
          <p className="text-xs text-text-secondary truncate">{lines[0]}</p>
        </div>
        <span className="text-text-tertiary flex-shrink-0 mt-0.5">{expanded ? '▾' : '▸'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-3 pl-10 flex flex-col gap-1.5 text-xs">
          <div className="grid grid-cols-[80px_1fr] gap-x-2">
            <span className="text-text-tertiary">Actor</span>
            <span className="text-text-primary">{SOURCE_LABEL[entry.source]}</span>
          </div>
          {entry.toolName && (
            <div className="grid grid-cols-[80px_1fr] gap-x-2">
              <span className="text-text-tertiary">Tool</span>
              <span className="text-text-primary font-mono">{entry.toolName}</span>
            </div>
          )}
          <div className="grid grid-cols-[80px_1fr] gap-x-2">
            <span className="text-text-tertiary">Result</span>
            <span className="text-text-primary capitalize">{entry.status ?? 'success'}</span>
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-x-2">
            <span className="text-text-tertiary">Detail</span>
            <div className="text-text-primary flex flex-col">
              {lines.map((line, i) => (
                <span key={i}>{line}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-3">
      <span className="text-lg font-semibold text-text-primary">{value}</span>
      <span className="text-[10px] text-text-tertiary uppercase tracking-wide">{label}</span>
    </div>
  );
}

export default function ActivityScreen() {
  const activityLog = useWorkspaceStore((s) => s.activityLog);
  const [filter, setFilter] = useState<FilterId>('all');

  const filtered = useMemo(
    () => [...activityLog].reverse().filter((e) => matchesFilter(e, filter)),
    [activityLog, filter]
  );

  const summary = useMemo(() => {
    const humanActions = activityLog.filter((e) => e.source === 'human').length;
    const agentActions = activityLog.filter((e) => e.source === 'webmcp').length;
    const proposals = activityLog.filter((e) => e.action === 'Proposed').length;
    const approved = activityLog.filter((e) => e.action === 'Applied').length;
    const rejected = activityLog.filter((e) => e.action === 'Rejected').length;
    const reverted = activityLog.filter((e) => e.action === 'Reverted').length;
    return { humanActions, agentActions, proposals, approved, rejected, reverted };
  }, [activityLog]);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Activity</h1>
          <p className="text-sm text-text-tertiary mt-0.5">
            Real-time session history of every human and agent action — nothing here is seeded or fabricated.
          </p>
        </div>

        <div className="bg-surface rounded-xl border border-border py-3 flex items-center justify-around flex-wrap gap-y-2">
          <StatBox label="Human" value={summary.humanActions} />
          <StatBox label="Agent" value={summary.agentActions} />
          <StatBox label="Proposals" value={summary.proposals} />
          <StatBox label="Approved" value={summary.approved} />
          <StatBox label="Rejected" value={summary.rejected} />
          <StatBox label="Reverted" value={summary.reverted} />
        </div>

        <div className="flex items-center gap-1 bg-surface-secondary rounded-full border border-border p-0.5 w-fit">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filter === f.id
                  ? 'bg-surface text-text-primary shadow-sm border border-border'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-text-tertiary">
              {activityLog.length === 0
                ? 'No activity yet. Human and agent actions will appear here as they happen.'
                : 'No events match this filter.'}
            </p>
          ) : (
            filtered.map((entry) => <ActivityRow key={entry.id} entry={entry} />)
          )}
        </div>
      </div>
    </div>
  );
}
