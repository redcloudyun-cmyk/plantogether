import { useMemo, useState } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import type { Proposal, ProposalChangeSet, RiskLevel } from '../../types/workspace';
import { calculateProposalImpact } from '../../lib/proposalImpact';
import { useTranslation, type TranslationKey } from '../../i18n';

const VALUE_LABEL_KEY: Record<string, TranslationKey> = {
  backlog: 'backlog',
  planned: 'planned',
  doing: 'doing',
  done: 'done',
  low: 'priorityLow',
  medium: 'priorityMedium',
  high: 'priorityHigh',
};

const RISK_STYLES: Record<RiskLevel, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-rose-100 text-rose-700',
};

const FIELD_LABEL_KEY: Record<keyof ProposalChangeSet, TranslationKey> = {
  title: 'fieldTitle',
  description: 'descriptionLabel',
  status: 'statusLabel',
  owner: 'ownerLabel',
  dueDate: 'dueDateLabel',
  priority: 'priorityLabel',
  dependencies: 'dependencies',
};

function formatFieldValue(field: keyof ProposalChangeSet, value: unknown, t: (key: TranslationKey) => string): string {
  if (value === undefined || value === null || value === '') return '—';
  switch (field) {
    case 'status':
    case 'priority':
      return VALUE_LABEL_KEY[value as string] ? t(VALUE_LABEL_KEY[value as string]) : (value as string);
    case 'dependencies': {
      const deps = value as string[];
      return `${deps.length} ${t('itemsSuffix')}`;
    }
    default:
      return String(value);
  }
}

function fieldsOf(change: ProposalChangeSet): (keyof ProposalChangeSet)[] {
  return Object.keys(change) as (keyof ProposalChangeSet)[];
}

export default function AgentProposalPanel() {
  const proposals = useWorkspaceStore((s) => s.proposals);
  const items = useWorkspaceStore((s) => s.items);
  const approveAllPending = useWorkspaceStore((s) => s.approveAllPending);
  const rejectAllPending = useWorkspaceStore((s) => s.rejectAllPending);
  const approveProposal = useWorkspaceStore((s) => s.approveProposal);
  const rejectProposal = useWorkspaceStore((s) => s.rejectProposal);
  const { t } = useTranslation();

  const pending = proposals.filter((p) => p.status === 'pending');
  const impact = useMemo(() => calculateProposalImpact(items, pending), [items, pending]);

  const [reviewMode, setReviewMode] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, 'accept' | 'reject'>>({});

  if (pending.length === 0) return null;

  const decisionFor = (id: string) => decisions[id] ?? 'accept';
  const toggleDecision = (id: string, decision: 'accept' | 'reject') => {
    setDecisions((prev) => ({ ...prev, [id]: decision }));
  };

  const closeReview = () => {
    setReviewMode(false);
    setDecisions({});
  };

  const handleAcceptAll = () => {
    approveAllPending();
    closeReview();
  };

  const handleRejectAll = () => {
    rejectAllPending();
    closeReview();
  };

  const handleApplyReview = () => {
    pending.forEach((p) => {
      if (decisionFor(p.id) === 'accept') approveProposal(p.id);
      else rejectProposal(p.id);
    });
    closeReview();
  };

  // Flatten each proposal's changed fields into individual table rows.
  const rows: { proposal: Proposal; field: keyof ProposalChangeSet }[] = pending.flatMap((p) =>
    fieldsOf(p.after).map((field) => ({ proposal: p, field }))
  );

  const affectedItems = new Set(pending.map((p) => p.itemId)).size;

  return (
    <div className="bg-surface rounded-xl border border-amber-200 p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-text-primary">{t('agentProposal')}</h2>
          <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
            {pending.length} {t('changesProposed')}
          </span>
          <span className="text-xs text-text-tertiary">{affectedItems} {t('itemsUpdated')}</span>
        </div>

        <div className="flex items-center gap-2">
          {!reviewMode && pending.length > 1 && (
            <button
              onClick={() => setReviewMode(true)}
              className="text-xs font-medium text-text-secondary hover:text-text-primary border border-border rounded-lg px-3 py-1.5 hover:bg-surface-secondary transition-colors"
            >
              {t('reviewIndividually')}
            </button>
          )}
          <button
            onClick={handleRejectAll}
            className="text-xs font-medium text-red-600 hover:text-red-700 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
          >
            {t('rejectAll')}
          </button>
          <button
            onClick={handleAcceptAll}
            className="text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg px-3 py-1.5 transition-colors"
          >
            {t('acceptAll')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-3 mb-3 rounded-lg border border-violet-100 bg-violet-50/40 p-3">
        <div>
          <p className="text-[10px] font-semibold tracking-wide text-text-tertiary">{t('currentPlan')}</p>
          <p className="mt-1 text-xl font-bold text-text-primary">{impact.current.score}<span className="text-xs font-normal text-text-tertiary"> / 100 {t('health')}</span></p>
          <p className="text-xs text-text-secondary">{impact.currentConflictTotal} {t('conflicts')} · {impact.current.blocked} {t('blocked')}</p>
        </div>
        <div className="self-center text-xl text-violet-500">→</div>
        <div>
          <p className="text-[10px] font-semibold tracking-wide text-violet-600">{t('proposedPlan')}</p>
          <p className="mt-1 text-xl font-bold text-violet-700">{impact.proposed.score}<span className="text-xs font-normal text-text-tertiary"> / 100 {t('health')}</span></p>
          <p className="text-xs text-text-secondary">{impact.proposedConflictTotal} {t('conflicts')} · {impact.proposed.blocked} {t('blocked')}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left text-text-tertiary bg-surface-secondary">
              <th className="px-3 py-2 font-medium">{t('task')}</th><th className="px-3 py-2 font-medium">{t('field')}</th>
              <th className="px-3 py-2 font-medium">{t('current')}</th><th className="px-3 py-2 font-medium">{t('proposed')}</th>
              <th className="px-3 py-2 font-medium">{t('risk')}</th><th className="px-3 py-2 font-medium">{t('reason')}</th>
              <th className="px-3 py-2 font-medium">{t('impact')}</th>{reviewMode && <th className="px-3 py-2 font-medium">{t('decision')}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ proposal, field }, i) => (
              <tr key={`${proposal.id}-${field}`} className={i < rows.length - 1 ? 'border-b border-border' : ''}>
                <td className="px-3 py-2 font-medium text-text-primary whitespace-nowrap">{proposal.itemTitle}</td>
                <td className="px-3 py-2 text-text-secondary">{t(FIELD_LABEL_KEY[field])}</td>
                <td className="px-3 py-2 text-text-tertiary whitespace-nowrap">{formatFieldValue(field, proposal.before[field], t)}</td>
                <td className="px-3 py-2 text-primary-700 font-medium whitespace-nowrap">{formatFieldValue(field, proposal.after[field], t)}</td>
                <td className="px-3 py-2">
                  <span className={`px-1.5 py-0.5 rounded font-medium uppercase text-[10px] ${RISK_STYLES[proposal.riskLevel]}`}>
                    {t(VALUE_LABEL_KEY[proposal.riskLevel])}
                  </span>
                </td>
                <td className="px-3 py-2 text-text-tertiary max-w-[220px]">{proposal.reason}</td>
                <td className="px-3 py-2 text-text-secondary whitespace-nowrap">
                  <span className="font-medium text-violet-700">Health {impact.healthDelta >= 0 ? '+' : ''}{impact.healthDelta}</span>
                  <span className="block text-[10px]">Conflicts {impact.conflictDelta >= 0 ? '+' : ''}{impact.conflictDelta} · Blocked {impact.blockedDelta >= 0 ? '+' : ''}{impact.blockedDelta}</span>
                </td>
                {reviewMode && (
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleDecision(proposal.id, 'accept')}
                        className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                          decisionFor(proposal.id) === 'accept'
                            ? 'bg-green-100 text-green-700'
                            : 'text-text-tertiary hover:bg-surface-secondary'
                        }`}
                        title={t('accept')}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => toggleDecision(proposal.id, 'reject')}
                        className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                          decisionFor(proposal.id) === 'reject'
                            ? 'bg-red-100 text-red-700'
                            : 'text-text-tertiary hover:bg-surface-secondary'
                        }`}
                        title={t('reject')}
                      >
                        ✗
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reviewMode && (
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={closeReview}
            className="text-xs font-medium text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleApplyReview}
            className="text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg px-3 py-1.5 transition-colors"
          >
            {t('applySelected')}
          </button>
        </div>
      )}
    </div>
  );
}
