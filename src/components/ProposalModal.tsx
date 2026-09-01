import { useEffect, useRef, useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import type { Proposal, ProposalChangeSet, RiskLevel } from '../types/workspace';

const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  planned: 'Planned',
  doing: 'Doing',
  done: 'Done',
};

const RISK_STYLES: Record<RiskLevel, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-rose-100 text-rose-700',
};

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

const FIELD_LABELS: Record<keyof ProposalChangeSet, string> = {
  title: 'Title',
  description: 'Description',
  status: 'Status',
  owner: 'Owner',
  dueDate: 'Due Date',
  dependencies: 'Dependencies',
};

function formatFieldValue(field: keyof ProposalChangeSet, value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  switch (field) {
    case 'status':
      return STATUS_LABELS[value as string] || (value as string);
    case 'dueDate':
      return formatDate(value as string);
    case 'dependencies': {
      const deps = value as string[];
      return `${deps.length} item${deps.length === 1 ? '' : 's'}`;
    }
    default:
      return String(value);
  }
}

function fieldsOf(change: ProposalChangeSet): (keyof ProposalChangeSet)[] {
  return Object.keys(change) as (keyof ProposalChangeSet)[];
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${RISK_STYLES[risk]}`}>
      {risk}
    </span>
  );
}

function ProposalRow({
  proposal,
  individualMode,
  decision,
  onToggle,
}: {
  proposal: Proposal;
  individualMode: boolean;
  decision: 'accept' | 'reject';
  onToggle: () => void;
}) {
  const fields = fieldsOf(proposal.after);

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 transition-colors ${
        individualMode && decision === 'reject'
          ? 'border-border bg-surface-secondary opacity-60'
          : 'border-border bg-surface'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary truncate">{proposal.itemTitle}</span>
            <RiskBadge risk={proposal.riskLevel} />
          </div>
          <div className="mt-1.5 flex flex-col gap-1">
            {fields.map((field) => (
              <div key={field} className="flex items-center gap-1.5 text-xs">
                <span className="text-text-tertiary w-16 flex-shrink-0">{FIELD_LABELS[field]}</span>
                <span className="text-text-secondary line-through decoration-text-tertiary">
                  {formatFieldValue(field, proposal.before[field])}
                </span>
                <span className="text-text-tertiary">→</span>
                <span className="font-medium text-agent">
                  {formatFieldValue(field, proposal.after[field])}
                </span>
              </div>
            ))}
          </div>
        </div>

        {individualMode && (
          <button
            onClick={onToggle}
            className={`flex-shrink-0 text-xs font-medium px-2 py-1 rounded-md border transition-colors ${
              decision === 'accept'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {decision === 'accept' ? '✓ Accept' : '× Reject'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProposalModal() {
  const proposals = useWorkspaceStore((s) => s.proposals);
  const approveAllPending = useWorkspaceStore((s) => s.approveAllPending);
  const rejectAllPending = useWorkspaceStore((s) => s.rejectAllPending);
  const approveProposal = useWorkspaceStore((s) => s.approveProposal);
  const rejectProposal = useWorkspaceStore((s) => s.rejectProposal);

  const pending = proposals.filter((p) => p.status === 'pending');

  const [individualMode, setIndividualMode] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, 'accept' | 'reject'>>({});
  const [dismissed, setDismissed] = useState(false);
  const prevPendingCount = useRef(0);

  // A fresh batch of proposals always resurfaces the modal, even if a
  // previous (now-resolved) batch had been minimized.
  useEffect(() => {
    if (prevPendingCount.current === 0 && pending.length > 0) {
      setDismissed(false);
      setIndividualMode(false);
      setDecisions({});
    }
    prevPendingCount.current = pending.length;
  }, [pending.length]);

  if (pending.length === 0) return null;

  if (dismissed) {
    return (
      <button
        onClick={() => setDismissed(false)}
        className="fixed bottom-20 right-6 z-40 flex items-center gap-2 px-4 py-2.5 bg-agent text-white text-sm font-medium rounded-full shadow-lg hover:brightness-110 transition-all animate-slide-in"
      >
        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
        {pending.length} Pending Proposal{pending.length === 1 ? '' : 's'}
      </button>
    );
  }

  const decisionFor = (id: string) => decisions[id] ?? 'accept';
  const toggleDecision = (id: string) => {
    setDecisions((prev) => ({ ...prev, [id]: decisionFor(id) === 'accept' ? 'reject' : 'accept' }));
  };

  const handleApply = () => {
    if (individualMode) {
      pending.forEach((p) => {
        if (decisionFor(p.id) === 'accept') {
          approveProposal(p.id);
        } else {
          rejectProposal(p.id);
        }
      });
    } else {
      approveAllPending();
    }
    setIndividualMode(false);
    setDecisions({});
  };

  const handleRejectAll = () => {
    rejectAllPending();
    setIndividualMode(false);
    setDecisions({});
  };

  const acceptedCount = individualMode
    ? pending.filter((p) => decisionFor(p.id) === 'accept').length
    : pending.length;

  const highestRisk: RiskLevel = pending.some((p) => p.riskLevel === 'high')
    ? 'high'
    : pending.some((p) => p.riskLevel === 'medium')
    ? 'medium'
    : 'low';

  const distinctReasons = Array.from(new Set(pending.map((p) => p.reason)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] animate-fade-in">
      <div className="bg-surface rounded-xl border border-border shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col animate-slide-in">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border flex items-start justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-agent-light text-agent flex items-center justify-center text-xs font-bold">
                ✦
              </span>
              <h2 className="text-sm font-semibold text-text-primary tracking-wide">AGENT PROPOSAL</h2>
              <RiskBadge risk={highestRisk} />
            </div>
            <p className="mt-1 text-xs text-text-tertiary">
              {pending.length} change{pending.length === 1 ? '' : 's'} awaiting your approval before {pending.length === 1 ? 'it takes' : 'they take'} effect.
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-text-tertiary hover:text-text-secondary text-sm px-1.5 py-0.5 rounded hover:bg-surface-secondary transition-colors"
            title="Review later — proposals stay pending"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          <h3 className="text-xs font-semibold text-text-secondary mb-2">Proposed Changes</h3>
          <div className="flex flex-col gap-2">
            {pending.map((p) => (
              <ProposalRow
                key={p.id}
                proposal={p}
                individualMode={individualMode}
                decision={decisionFor(p.id)}
                onToggle={() => toggleDecision(p.id)}
              />
            ))}
          </div>

          <h3 className="text-xs font-semibold text-text-secondary mt-4 mb-1.5">Impact</h3>
          <div className="text-xs text-text-secondary bg-surface-secondary rounded-lg px-3 py-2 flex flex-col gap-0.5">
            <span>{pending.length} item{pending.length === 1 ? '' : 's'} affected</span>
            <span>
              {pending.filter((p) => p.riskLevel === 'high').length} high · {pending.filter((p) => p.riskLevel === 'medium').length} medium · {pending.filter((p) => p.riskLevel === 'low').length} low risk
            </span>
            {individualMode && <span>{acceptedCount} of {pending.length} currently set to Accept</span>}
          </div>

          <h3 className="text-xs font-semibold text-text-secondary mt-4 mb-1.5">Why?</h3>
          <div className="flex flex-col gap-1.5">
            {distinctReasons.map((r, i) => (
              <p key={i} className="text-xs text-text-secondary italic">"{r}"</p>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2 flex-shrink-0">
          <button
            onClick={handleRejectAll}
            className="px-4 py-2 text-sm text-text-secondary hover:text-rose-600 transition-colors rounded-lg hover:bg-surface-secondary"
          >
            Reject
          </button>
          {!individualMode && pending.length > 1 && (
            <button
              onClick={() => setIndividualMode(true)}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface-secondary"
            >
              Review Individually
            </button>
          )}
          <button
            onClick={handleApply}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            {individualMode ? `Apply Accepted (${acceptedCount})` : 'Apply Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
