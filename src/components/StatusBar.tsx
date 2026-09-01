import { useWorkspaceStore } from '../store/workspaceStore';
import { useTranslation } from '../i18n';

export default function StatusBar() {
  const selectedItemId = useWorkspaceStore((s) => s.selectedItemId);
  const items = useWorkspaceStore((s) => s.items);
  const webmcpAvailable = useWorkspaceStore((s) => s.webmcpAvailable);
  const { t } = useTranslation();

  const selectedItem = selectedItemId
    ? items.find((i) => i.id === selectedItemId)
    : null;

  return (
    <div className="flex items-center gap-4 px-4 py-2 text-xs border-t border-border bg-surface">
      <div className="flex items-center gap-2">
        <span className="text-text-tertiary">{t('currentFocus')}</span>
        {selectedItem ? (
          <span className="font-medium text-text-primary">
            {selectedItem.title}
            {selectedItem.locked && ' 🔒'}
          </span>
        ) : (
          <span className="text-text-tertiary italic">{t('noneSelected')}</span>
        )}
      </div>

      <div className="flex-1" />

      {!webmcpAvailable && (
        <span className="text-amber-600 text-[10px]">
          Enable WebMCP in Chrome 149+ via chrome://flags/#enable-webmcp-testing
        </span>
      )}

      <div className="flex items-center gap-3 text-text-tertiary">
        <span>{items.length} {t('itemsSuffix')}</span>
        <span>·</span>
        <span>{items.filter((i) => i.status === 'done').length} {t('doneSuffix')}</span>
      </div>
    </div>
  );
}
