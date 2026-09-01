import Board from './Board';
import LiveHumanContext from './LiveHumanContext';
import AiPlanAnalysisMini from './workspace/AiPlanAnalysisMini';
import ContextScope from './workspace/ContextScope';
import AiPermissions from './workspace/AiPermissions';
import PlanAnalysisCard from './workspace/PlanAnalysisCard';
import CriticalPathCard from './workspace/CriticalPathCard';
import AgentProposalPanel from './workspace/AgentProposalPanel';
import AgentMissionCard from './workspace/AgentMissionCard';

export default function WorkspaceScreen() {
  return (
    <div className="flex-1 flex overflow-hidden bg-[#f7f9fc]">
      <div className="flex-1 overflow-y-auto">
        <Board />

        <div className="px-4 pb-6 pt-3 flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row gap-4">
            <PlanAnalysisCard />
            <CriticalPathCard />
          </div>

          <AgentMissionCard />
          <AgentProposalPanel />
        </div>
      </div>

      <aside className="w-72 xl:w-80 flex-shrink-0 flex flex-col overflow-y-auto border-l border-border bg-white p-3 gap-3 [&>*]:rounded-xl [&>*]:border [&>*]:border-border">
        <LiveHumanContext />
        <AiPlanAnalysisMini />
        <ContextScope />
        <AiPermissions />
      </aside>
    </div>
  );
}
