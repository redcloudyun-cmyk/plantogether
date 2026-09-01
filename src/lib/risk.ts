import type { ProposalChangeSet, RiskLevel, AutonomyMode } from '../types/workspace';

/**
 * Risk Classification (V1.4 §20)
 *
 * LOW    — Create Item, Add Description, Add Metadata (title/description/owner)
 * MEDIUM — Change Due Date, Move Status, Change Priority
 * HIGH   — Change Dependency, Change Critical Milestone
 *
 * A change touching multiple fields is classified at the highest risk level
 * among the touched fields.
 */
export function classifyRisk(changes: ProposalChangeSet): RiskLevel {
  const touched = Object.keys(changes) as (keyof ProposalChangeSet)[];

  if (touched.some((field) => field === 'dependencies')) {
    return 'high';
  }
  if (touched.some((field) => field === 'dueDate' || field === 'status')) {
    return 'medium';
  }
  // title / description / owner
  return 'low';
}

export type AutonomyDecision = 'blocked' | 'auto-apply' | 'propose';

/**
 * Autonomy Policy (V1.4 §20)
 *
 * Observe    → no mutation at all
 * Assist     → low auto-applies; medium/high become proposals
 * Autonomous → low/medium auto-apply; high becomes a proposal
 *
 * Human locks (checked separately, before this) always take priority over autonomy.
 */
export function decideAutonomyAction(mode: AutonomyMode, risk: RiskLevel): AutonomyDecision {
  if (mode === 'observe') return 'blocked';

  if (mode === 'assist') {
    return risk === 'low' ? 'auto-apply' : 'propose';
  }

  // autonomous
  return risk === 'high' ? 'propose' : 'auto-apply';
}
