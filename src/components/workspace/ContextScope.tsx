import { useWorkspaceStore } from '../../store/workspaceStore';
import type { ContextScopeKey } from '../../types/workspace';

const OPTIONS: { key: ContextScopeKey; label: string }[] = [
  { key: 'currentItem', label: 'Current item' },
  { key: 'boardState', label: 'Board state' },
  { key: 'dependencies', label: 'Dependencies' },
  { key: 'planStatus', label: 'Plan status' },
  { key: 'activityHistory', label: 'Activity history' },
  { key: 'completedItems', label: 'Completed items' },
  { key: 'teamInformation', label: 'Team information' },
];

export default function ContextScope() {
  const scope = useWorkspaceStore((state) => state.contextScope);
  const toggle = useWorkspaceStore((state) => state.toggleContextScope);

  return (
    <section className="px-4 py-3 border-b border-border flex-shrink-0" aria-labelledby="context-scope-heading">
      <h3 id="context-scope-heading" className="text-xs font-semibold text-text-secondary tracking-wide mb-3">
        CONTEXT SCOPE (What AI Sees)
      </h3>

      <div className="flex flex-col gap-1">
        {OPTIONS.map(({ key, label }) => {
          const enabled = scope[key];
          return (
            <label
              key={key}
              className="flex items-center gap-2 rounded px-1 py-1 text-xs text-text-primary cursor-pointer hover:bg-surface-secondary"
            >
              <input
                type="checkbox"
                checked={enabled}
                onChange={() => toggle(key)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center text-[9px] flex-shrink-0 transition-colors ${
                  enabled ? 'bg-green-100 border-green-200 text-green-700' : 'border-border'
                }`}
              >
                {enabled ? '✓' : ''}
              </span>
              <span className={enabled ? 'text-text-primary' : 'text-text-tertiary'}>{label}</span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
