import { useWorkspaceStore } from '../store/workspaceStore';

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

export async function registerWebMCPTools(): Promise<() => void> {
  const store = useWorkspaceStore;

  if (!document.modelContext) {
    console.warn('[WebMCP] document.modelContext is not available. Tools will not be registered.');
    store.getState().setWebmcpAvailable(false);
    return () => {};
  }

  console.log('[WebMCP] Registering PlanTogether tools...');
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
          'Returns the current live state of the PlanTogether planning workspace, including all items with their statuses, due dates, owners, lock states, dependencies, and the item currently selected/focused by the human user. Use this to understand the full context of the workspace before making changes.',
        annotations: { readOnlyHint: true },
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        execute: async () => {
          log('get_workspace_state', 'Reading workspace state');
          const state = store.getState().getWorkspace();
          store.getState().addActivityLog('Read workspace', `${state.items.length} items`);
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
          'Returns the planning item currently selected/focused by the human user. This tells you what the human is currently looking at or working on. Returns null if no item is selected.',
        annotations: { readOnlyHint: true },
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        execute: async () => {
          log('get_current_focus', 'Reading current focus');
          const item = store.getState().getSelectedItem();
          store.getState().addActivityLog(
            'Read current focus',
            item ? `"${item.title}"` : 'None selected'
          );
          return item || { selectedItem: null, message: 'No item is currently selected by the human.' };
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
          },
          required: ['title'],
          additionalProperties: false,
        },
        execute: async (args) => {
          const { title, description, status, owner, dueDate, dependencies } = args as {
            title: string;
            description?: string;
            status?: string;
            owner?: string;
            dueDate?: string;
            dependencies?: string[];
          };

          log('add_item', { title, status, owner, dueDate });

          if (!title || typeof title !== 'string' || !title.trim()) {
            return { success: false, reason: 'TITLE_REQUIRED', message: 'A non-empty title is required.' };
          }

          // Validate status
          const validStatuses = ['backlog', 'planned', 'doing', 'done'];
          if (status && !validStatuses.includes(status)) {
            return { success: false, reason: 'INVALID_STATUS', message: `Status must be one of: ${validStatuses.join(', ')}` };
          }

          // Validate date format
          if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
            return { success: false, reason: 'INVALID_DATE_FORMAT', message: 'Date must be in YYYY-MM-DD format' };
          }

          const newItem = store.getState().addItem(
            {
              title: title.trim(),
              description,
              status: (status as 'backlog' | 'planned' | 'doing' | 'done') || 'planned',
              owner,
              dueDate,
              dependencies,
            },
            'agent'
          );

          store.getState().addActivityLog('Added', `"${newItem.title}"`);

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
          'Updates an existing planning item. You can change the title, description, status, owner, due date, or dependencies. Changes appear immediately on the board. Cannot modify items that are locked by the human user.',
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
          },
          required: ['itemId'],
          additionalProperties: false,
        },
        execute: async (args) => {
          const { itemId, ...changes } = args as {
            itemId: string;
            title?: string;
            description?: string;
            status?: string;
            owner?: string;
            dueDate?: string;
            dependencies?: string[];
          };

          log('update_item', { itemId, changes });

          if (!itemId) {
            return { success: false, reason: 'ITEM_ID_REQUIRED' };
          }

          // Validate date format if provided
          if (changes.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(changes.dueDate)) {
            return { success: false, reason: 'INVALID_DATE_FORMAT', message: 'Date must be in YYYY-MM-DD format' };
          }

          const typedChanges = {
            ...changes,
            status: changes.status as 'backlog' | 'planned' | 'doing' | 'done' | undefined,
          };
          const result = store.getState().updateItem(itemId, typedChanges, 'agent');

          if (result.success) {
            const changeDesc = Object.keys(changes).join(', ');
            store.getState().addActivityLog('Updated', `"${result.item?.title}" (${changeDesc})`);
            return result;
          }

          if (result.reason === 'DEPENDENCIES_INCOMPLETE') {
            const blockers = store.getState().getIncompleteDependencies(itemId);
            const item = store.getState().items.find((i) => i.id === itemId);
            store.getState().addActivityLog('Blocked', `"${item?.title}" can't move to Done — dependencies incomplete`);
            return {
              ...result,
              message: `Cannot mark this item Done: it still depends on ${blockers.length} incomplete item(s): ${blockers.map((b) => b.title).join(', ')}.`,
            };
          }

          return result;
        },
      },
      { signal }
    );
    console.log('[WebMCP] ✓ Registered: update_item');

    // Tool 5: lock_item
    await document.modelContext.registerTool(
      {
        name: 'lock_item',
        title: 'Lock Planning Item',
        description:
          'Locks an item so that it cannot be modified by the agent. This is used when the human wants to protect an item from being changed during a rebalance or bulk update. Locked items show a lock icon on the board.',
        inputSchema: {
          type: 'object',
          properties: {
            itemId: {
              type: 'string',
              description: 'The ID of the item to lock',
            },
          },
          required: ['itemId'],
          additionalProperties: false,
        },
        execute: async (args) => {
          const { itemId } = args as { itemId: string };
          log('lock_item', { itemId });

          if (!itemId) {
            return { success: false, reason: 'ITEM_ID_REQUIRED' };
          }

          const result = store.getState().lockItem(itemId);
          if (result.success) {
            const item = store.getState().items.find((i) => i.id === itemId);
            store.getState().addActivityLog('Locked', `"${item?.title}"`);
          }
          return result;
        },
      },
      { signal }
    );
    console.log('[WebMCP] ✓ Registered: lock_item');

    // Tool 6: rebalance_plan
    await document.modelContext.registerTool(
      {
        name: 'rebalance_plan',
        title: 'Rebalance Plan',
        description:
          'Reads the current workspace state and returns a structured analysis of the plan. This includes all items grouped by status, locked items that must not be changed, identified dependencies, and suggested schedule adjustments. Use this as a starting point, then use update_item to apply the individual changes. Locked items must be respected and should not be modified.',
        annotations: { readOnlyHint: true },
        inputSchema: {
          type: 'object',
          properties: {
            constraints: {
              type: 'string',
              description: 'Optional constraints or priorities to consider during rebalancing',
            },
          },
          additionalProperties: false,
        },
        execute: async (args) => {
          const { constraints } = (args || {}) as { constraints?: string };
          log('rebalance_plan', { constraints });

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
            constraints: constraints || 'none specified',
            instructions:
              'Review the items above. Respect all locked items. Use update_item to adjust dates, statuses, and dependencies for unlocked items as needed to create a balanced plan.',
          };

          store.getState().addActivityLog('Analyzed plan', `${state.items.length} items, ${lockedItems.length} locked`);

          return analysis;
        },
      },
      { signal }
    );
    console.log('[WebMCP] ✓ Registered: rebalance_plan');

    console.log('[WebMCP] All 6 tools registered successfully.');
    store.getState().addActivityLog('WebMCP', '6 tools registered');

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
