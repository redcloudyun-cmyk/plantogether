export type ItemStatus = 'backlog' | 'planned' | 'doing' | 'done';
export type Actor = 'human' | 'agent';
export type RiskLevel = 'low' | 'medium' | 'high';
export type AutonomyMode = 'observe' | 'assist' | 'autonomous';
export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'applied';
export type ItemPriority = 'low' | 'medium' | 'high';
export type ContextScopeKey =
  | 'currentItem'
  | 'boardState'
  | 'dependencies'
  | 'planStatus'
  | 'activityHistory'
  | 'completedItems'
  | 'teamInformation';

export interface RevertSnapshot {
  title: string;
  description?: string;
  status: ItemStatus;
  owner?: string;
  dueDate?: string;
  priority?: ItemPriority;
}

export interface PlanItem {
  id: string;
  title: string;
  description?: string;
  status: ItemStatus;
  owner?: string;
  dueDate?: string;
  priority?: ItemPriority;
  locked: boolean;
  dependencies: string[];
  createdBy: Actor;
  updatedBy: Actor;
  createdAt: string;
  updatedAt: string;
  /** Snapshot of the item just before the agent's most recent change, so a human can revert it. Cleared once a human edits or reverts the item. */
  previousState?: RevertSnapshot;
}

export type ActivitySource = 'webmcp' | 'human' | 'system';
export type ActivityStatus = 'success' | 'blocked' | 'error';

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  source: ActivitySource;
  toolName?: string;
  action: string;
  detail: string;
  status?: ActivityStatus;
  /** True only for the pre-seeded sample history (see createDemoActivityLog) — never set by real Human/Agent actions. Lets the UI mark it clearly so it can't be mistaken for a live WebMCP call. */
  seeded?: boolean;
}

export interface Workspace {
  id: string;
  title: string;
  items: PlanItem[];
  selectedItemId: string | null;
  updatedAt: string;
}

/** Subset of PlanItem fields a proposal changes. Only the touched fields are present. */
export interface ProposalChangeSet {
  title?: string;
  description?: string;
  status?: ItemStatus;
  owner?: string;
  dueDate?: string;
  priority?: ItemPriority;
  dependencies?: string[];
}

export interface Proposal {
  id: string;
  itemId: string;
  itemTitle: string;
  riskLevel: RiskLevel;
  /** The item's values for the touched fields, before this change. */
  before: ProposalChangeSet;
  /** The item's values for the touched fields, after this change is applied. */
  after: ProposalChangeSet;
  /** Why the agent is proposing this change. Comes from the agent's tool call, never fabricated. */
  reason: string;
  /** Which WebMCP tool triggered this proposal. */
  tool: string;
  status: ProposalStatus;
  createdAt: string;
  resolvedAt?: string;
}

export const COLUMNS: { id: ItemStatus; title: string }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'planned', title: 'Planned' },
  { id: 'doing', title: 'Doing' },
  { id: 'done', title: 'Done' },
];
