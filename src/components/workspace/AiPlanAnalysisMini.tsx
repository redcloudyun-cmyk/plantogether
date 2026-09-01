import { useMemo, useState } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { detectConflicts } from '../../lib/planAnalysis';

export default function AiPlanAnalysisMini({ onViewWorkspace }: { onViewWorkspace?: () => void }) {
  const items = useWorkspaceStore((s) => s.items);
  const [expanded, setExpanded] = useState(false);
  const conflicts = useMemo(() => detectConflicts(items), [items]);

  const conflictCount = conflicts.filter((c) => c.type === 'schedule_conflict' || c.type === 'dependency_cycle').length;
  const blockedIds = new Set(conflicts.filter((c) => c.type === 'blocked_dependency').map((c) => c.itemIds[0]));
  const atRiskIds = new Set(
    conflicts.filter((c) => c.type === 'overdue' || c.type === 'locked_critical').map((c) => c.itemIds[0])
  );
  const affectedIds = new Set([...blockedIds, ...atRiskIds]);
  const onTrack = items.filter((i) => i.status !== 'done' && !affectedIds.has(i.id)).length;

  return (
    <div className="px-4 py-3 border-b border-border flex-shrink-0">
      <h3 className="text-xs font-semibold text-text-secondary tracking-wide mb-3">AI PLAN ANALYSIS</h3>

      <div className="flex flex-col gap-1.5 text-xs mb-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-text-primary">⚠ Conflicts</span>
          <span className="font-medium text-red-600">{conflictCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-text-primary">⛔ Blocked</span>
          <span className="font-medium text-red-600">{blockedIds.size}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-text-primary">⏰ At Risk</span>
          <span className="font-medium text-amber-600">{atRiskIds.size}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-text-primary">✓ On Track</span>
          <span className="font-medium text-green-600">{onTrack}</span>
        </div>
      </div>

      {onViewWorkspace ? (
        <button
          onClick={onViewWorkspace}
          className="w-full text-xs font-medium text-primary-600 hover:text-primary-700 border border-primary-200 hover:bg-primary-50 rounded-lg px-3 py-1.5 transition-colors"
        >
          View Analysis
        </button>
      ) : (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full text-xs font-medium text-primary-600 hover:text-primary-700 border border-primary-200 hover:bg-primary-50 rounded-lg px-3 py-1.5 transition-colors"
        >
          {expanded ? 'Hide Analysis' : 'View Analysis'}
        </button>
      )}

      {expanded && !onViewWorkspace && (
        <div className="mt-3 flex flex-col gap-1.5">
          {conflicts.length === 0 ? (
            <p className="text-xs text-text-tertiary">No conflicts detected.</p>
          ) : (
            conflicts.map((c) => (
              <p key={c.id} className="text-xs text-text-secondary border-l-2 border-amber-300 pl-2">
                {c.detail}
              </p>
            ))
          )}
        </div>
      )}
    </div>
  );
}
