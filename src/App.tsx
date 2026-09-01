import { useEffect } from 'react';
import Header from './components/Header';
import Board from './components/Board';
import AgentActivity from './components/AgentActivity';
import StatusBar from './components/StatusBar';
import { registerWebMCPTools } from './webmcp/registerTools';

export default function App() {
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
      <Header />
      <Board />
      <div className="border-t border-border bg-surface">
        <AgentActivity />
      </div>
      <StatusBar />
    </div>
  );
}
