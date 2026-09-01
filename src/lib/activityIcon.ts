import type { ActivityLogEntry } from '../types/workspace';

const READ_TOOLS = new Set(['get_workspace_state', 'get_current_focus', 'analyze_plan']);

export function getActivityIcon(entry: ActivityLogEntry): { icon: string; className: string } {
  if (entry.status === 'blocked' || entry.status === 'error') {
    return { icon: '✗', className: 'text-red-500' };
  }
  if (entry.source === 'webmcp') {
    const isRead = entry.toolName ? READ_TOOLS.has(entry.toolName) : false;
    return { icon: isRead ? '→' : '✦', className: 'text-agent' };
  }
  return { icon: '✓', className: 'text-green-500' };
}
