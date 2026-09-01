import { describe, expect, it } from 'vitest';
import type { PlanItem, Proposal } from '../types/workspace';
import { calculateProposalImpact } from './proposalImpact';

const now = '2026-09-01T00:00:00.000Z';
const item = (id: string, overrides: Partial<PlanItem> = {}): PlanItem => ({
  id, title: id, status: 'planned', priority: 'medium', locked: false, dependencies: [],
  createdBy: 'human', updatedBy: 'human', createdAt: now, updatedAt: now, ...overrides,
});

describe('calculateProposalImpact', () => {
  it('calculates health from the proposed workspace without mutating live items', () => {
    const dependency = item('dependency', { status: 'doing' });
    const dependent = item('dependent', { dependencies: ['dependency'] });
    const proposal: Proposal = {
      id: 'proposal_1', itemId: dependency.id, itemTitle: dependency.title, riskLevel: 'medium',
      before: { status: 'doing' }, after: { status: 'done' }, reason: 'Unblock downstream work',
      tool: 'update_item', status: 'pending', createdAt: now,
    };

    const result = calculateProposalImpact([dependency, dependent], [proposal]);

    expect(result.current.blocked).toBe(1);
    expect(result.proposed.blocked).toBe(0);
    expect(result.healthDelta).toBeGreaterThan(0);
    expect(dependency.status).toBe('doing');
  });
});
