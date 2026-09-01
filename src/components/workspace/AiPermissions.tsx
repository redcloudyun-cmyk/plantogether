import { useWorkspaceStore } from '../../store/workspaceStore';
import { decideAutonomyAction } from '../../lib/risk';
import type { RiskLevel } from '../../types/workspace';

type PolicyLabel = 'Allowed' | 'Auto Apply' | 'Ask' | 'Require Approval' | 'Blocked';

const COLOR: Record<PolicyLabel, string> = {
  Allowed: 'text-green-700 bg-green-50',
  'Auto Apply': 'text-green-700 bg-green-50',
  Ask: 'text-amber-700 bg-amber-50',
  'Require Approval': 'text-red-700 bg-red-50',
  Blocked: 'text-red-700 bg-red-50',
};

const RISK_ROWS: { label: string; risk: RiskLevel }[] = [
  { label: 'Update (low risk)', risk: 'low' },
  { label: 'Update (medium risk)', risk: 'medium' },
  { label: 'Update (high risk)', risk: 'high' },
];

function policyLabel(action: ReturnType<typeof decideAutonomyAction>): PolicyLabel {
  if (action === 'blocked') return 'Blocked';
  if (action === 'auto-apply') return 'Auto Apply';
  return 'Require Approval';
}

function Row({ label, value }: { label: string; value: PolicyLabel }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-text-primary">{label}</span>
      <span className={`font-medium px-1.5 py-0.5 rounded ${COLOR[value]}`}>{value}</span>
    </div>
  );
}

export default function AiPermissions() {
  const autonomyMode = useWorkspaceStore((s) => s.autonomyMode);
  const blocked = autonomyMode === 'observe';

  return (
    <div className="px-4 py-3 flex-shrink-0">
      <h3 className="text-xs font-semibold text-text-secondary tracking-wide mb-3">
        AI PERMISSIONS
      </h3>

      <div className="flex flex-col gap-1.5">
        <Row label="Read workspace" value="Allowed" />
        <Row label="Create item" value={blocked ? 'Blocked' : 'Auto Apply'} />
        {RISK_ROWS.map((r) => (
          <Row key={r.risk} label={r.label} value={policyLabel(decideAutonomyAction(autonomyMode, r.risk))} />
        ))}
        <Row label="Delete" value="Blocked" />
        <Row label="Lock / unlock" value="Blocked" />
      </div>
    </div>
  );
}
