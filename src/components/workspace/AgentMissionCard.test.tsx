import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import AgentMissionCard from './AgentMissionCard';
import { useWorkspaceStore } from '../../store/workspaceStore';

beforeEach(() => {
  useWorkspaceStore.setState({ items: [], proposals: [], activityLog: [], selectedItemId: null });
});

describe('AgentMissionCard', () => {
  it('shows mission progress from real tool activity', () => {
    useWorkspaceStore.getState().addActivityLog({ source: 'webmcp', toolName: 'analyze_plan', action: 'analyze_plan', detail: '0 items', status: 'success' });
    render(<AgentMissionCard />);
    expect(screen.getByText('ANALYSIS COMPLETE')).toBeInTheDocument();
    expect(screen.getByText('Workspace context read')).toBeInTheDocument();
    expect(screen.getByText('Critical path calculated')).toBeInTheDocument();
  });
});
