import { useEffect, useRef } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function AgentActivity() {
  const activityLog = useWorkspaceStore((s) => s.activityLog);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activityLog.length]);

  if (activityLog.length === 0) {
    return (
      <div className="px-4 py-3 text-xs text-text-tertiary">
        <span className="font-medium">Agent Activity</span>
        <p className="mt-1">No agent activity yet. Agent actions via WebMCP tools will appear here.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <h3 className="text-xs font-semibold text-text-secondary mb-2">Agent Activity</h3>
      <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
        {activityLog.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-2 text-xs animate-slide-in"
          >
            <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
            <span className="text-text-secondary">
              <span className="font-medium text-agent">{entry.action}</span>
              {' '}
              {entry.detail}
            </span>
            <span className="text-text-tertiary ml-auto flex-shrink-0 text-[10px]">
              {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
