import { useEffect, useRef } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { getActivityIcon } from '../lib/activityIcon';

interface WebMcpActivityProps {
  onViewAll?: () => void;
}

export default function WebMcpActivity({ onViewAll }: WebMcpActivityProps) {
  const activityLog = useWorkspaceStore((s) => s.activityLog);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activityLog.length]);

  return (
    <div className="px-4 py-3 flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between flex-shrink-0 mb-2">
        <h3 className="text-xs font-semibold text-text-secondary tracking-wide">
          WEBMCP LIVE ACTIVITY
        </h3>
        {onViewAll && activityLog.length > 0 && (
          <button
            onClick={onViewAll}
            className="text-[10px] font-medium text-primary-600 hover:text-primary-700"
          >
            View All →
          </button>
        )}
      </div>

      {activityLog.length === 0 ? (
        <p className="text-xs text-text-tertiary">
          No activity yet. Agent actions via WebMCP tools will appear here.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5 overflow-y-auto min-h-0">
          {activityLog.map((entry) => {
            const { icon, className } = getActivityIcon(entry);
            const lines = entry.detail.split('\n');
            return (
              <div key={entry.id} className="flex items-start gap-2 text-xs animate-slide-in">
                <span className={`mt-0.5 flex-shrink-0 ${className}`}>{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium text-text-primary">{entry.toolName || entry.action}</span>
                    <span className="text-text-tertiary flex-shrink-0 text-[10px]">
                      {new Date(entry.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                  {lines.map((line, i) => (
                    <p key={i} className="text-text-secondary truncate">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      )}
    </div>
  );
}
