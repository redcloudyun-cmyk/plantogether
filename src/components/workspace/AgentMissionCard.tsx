import { useMemo } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { detectConflicts } from '../../lib/planAnalysis';
import { useTranslation } from '../../i18n';

type MissionStepStatus = 'pending' | 'success' | 'warning';

function Step({ label, status }: { label: string; status: MissionStepStatus }) {
  const style = status === 'success' ? 'text-green-600' : status === 'warning' ? 'text-amber-600' : 'text-text-tertiary';
  return <li className="flex items-center gap-2 text-xs"><span className={`w-4 text-center font-bold ${style}`}>{status === 'success' ? '✓' : status === 'warning' ? '!' : '○'}</span><span className={status === 'pending' ? 'text-text-tertiary' : 'text-text-primary'}>{label}</span></li>;
}

export default function AgentMissionCard() {
  const items = useWorkspaceStore((state) => state.items);
  const selectedItemId = useWorkspaceStore((state) => state.selectedItemId);
  const activityLog = useWorkspaceStore((state) => state.activityLog);
  const proposals = useWorkspaceStore((state) => state.proposals);
  const pending = proposals.filter((proposal) => proposal.status === 'pending');
  const conflicts = useMemo(() => detectConflicts(items), [items]);
  const toolWasCalled = (name: string) => activityLog.some((entry) => entry.toolName === name);
  const workspaceRead = toolWasCalled('get_workspace_state') || toolWasCalled('analyze_plan');
  const focusRead = toolWasCalled('get_current_focus') || selectedItemId !== null;
  const analyzed = toolWasCalled('analyze_plan');
  const { t } = useTranslation();

  return (
    <section className="bg-white rounded-xl border border-violet-200 p-4" aria-labelledby="agent-mission-heading">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-wider text-violet-600 mb-1">{t('agentMission')}</p>
          <h2 id="agent-mission-heading" className="text-sm font-semibold text-text-primary">{t('missionGoal')}</h2>
        </div>
        <span className={`text-[10px] font-semibold rounded-full px-2 py-1 ${pending.length ? 'bg-amber-100 text-amber-700' : analyzed ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
          {pending.length ? t('waitingApproval') : analyzed ? t('analysisComplete') : t('ready')}
        </span>
      </div>
      <ol className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 mt-4">
        <Step label={t('workspaceRead')} status={workspaceRead ? 'success' : 'pending'} />
        <Step label={t('focusDetected')} status={focusRead ? 'success' : 'pending'} />
        <Step label={`${items.length} ${t('tasksAvailable')}`} status={workspaceRead ? 'success' : 'pending'} />
        <Step label={`${conflicts.length} ${t('planRisksFound')}`} status={analyzed && conflicts.length ? 'warning' : analyzed ? 'success' : 'pending'} />
        <Step label={t('criticalCalculated')} status={analyzed ? 'success' : 'pending'} />
        <Step label={`${pending.length} ${t('improvementsProposed')}`} status={pending.length ? 'success' : 'pending'} />
      </ol>
    </section>
  );
}
