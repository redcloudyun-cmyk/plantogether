import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PlanCard from './PlanCard';
import { useWorkspaceStore } from '../store/workspaceStore';
import type { PlanItem } from '../types/workspace';

function makeItem(overrides: Partial<PlanItem> = {}): PlanItem {
  const now = new Date().toISOString();
  return {
    id: 'item_1',
    title: 'Sample task',
    status: 'doing',
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
  useWorkspaceStore.setState({ items: [], selectedItemId: null, activityLog: [] });
});

describe('PlanCard', () => {
  it('shows a Blocked badge when a dependency is incomplete', () => {
    const dep = makeItem({ id: 'dep_1', title: 'Dependency', status: 'doing' });
    const item = makeItem({ id: 'item_1', dependencies: ['dep_1'] });
    useWorkspaceStore.setState({ items: [dep, item] });

    render(<PlanCard item={item} onEdit={vi.fn()} />);

    expect(screen.getByText(/Blocked by 1/)).toBeInTheDocument();
  });

  it('does not show a Blocked badge once the dependency is done', () => {
    const dep = makeItem({ id: 'dep_1', title: 'Dependency', status: 'done' });
    const item = makeItem({ id: 'item_1', dependencies: ['dep_1'] });
    useWorkspaceStore.setState({ items: [dep, item] });

    render(<PlanCard item={item} onEdit={vi.fn()} />);

    expect(screen.queryByText(/Blocked by/)).not.toBeInTheDocument();
  });

  it('reverts an agent edit back to the previous state on click', () => {
    const item = makeItem({
      title: 'Agent edit',
      updatedBy: 'agent',
      previousState: { title: 'Original title', status: 'backlog' },
    });
    useWorkspaceStore.setState({ items: [item] });

    render(<PlanCard item={item} onEdit={vi.fn()} />);
    fireEvent.click(screen.getByText('↩ Revert'));

    const reverted = useWorkspaceStore.getState().items.find((i) => i.id === item.id)!;
    expect(reverted.title).toBe('Original title');
    expect(reverted.updatedBy).toBe('human');
  });
});
