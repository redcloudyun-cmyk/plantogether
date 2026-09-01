import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PlanItem,
  ItemStatus,
  ActivityLogEntry,
  Actor,
  RevertSnapshot,
  Proposal,
  ProposalChangeSet,
  RiskLevel,
  AutonomyMode,
  ContextScopeKey,
} from '../types/workspace';
import { demoWorkspace } from '../data/demoWorkspace';

let idCounter = 100;
function generateId(): string {
  return `item_${Date.now()}_${idCounter++}`;
}

let proposalCounter = 1;
function generateProposalId(): string {
  return `proposal_${proposalCounter++}`;
}

const DEFAULT_CONTEXT_SCOPE: Record<ContextScopeKey, boolean> = {
  currentItem: true,
  boardState: true,
  dependencies: true,
  planStatus: true,
  activityHistory: false,
  completedItems: false,
  teamInformation: false,
};

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

  // Agent Proposal / Human Approval (V1.4 §15)
  proposals: Proposal[];
  autonomyMode: AutonomyMode;
  contextScope: Record<ContextScopeKey, boolean>;

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
  addActivityLog: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void;
  setWebmcpAvailable: (available: boolean) => void;
  resetWorkspace: () => void;

  // Proposal actions
  setAutonomyMode: (mode: AutonomyMode) => void;
  toggleContextScope: (key: ContextScopeKey) => void;
  createProposal: (input: {
    itemId: string;
    itemTitle: string;
    riskLevel: RiskLevel;
    before: ProposalChangeSet;
    after: ProposalChangeSet;
    reason: string;
    tool: string;
  }) => Proposal;
  approveProposal: (id: string) => { success: boolean; reason?: string };
  rejectProposal: (id: string) => { success: boolean; reason?: string };
  approveAllPending: () => void;
  rejectAllPending: () => void;
  getPendingProposals: () => Proposal[];
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
      proposals: [],
      autonomyMode: 'assist',
      contextScope: DEFAULT_CONTEXT_SCOPE,

      addItem: (itemData, actor = 'human') => {
        const now = new Date().toISOString();
        const newItem: PlanItem = {
          id: generateId(),
          title: itemData.title,
          description: itemData.description || undefined,
          status: itemData.status || 'backlog',
          owner: itemData.owner || undefined,
          dueDate: itemData.dueDate || undefined,
          priority: itemData.priority || 'medium',
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
                priority: item.priority,
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

        if (item.locked && actor === 'agent') {
          return { success: false, reason: 'ITEM_LOCKED_BY_HUMAN' };
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

        get().addActivityLog({
          source: 'human',
          action: 'Reverted',
          detail: `"${item.title}" — agent's last change undone`,
          status: 'success',
        });

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

      addActivityLog: (entry) => {
        const fullEntry: ActivityLogEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          ...entry,
        };
        set((state) => ({
          activityLog: [...state.activityLog.slice(-49), fullEntry],
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
          proposals: [],
          autonomyMode: 'assist',
          contextScope: DEFAULT_CONTEXT_SCOPE,
        });
      },

      setAutonomyMode: (mode) => {
        set({ autonomyMode: mode });
        get().addActivityLog({
          source: 'human',
          action: 'Autonomy',
          detail: `Mode set to ${mode}`,
          status: 'success',
        });
      },

      toggleContextScope: (key) => {
        set((state) => ({
          contextScope: { ...state.contextScope, [key]: !state.contextScope[key] },
        }));
      },

      createProposal: ({ itemId, itemTitle, riskLevel, before, after, reason, tool }) => {
        const proposal: Proposal = {
          id: generateProposalId(),
          itemId,
          itemTitle,
          riskLevel,
          before,
          after,
          reason,
          tool,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          proposals: [...state.proposals, proposal],
        }));

        get().addActivityLog({
          source: 'webmcp',
          toolName: tool,
          action: 'Proposed',
          detail: `"${itemTitle}" — ${riskLevel.toUpperCase()} risk change pending approval`,
          status: 'success',
        });

        return proposal;
      },

      approveProposal: (id) => {
        const state = get();
        const proposal = state.proposals.find((p) => p.id === id);
        if (!proposal) {
          return { success: false, reason: 'PROPOSAL_NOT_FOUND' };
        }
        if (proposal.status !== 'pending') {
          return { success: false, reason: 'PROPOSAL_ALREADY_RESOLVED' };
        }

        const result = state.updateItem(proposal.itemId, proposal.after, 'agent');
        const now = new Date().toISOString();

        if (!result.success) {
          set((s) => ({
            proposals: s.proposals.map((p) =>
              p.id === id ? { ...p, status: 'rejected', resolvedAt: now } : p
            ),
          }));
          get().addActivityLog({
            source: 'webmcp',
            toolName: proposal.tool,
            action: 'Blocked',
            detail: `Proposal for "${proposal.itemTitle}" could not be applied\n${result.reason}`,
            status: 'blocked',
          });
          return result;
        }

        set((s) => ({
          proposals: s.proposals.map((p) =>
            p.id === id ? { ...p, status: 'applied', resolvedAt: now } : p
          ),
        }));
        get().addActivityLog({
          source: 'webmcp',
          toolName: proposal.tool,
          action: 'Applied',
          detail: `"${proposal.itemTitle}" — proposal approved and applied`,
          status: 'success',
        });

        return { success: true };
      },

      rejectProposal: (id) => {
        const state = get();
        const proposal = state.proposals.find((p) => p.id === id);
        if (!proposal) {
          return { success: false, reason: 'PROPOSAL_NOT_FOUND' };
        }
        if (proposal.status !== 'pending') {
          return { success: false, reason: 'PROPOSAL_ALREADY_RESOLVED' };
        }

        const now = new Date().toISOString();
        set((s) => ({
          proposals: s.proposals.map((p) =>
            p.id === id ? { ...p, status: 'rejected', resolvedAt: now } : p
          ),
        }));
        get().addActivityLog({
          source: 'human',
          action: 'Rejected',
          detail: `"${proposal.itemTitle}" — proposal rejected by human`,
          status: 'success',
        });

        return { success: true };
      },

      approveAllPending: () => {
        const pending = get().proposals.filter((p) => p.status === 'pending');
        pending.forEach((p) => get().approveProposal(p.id));
      },

      rejectAllPending: () => {
        const pending = get().proposals.filter((p) => p.status === 'pending');
        pending.forEach((p) => get().rejectProposal(p.id));
      },

      getPendingProposals: () => {
        return get().proposals.filter((p) => p.status === 'pending');
      },
    }),
    {
      name: 'withgex-workspace',
      partialize: (state) => ({
        id: state.id,
        title: state.title,
        items: state.items,
        selectedItemId: state.selectedItemId,
        updatedAt: state.updatedAt,
        proposals: state.proposals,
        autonomyMode: state.autonomyMode,
        contextScope: state.contextScope,
      }),
    }
  )
);
