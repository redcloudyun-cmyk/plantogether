import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AgentProposalPanel from './AgentProposalPanel';
import { useWorkspaceStore } from '../../store/workspaceStore';
import type { PlanItem } from '../../types/workspace';

function makeItem(overrides: Partial<PlanItem> = {}): PlanItem {
  const now = new Date().toISOString();
  return {
    id: 'item_1',
    title: 'Sample task',
    status: 'planned',
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
    items: [],
    proposals: [],
    activityLog: [],
    selectedItemId: null,
    autonomyMode: 'assist',
  });
});

describe('AgentProposalPanel', () => {
  it('renders nothing when there are no pending proposals', () => {
    const { container } = render(<AgentProposalPanel />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a pending proposal and Accept All applies it', () => {
    const item = makeItem({ dueDate: '2026-09-04' });
    useWorkspaceStore.setState({ items: [item] });
    useWorkspaceStore.getState().createProposal({
      itemId: item.id,
      itemTitle: item.title,
      riskLevel: 'medium',
      before: { dueDate: '2026-09-04' },
      after: { dueDate: '2026-09-10' },
      reason: 'Test reason',
      tool: 'update_item',
    });

    render(<AgentProposalPanel />);
    expect(screen.getByText('Sample task')).toBeInTheDocument();
    expect(screen.getByText('Test reason')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Accept All'));

    const updated = useWorkspaceStore.getState().items.find((i) => i.id === item.id)!;
    expect(updated.dueDate).toBe('2026-09-10');
    expect(useWorkspaceStore.getState().proposals[0].status).toBe('applied');
  });

  it('Reject All leaves the item unchanged', () => {
    const item = makeItem({ dueDate: '2026-09-04' });
    useWorkspaceStore.setState({ items: [item] });
    useWorkspaceStore.getState().createProposal({
      itemId: item.id,
      itemTitle: item.title,
      riskLevel: 'medium',
      before: { dueDate: '2026-09-04' },
      after: { dueDate: '2026-09-10' },
      reason: 'Test reason',
      tool: 'update_item',
    });

    render(<AgentProposalPanel />);
    fireEvent.click(screen.getByText('Reject All'));

    const unchanged = useWorkspaceStore.getState().items.find((i) => i.id === item.id)!;
    expect(unchanged.dueDate).toBe('2026-09-04');
    expect(useWorkspaceStore.getState().proposals[0].status).toBe('rejected');
  });

  it('supports individual review across multiple proposals', () => {
    const itemA = makeItem({ id: 'item_a', title: 'Task A', dueDate: '2026-09-04' });
    const itemB = makeItem({ id: 'item_b', title: 'Task B', dueDate: '2026-09-05' });
    useWorkspaceStore.setState({ items: [itemA, itemB] });
    useWorkspaceStore.getState().createProposal({
      itemId: itemA.id,
      itemTitle: itemA.title,
      riskLevel: 'medium',
      before: { dueDate: '2026-09-04' },
      after: { dueDate: '2026-09-11' },
      reason: 'Reason A',
      tool: 'update_item',
    });
    useWorkspaceStore.getState().createProposal({
      itemId: itemB.id,
      itemTitle: itemB.title,
      riskLevel: 'medium',
      before: { dueDate: '2026-09-05' },
      after: { dueDate: '2026-09-12' },
      reason: 'Reason B',
      tool: 'update_item',
    });

    render(<AgentProposalPanel />);
    fireEvent.click(screen.getByText('Review Individually'));

    // Reject Task B's row (find the row's reject button); accept Task A by default.
    const rejectButtons = screen.getAllByTitle('Reject');
    fireEvent.click(rejectButtons[1]);
    fireEvent.click(screen.getByText('Apply Selected'));

    const finalA = useWorkspaceStore.getState().items.find((i) => i.id === 'item_a')!;
    const finalB = useWorkspaceStore.getState().items.find((i) => i.id === 'item_b')!;
    expect(finalA.dueDate).toBe('2026-09-11');
    expect(finalB.dueDate).toBe('2026-09-05');
  });
});
