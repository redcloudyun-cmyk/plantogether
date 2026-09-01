import { useWorkspaceStore } from '../store/workspaceStore';
import type { ItemStatus } from '../types/workspace';

const STATUS_LABELS: Record<ItemStatus, string> = {
  backlog: 'Backlog',
  planned: 'Planned',
  doing: 'Doing',
  done: 'Done',
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

  const selected = selectedItemId ? items.find((i) => i.id === selectedItemId) : null;

  return (
    <div className="px-4 py-3 border-b border-border flex-shrink-0">
      <h3 className="text-xs font-semibold text-text-secondary tracking-wide mb-3">
        LIVE HUMAN CONTEXT
      </h3>

      {selected ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wide mb-1">Selected</p>
              <p className="text-sm font-medium text-text-primary leading-snug">{selected.title}</p>
            </div>
            {selected.locked && <span className="text-amber-600 flex-shrink-0 mt-0.5">🔒</span>}
          </div>

          <dl className="flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between">
              <dt className="text-text-tertiary">Status</dt>
              <dd className="text-text-primary font-medium">{STATUS_LABELS[selected.status]}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-tertiary">Due</dt>
              <dd className="text-text-primary font-medium">{formatDate(selected.dueDate)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-tertiary">Owner</dt>
              <dd className="text-text-primary font-medium">{selected.owner || '—'}</dd>
            </div>
            {selected.locked && (
              <div className="flex items-center justify-between">
                <dt className="text-text-tertiary">Locked</dt>
                <dd className="text-amber-600 font-medium">By you</dd>
              </div>
            )}
            <div className="flex items-center justify-between">
              <dt className="text-text-tertiary">Last Edited</dt>
              <dd className="text-text-primary font-medium">{formatTime(selected.updatedAt)}</dd>
            </div>
          </dl>

          {webmcpAvailable && (
            <div className="flex items-center gap-1.5 text-[10px] text-agent font-medium pt-1">
              <span>✓</span>
              <span>Shared with Agent</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-text-tertiary italic">
          No card selected. Select a card to share it as live context with the agent.
        </p>
      )}
    </div>
  );
}
