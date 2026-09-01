import { useWorkspaceStore } from '../store/workspaceStore';
import { useTranslation, type TranslationKey } from '../i18n';

const PRIORITY_LABEL_KEY: Record<string, TranslationKey> = {
  low: 'priorityLow',
  medium: 'priorityMedium',
  high: 'priorityHigh',
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function LiveHumanContext() {
  const selectedItemId = useWorkspaceStore((s) => s.selectedItemId);
  const items = useWorkspaceStore((s) => s.items);
  const webmcpAvailable = useWorkspaceStore((s) => s.webmcpAvailable);
  const { t } = useTranslation();

  const selected = selectedItemId ? items.find((i) => i.id === selectedItemId) : null;

  return (
    <div className="px-4 py-3 border-b border-border flex-shrink-0">
      <h3 className="text-xs font-semibold text-text-secondary tracking-wide mb-3">
        {t('liveHumanContext')}
      </h3>

      {selected ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wide mb-1">{t('selected')}</p>
              <p className="text-sm font-medium text-text-primary leading-snug">{selected.title}</p>
            </div>
            {selected.locked && <span className="text-amber-600 flex-shrink-0 mt-0.5">🔒</span>}
          </div>

          <dl className="flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between">
              <dt className="text-text-tertiary">{t('status')}</dt>
              <dd className="text-text-primary font-medium">{t(selected.status)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-tertiary">{t('due')}</dt>
              <dd className="text-text-primary font-medium">{formatDate(selected.dueDate)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-tertiary">{t('owner')}</dt>
              <dd className="text-text-primary font-medium">{selected.owner || '—'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-tertiary">{t('priority')}</dt>
              <dd className={`font-medium ${selected.priority === 'high' ? 'text-rose-600' : selected.priority === 'low' ? 'text-slate-500' : 'text-amber-600'}`}>
                {t(PRIORITY_LABEL_KEY[selected.priority || 'medium'])}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-tertiary">{t('dependencies')}</dt>
              <dd className="text-text-primary font-medium">{selected.dependencies.length}</dd>
            </div>
            {selected.locked && (
              <div className="flex items-center justify-between">
                <dt className="text-text-tertiary">{t('locked')}</dt>
                <dd className="text-amber-600 font-medium">{t('byYou')}</dd>
              </div>
            )}
            <div className="flex items-center justify-between">
              <dt className="text-text-tertiary">{t('lastEdited')}</dt>
              <dd className="text-text-primary font-medium">{formatTime(selected.updatedAt)}</dd>
            </div>
          </dl>

          {webmcpAvailable && (
            <div className="flex items-center gap-1.5 text-[10px] text-agent font-medium pt-1">
              <span>✓</span>
              <span>{t('sharedWithAgent')}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-text-tertiary italic">
          {t('noCardSelected')}
        </p>
      )}
    </div>
  );
}
