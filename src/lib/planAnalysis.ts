import type { PlanItem } from '../types/workspace';

/**
 * Plan Health, Conflict Detection, and Critical Path (V1.4 §12-14)
 *
 * Everything here is a deterministic, pure computation over the live
 * workspace — no fabricated numbers, no hardcoded demo values. Every stat
 * shown on the Dashboard traces back to one of these functions.
 */

export type ConflictType =
  | 'schedule_conflict'
  | 'blocked_dependency'
  | 'overdue'
  | 'locked_critical'
  | 'dependency_cycle';

export interface Conflict {
  id: string;
  type: ConflictType;
  itemIds: string[];
  title: string;
  detail: string;
}

export interface PlanHealth {
  score: number;
  conflicts: number;
  blocked: number;
  overdue: number;
  protected: number;
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getIncompleteDependencies(item: PlanItem, all: PlanItem[]): PlanItem[] {
  if (item.dependencies.length === 0) return [];
  return item.dependencies
    .map((id) => all.find((i) => i.id === id))
    .filter((d): d is PlanItem => !!d && d.status !== 'done');
}

function isOverdue(item: PlanItem, todayISO: string): boolean {
  return !!item.dueDate && item.status !== 'done' && item.dueDate < todayISO;
}

export function detectConflicts(items: PlanItem[], todayISO: string = todayISODate()): Conflict[] {
  const conflicts: Conflict[] = [];
  const byId = new Map(items.map((i) => [i.id, i]));

  // Blocked Dependency — item isn't Done and still depends on incomplete work.
  for (const item of items) {
    if (item.status === 'done') continue;
    const incomplete = getIncompleteDependencies(item, items);
    if (incomplete.length > 0) {
      conflicts.push({
        id: `blocked_${item.id}`,
        type: 'blocked_dependency',
        itemIds: [item.id, ...incomplete.map((d) => d.id)],
        title: 'Blocked Dependency',
        detail: `"${item.title}" is blocked by ${incomplete.length} incomplete item(s): ${incomplete
          .map((d) => d.title)
          .join(', ')}.`,
      });
    }
  }

  // Overdue Task — past its due date and not Done.
  for (const item of items) {
    if (isOverdue(item, todayISO)) {
      conflicts.push({
        id: `overdue_${item.id}`,
        type: 'overdue',
        itemIds: [item.id],
        title: 'Overdue Task',
        detail: `"${item.title}" was due ${item.dueDate} and is still ${item.status}.`,
      });
    }
  }

  // Schedule Conflict — an item is due before an incomplete item it depends on.
  for (const item of items) {
    if (!item.dueDate) continue;
    for (const depId of item.dependencies) {
      const dep = byId.get(depId);
      if (dep && dep.dueDate && dep.status !== 'done' && dep.dueDate > item.dueDate) {
        conflicts.push({
          id: `schedule_${item.id}_${dep.id}`,
          type: 'schedule_conflict',
          itemIds: [item.id, dep.id],
          title: 'Schedule Conflict',
          detail: `"${item.title}" is due ${item.dueDate} but depends on "${dep.title}", which isn't due until ${dep.dueDate}.`,
        });
      }
    }
  }

  // Locked Critical Task — locked, unfinished, and blocking at least one other item.
  const dependedOnCount = new Map<string, number>();
  items.forEach((i) => i.dependencies.forEach((d) => dependedOnCount.set(d, (dependedOnCount.get(d) || 0) + 1)));
  for (const item of items) {
    const blockingCount = dependedOnCount.get(item.id) || 0;
    if (item.locked && item.status !== 'done' && blockingCount > 0) {
      conflicts.push({
        id: `locked_critical_${item.id}`,
        type: 'locked_critical',
        itemIds: [item.id],
        title: 'Locked Critical Task',
        detail: `"${item.title}" is locked and blocks ${blockingCount} other item(s) — the agent cannot help move it forward.`,
      });
    }
  }

  // Dependency Conflict — a cycle in the dependency graph.
  const visited = new Set<string>();
  const onStack = new Set<string>();
  const cyclesSeen = new Set<string>();

  function dfs(id: string, path: string[]) {
    if (onStack.has(id)) {
      const cycle = path.slice(path.indexOf(id));
      const key = [...cycle].sort().join(',');
      if (!cyclesSeen.has(key)) {
        cyclesSeen.add(key);
        conflicts.push({
          id: `cycle_${key}`,
          type: 'dependency_cycle',
          itemIds: cycle,
          title: 'Dependency Conflict',
          detail: `Circular dependency: ${cycle
            .map((cid) => byId.get(cid)?.title ?? cid)
            .join(' → ')} → ${byId.get(cycle[0])?.title ?? cycle[0]}.`,
        });
      }
      return;
    }
    if (visited.has(id)) return;
    visited.add(id);
    onStack.add(id);
    const item = byId.get(id);
    (item?.dependencies || []).forEach((depId) => dfs(depId, [...path, id]));
    onStack.delete(id);
  }
  items.forEach((i) => dfs(i.id, []));

  return conflicts;
}

export function computePlanHealth(items: PlanItem[], todayISO: string = todayISODate()): PlanHealth {
  const conflicts = detectConflicts(items, todayISO);
  const conflictCount = conflicts.filter((c) => c.type === 'schedule_conflict' || c.type === 'dependency_cycle').length;
  const blockedCount = conflicts.filter((c) => c.type === 'blocked_dependency').length;
  const overdueCount = conflicts.filter((c) => c.type === 'overdue').length;
  const protectedCount = items.filter((i) => i.locked).length;

  const score = Math.max(0, Math.min(100, 100 - conflictCount * 15 - blockedCount * 8 - overdueCount * 10));

  return { score, conflicts: conflictCount, blocked: blockedCount, overdue: overdueCount, protected: protectedCount };
}

/**
 * Longest chain through the dependency graph, by item count. Items on this
 * chain are the ones most likely to push the whole plan's finish date out if
 * they slip — they get the CRITICAL badge (§14).
 */
export function computeCriticalPath(items: PlanItem[]): Set<string> {
  const byId = new Map(items.map((i) => [i.id, i]));
  const memo = new Map<string, string[]>();

  function longestChainFrom(id: string, seen: Set<string>): string[] {
    if (seen.has(id)) return []; // cycle guard
    if (memo.has(id)) return memo.get(id)!;

    const item = byId.get(id);
    const deps = item?.dependencies ?? [];
    if (deps.length === 0) {
      const result = [id];
      memo.set(id, result);
      return result;
    }

    const nextSeen = new Set(seen);
    nextSeen.add(id);
    let best: string[] = [];
    for (const depId of deps) {
      const chain = longestChainFrom(depId, nextSeen);
      if (chain.length > best.length) best = chain;
    }
    const result = [id, ...best];
    memo.set(id, result);
    return result;
  }

  let overallBest: string[] = [];
  for (const item of items) {
    const chain = longestChainFrom(item.id, new Set());
    if (chain.length > overallBest.length) overallBest = chain;
  }

  return new Set(overallBest);
}
