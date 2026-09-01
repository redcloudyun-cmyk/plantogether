import { useEffect, useRef } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import type { ActivityLogEntry } from '../types/workspace';

const READ_TOOLS = new Set(['get_workspace_state', 'get_current_focus', 'analyze_plan']);

function getIcon(entry: ActivityLogEntry): { icon: string; className: string } {
  if (entry.status === 'blocked' || entry.status === 'error') {
    return { icon: '✗', className: 'text-red-500' };
  }
  if (entry.source === 'webmcp') {
    const isRead = entry.toolName ? READ_TOOLS.has(entry.toolName) : false;
    return { icon: isRead ? '→' : '✦', className: 'text-agent' };
  }
  return { icon: '✓', className: 'text-green-500' };
}

export default function WebMcpActivity() {
  const activityLog = useWorkspaceStore((s) => s.activityLog);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activityLog.length]);

  return (
    <div className="px-4 py-3 flex flex-col h-full min-h-0">
      <h3 className="text-xs font-semibold text-text-secondary tracking-wide mb-2 flex-shrink-0">
        WEBMCP LIVE ACTIVITY
      </h3>

      {activityLog.length === 0 ? (
        <p className="text-xs text-text-tertiary">
          No activity yet. Agent actions via WebMCP tools will appear here.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5 overflow-y-auto min-h-0">
          {activityLog.map((entry) => {
            const { icon, className } = getIcon(entry);
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
