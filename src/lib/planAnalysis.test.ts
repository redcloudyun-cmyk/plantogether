import { describe, it, expect } from 'vitest';
import { detectConflicts, computePlanHealth, computeCriticalPath } from './planAnalysis';
import type { PlanItem } from '../types/workspace';

const TODAY = '2026-09-01';

function makeItem(overrides: Partial<PlanItem> = {}): PlanItem {
  const now = new Date().toISOString();
  return {
    id: 'item_1',
    title: 'Sample task',
    status: 'doing',
    locked: false,
    dependencies: [],
    createdBy: 'human',
    updatedBy: 'human',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('detectConflicts', () => {
  it('flags a blocked dependency when a prerequisite is not done', () => {
    const dep = makeItem({ id: 'dep', title: 'Dependency', status: 'doing' });
    const item = makeItem({ id: 'item', title: 'Item', dependencies: ['dep'] });

    const conflicts = detectConflicts([dep, item], TODAY);

    expect(conflicts).toContainEqual(
      expect.objectContaining({ type: 'blocked_dependency', itemIds: ['item', 'dep'] })
    );
  });

  it('does not flag a blocked dependency once the prerequisite is done', () => {
    const dep = makeItem({ id: 'dep', title: 'Dependency', status: 'done' });
    const item = makeItem({ id: 'item', title: 'Item', dependencies: ['dep'] });

    const conflicts = detectConflicts([dep, item], TODAY);

    expect(conflicts.some((c) => c.type === 'blocked_dependency')).toBe(false);
  });

  it('flags an overdue task', () => {
    const item = makeItem({ id: 'item', status: 'doing', dueDate: '2026-08-20' });

    const conflicts = detectConflicts([item], TODAY);

    expect(conflicts).toContainEqual(expect.objectContaining({ type: 'overdue', itemIds: ['item'] }));
  });

  it('does not flag a completed item as overdue', () => {
    const item = makeItem({ id: 'item', status: 'done', dueDate: '2026-08-20' });

    const conflicts = detectConflicts([item], TODAY);

    expect(conflicts.some((c) => c.type === 'overdue')).toBe(false);
  });

  it('flags a schedule conflict when a due date precedes an unfinished dependency', () => {
    const dep = makeItem({ id: 'dep', title: 'Record Demo', status: 'planned', dueDate: '2026-09-05' });
    const item = makeItem({ id: 'item', title: 'Submit', dependencies: ['dep'], dueDate: '2026-09-04' });

    const conflicts = detectConflicts([dep, item], TODAY);

    expect(conflicts).toContainEqual(
      expect.objectContaining({ type: 'schedule_conflict', itemIds: ['item', 'dep'] })
    );
  });

  it('flags a locked item that blocks other unfinished items', () => {
    const locked = makeItem({ id: 'locked', title: 'Locked task', status: 'doing', locked: true });
    const dependent = makeItem({ id: 'dependent', dependencies: ['locked'] });

    const conflicts = detectConflicts([locked, dependent], TODAY);

    expect(conflicts).toContainEqual(expect.objectContaining({ type: 'locked_critical', itemIds: ['locked'] }));
  });

  it('does not flag a locked item that nothing depends on', () => {
    const locked = makeItem({ id: 'locked', status: 'doing', locked: true });

    const conflicts = detectConflicts([locked], TODAY);

    expect(conflicts.some((c) => c.type === 'locked_critical')).toBe(false);
  });

  it('flags a circular dependency without infinite looping', () => {
    const a = makeItem({ id: 'a', dependencies: ['b'] });
    const b = makeItem({ id: 'b', dependencies: ['a'] });

    const conflicts = detectConflicts([a, b], TODAY);

    expect(conflicts.some((c) => c.type === 'dependency_cycle')).toBe(true);
  });
});

describe('computePlanHealth', () => {
  it('scores a clean plan at 100', () => {
    const items = [makeItem({ id: 'a', status: 'done' }), makeItem({ id: 'b', status: 'planned' })];

    const health = computePlanHealth(items, TODAY);

    expect(health.score).toBe(100);
    expect(health.conflicts).toBe(0);
    expect(health.blocked).toBe(0);
    expect(health.overdue).toBe(0);
  });

  it('deducts points per §12 formula (conflict×15, blocked×8, overdue×10)', () => {
    const dep = makeItem({ id: 'dep', status: 'doing' });
    const blocked = makeItem({ id: 'blocked', dependencies: ['dep'] });
    const overdue = makeItem({ id: 'overdue', status: 'doing', dueDate: '2026-08-01' });

    const health = computePlanHealth([dep, blocked, overdue], TODAY);

    expect(health.blocked).toBe(1);
    expect(health.overdue).toBe(1);
    expect(health.score).toBe(100 - 1 * 8 - 1 * 10);
  });

  it('never drops below 0', () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      makeItem({ id: `overdue_${i}`, status: 'doing', dueDate: '2026-01-01' })
    );

    const health = computePlanHealth(items, TODAY);

    expect(health.score).toBe(0);
  });

  it('counts locked items as protected regardless of conflicts', () => {
    const locked = makeItem({ id: 'locked', status: 'done', locked: true });

    const health = computePlanHealth([locked], TODAY);

    expect(health.protected).toBe(1);
  });
});

describe('computeCriticalPath', () => {
  it('selects the longest dependency chain', () => {
    // define -> build -> polish -> record -> submit  (5 deep)
    const chain: PlanItem[] = [
      makeItem({ id: 'define', dependencies: [] }),
      makeItem({ id: 'build', dependencies: ['define'] }),
      makeItem({ id: 'polish', dependencies: ['build'] }),
      makeItem({ id: 'record', dependencies: ['polish'] }),
      makeItem({ id: 'submit', dependencies: ['record'] }),
      // an unrelated shorter chain
      makeItem({ id: 'shortA', dependencies: [] }),
      makeItem({ id: 'shortB', dependencies: ['shortA'] }),
    ];

    const critical = computeCriticalPath(chain);

    expect(critical).toEqual(new Set(['submit', 'record', 'polish', 'build', 'define']));
  });

  it('does not crash or hang on a circular dependency', () => {
    const a = makeItem({ id: 'a', dependencies: ['b'] });
    const b = makeItem({ id: 'b', dependencies: ['a'] });

    expect(() => computeCriticalPath([a, b])).not.toThrow();
  });
});
