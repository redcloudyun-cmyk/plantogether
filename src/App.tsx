import { useEffect, useState } from 'react';
import Header, { type ScreenId } from './components/Header';
import WorkspaceScreen from './components/WorkspaceScreen';
import StatusBar from './components/StatusBar';
import Dashboard from './components/Dashboard';
import ActivityScreen from './components/ActivityScreen';
import SettingsScreen from './components/SettingsScreen';
import { registerWebMCPTools } from './webmcp/registerTools';
import { useWorkspaceStore } from './store/workspaceStore';
import ResetDemoButton from './components/ResetDemoButton';
import { useTranslation } from './i18n';

function TopBar({ screen }: { screen: ScreenId }) {
  const title = useWorkspaceStore((state) => state.title);
  const webmcpAvailable = useWorkspaceStore((state) => state.webmcpAvailable);
  const autonomyMode = useWorkspaceStore((state) => state.autonomyMode);
  const setAutonomyMode = useWorkspaceStore((state) => state.setAutonomyMode);
  const { t } = useTranslation();
  const heading = screen === 'workspace' ? title : screen === 'activity' ? `3. ${t('activity')}` : screen === 'settings' ? `4. ${t('settings')} / WebMCP` : t('dashboard');
  const subtitle = screen === 'activity' ? t('activitySubtitle') : screen === 'settings' ? t('settingsSubtitle') : screen === 'workspace' ? t('workspaceSubtitle') : t('dashboardSubtitle');

  return (
    <div className="h-20 flex-shrink-0 bg-white border-b border-border px-7 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold text-slate-950">{heading}</h1>
        <p className="text-xs text-text-tertiary mt-1">
          {subtitle}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden lg:flex items-center gap-2 border border-border rounded-lg px-3 py-2 text-xs font-medium">
          <span className={`w-2 h-2 rounded-full ${webmcpAvailable ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          WebMCP <span className={webmcpAvailable ? 'text-emerald-600' : 'text-text-tertiary'}>{webmcpAvailable ? t('connected') : t('unavailable')}</span>
        </span>
        {screen === 'workspace' && (
          <select value={autonomyMode} onChange={(event) => setAutonomyMode(event.target.value as typeof autonomyMode)} className="border border-border rounded-lg bg-white px-3 py-2 text-xs font-medium">
            <option value="observe">{t('observeMode')}</option>
            <option value="assist">{t('assistMode')}</option>
            <option value="autonomous">{t('autonomousMode')}</option>
          </select>
        )}
        <ResetDemoButton />
      </div>
    </div>
  );
}

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
    <div className="h-screen flex bg-[#f7f9fc] overflow-hidden">
      <Header screen={screen} onScreenChange={setScreen} />
      <main className="min-w-0 flex-1 flex flex-col">
        <TopBar screen={screen} />
        {screen === 'dashboard' && <Dashboard onOpenWorkspace={() => setScreen('workspace')} />}
        {screen === 'workspace' && <WorkspaceScreen />}
        {screen === 'activity' && <ActivityScreen />}
        {screen === 'settings' && <SettingsScreen />}
        <StatusBar />
      </main>
    </div>
  );
}
