import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkspaceStore } from './workspaceStore';

beforeEach(() => {
  useWorkspaceStore.setState({
    items: [],
    selectedItemId: null,
    activityLog: [],
  });
});

describe('addItem', () => {
  it('creates an item with defaults', () => {
    const item = useWorkspaceStore.getState().addItem({ title: 'Test' });
    expect(item.title).toBe('Test');
    expect(item.status).toBe('backlog');
    expect(item.locked).toBe(false);
    expect(useWorkspaceStore.getState().items).toHaveLength(1);
  });
});

describe('updateItem', () => {
  it('rejects agent edits on a locked item', () => {
    const item = useWorkspaceStore.getState().addItem({ title: 'Locked task' });
    useWorkspaceStore.getState().lockItem(item.id);

    const result = useWorkspaceStore.getState().updateItem(item.id, { title: 'Changed by agent' }, 'agent');

    expect(result.success).toBe(false);
    expect(result.reason).toBe('ITEM_LOCKED_BY_HUMAN');
  });

  it('allows human edits on a locked item', () => {
    const item = useWorkspaceStore.getState().addItem({ title: 'Locked task' });
    useWorkspaceStore.getState().lockItem(item.id);

    const result = useWorkspaceStore.getState().updateItem(item.id, { title: 'Changed by human' }, 'human');

    expect(result.success).toBe(true);
  });

  it('blocks marking an item Done while dependencies are incomplete', () => {
    const dep = useWorkspaceStore.getState().addItem({ title: 'Dependency', status: 'doing' });
    const item = useWorkspaceStore.getState().addItem({
      title: 'Blocked item',
      status: 'doing',
      dependencies: [dep.id],
    });

    const result = useWorkspaceStore.getState().updateItem(item.id, { status: 'done' }, 'agent');

    expect(result.success).toBe(false);
    expect(result.reason).toBe('DEPENDENCIES_INCOMPLETE');
  });

  it('allows marking Done once dependencies are complete', () => {
    const dep = useWorkspaceStore.getState().addItem({ title: 'Dependency', status: 'done' });
    const item = useWorkspaceStore.getState().addItem({
      title: 'Item',
      status: 'doing',
      dependencies: [dep.id],
    });

    const result = useWorkspaceStore.getState().updateItem(item.id, { status: 'done' }, 'agent');

    expect(result.success).toBe(true);
  });

  it('records a revert snapshot only for agent-authored changes', () => {
    const item = useWorkspaceStore.getState().addItem({ title: 'Original' });

    useWorkspaceStore.getState().updateItem(item.id, { title: 'Agent edit' }, 'agent');
    let stored = useWorkspaceStore.getState().items.find((i) => i.id === item.id)!;
    expect(stored.previousState?.title).toBe('Original');

    useWorkspaceStore.getState().updateItem(item.id, { title: 'Human edit' }, 'human');
    stored = useWorkspaceStore.getState().items.find((i) => i.id === item.id)!;
    expect(stored.previousState).toBeUndefined();
  });
});

describe('moveItem', () => {
  it('blocks a drag-to-Done move when dependencies are incomplete', () => {
    const dep = useWorkspaceStore.getState().addItem({ title: 'Dependency', status: 'doing' });
    const item = useWorkspaceStore.getState().addItem({
      title: 'Blocked item',
      status: 'doing',
      dependencies: [dep.id],
    });

    const result = useWorkspaceStore.getState().moveItem(item.id, 'done', 'human');

    expect(result.success).toBe(false);
    expect(result.reason).toBe('DEPENDENCIES_INCOMPLETE');
    expect(useWorkspaceStore.getState().items.find((i) => i.id === item.id)!.status).toBe('doing');
  });

  it('allows the move once dependencies are done', () => {
    const dep = useWorkspaceStore.getState().addItem({ title: 'Dependency', status: 'done' });
    const item = useWorkspaceStore.getState().addItem({
      title: 'Item',
      status: 'doing',
      dependencies: [dep.id],
    });

    const result = useWorkspaceStore.getState().moveItem(item.id, 'done', 'human');

    expect(result.success).toBe(true);
    expect(useWorkspaceStore.getState().items.find((i) => i.id === item.id)!.status).toBe('done');
  });
});

describe('revertItem', () => {
  it("restores the pre-agent-edit snapshot and re-attributes the change to human", () => {
    const item = useWorkspaceStore.getState().addItem({ title: 'Original', status: 'backlog' });
    useWorkspaceStore.getState().updateItem(item.id, { title: 'Agent edit', status: 'doing' }, 'agent');

    const result = useWorkspaceStore.getState().revertItem(item.id);

    expect(result.success).toBe(true);
    const reverted = useWorkspaceStore.getState().items.find((i) => i.id === item.id)!;
    expect(reverted.title).toBe('Original');
    expect(reverted.status).toBe('backlog');
    expect(reverted.updatedBy).toBe('human');
    expect(reverted.previousState).toBeUndefined();
  });

  it('fails when there is nothing to revert', () => {
    const item = useWorkspaceStore.getState().addItem({ title: 'Untouched' });

    const result = useWorkspaceStore.getState().revertItem(item.id);

    expect(result.success).toBe(false);
    expect(result.reason).toBe('NOTHING_TO_REVERT');
  });
});

describe('lockItem / unlockItem', () => {
  it('toggles the locked flag', () => {
    const item = useWorkspaceStore.getState().addItem({ title: 'Task' });

    useWorkspaceStore.getState().lockItem(item.id);
    expect(useWorkspaceStore.getState().items.find((i) => i.id === item.id)!.locked).toBe(true);

    useWorkspaceStore.getState().unlockItem(item.id);
    expect(useWorkspaceStore.getState().items.find((i) => i.id === item.id)!.locked).toBe(false);
  });
});
