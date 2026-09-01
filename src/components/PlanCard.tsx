import { useState, useEffect, useRef, useMemo } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import type { PlanItem } from '../types/workspace';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { detectConflicts, computeCriticalPath } from '../lib/planAnalysis';

const CONFLICT_BADGE: Record<string, { icon: string; label: string }> = {
  schedule_conflict: { icon: '⚠', label: 'Schedule Conflict' },
  overdue: { icon: '⏰', label: 'Overdue' },
  locked_critical: { icon: '🔒', label: 'Blocks Others' },
  dependency_cycle: { icon: '⚠', label: 'Circular Dependency' },
};

const PRIORITY_STYLES = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-rose-50 text-rose-700',
};

interface PlanCardProps {
  item: PlanItem;
  onEdit: (item: PlanItem) => void;
}

export default function PlanCard({ item, onEdit }: PlanCardProps) {
  const selectedItemId = useWorkspaceStore((s) => s.selectedItemId);
  const selectItem = useWorkspaceStore((s) => s.selectItem);
  const lockItem = useWorkspaceStore((s) => s.lockItem);
  const unlockItem = useWorkspaceStore((s) => s.unlockItem);
  const revertItem = useWorkspaceStore((s) => s.revertItem);
  const addActivityLog = useWorkspaceStore((s) => s.addActivityLog);
  const allItems = useWorkspaceStore((s) => s.items);

  const isSelected = selectedItemId === item.id;
  const blockingItems = useMemo(
    () =>
      item.dependencies
        .map((depId) => allItems.find((i) => i.id === depId))
        .filter((dep): dep is PlanItem => !!dep && dep.status !== 'done'),
    [item.dependencies, allItems]
  );
  const otherConflicts = useMemo(() => {
    const conflicts = detectConflicts(allItems).filter(
      (c) => c.itemIds.includes(item.id) && c.type !== 'blocked_dependency'
    );
    // De-dupe by type so a card shows at most one badge per conflict kind.
    const seen = new Set<string>();
    return conflicts.filter((c) => (seen.has(c.type) ? false : (seen.add(c.type), true)));
  }, [allItems, item.id]);
  const isCritical = useMemo(() => computeCriticalPath(allItems).has(item.id), [allItems, item.id]);

  const [showHighlight, setShowHighlight] = useState(false);
  const prevUpdatedAtRef = useRef(item.updatedAt);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Trigger highlight animation when agent updates
  useEffect(() => {
    if (
      item.updatedBy === 'agent' &&
      item.updatedAt !== prevUpdatedAtRef.current
    ) {
      setShowHighlight(true);
      const timer = setTimeout(() => setShowHighlight(false), 2500);
      prevUpdatedAtRef.current = item.updatedAt;
      return () => clearTimeout(timer);
    }
    prevUpdatedAtRef.current = item.updatedAt;
  }, [item.updatedAt, item.updatedBy]);

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectItem(isSelected ? null : item.id);
  };

  const handleLockToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.locked) {
      unlockItem(item.id);
      addActivityLog({ source: 'human', action: 'Unlocked', detail: `"${item.title}"`, status: 'success' });
    } else {
      lockItem(item.id);
      addActivityLog({ source: 'human', action: 'Locked', detail: `"${item.title}"`, status: 'success' });
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(item);
  };

  const handleRevert = (e: React.MouseEvent) => {
    e.stopPropagation();
    revertItem(item.id);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleSelect}
      onDoubleClick={handleDoubleClick}
      className={`
        group relative bg-surface rounded-lg border p-3 min-h-[108px] cursor-grab active:cursor-grabbing
        transition-all duration-200 
        ${isDragging ? 'opacity-50 shadow-lg scale-105' : 'hover:shadow-sm hover:border-border-hover'}
        ${isSelected ? 'border-primary-400 ring-1 ring-primary-200' : 'border-border'}
        ${showHighlight ? 'animate-agent-highlight' : ''}
        ${item.createdBy === 'agent' ? 'border-l-2 border-l-agent' : ''}
      `}
    >
      {/* Lock indicator */}
      <button
        onClick={handleLockToggle}
        className={`
          absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded
          text-xs transition-all
          ${item.locked
            ? 'opacity-100 text-amber-600 bg-amber-50'
            : 'opacity-0 group-hover:opacity-40 hover:!opacity-100 text-text-tertiary hover:bg-surface-secondary'
          }
        `}
        title={item.locked ? 'Locked by human — Agent cannot modify' : 'Click to lock'}
      >
        {item.locked ? '🔒' : '🔓'}
      </button>

      {/* Title */}
      <h3 className="text-sm font-medium text-text-primary pr-7 leading-snug flex items-center gap-1.5 flex-wrap">
        {item.title}
        {isCritical && (
          <span
            className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded bg-rose-50 text-rose-600"
            title="On the critical path — slipping this pushes the whole plan out"
          >
            CRITICAL
          </span>
        )}
      </h3>

      {/* Meta row */}
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${PRIORITY_STYLES[item.priority || 'medium']}`}>
          {item.priority || 'medium'}
        </span>
        {item.dueDate && (
          <span className="inline-flex items-center gap-1 text-xs text-text-secondary bg-surface-secondary px-1.5 py-0.5 rounded">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(item.dueDate)}
          </span>
        )}

        {item.owner && (
          <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
            <span className="w-4 h-4 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-[10px] font-medium">
              {item.owner.charAt(0).toUpperCase()}
            </span>
            {item.owner}
          </span>
        )}

        {item.status !== 'done' && blockingItems.length > 0 && (
          <span
            className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded"
            title={`Blocked by: ${blockingItems.map((d) => d.title).join(', ')}`}
          >
            ⛔ Blocked by {blockingItems.length}
          </span>
        )}

        {otherConflicts.map((c) => (
          <span
            key={c.type}
            className="inline-flex items-center gap-1 text-xs text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded"
            title={c.detail}
          >
            {CONFLICT_BADGE[c.type]?.icon ?? '⚠'} {CONFLICT_BADGE[c.type]?.label ?? c.title}
          </span>
        ))}
      </div>

      {/* Actor badge */}
      <div className="mt-2 flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
            item.updatedBy === 'agent'
              ? 'bg-agent-light text-agent'
              : 'bg-human-light text-human'
          }`}
        >
          {item.updatedBy === 'agent' ? (
            <>Agent ✦</>
          ) : (
            <>Human</>
          )}
        </span>

        {item.updatedBy === 'agent' && item.previousState && (
          <button
            onClick={handleRevert}
            className="text-[10px] text-text-tertiary hover:text-agent underline decoration-dotted transition-colors"
            title="Revert to before the agent's last change"
          >
            ↩ Revert
          </button>
        )}

        {item.locked && (
          <span className="text-[10px] text-amber-600 font-medium">
            Locked
          </span>
        )}
      </div>

      {/* Recently updated by agent indicator */}
      {showHighlight && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-agent rounded-full animate-fade-in" />
      )}
    </div>
  );
}
