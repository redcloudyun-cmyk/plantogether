import { useEffect, useState } from 'react';
import Header, { type ScreenId } from './components/Header';
import WorkspaceScreen from './components/WorkspaceScreen';
import StatusBar from './components/StatusBar';
import Dashboard from './components/Dashboard';
import ActivityScreen from './components/ActivityScreen';
import SettingsScreen from './components/SettingsScreen';
import { registerWebMCPTools } from './webmcp/registerTools';

export default function App() {
  const [screen, setScreen] = useState<ScreenId>('workspace');

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

      {screen === 'dashboard' && <Dashboard onOpenWorkspace={() => setScreen('workspace')} />}
      {screen === 'workspace' && <WorkspaceScreen />}
      {screen === 'activity' && <ActivityScreen />}
      {screen === 'settings' && <SettingsScreen />}

      <StatusBar />
    </div>
  );
}
