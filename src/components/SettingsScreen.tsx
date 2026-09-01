import { useWorkspaceStore } from '../store/workspaceStore';
import type { AutonomyMode } from '../types/workspace';
import ResetDemoButton from './ResetDemoButton';

const TOOLS = [
  { name: 'get_workspace_state', description: 'Read the full board — every item, status, owner, due date, lock, dependencies.' },
  { name: 'get_current_focus', description: 'Read the item the human currently has selected.' },
  { name: 'add_item', description: 'Create a new planning item. Always low-risk — applies immediately.' },
  { name: 'update_item', description: 'Edit an item. Risk depends on which fields change; risky changes become proposals.' },
  { name: 'analyze_plan', description: 'Read-only structured analysis of the plan, grouped by status and blockers.' },
];

const AUTONOMY_MODES: { id: AutonomyMode; label: string; hint: string }[] = [
  { id: 'observe', label: 'Observe', hint: 'Agent can read the workspace but cannot make any changes at all.' },
  { id: 'assist', label: 'Assist (Recommended)', hint: 'Low-risk edits apply automatically. Due date, status, and dependency changes need your approval.' },
  { id: 'autonomous', label: 'Autonomous', hint: 'Low & medium-risk edits apply automatically. Only high-risk changes (dependencies) need your approval.' },
];

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <h2 className="text-xs font-semibold text-text-secondary tracking-wide mb-3">{title}</h2>
      {children}
    </div>
  );
}

export default function SettingsScreen() {
  const webmcpAvailable = useWorkspaceStore((s) => s.webmcpAvailable);
  const autonomyMode = useWorkspaceStore((s) => s.autonomyMode);
  const setAutonomyMode = useWorkspaceStore((s) => s.setAutonomyMode);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Settings / WebMCP</h1>
          <p className="text-sm text-text-tertiary mt-0.5">
            What the agent can see and do, and how independently it's allowed to act.
          </p>
        </div>

        <Card title="WEBMCP STATUS">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${webmcpAvailable ? 'bg-green-500' : 'bg-text-tertiary'}`} />
            <span className="text-sm font-medium text-text-primary">
              {webmcpAvailable ? 'Connected' : 'Unavailable'}
            </span>
          </div>
          {!webmcpAvailable && (
            <p className="text-xs text-amber-600 mt-2">
              Enable WebMCP in Chrome 149+ via chrome://flags/#enable-webmcp-testing, then reload.
            </p>
          )}
        </Card>

        <Card title="TOOLS">
          <div className="flex flex-col gap-2.5">
            {TOOLS.map((tool) => (
              <div key={tool.name} className="flex items-start gap-2 text-sm">
                <span className="text-green-600 mt-0.5">✓</span>
                <div>
                  <span className="font-mono text-text-primary">{tool.name}</span>
                  <p className="text-xs text-text-tertiary">{tool.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="AUTONOMY">
          <div className="flex flex-col gap-2">
            {AUTONOMY_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setAutonomyMode(mode.id)}
                className={`text-left rounded-lg border px-3 py-2.5 transition-colors ${
                  autonomyMode === mode.id
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-border hover:bg-surface-secondary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                      autonomyMode === mode.id ? 'border-primary-600 bg-primary-600' : 'border-border'
                    }`}
                  />
                  <span className="text-sm font-medium text-text-primary">{mode.label}</span>
                </div>
                <p className="text-xs text-text-tertiary mt-1 ml-5">{mode.hint}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card title="CONTEXT">
          <div className="flex flex-col gap-1.5">
            {['Current focus', 'Workspace state', 'Dependencies'].map((label) => (
              <div key={label} className="flex items-center gap-2 text-sm text-text-primary">
                <span className="text-green-600">✓</span>
                {label}
              </div>
            ))}
          </div>
        </Card>

        <Card title="RESTRICTED">
          <div className="flex flex-col gap-1.5">
            {['Delete items or the workspace', 'Lock or unlock items (human-only)', 'Manage users'].map((label) => (
              <div key={label} className="flex items-center gap-2 text-sm text-text-tertiary">
                <span className="text-red-500">✗</span>
                {label}
              </div>
            ))}
          </div>
        </Card>

        <Card title="DEMO">
          <ResetDemoButton variant="button" />
        </Card>
      </div>
    </div>
  );
}
