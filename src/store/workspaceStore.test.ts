import { describe, it, expect, beforeEach } from 'vitest';
import { migratePersistedWorkspace, useWorkspaceStore } from './workspaceStore';

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
    expect(item.priority).toBe('medium');
    expect(item.locked).toBe(false);
    expect(useWorkspaceStore.getState().items).toHaveLength(1);
  });
});

describe('context scope', () => {
  it('lets the human toggle what context is shared', () => {
    useWorkspaceStore.setState({
      contextScope: {
        currentItem: true,
        boardState: true,
        dependencies: true,
        planStatus: true,
        activityHistory: false,
        completedItems: false,
        teamInformation: false,
      },
    });
    useWorkspaceStore.getState().toggleContextScope('activityHistory');
    expect(useWorkspaceStore.getState().contextScope.activityHistory).toBe(true);
  });
});

describe('shared current focus', () => {
  it('returns the exact item selected by the human', () => {
    const selected = useWorkspaceStore.getState().addItem({
      title: 'Record Demo', owner: 'Emily Johnson', priority: 'high', dependencies: [],
    });
    useWorkspaceStore.getState().selectItem(selected.id);

    expect(useWorkspaceStore.getState().getSelectedItem()).toEqual(
      useWorkspaceStore.getState().items.find((item) => item.id === selected.id)
    );
  });
});

describe('persisted workspace migration', () => {
  it('backfills new fields and removes retired demo branding safely', () => {
    const legacy = {
      title: 'PlanTogether Demo',
      items: [{
        id: 'legacy', title: 'Legacy task', status: 'planned', owner: 'Mina Park', locked: false,
        dependencies: [], createdBy: 'human', updatedBy: 'human', createdAt: '2026-01-01', updatedAt: '2026-01-01',
      }],
      contextScope: { activityHistory: true },
    };

    const migrated = migratePersistedWorkspace(legacy);

    expect(migrated.title).toBe('WithGeX Demo');
    expect(migrated.items?.[0]).toMatchObject({ priority: 'medium', owner: 'Emily Johnson' });
    expect(migrated.contextScope).toMatchObject({ currentItem: true, activityHistory: true, teamInformation: false });
  });

  it('handles invalid persisted values without throwing', () => {
    expect(migratePersistedWorkspace(null)).toEqual({});
    expect(migratePersistedWorkspace('invalid')).toEqual({});
    expect(migratePersistedWorkspace({ contextScope: {} })).not.toHaveProperty('title');
    expect(migratePersistedWorkspace({ contextScope: {} })).not.toHaveProperty('items');
  });
});

describe('resetWorkspace', () => {
  it('restores a complete, executable demo state', () => {
    useWorkspaceStore.setState({
      items: [], proposals: [], autonomyMode: 'observe',
      contextScope: {
        currentItem: false, boardState: false, dependencies: false, planStatus: false,
        activityHistory: true, completedItems: true, teamInformation: true,
      },
    });

    useWorkspaceStore.getState().resetWorkspace();
    const state = useWorkspaceStore.getState();

    expect(state.items.length).toBeGreaterThanOrEqual(6);
    expect(state.items.every((item) => item.priority && item.owner === 'Emily Johnson')).toBe(true);
    expect(state.items.some((item) => item.locked)).toBe(true);
    expect(state.items.some((item) => item.dependencies.length > 0)).toBe(true);
    expect(state.proposals).toEqual([]);
    expect(state.autonomyMode).toBe('assist');
    expect(state.contextScope).toMatchObject({ currentItem: true, activityHistory: false });
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
