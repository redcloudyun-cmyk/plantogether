import { useMemo } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { computeCriticalPath, detectConflicts } from '../../lib/planAnalysis';
import type { ItemStatus } from '../../types/workspace';

const STATUS_STYLE: Record<ItemStatus, string> = {
  backlog: 'bg-surface-secondary border-border text-text-secondary',
  planned: 'bg-blue-50 border-blue-200 text-blue-700',
  doing: 'bg-amber-50 border-amber-300 text-amber-800',
  done: 'bg-green-50 border-green-200 text-green-700',
};

export default function CriticalPathCard() {
  const items = useWorkspaceStore((s) => s.items);
  const selectedItemId = useWorkspaceStore((s) => s.selectedItemId);
  const selectItem = useWorkspaceStore((s) => s.selectItem);

  const pathIds = useMemo(() => Array.from(computeCriticalPath(items)).reverse(), [items]);
  const pathItems = useMemo(
    () => pathIds.map((id) => items.find((i) => i.id === id)).filter((i): i is NonNullable<typeof i> => !!i),
    [pathIds, items]
  );
  const conflicts = useMemo(() => detectConflicts(items), [items]);
  const pathConflict = useMemo(
    () => conflicts.find((c) => c.itemIds.some((id) => pathIds.includes(id)) && c.type !== 'blocked_dependency'),
    [conflicts, pathIds]
  );

  if (pathItems.length < 2) {
    return (
      <div className="bg-surface rounded-xl border border-border p-4 flex-1 min-w-0">
        <h2 className="text-xs font-semibold text-text-secondary tracking-wide mb-3">CRITICAL PATH</h2>
        <p className="text-xs text-text-tertiary">Not enough linked items yet to compute a critical path.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-4 flex-1 min-w-0">
      <h2 className="text-xs font-semibold text-text-secondary tracking-wide mb-3">CRITICAL PATH</h2>

      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {pathItems.map((item, i) => (
          <div key={item.id} className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => selectItem(item.id)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all whitespace-nowrap ${STATUS_STYLE[item.status]} ${
                selectedItemId === item.id ? 'ring-2 ring-primary-300' : ''
              }`}
            >
              {item.title}
            </button>
            {i < pathItems.length - 1 && <span className="text-text-tertiary text-xs flex-shrink-0">→</span>}
          </div>
        ))}
      </div>

      {pathConflict && (
        <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <span className="text-amber-600 flex-shrink-0">⚠</span>
          <p className="text-xs text-amber-800">{pathConflict.detail}</p>
        </div>
      )}
    </div>
  );
}
