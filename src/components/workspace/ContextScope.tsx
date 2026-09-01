import { useWorkspaceStore } from '../../store/workspaceStore';
import type { ContextScopeKey } from '../../types/workspace';
import { useTranslation, type TranslationKey } from '../../i18n';

const OPTIONS: { key: ContextScopeKey; label: TranslationKey }[] = [
  { key: 'currentItem', label: 'currentItem' }, { key: 'boardState', label: 'boardState' },
  { key: 'dependencies', label: 'dependencies' }, { key: 'planStatus', label: 'planStatus' },
  { key: 'activityHistory', label: 'activityHistory' }, { key: 'completedItems', label: 'completedItems' },
  { key: 'teamInformation', label: 'teamInformation' },
];

/**
 * The checklist rows only — no wrapping heading, so it can be embedded
 * anywhere the live Context Scope needs to be shown (Workspace sidebar,
 * Settings) without ever drifting out of sync between the two.
 */
export function ContextScopeList() {
  const scope = useWorkspaceStore((state) => state.contextScope);
  const toggle = useWorkspaceStore((state) => state.toggleContextScope);
  const { t } = useTranslation();

  return (
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
            <span className={enabled ? 'text-text-primary' : 'text-text-tertiary'}>{t(label)}</span>
          </label>
        );
      })}
    </div>
  );
}

export default function ContextScope() {
  const { t } = useTranslation();

  return (
    <section className="px-4 py-3 border-b border-border flex-shrink-0" aria-labelledby="context-scope-heading">
      <h3 id="context-scope-heading" className="text-xs font-semibold text-text-secondary tracking-wide mb-3">
        {t('contextScope')}
      </h3>
      <ContextScopeList />
    </section>
  );
}
