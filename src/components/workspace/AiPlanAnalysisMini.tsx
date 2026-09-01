import { useMemo, useState } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { detectConflicts } from '../../lib/planAnalysis';
import { useTranslation, translateConflict } from '../../i18n';

export default function AiPlanAnalysisMini({ onViewWorkspace }: { onViewWorkspace?: () => void }) {
  const items = useWorkspaceStore((state) => state.items);
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();
  const conflicts = useMemo(() => detectConflicts(items), [items]);
  const conflictCount = conflicts.filter((conflict) => conflict.type === 'schedule_conflict' || conflict.type === 'dependency_cycle').length;
  const blockedIds = new Set(conflicts.filter((conflict) => conflict.type === 'blocked_dependency').map((conflict) => conflict.itemIds[0]));
  const atRiskIds = new Set(conflicts.filter((conflict) => conflict.type === 'overdue' || conflict.type === 'locked_critical').map((conflict) => conflict.itemIds[0]));
  const affectedIds = new Set([...blockedIds, ...atRiskIds]);
  const onTrack = items.filter((item) => item.status !== 'done' && !affectedIds.has(item.id)).length;

  const metrics = [
    [t('conflicts'), conflictCount, 'text-red-600'], [t('blocked'), blockedIds.size, 'text-red-600'],
    [t('atRisk'), atRiskIds.size, 'text-amber-600'], [t('onTrack'), onTrack, 'text-green-600'],
  ] as const;

  return (
    <div className="px-4 py-3 border-b border-border flex-shrink-0">
      <h3 className="text-xs font-semibold text-text-secondary tracking-wide mb-3">{t('aiPlanAnalysis')}</h3>
      <div className="flex flex-col gap-1.5 text-xs mb-3">
        {metrics.map(([label, value, color]) => (
          <div key={label} className="flex items-center justify-between"><span>{label}</span><span className={`font-medium ${color}`}>{value}</span></div>
        ))}
      </div>
      <button onClick={onViewWorkspace ?? (() => setExpanded((value) => !value))} className="w-full text-xs font-medium text-primary-600 border border-primary-200 hover:bg-primary-50 rounded-lg px-3 py-1.5">
        {expanded && !onViewWorkspace ? t('hideAnalysis') : t('viewAnalysis')}
      </button>
      {expanded && !onViewWorkspace && (
        <div className="mt-3 flex flex-col gap-1.5">
          {conflicts.length === 0 ? <p className="text-xs text-text-tertiary">{t('noConflicts')}</p> : conflicts.map((conflict) => <p key={conflict.id} className="text-xs text-text-secondary border-l-2 border-amber-300 pl-2">{translateConflict(conflict, t).detail}</p>)}
        </div>
      )}
    </div>
  );
}
