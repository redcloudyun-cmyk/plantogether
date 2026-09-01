import { useMemo, useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { getActivityIcon } from '../lib/activityIcon';
import type { ActivityLogEntry } from '../types/workspace';
import { useTranslation, type TranslationKey } from '../i18n';

type FilterId = 'all' | 'human' | 'agent' | 'blocked' | 'proposals';

const FILTERS: { id: FilterId; label: TranslationKey }[] = [
  { id: 'all', label: 'all' }, { id: 'human', label: 'human' }, { id: 'agent', label: 'agentActionsFilter' },
  { id: 'blocked', label: 'blocked' }, { id: 'proposals', label: 'proposalsFilter' },
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

const SOURCE_LABEL_KEY: Record<ActivityLogEntry['source'], TranslationKey> = {
  human: 'human',
  webmcp: 'sourceAgentWebmcp',
  system: 'sourceSystem',
};

function ActivityRow({ entry }: { entry: ActivityLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const { icon, className } = getActivityIcon(entry);
  const lines = entry.detail.split('\n');
  const { t } = useTranslation();

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-surface-secondary transition-colors"
      >
        <span className={`mt-0.5 flex-shrink-0 ${className}`}>{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium text-text-primary flex items-center gap-1.5">
              {entry.toolName || entry.action}
              {entry.seeded && (
                <span
                  className="text-[9px] font-semibold tracking-wide text-violet-600 bg-violet-100 rounded px-1 py-0.5"
                  title={t('demoActivityTooltip')}
                >
                  {t('demoActivityBadge')}
                </span>
              )}
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
            <span className="text-text-tertiary">{t('actor')}</span>
            <span className="text-text-primary">{t(SOURCE_LABEL_KEY[entry.source])}</span>
          </div>
          {entry.toolName && (
            <div className="grid grid-cols-[80px_1fr] gap-x-2">
              <span className="text-text-tertiary">{t('tool')}</span>
              <span className="text-text-primary font-mono">{entry.toolName}</span>
            </div>
          )}
          <div className="grid grid-cols-[80px_1fr] gap-x-2">
            <span className="text-text-tertiary">{t('result')}</span>
            <span className="text-text-primary capitalize">{entry.status ?? 'success'}</span>
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-x-2">
            <span className="text-text-tertiary">{t('detail')}</span>
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
  const { t } = useTranslation();

  const filtered = useMemo(
    () => [...activityLog].reverse().filter((e) => matchesFilter(e, filter)),
    [activityLog, filter]
  );
  const hasSeeded = useMemo(() => activityLog.some((e) => e.seeded), [activityLog]);

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
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        {hasSeeded && (
          <p className="text-xs text-violet-700 bg-violet-50 border border-violet-200 rounded-lg px-3 py-2">
            {t('demoHistoryBanner')}
          </p>
        )}

        <div className="bg-surface rounded-xl border border-border py-3 flex items-center justify-around flex-wrap gap-y-2">
          <StatBox label={t('human')} value={summary.humanActions} />
          <StatBox label={t('agentActionsFilter')} value={summary.agentActions} />
          <StatBox label={t('proposalsFilter')} value={summary.proposals} />
          <StatBox label={t('approved')} value={summary.approved} />
          <StatBox label={t('rejected')} value={summary.rejected} />
          <StatBox label={t('reverted')} value={summary.reverted} />
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
              {t(f.label)}
            </button>
          ))}
        </div>

        <div className="bg-surface rounded-xl border border-border overflow-hidden min-h-[430px]">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-text-tertiary">
              {activityLog.length === 0
                ? t('noActivity')
                : t('noMatchingEvents')}
            </p>
          ) : (
            filtered.map((entry) => <ActivityRow key={entry.id} entry={entry} />)
          )}
        </div>
      </div>
    </div>
  );
}
