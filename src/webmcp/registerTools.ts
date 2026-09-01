import { useWorkspaceStore, applyContextScopeToItem } from '../store/workspaceStore';
import type { ActivityStatus, ProposalChangeSet } from '../types/workspace';
import { classifyRisk, decideAutonomyAction } from '../lib/risk';

// Type declaration for the WebMCP API
declare global {
  interface Document {
    modelContext?: {
      registerTool: (
        tool: {
          name: string;
          title?: string;
          description: string;
          annotations?: {
            readOnlyHint?: boolean;
            untrustedContentHint?: boolean;
          };
          inputSchema: Record<string, unknown>;
          execute: (args: Record<string, unknown>) => Promise<unknown>;
        },
        options?: { signal?: AbortSignal }
      ) => Promise<void>;
    };
  }
}

const log = (toolName: string, ...args: unknown[]) => {
  console.log(`[WebMCP] ${toolName}`, ...args);
};

const REASON_MESSAGES: Record<string, string> = {
  ITEM_NOT_FOUND: 'No item exists with that ID.',
  ITEM_LOCKED_BY_HUMAN: 'This item is locked by the human and cannot be modified by the agent.',
  ITEM_ID_REQUIRED: 'An itemId is required.',
  TITLE_REQUIRED: 'A non-empty title is required.',
  INVALID_STATUS: 'Status must be one of: backlog, planned, doing, done.',
  INVALID_DATE_FORMAT: 'Date must be in YYYY-MM-DD format.',
  DEPENDENCIES_INCOMPLETE: 'This item cannot be marked Done until its dependencies are Done.',
  AUTONOMY_OBSERVE_MODE: 'The agent is currently in Observe mode. Mutations are disabled until a human switches to Assist or Autonomous mode.',
};

export async function registerWebMCPTools(): Promise<() => void> {
  const store = useWorkspaceStore;

  const logActivity = (
    toolName: string,
    detail: string,
    status: ActivityStatus = 'success'
  ) => {
    store.getState().addActivityLog({
      source: 'webmcp',
      toolName,
      action: toolName,
      detail,
      status,
    });
  };

  if (!document.modelContext) {
    console.warn('[WebMCP] document.modelContext is not available. Tools will not be registered.');
    store.getState().setWebmcpAvailable(false);
    return () => {};
  }

  console.log('[WebMCP] Registering WithGeX tools...');
  store.getState().setWebmcpAvailable(true);

  const controller = new AbortController();
  const { signal } = controller;

  try {
    // Tool 1: get_workspace_state
    await document.modelContext.registerTool(
      {
        name: 'get_workspace_state',
        title: 'Get Workspace State',
        description:
          'Returns the current live state of the WithGeX planning workspace, including all items with their statuses, due dates, owners, lock states, dependencies, and the item currently selected/focused by the human user. Use this to understand the full context of the workspace before making changes.',
        annotations: { readOnlyHint: true },
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        execute: async () => {
          log('get_workspace_state', 'Reading workspace state');
          const state = store.getState().getWorkspace();
          logActivity('get_workspace_state', `${state.items.length} live items read`);
          return state;
        },
      },
      { signal }
    );
    console.log('[WebMCP] ✓ Registered: get_workspace_state');

    // Tool 2: get_current_focus
    await document.modelContext.registerTool(
      {
        name: 'get_current_focus',
        title: 'Get Current Focus',
        description:
          'Returns the planning item currently selected/focused by the human user. This tells you what the human is currently looking at or working on — use it to continue planning from the same live context the human has open, without asking them to re-explain it. Returns null if no item is selected.',
        annotations: { readOnlyHint: true },
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        execute: async () => {
          log('get_current_focus', 'Reading current focus');

          if (!store.getState().contextScope.currentItem) {
            logActivity('get_current_focus', 'Blocked by Context Scope (Current item disabled)', 'blocked');
            return {
              selectedItem: null,
              message: 'The human has disabled the "Current item" context scope, so the current focus is not shared with the agent.',
            };
          }

          const item = store.getState().getSelectedItem();
          logActivity('get_current_focus', item ? item.title : 'None selected');
          if (!item) return { selectedItem: null, message: 'No item is currently selected by the human.' };
          return applyContextScopeToItem(item, store.getState().contextScope);
        },
      },
      { signal }
    );
    console.log('[WebMCP] ✓ Registered: get_current_focus');

    // Tool 3: add_item
    await document.modelContext.registerTool(
      {
        name: 'add_item',
        title: 'Add Planning Item',
        description:
          'Adds a new planning item to the workspace board. The item will appear immediately on the Kanban board visible to the human user. You must provide at least a title. Status defaults to "planned" if not specified.',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'The title of the planning item',
            },
            description: {
              type: 'string',
              description: 'Optional description with more details',
            },
            status: {
              type: 'string',
              enum: ['backlog', 'planned', 'doing', 'done'],
              description: 'The column to place this item in. Defaults to "planned".',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Priority. Defaults to "medium".',
            },
            owner: {
              type: 'string',
              description: 'The person assigned to this item',
            },
            dueDate: {
              type: 'string',
              description: 'Due date in YYYY-MM-DD format',
            },
            dependencies: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of item IDs this item depends on',
            },
            reason: {
              type: 'string',
              description: 'Optional: briefly explain why you are adding this item. Shown to the human in the activity log.',
            },
          },
          required: ['title'],
          additionalProperties: false,
        },
        execute: async (args) => {
          const { title, description, status, priority, owner, dueDate, dependencies, reason } = args as {
            title: string;
            description?: string;
            status?: string;
            priority?: 'low' | 'medium' | 'high';
            owner?: string;
            dueDate?: string;
            dependencies?: string[];
            reason?: string;
          };

          log('add_item', { title, status, owner, dueDate });

          if (!title || typeof title !== 'string' || !title.trim()) {
            logActivity('add_item', 'TITLE_REQUIRED', 'error');
            return { success: false, reason: 'TITLE_REQUIRED', message: REASON_MESSAGES.TITLE_REQUIRED };
          }

          const validStatuses = ['backlog', 'planned', 'doing', 'done'];
          if (status && !validStatuses.includes(status)) {
            logActivity('add_item', 'INVALID_STATUS', 'error');
            return { success: false, reason: 'INVALID_STATUS', message: REASON_MESSAGES.INVALID_STATUS };
          }

          if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
            logActivity('add_item', 'INVALID_DATE_FORMAT', 'error');
            return { success: false, reason: 'INVALID_DATE_FORMAT', message: REASON_MESSAGES.INVALID_DATE_FORMAT };
          }

          // Create Item is always LOW risk (§20), but Observe mode allows no mutation at all.
          if (store.getState().autonomyMode === 'observe') {
            logActivity('add_item', 'AUTONOMY_OBSERVE_MODE', 'blocked');
            return { success: false, reason: 'AUTONOMY_OBSERVE_MODE', message: REASON_MESSAGES.AUTONOMY_OBSERVE_MODE };
          }

          const newItem = store.getState().addItem(
            {
              title: title.trim(),
              description,
              status: (status as 'backlog' | 'planned' | 'doing' | 'done') || 'planned',
              priority,
              owner,
              dueDate,
              dependencies,
            },
            'agent'
          );

          logActivity('add_item', reason ? `${newItem.title}\n${reason}` : newItem.title);

          return {
            success: true,
            item: newItem,
            message: `Item "${newItem.title}" has been added to the ${newItem.status} column.`,
          };
        },
      },
      { signal }
    );
    console.log('[WebMCP] ✓ Registered: add_item');

    // Tool 4: update_item
    await document.modelContext.registerTool(
      {
        name: 'update_item',
        title: 'Update Planning Item',
        description:
          'Updates an existing planning item. You can change the title, description, status, priority, owner, due date, or dependencies. Low-risk edits (title/description/owner) apply immediately. Due date, status, priority, or dependency changes are medium/high risk: depending on the current autonomy mode, they may instead create a Proposal that a human must approve before it takes effect (the response will have proposed: true and no board change will be visible yet). Cannot modify items that are locked by the human user — that always takes priority over autonomy mode, so a locked item stays locked until the human unlocks it.',
        inputSchema: {
          type: 'object',
          properties: {
            itemId: {
              type: 'string',
              description: 'The ID of the item to update',
            },
            title: {
              type: 'string',
              description: 'New title',
            },
            description: {
              type: 'string',
              description: 'New description',
            },
            status: {
              type: 'string',
              enum: ['backlog', 'planned', 'doing', 'done'],
              description: 'New status/column',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'New priority',
            },
            owner: {
              type: 'string',
              description: 'New owner',
            },
            dueDate: {
              type: 'string',
              description: 'New due date in YYYY-MM-DD format',
            },
            dependencies: {
              type: 'array',
              items: { type: 'string' },
              description: 'New dependency list',
            },
            reason: {
              type: 'string',
              description:
                'Why you are making this change. Important for due date, status, or dependency changes — those are shown to the human for approval along with this explanation, so a clear, specific reason (e.g. "Record Demo was delayed, shifting this by one day to avoid a conflict") matters.',
            },
          },
          required: ['itemId'],
          additionalProperties: false,
        },
        execute: async (args) => {
          const { itemId, reason, ...changes } = args as {
            itemId: string;
            title?: string;
            description?: string;
            status?: string;
            priority?: 'low' | 'medium' | 'high';
            owner?: string;
            dueDate?: string;
            dependencies?: string[];
            reason?: string;
          };

          log('update_item', { itemId, changes, reason });

          if (!itemId) {
            logActivity('update_item', 'ITEM_ID_REQUIRED', 'error');
            return { success: false, reason: 'ITEM_ID_REQUIRED', message: REASON_MESSAGES.ITEM_ID_REQUIRED };
          }

          const item = store.getState().items.find((i) => i.id === itemId);
          if (!item) {
            logActivity('update_item', 'ITEM_NOT_FOUND', 'error');
            return { success: false, reason: 'ITEM_NOT_FOUND', message: REASON_MESSAGES.ITEM_NOT_FOUND };
          }

          if (changes.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(changes.dueDate)) {
            logActivity('update_item', 'INVALID_DATE_FORMAT', 'error');
            return { success: false, reason: 'INVALID_DATE_FORMAT', message: REASON_MESSAGES.INVALID_DATE_FORMAT };
          }

          // Human locks always take priority over autonomy mode (§23) — checked before
          // risk classification so a locked item never gets a proposal either.
          if (item.locked) {
            logActivity('update_item', `${item.title}\nITEM_LOCKED_BY_HUMAN`, 'blocked');
            return { success: false, reason: 'ITEM_LOCKED_BY_HUMAN', message: REASON_MESSAGES.ITEM_LOCKED_BY_HUMAN };
          }

          // Only include `status` when the caller actually passed one — an explicit
          // `status: undefined` key would still be spread onto the item later and wipe
          // out its real status (object spread copies own keys regardless of value).
          const { status: rawStatus, ...changesWithoutStatus } = changes;
          const typedChanges: ProposalChangeSet = {
            ...changesWithoutStatus,
            ...(rawStatus !== undefined ? { status: rawStatus as 'backlog' | 'planned' | 'doing' | 'done' } : {}),
          };

          // Dependency completeness is validated up front regardless of risk/autonomy,
          // so we never propose (or auto-apply) a change that can't actually be applied.
          if (typedChanges.status === 'done') {
            const effectiveDeps = typedChanges.dependencies ?? item.dependencies;
            const stillIncomplete = effectiveDeps
              .map((depId) => store.getState().items.find((i) => i.id === depId))
              .filter((dep) => dep && dep.status !== 'done');
            if (stillIncomplete.length > 0) {
              const blockers = store.getState().getIncompleteDependencies(itemId);
              logActivity('update_item', `${item.title}\nDEPENDENCIES_INCOMPLETE`, 'blocked');
              return {
                success: false,
                reason: 'DEPENDENCIES_INCOMPLETE',
                message: `Cannot mark this item Done: it still depends on ${blockers.length} incomplete item(s): ${blockers.map((b) => b.title).join(', ')}.`,
              };
            }
          }

          if (store.getState().autonomyMode === 'observe') {
            logActivity('update_item', 'AUTONOMY_OBSERVE_MODE', 'blocked');
            return { success: false, reason: 'AUTONOMY_OBSERVE_MODE', message: REASON_MESSAGES.AUTONOMY_OBSERVE_MODE };
          }

          const changeSet: ProposalChangeSet = typedChanges;
          const risk = classifyRisk(changeSet);
          const action = decideAutonomyAction(store.getState().autonomyMode, risk);

          if (action === 'propose') {
            const before: ProposalChangeSet = {};
            (Object.keys(changeSet) as (keyof ProposalChangeSet)[]).forEach((field) => {
              // @ts-expect-error — narrowing per-field assignment between two structurally matching partials
              before[field] = item[field];
            });

            const proposalReason = reason?.trim()
              ? reason.trim()
              : 'No reason was provided by the agent for this change.';

            const proposal = store.getState().createProposal({
              itemId,
              itemTitle: item.title,
              riskLevel: risk,
              before,
              after: changeSet,
              reason: proposalReason,
              tool: 'update_item',
            });

            return {
              success: true,
              proposed: true,
              proposalId: proposal.id,
              riskLevel: risk,
              message: `This is a ${risk.toUpperCase()}-risk change, so it was not applied automatically. A proposal (${proposal.id}) has been created and is waiting for the human to approve or reject it in the Workspace UI.`,
            };
          }

          const result = store.getState().updateItem(itemId, typedChanges, 'agent');

          if (result.success) {
            const changeDesc = Object.keys(changes).join(', ');
            logActivity(
              'update_item',
              reason ? `${result.item?.title} (${changeDesc})\n${reason}` : `${result.item?.title} (${changeDesc})`
            );
            return result;
          }

          logActivity('update_item', String(result.reason ?? 'UNKNOWN_ERROR'), 'error');
          return { ...result, message: REASON_MESSAGES[result.reason ?? ''] ?? 'This update could not be applied.' };
        },
      },
      { signal }
    );
    console.log('[WebMCP] ✓ Registered: update_item');

    // Tool 5: analyze_plan
    await document.modelContext.registerTool(
      {
        name: 'analyze_plan',
        title: 'Analyze Plan',
        description:
          'Reads the current workspace state (read-only) and returns a structured analysis of the plan: all items grouped by status, locked items that must not be changed, dependency relationships, and which items are currently blocked. Use this as a starting point, then call update_item individually for each change. Locked items must be respected and should not be modified.',
        annotations: { readOnlyHint: true },
        inputSchema: {
          type: 'object',
          properties: {
            constraints: {
              type: 'string',
              description: 'Optional constraints or priorities to consider during analysis',
            },
          },
          additionalProperties: false,
        },
        execute: async (args) => {
          const { constraints } = (args || {}) as { constraints?: string };
          log('analyze_plan', { constraints });

          const state = store.getState().getWorkspace();
          const lockedItems = state.items.filter((i) => i.locked);
          const unlockedItems = state.items.filter((i) => !i.locked);

          const analysis = {
            workspaceTitle: state.title,
            totalItems: state.items.length,
            byStatus: {
              backlog: state.items.filter((i) => i.status === 'backlog').map((i) => ({ id: i.id, title: i.title, dueDate: i.dueDate, locked: i.locked })),
              planned: state.items.filter((i) => i.status === 'planned').map((i) => ({ id: i.id, title: i.title, dueDate: i.dueDate, locked: i.locked })),
              doing: state.items.filter((i) => i.status === 'doing').map((i) => ({ id: i.id, title: i.title, dueDate: i.dueDate, locked: i.locked })),
              done: state.items.filter((i) => i.status === 'done').map((i) => ({ id: i.id, title: i.title, dueDate: i.dueDate, locked: i.locked })),
            },
            lockedItems: lockedItems.map((i) => ({
              id: i.id,
              title: i.title,
              dueDate: i.dueDate,
              status: i.status,
              note: 'LOCKED — do not modify',
            })),
            modifiableItems: unlockedItems.map((i) => {
              const blockers = store.getState().getIncompleteDependencies(i.id);
              return {
                id: i.id,
                title: i.title,
                dueDate: i.dueDate,
                status: i.status,
                dependencies: i.dependencies,
                blockedBy: blockers.map((b) => ({ id: b.id, title: b.title, status: b.status })),
              };
            }),
            blockedItems: state.items
              .filter((i) => i.status !== 'done' && store.getState().getIncompleteDependencies(i.id).length > 0)
              .map((i) => ({
                id: i.id,
                title: i.title,
                blockedBy: store.getState().getIncompleteDependencies(i.id).map((b) => b.title),
                note: 'Cannot be marked Done until its dependencies are Done.',
              })),
            autonomyMode: store.getState().autonomyMode,
            constraints: constraints || 'none specified',
            instructions:
              'Review the items above. Respect all locked items. Use update_item to adjust dates, statuses, and dependencies for unlocked items as needed to create a balanced plan. Title/description/owner edits apply immediately; due date, status, or dependency changes may instead create a proposal awaiting human approval, depending on the current autonomy mode — always pass a clear "reason" explaining why.',
          };

          logActivity('analyze_plan', `${state.items.length} items, ${lockedItems.length} locked`);

          return analysis;
        },
      },
      { signal }
    );
    console.log('[WebMCP] ✓ Registered: analyze_plan');

    console.log('[WebMCP] All 5 tools registered successfully.');
    store.getState().addActivityLog({
      source: 'system',
      action: 'WebMCP',
      detail: '5 tools registered',
      status: 'success',
    });

  } catch (error) {
    console.error('[WebMCP] Error registering tools:', error);
    store.getState().setWebmcpAvailable(false);
  }

  // Return cleanup function
  return () => {
    controller.abort();
    console.log('[WebMCP] Tools unregistered.');
  };
}
