import { useWorkspaceStore } from '../store/workspaceStore';

export default function Header() {
  const title = useWorkspaceStore((s) => s.title);
  const webmcpAvailable = useWorkspaceStore((s) => s.webmcpAvailable);
  const resetWorkspace = useWorkspaceStore((s) => s.resetWorkspace);

  return (
    <header className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary leading-tight">
              PlanTogether
            </h1>
            <p className="text-xs text-text-tertiary leading-tight">
              Plan together. Human and agent.
            </p>
          </div>
        </div>
        <span className="text-text-tertiary mx-2">·</span>
        <span className="text-sm text-text-secondary font-medium">{title}</span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={resetWorkspace}
          className="text-xs text-text-tertiary hover:text-text-secondary transition-colors px-2 py-1 rounded hover:bg-surface-secondary"
          title="Reset to demo data"
        >
          Reset
        </button>
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
