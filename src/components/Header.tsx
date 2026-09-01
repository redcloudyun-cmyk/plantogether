import { useWorkspaceStore } from '../store/workspaceStore';
import type { AutonomyMode } from '../types/workspace';
import ResetDemoButton from './ResetDemoButton';

const AUTONOMY_MODES: { id: AutonomyMode; label: string; hint: string }[] = [
  { id: 'observe', label: 'Observe', hint: 'Agent can read the workspace but cannot make any changes.' },
  { id: 'assist', label: 'Assist', hint: 'Low-risk edits apply automatically. Due date, status, and dependency changes need your approval.' },
  { id: 'autonomous', label: 'Autonomous', hint: 'Low & medium-risk edits apply automatically. Only high-risk changes (dependencies) need your approval.' },
];

export type ScreenId = 'dashboard' | 'workspace' | 'activity' | 'settings';
const SCREENS: ScreenId[] = ['dashboard', 'workspace', 'activity', 'settings'];

interface HeaderProps {
  screen: ScreenId;
  onScreenChange: (screen: ScreenId) => void;
}

export default function Header({ screen, onScreenChange }: HeaderProps) {
  const title = useWorkspaceStore((s) => s.title);
  const webmcpAvailable = useWorkspaceStore((s) => s.webmcpAvailable);
  const autonomyMode = useWorkspaceStore((s) => s.autonomyMode);
  const setAutonomyMode = useWorkspaceStore((s) => s.setAutonomyMode);
  const pendingCount = useWorkspaceStore((s) => s.proposals.filter((p) => p.status === 'pending').length);

  return (
    <header className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary leading-tight">
              WithGeX
            </h1>
            <p className="text-xs text-text-tertiary leading-tight">
              Plan together. Human and agent.
            </p>
          </div>
        </div>
        <span className="text-text-tertiary mx-2">·</span>
        <span className="text-sm text-text-secondary font-medium">{title}</span>

        <div className="flex items-center bg-surface-secondary rounded-full border border-border p-0.5 ml-3">
          {SCREENS.map((s) => (
            <button
              key={s}
              onClick={() => onScreenChange(s)}
              className={`px-3 py-1 text-xs font-medium rounded-full capitalize transition-colors ${
                screen === s
                  ? 'bg-surface text-text-primary shadow-sm border border-border'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {pendingCount > 0 && (
          <span className="flex items-center gap-1 text-xs font-medium text-agent bg-agent-light px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-agent rounded-full animate-pulse" />
            {pendingCount} pending proposal{pendingCount === 1 ? '' : 's'}
          </span>
        )}

        <div className="flex items-center bg-surface-secondary rounded-full border border-border p-0.5">
          {AUTONOMY_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setAutonomyMode(mode.id)}
              title={mode.hint}
              className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                autonomyMode === mode.id
                  ? 'bg-surface text-text-primary shadow-sm border border-border'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <ResetDemoButton />
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              webmcpAvailable ? 'bg-green-500' : 'bg-text-tertiary'
            }`}
          />
          <span className="text-xs text-text-tertiary">
            {webmcpAvailable ? 'WebMCP Connected' : 'WebMCP Unavailable'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary rounded-full border border-border">
          <span className="text-xs font-medium text-human">Human</span>
          <span className="text-text-tertiary text-xs">+</span>
          <span className="text-xs font-medium text-agent">Agent</span>
        </div>
      </div>
    </header>
  );
}
