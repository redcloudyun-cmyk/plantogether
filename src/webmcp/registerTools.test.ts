import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registerWebMCPTools } from './registerTools';
import { useWorkspaceStore } from '../store/workspaceStore';
import type { PlanItem } from '../types/workspace';

type RegisteredTool = {
  name: string;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
};

const tools = new Map<string, RegisteredTool>();
let cleanupTools: (() => void) | undefined;

function makeItem(overrides: Partial<PlanItem> = {}): PlanItem {
  const now = new Date().toISOString();
  return {
    id: 'item_1', title: 'Record Demo', status: 'planned', priority: 'high', owner: 'Emily Johnson',
    locked: false, dependencies: [], createdBy: 'human', updatedBy: 'human', createdAt: now, updatedAt: now,
    ...overrides,
  };
}

beforeEach(async () => {
  tools.clear();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  document.modelContext = {
    registerTool: vi.fn(async (tool) => {
      tools.set(tool.name, tool as RegisteredTool);
    }),
  };
  useWorkspaceStore.setState({
    items: [], selectedItemId: null, activityLog: [], proposals: [], autonomyMode: 'assist', webmcpAvailable: false,
  });
  cleanupTools = await registerWebMCPTools();
});

afterEach(() => {
  cleanupTools?.();
  cleanupTools = undefined;
  delete document.modelContext;
  vi.restoreAllMocks();
});

describe('WebMCP tool regression gate', () => {
  it('registers the exact five public tools', () => {
    expect([...tools.keys()]).toEqual([
      'get_workspace_state', 'get_current_focus', 'add_item', 'update_item', 'analyze_plan',
    ]);
    expect(useWorkspaceStore.getState().webmcpAvailable).toBe(true);
  });

  it('shares one source of truth between workspace state and current focus', async () => {
    const item = makeItem();
    useWorkspaceStore.setState({
      items: [item],
      selectedItemId: item.id,
      contextScope: {
        currentItem: true, boardState: true, dependencies: true, planStatus: true,
        activityHistory: true, completedItems: true, teamInformation: true,
      },
    });

    const workspace = await tools.get('get_workspace_state')!.execute({}) as { items: PlanItem[]; selectedItemId: string };
    const focus = await tools.get('get_current_focus')!.execute({}) as PlanItem;

    expect(workspace.selectedItemId).toBe(item.id);
    expect(workspace.items[0]).toEqual(focus);
    expect(focus).toEqual(useWorkspaceStore.getState().getSelectedItem());
  });

  it('lets the human restrict what Context Scope shares with the agent', async () => {
    const doneItem = makeItem({ id: 'item_done', status: 'done' });
    const item = makeItem({ dependencies: ['item_done'] });
    useWorkspaceStore.setState({
      items: [item, doneItem],
      selectedItemId: item.id,
      contextScope: {
        currentItem: true, boardState: true, dependencies: false, planStatus: false,
        activityHistory: false, completedItems: false, teamInformation: false,
      },
    });

    const workspace = await tools.get('get_workspace_state')!.execute({}) as {
      items: PlanItem[]; recentActivity?: unknown; planHealth?: unknown; contextScopeNote?: string;
    };

    // completedItems disabled -> the done item is withheld entirely
    expect(workspace.items).toHaveLength(1);
    expect(workspace.items[0].id).toBe(item.id);
    // teamInformation disabled -> owner is stripped
    expect(workspace.items[0].owner).toBeUndefined();
    // dependencies disabled -> dependency list is stripped
    expect(workspace.items[0].dependencies).toEqual([]);
    // planStatus / activityHistory disabled -> those keys are absent
    expect(workspace.planHealth).toBeUndefined();
    expect(workspace.recentActivity).toBeUndefined();
    expect(workspace.contextScopeNote).toContain('completedItems');

    useWorkspaceStore.getState().selectItem(item.id);
    const focus = await tools.get('get_current_focus')!.execute({}) as PlanItem;
    expect(focus.owner).toBeUndefined();

    useWorkspaceStore.setState({ contextScope: { ...useWorkspaceStore.getState().contextScope, currentItem: false } });
    const blockedFocus = await tools.get('get_current_focus')!.execute({}) as { selectedItem: null; message: string };
    expect(blockedFocus.selectedItem).toBeNull();
    expect(blockedFocus.message).toMatch(/Current item/);
  });

  it('adds an item and preserves status during an unrelated update', async () => {
    const addResult = await tools.get('add_item')!.execute({ title: 'New task', status: 'doing', priority: 'high' }) as { success: boolean; item: PlanItem };
    expect(addResult.success).toBe(true);

    const updateResult = await tools.get('update_item')!.execute({ itemId: addResult.item.id, title: 'Renamed task' }) as { success: boolean };
    const stored = useWorkspaceStore.getState().items.find((item) => item.id === addResult.item.id)!;
    expect(updateResult.success).toBe(true);
    expect(stored.title).toBe('Renamed task');
    expect(stored.status).toBe('doing');
    expect(stored.priority).toBe('high');
  });

  it('creates approval proposals for medium-risk changes and respects human locks', async () => {
    const item = makeItem({ dueDate: '2026-09-04' });
    useWorkspaceStore.setState({ items: [item] });

    const proposalResult = await tools.get('update_item')!.execute({ itemId: item.id, dueDate: '2026-09-05', reason: 'Protect the launch sequence' }) as { proposed: boolean };
    expect(proposalResult.proposed).toBe(true);
    expect(useWorkspaceStore.getState().items[0].dueDate).toBe('2026-09-04');
    expect(useWorkspaceStore.getState().proposals).toHaveLength(1);

    useWorkspaceStore.getState().lockItem(item.id);
    const lockedResult = await tools.get('update_item')!.execute({ itemId: item.id, title: 'Blocked edit' }) as { success: boolean; reason: string };
    expect(lockedResult).toMatchObject({ success: false, reason: 'ITEM_LOCKED_BY_HUMAN' });
  });

  it('returns a live structured plan analysis', async () => {
    const item = makeItem({ locked: true });
    useWorkspaceStore.setState({ items: [item] });
    const result = await tools.get('analyze_plan')!.execute({ constraints: 'Do not move launch date' }) as { totalItems: number; lockedItems: PlanItem[]; constraints: string };
    expect(result.totalItems).toBe(1);
    expect(result.lockedItems[0].id).toBe(item.id);
    expect(result.constraints).toBe('Do not move launch date');
  });
});
