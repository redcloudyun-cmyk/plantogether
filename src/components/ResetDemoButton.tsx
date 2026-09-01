import { useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useTranslation } from '../i18n';

interface ResetDemoButtonProps {
  variant?: 'link' | 'button';
}

export default function ResetDemoButton({ variant = 'link' }: ResetDemoButtonProps) {
  const resetWorkspace = useWorkspaceStore((s) => s.resetWorkspace);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { t } = useTranslation();

  const handleReset = () => {
    resetWorkspace();
    setConfirmOpen(false);
  };

  return (
    <>
      {variant === 'link' ? (
        <button
          onClick={() => setConfirmOpen(true)}
          className="text-xs text-text-tertiary hover:text-text-secondary transition-colors px-2 py-1 rounded hover:bg-surface-secondary"
          title={t('resetDemoTooltip')}
        >
          {t('resetDemo')}
        </button>
      ) : (
        <button
          onClick={() => setConfirmOpen(true)}
          className="w-full px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
        >
          {t('resetWorkspace')}
        </button>
      )}

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] animate-fade-in"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="bg-surface rounded-xl border border-border shadow-xl w-full max-w-sm p-6 animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-sm font-semibold text-text-primary mb-1">{t('resetQuestion')}</h2>
            <p className="text-xs text-text-secondary mb-4">
              {t('resetExplanation')}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface-secondary"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                {t('reset')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
