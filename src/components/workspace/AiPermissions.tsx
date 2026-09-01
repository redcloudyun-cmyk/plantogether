import { useWorkspaceStore } from '../../store/workspaceStore';
import { decideAutonomyAction } from '../../lib/risk';
import type { RiskLevel } from '../../types/workspace';
import { useTranslation, type TranslationKey } from '../../i18n';

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

function Row({ label, value, translatedValue }: { label: string; value: PolicyLabel; translatedValue: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-text-primary">{label}</span>
      <span className={`font-medium px-1.5 py-0.5 rounded ${COLOR[value]}`}>{translatedValue}</span>
    </div>
  );
}

export default function AiPermissions() {
  const autonomyMode = useWorkspaceStore((s) => s.autonomyMode);
  const blocked = autonomyMode === 'observe';
  const { t } = useTranslation();
  const valueText = (value: PolicyLabel) => t(({ Allowed: 'allowed', 'Auto Apply': 'autoApply', Ask: 'requireApproval', 'Require Approval': 'requireApproval', Blocked: 'blocked' } as Record<PolicyLabel, TranslationKey>)[value]);

  return (
    <div className="px-4 py-3 flex-shrink-0">
      <h3 className="text-xs font-semibold text-text-secondary tracking-wide mb-3">
        {t('aiPermissions')}
      </h3>

      <div className="flex flex-col gap-1.5">
        <Row label={t('readWorkspace')} value="Allowed" translatedValue={valueText('Allowed')} />
        <Row label={t('createItem')} value={blocked ? 'Blocked' : 'Auto Apply'} translatedValue={valueText(blocked ? 'Blocked' : 'Auto Apply')} />
        {RISK_ROWS.map((r) => (
          <Row key={r.risk} label={t(r.risk === 'low' ? 'updateLow' : r.risk === 'medium' ? 'updateMedium' : 'updateHigh')} value={policyLabel(decideAutonomyAction(autonomyMode, r.risk))} translatedValue={valueText(policyLabel(decideAutonomyAction(autonomyMode, r.risk)))} />
        ))}
        <Row label={t('delete')} value="Blocked" translatedValue={valueText('Blocked')} />
        <Row label={t('lockUnlock')} value="Blocked" translatedValue={valueText('Blocked')} />
      </div>
    </div>
  );
}
