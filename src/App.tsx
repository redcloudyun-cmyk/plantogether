import { useEffect, useState } from 'react';
import Header from './components/Header';
import Board from './components/Board';
import LiveHumanContext from './components/LiveHumanContext';
import WebMcpActivity from './components/WebMcpActivity';
import StatusBar from './components/StatusBar';
import ProposalModal from './components/ProposalModal';
import Dashboard from './components/Dashboard';
import { registerWebMCPTools } from './webmcp/registerTools';

export default function App() {
  const [screen, setScreen] = useState<'dashboard' | 'workspace'>('workspace');

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const init = async () => {
      cleanup = await registerWebMCPTools();
    };

    init();

    return () => {
      cleanup?.();
    };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-surface-secondary">
      <Header screen={screen} onScreenChange={setScreen} />

      {screen === 'dashboard' ? (
        <Dashboard onOpenWorkspace={() => setScreen('workspace')} />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <Board />
          <aside className="w-80 flex-shrink-0 flex flex-col overflow-hidden border-l border-border bg-surface">
            <LiveHumanContext />
            <div className="flex-1 overflow-hidden">
              <WebMcpActivity />
            </div>
          </aside>
        </div>
      )}

      <StatusBar />
      <ProposalModal />
    </div>
  );
}
