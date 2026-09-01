import { useMemo, useState } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { computePlanHealth, detectConflicts } from '../../lib/planAnalysis';

const HEALTH_COLOR = (score: number) => (score >= 80 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626');
const HEALTH_LABEL = (score: number) => (score >= 80 ? 'Good' : score >= 50 ? 'Fair' : 'Poor');

const CONFLICT_ICON: Record<string, string> = {
  schedule_conflict: '⚠',
  blocked_dependency: '⛔',
  overdue: '⏰',
  locked_critical: '🔒',
  dependency_cycle: '⚠',
};

function Gauge({ score }: { score: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color = HEALTH_COLOR(score);

  return (
    <div className="relative w-28 h-28 flex-shrink-0">
      <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-text-primary">{score}</span>
        <span className="text-[10px] text-text-tertiary">/ 100</span>
      </div>
    </div>
  );
}

export default function PlanAnalysisCard() {
  const items = useWorkspaceStore((s) => s.items);
  const [showDetails, setShowDetails] = useState(false);

  const health = useMemo(() => computePlanHealth(items), [items]);
  const conflicts = useMemo(() => detectConflicts(items), [items]);

  return (
    <div className="bg-surface rounded-xl border border-border p-4 flex-1 min-w-0">
      <h2 className="text-xs font-semibold text-text-secondary tracking-wide mb-3">PLAN ANALYSIS</h2>

      <div className="flex items-start gap-5">
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <Gauge score={health.score} />
          <span className="text-xs font-medium" style={{ color: HEALTH_COLOR(health.score) }}>
            {HEALTH_LABEL(health.score)}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-text-tertiary uppercase tracking-wide mb-2">Detected Issues</p>
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span>⚠</span>
              <span className="text-text-primary">{health.conflicts} Conflict{health.conflicts === 1 ? '' : 's'} Detected</span>
            </div>
            <div className="flex items-center gap-2">
              <span>⏰</span>
              <span className="text-text-primary">{health.overdue} Overdue Task{health.overdue === 1 ? '' : 's'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>⛔</span>
              <span className="text-text-primary">{health.blocked} Blocked Item{health.blocked === 1 ? '' : 's'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔒</span>
              <span className="text-text-primary">{health.protected} Protected Item{health.protected === 1 ? '' : 's'}</span>
            </div>
          </div>

          <button
            onClick={() => setShowDetails((v) => !v)}
            className="mt-3 text-xs font-medium text-primary-600 hover:text-primary-700 border border-primary-200 hover:bg-primary-50 rounded-lg px-3 py-1.5 transition-colors"
          >
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
          {conflicts.length === 0 ? (
            <p className="text-xs text-text-tertiary">No conflicts detected — the plan is clean.</p>
          ) : (
            conflicts.map((c) => (
              <div key={c.id} className="flex items-start gap-2 text-xs border-l-2 border-amber-300 pl-3 py-0.5">
                <span className="flex-shrink-0">{CONFLICT_ICON[c.type] ?? '⚠'}</span>
                <div>
                  <span className="font-medium text-text-primary">{c.title}</span>
                  <p className="text-text-secondary mt-0.5">{c.detail}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
