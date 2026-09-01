import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlanItem, ItemStatus, ActivityLogEntry, Actor, RevertSnapshot } from '../types/workspace';
import { demoWorkspace } from '../data/demoWorkspace';

let idCounter = 100;
function generateId(): string {
  return `item_${Date.now()}_${idCounter++}`;
}

function getIncompleteDependencies(item: PlanItem, allItems: PlanItem[]): PlanItem[] {
  if (item.dependencies.length === 0) return [];
  return item.dependencies
    .map((depId) => allItems.find((i) => i.id === depId))
    .filter((dep): dep is PlanItem => !!dep && dep.status !== 'done');
}

interface WorkspaceState {
  // Workspace data
  id: string;
  title: string;
  items: PlanItem[];
  selectedItemId: string | null;
  updatedAt: string;

  // Activity log
  activityLog: ActivityLogEntry[];

  // WebMCP status
  webmcpAvailable: boolean;

  // Actions
  addItem: (item: Partial<PlanItem> & { title: string }, actor?: Actor) => PlanItem;
  updateItem: (id: string, changes: Partial<Omit<PlanItem, 'id' | 'createdAt' | 'createdBy'>>, actor?: Actor) => { success: boolean; reason?: string; item?: PlanItem };
  moveItem: (id: string, newStatus: ItemStatus, actor?: Actor) => { success: boolean; reason?: string };
  selectItem: (id: string | null) => void;
  lockItem: (id: string) => { success: boolean; reason?: string };
  unlockItem: (id: string) => { success: boolean; reason?: string };
  revertItem: (id: string) => { success: boolean; reason?: string };
  getWorkspace: () => { id: string; title: string; items: PlanItem[]; selectedItemId: string | null; updatedAt: string };
  getSelectedItem: () => PlanItem | null;
  getIncompleteDependencies: (id: string) => PlanItem[];
  addActivityLog: (action: string, detail: string) => void;
  setWebmcpAvailable: (available: boolean) => void;
  resetWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      // Initial state from demo
      id: demoWorkspace.id,
      title: demoWorkspace.title,
      items: demoWorkspace.items,
      selectedItemId: demoWorkspace.selectedItemId,
      updatedAt: demoWorkspace.updatedAt,
      activityLog: [],
      webmcpAvailable: false,

      addItem: (itemData, actor = 'human') => {
        const now = new Date().toISOString();
        const newItem: PlanItem = {
          id: generateId(),
          title: itemData.title,
          description: itemData.description || undefined,
          status: itemData.status || 'backlog',
          owner: itemData.owner || undefined,
          dueDate: itemData.dueDate || undefined,
          locked: false,
          dependencies: itemData.dependencies || [],
          createdBy: actor,
          updatedBy: actor,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          items: [...state.items, newItem],
          updatedAt: now,
        }));

        return newItem;
      },

      updateItem: (id, changes, actor = 'human') => {
        const state = get();
        const item = state.items.find((i) => i.id === id);

        if (!item) {
          return { success: false, reason: 'ITEM_NOT_FOUND' };
        }

        if (item.locked && actor === 'agent') {
          return { success: false, reason: 'ITEM_LOCKED_BY_HUMAN' };
        }

        // Validate status if provided
        if (changes.status && !['backlog', 'planned', 'doing', 'done'].includes(changes.status)) {
          return { success: false, reason: 'INVALID_STATUS' };
        }

        if (changes.status === 'done') {
          const incomplete = getIncompleteDependencies(
            { ...item, dependencies: changes.dependencies ?? item.dependencies },
            state.items
          );
          if (incomplete.length > 0) {
            return { success: false, reason: 'DEPENDENCIES_INCOMPLETE' };
          }
        }

        const now = new Date().toISOString();
        const snapshot: RevertSnapshot | undefined =
          actor === 'agent'
            ? {
                title: item.title,
                description: item.description,
                status: item.status,
                owner: item.owner,
                dueDate: item.dueDate,
              }
            : undefined;

        const updatedItem: PlanItem = {
          ...item,
          ...changes,
          updatedBy: actor,
          updatedAt: now,
          previousState: snapshot,
        };

        set((state) => ({
          items: state.items.map((i) => (i.id === id ? updatedItem : i)),
          updatedAt: now,
        }));

        return { success: true, item: updatedItem };
      },

      moveItem: (id, newStatus, actor = 'human') => {
        const state = get();
        const item = state.items.find((i) => i.id === id);
        if (!item) {
          return { success: false, reason: 'ITEM_NOT_FOUND' };
        }

        if (newStatus === 'done') {
          const incomplete = getIncompleteDependencies(item, state.items);
          if (incomplete.length > 0) {
            return { success: false, reason: 'DEPENDENCIES_INCOMPLETE' };
          }
        }

        const now = new Date().toISOString();
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id
              ? { ...i, status: newStatus, updatedBy: actor, updatedAt: now }
              : i
          ),
          updatedAt: now,
        }));

        return { success: true };
      },

      selectItem: (id) => {
        set({ selectedItemId: id });
      },

      lockItem: (id) => {
        const state = get();
        const item = state.items.find((i) => i.id === id);
        if (!item) {
          return { success: false, reason: 'ITEM_NOT_FOUND' };
        }

        const now = new Date().toISOString();
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, locked: true, updatedAt: now } : i
          ),
          updatedAt: now,
        }));

        return { success: true };
      },

      unlockItem: (id) => {
        const state = get();
        const item = state.items.find((i) => i.id === id);
        if (!item) {
          return { success: false, reason: 'ITEM_NOT_FOUND' };
        }

        const now = new Date().toISOString();
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, locked: false, updatedAt: now } : i
          ),
          updatedAt: now,
        }));

        return { success: true };
      },

      revertItem: (id) => {
        const state = get();
        const item = state.items.find((i) => i.id === id);
        if (!item) {
          return { success: false, reason: 'ITEM_NOT_FOUND' };
        }
        if (!item.previousState) {
          return { success: false, reason: 'NOTHING_TO_REVERT' };
        }

        const now = new Date().toISOString();
        const revertedItem: PlanItem = {
          ...item,
          ...item.previousState,
          previousState: undefined,
          updatedBy: 'human',
          updatedAt: now,
        };

        set((state) => ({
          items: state.items.map((i) => (i.id === id ? revertedItem : i)),
          updatedAt: now,
        }));

        get().addActivityLog('Reverted', `"${item.title}" — agent's last change undone`);

        return { success: true };
      },

      getWorkspace: () => {
        const state = get();
        return {
          id: state.id,
          title: state.title,
          items: state.items,
          selectedItemId: state.selectedItemId,
          updatedAt: state.updatedAt,
        };
      },

      getSelectedItem: () => {
        const state = get();
        if (!state.selectedItemId) return null;
        return state.items.find((i) => i.id === state.selectedItemId) || null;
      },

      getIncompleteDependencies: (id) => {
        const state = get();
        const item = state.items.find((i) => i.id === id);
        if (!item) return [];
        return getIncompleteDependencies(item, state.items);
      },

      addActivityLog: (action, detail) => {
        const entry: ActivityLogEntry = {
          id: `log_${Date.now()}`,
          action,
          detail,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          activityLog: [...state.activityLog.slice(-49), entry],
        }));
      },

      setWebmcpAvailable: (available) => {
        set({ webmcpAvailable: available });
      },

      resetWorkspace: () => {
        set({
          id: demoWorkspace.id,
          title: demoWorkspace.title,
          items: demoWorkspace.items,
          selectedItemId: demoWorkspace.selectedItemId,
          updatedAt: new Date().toISOString(),
          activityLog: [],
        });
      },
    }),
    {
      name: 'plantogether-workspace',
      partialize: (state) => ({
        id: state.id,
        title: state.title,
        items: state.items,
        selectedItemId: state.selectedItemId,
        updatedAt: state.updatedAt,
      }),
    }
  )
);
