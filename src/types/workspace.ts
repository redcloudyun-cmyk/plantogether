export type ItemStatus = 'backlog' | 'planned' | 'doing' | 'done';
export type Actor = 'human' | 'agent';

export interface RevertSnapshot {
  title: string;
  description?: string;
  status: ItemStatus;
  owner?: string;
  dueDate?: string;
}

export interface PlanItem {
  id: string;
  title: string;
  description?: string;
  status: ItemStatus;
  owner?: string;
  dueDate?: string;
  locked: boolean;
  dependencies: string[];
  createdBy: Actor;
  updatedBy: Actor;
  createdAt: string;
  updatedAt: string;
  /** Snapshot of the item just before the agent's most recent change, so a human can revert it. Cleared once a human edits or reverts the item. */
  previousState?: RevertSnapshot;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  detail: string;
  timestamp: string;
}

export interface Workspace {
  id: string;
  title: string;
  items: PlanItem[];
  selectedItemId: string | null;
  updatedAt: string;
}

export const COLUMNS: { id: ItemStatus; title: string }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'planned', title: 'Planned' },
  { id: 'doing', title: 'Doing' },
  { id: 'done', title: 'Done' },
];
