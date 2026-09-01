import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ProposalModal from './ProposalModal';
import { useWorkspaceStore } from '../store/workspaceStore';
import type { PlanItem } from '../types/workspace';

function makeItem(overrides: Partial<PlanItem> = {}): PlanItem {
  const now = new Date().toISOString();
  return {
    id: 'item_1',
    title: 'Record demo',
    status: 'planned',
    dueDate: '2026-09-03',
    locked: false,
    dependencies: [],
    createdBy: 'human',
    updatedBy: 'human',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

beforeEach(() => {
  useWorkspaceStore.setState({
    items: [makeItem()],
    selectedItemId: null,
    activityLog: [],
    proposals: [],
  });
});

afterEach(cleanup);

describe('ProposalModal', () => {
  it('renders nothing when there are no pending proposals', () => {
    render(<ProposalModal />);
    expect(screen.queryByText('AGENT PROPOSAL')).not.toBeInTheDocument();
  });

  it('shows a pending proposal with its before/after diff and reason', () => {
    useWorkspaceStore.getState().createProposal({
      itemId: 'item_1',
      itemTitle: 'Record demo',
      riskLevel: 'medium',
      before: { dueDate: '2026-09-03' },
      after: { dueDate: '2026-09-05' },
      reason: 'Shifting to avoid a schedule conflict.',
      tool: 'update_item',
    });

    render(<ProposalModal />);

    expect(screen.getByText('AGENT PROPOSAL')).toBeInTheDocument();
    expect(screen.getByText('Record demo')).toBeInTheDocument();
    expect(screen.getByText(/Shifting to avoid a schedule conflict/)).toBeInTheDocument();
  });

  it('applies the change and clears the proposal on Apply Changes', () => {
    useWorkspaceStore.getState().createProposal({
      itemId: 'item_1',
      itemTitle: 'Record demo',
      riskLevel: 'medium',
      before: { dueDate: '2026-09-03' },
      after: { dueDate: '2026-09-05' },
      reason: 'Shifting to avoid a schedule conflict.',
      tool: 'update_item',
    });

    render(<ProposalModal />);
    fireEvent.click(screen.getByText('Apply Changes'));

    expect(useWorkspaceStore.getState().items[0].dueDate).toBe('2026-09-05');
    expect(useWorkspaceStore.getState().proposals[0].status).toBe('applied');
    expect(screen.queryByText('AGENT PROPOSAL')).not.toBeInTheDocument();
  });

  it('leaves the item unchanged and marks the proposal rejected on Reject', () => {
    useWorkspaceStore.getState().createProposal({
      itemId: 'item_1',
      itemTitle: 'Record demo',
      riskLevel: 'high',
      before: { dependencies: [] },
      after: { dependencies: ['some_other_item'] },
      reason: 'Testing rejection.',
      tool: 'update_item',
    });

    render(<ProposalModal />);
    fireEvent.click(screen.getByText('Reject'));

    expect(useWorkspaceStore.getState().items[0].dependencies).toEqual([]);
    expect(useWorkspaceStore.getState().proposals[0].status).toBe('rejected');
    expect(screen.queryByText('AGENT PROPOSAL')).not.toBeInTheDocument();
  });

  it('minimizes to a pill on dismiss without resolving the proposal', () => {
    useWorkspaceStore.getState().createProposal({
      itemId: 'item_1',
      itemTitle: 'Record demo',
      riskLevel: 'medium',
      before: { dueDate: '2026-09-03' },
      after: { dueDate: '2026-09-05' },
      reason: 'Testing dismiss.',
      tool: 'update_item',
    });

    render(<ProposalModal />);
    fireEvent.click(screen.getByTitle('Review later — proposals stay pending'));

    expect(screen.queryByText('AGENT PROPOSAL')).not.toBeInTheDocument();
    expect(screen.getByText(/1 Pending Proposal/)).toBeInTheDocument();
    expect(useWorkspaceStore.getState().proposals[0].status).toBe('pending');
  });
});
