import { useState, useEffect, useRef } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import type { PlanItem, ItemStatus, ItemPriority } from '../types/workspace';
import { useTranslation } from '../i18n';

interface CardEditorProps {
  item?: PlanItem | null;
  defaultStatus?: ItemStatus;
  onClose: () => void;
}

export default function CardEditor({ item, defaultStatus = 'backlog', onClose }: CardEditorProps) {
  const addItem = useWorkspaceStore((s) => s.addItem);
  const updateItem = useWorkspaceStore((s) => s.updateItem);
  const addActivityLog = useWorkspaceStore((s) => s.addActivityLog);
  const { t } = useTranslation();

  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [owner, setOwner] = useState(item?.owner || '');
  const [dueDate, setDueDate] = useState(item?.dueDate || '');
  const [status, setStatus] = useState<ItemStatus>(item?.status || defaultStatus);
  const [priority, setPriority] = useState<ItemPriority>(item?.priority || 'medium');
  const [error, setError] = useState<string | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (item) {
      const result = updateItem(item.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        owner: owner.trim() || undefined,
        dueDate: dueDate || undefined,
        status,
        priority,
      }, 'human');

      if (!result.success) {
        if (result.reason === 'DEPENDENCIES_INCOMPLETE') {
          addActivityLog({
            source: 'human',
            action: 'Blocked',
            detail: `"${item.title}"\nDEPENDENCIES_INCOMPLETE`,
            status: 'blocked',
          });
        }
        setError(
          result.reason === 'DEPENDENCIES_INCOMPLETE'
            ? t('dependenciesIncompleteError')
            : t('couldNotSaveError')
        );
        return;
      }

      addActivityLog({
        source: 'human',
        action: 'Updated',
        detail: `"${title.trim()}"`,
        status: 'success',
      });
    } else {
      addItem({
        title: title.trim(),
        description: description.trim() || undefined,
        owner: owner.trim() || undefined,
        dueDate: dueDate || undefined,
        status,
        priority,
      }, 'human');

      addActivityLog({
        source: 'human',
        action: 'Added',
        detail: `"${title.trim()}"`,
        status: 'success',
      });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl border border-border shadow-xl w-full max-w-md p-6 animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-text-primary mb-4">
          {item ? t('editItem') : t('newItem')}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              {t('titleLabel')}
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('titlePlaceholder')}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              {t('descriptionLabel')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('descriptionPlaceholder')}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                {t('ownerLabel')}
              </label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder={t('ownerPlaceholder')}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                {t('dueDateLabel')}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              {t('statusLabel')}
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as ItemStatus);
                setError(null);
              }}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
            >
              <option value="backlog">{t('backlog')}</option>
              <option value="planned">{t('planned')}</option>
              <option value="doing">{t('doing')}</option>
              <option value="done">{t('done')}</option>
            </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                {t('priorityLabel')}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ItemPriority)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
              >
                <option value="low">{t('priorityLow')}</option>
                <option value="medium">{t('priorityMedium')}</option>
                <option value="high">{t('priorityHigh')}</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface-secondary"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {item ? t('saveChanges') : t('addItemBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
