import Board from './Board';
import LiveHumanContext from './LiveHumanContext';
import AiPlanAnalysisMini from './workspace/AiPlanAnalysisMini';
import ContextScope from './workspace/ContextScope';
import AiPermissions from './workspace/AiPermissions';
import PlanAnalysisCard from './workspace/PlanAnalysisCard';
import CriticalPathCard from './workspace/CriticalPathCard';
import AgentProposalPanel from './workspace/AgentProposalPanel';

export default function WorkspaceScreen() {
  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <Board />

        <div className="px-6 pb-6 pt-4 flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <PlanAnalysisCard />
            <CriticalPathCard />
          </div>

          <AgentProposalPanel />
        </div>
      </div>

      <aside className="w-80 flex-shrink-0 flex flex-col overflow-y-auto border-l border-border bg-surface">
        <LiveHumanContext />
        <AiPlanAnalysisMini />
        <ContextScope />
        <AiPermissions />
      </aside>
    </div>
  );
}
