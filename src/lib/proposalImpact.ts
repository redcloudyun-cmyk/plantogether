import type { PlanItem, Proposal } from '../types/workspace';
import { computePlanHealth, detectConflicts, type PlanHealth } from './planAnalysis';

export interface ProposalImpact {
  current: PlanHealth;
  proposed: PlanHealth;
  currentConflictTotal: number;
  proposedConflictTotal: number;
  healthDelta: number;
  conflictDelta: number;
  blockedDelta: number;
}

export function applyPendingProposals(items: PlanItem[], proposals: Proposal[]): PlanItem[] {
  const pending = proposals.filter((proposal) => proposal.status === 'pending');
  return items.map((item) => {
    const changes = pending.filter((proposal) => proposal.itemId === item.id).map((proposal) => proposal.after);
    return changes.reduce<PlanItem>((updated, change) => ({ ...updated, ...change }), item);
  });
}

export function calculateProposalImpact(items: PlanItem[], proposals: Proposal[]): ProposalImpact {
  const proposedItems = applyPendingProposals(items, proposals);
  const current = computePlanHealth(items);
  const proposed = computePlanHealth(proposedItems);
  const currentConflictTotal = detectConflicts(items).length;
  const proposedConflictTotal = detectConflicts(proposedItems).length;
  return {
    current,
    proposed,
    currentConflictTotal,
    proposedConflictTotal,
    healthDelta: proposed.score - current.score,
    conflictDelta: proposedConflictTotal - currentConflictTotal,
    blockedDelta: proposed.blocked - current.blocked,
  };
}
