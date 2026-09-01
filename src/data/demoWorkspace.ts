import type { ActivityLogEntry, PlanItem, Workspace } from '../types/workspace';

const now = new Date().toISOString();

/**
 * A pre-seeded slice of Activity history so a first-time visitor (or a
 * fresh Reset Demo) sees Human/Agent collaboration already in progress
 * instead of an empty Activity screen. Same ActivityLogEntry shape as
 * real runtime entries — timestamps are relative to "now" so they always
 * read as "recent" no matter when the page loads.
 */
export function createDemoActivityLog(): ActivityLogEntry[] {
  const base = Date.now();
  const minutesAgo = (m: number) => new Date(base - m * 60_000).toISOString();

  return [
    {
      id: 'seed_1', timestamp: minutesAgo(30), source: 'human', action: 'Selected',
      detail: '"Run Chrome WebMCP Judge Test"', status: 'success', seeded: true,
    },
    {
      id: 'seed_2', timestamp: minutesAgo(27), source: 'webmcp', toolName: 'get_workspace_state', action: 'get_workspace_state',
      detail: '8 live items read', status: 'success', seeded: true,
    },
    {
      id: 'seed_3', timestamp: minutesAgo(26), source: 'webmcp', toolName: 'analyze_plan', action: 'analyze_plan',
      detail: '8 items, 1 locked', status: 'success', seeded: true,
    },
    {
      id: 'seed_4', timestamp: minutesAgo(24), source: 'webmcp', toolName: 'update_item', action: 'Proposed',
      detail: '"Record Final Demo Video" — MEDIUM risk change pending approval', status: 'success', seeded: true,
    },
    {
      id: 'seed_5', timestamp: minutesAgo(21), source: 'human', action: 'Rejected',
      detail: '"Record Final Demo Video" — proposal rejected by human', status: 'success', seeded: true,
    },
    {
      id: 'seed_6', timestamp: minutesAgo(18), source: 'human', action: 'Locked',
      detail: '"Submit Final Devpost Entry"', status: 'success', seeded: true,
    },
  ];
}

const demoItems: PlanItem[] = [
  {
    id: 'item_submission_strategy',
    title: 'Finalize Submission Strategy',
    description:
      'Lock the final WithGeX positioning, judging strategy, and Human-Agent Shared Workspace narrative for the WebMCP Challenge.',
    status: 'done',
    priority: 'high',
    owner: 'Emily Johnson',
    dueDate: '2026-09-01',
    locked: false,
    dependencies: [],
    createdBy: 'human',
    updatedBy: 'human',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'item_final_ui',
    title: 'Match UI to Final Mockups',
    description:
      'Rebuild the Dashboard and Workspace visuals to match the approved WithGeX mockups, including the official logo and polished Human/Agent states.',
    status: 'done',
    priority: 'high',
    owner: 'Emily Johnson',
    dueDate: '2026-09-01',
    locked: false,
    dependencies: ['item_submission_strategy'],
    createdBy: 'human',
    updatedBy: 'human',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'item_i18n_context_scope',
    title: 'Complete i18n & Context Scope',
    description:
      'Finish English/Korean i18n coverage and connect Context Scope controls to actual WebMCP tool output.',
    status: 'done',
    priority: 'high',
    owner: 'Emily Johnson',
    dueDate: '2026-09-01',
    locked: false,
    dependencies: ['item_final_ui'],
    createdBy: 'human',
    updatedBy: 'human',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'item_latest_deploy',
    title: 'Deploy Latest Build',
    description:
      'Deploy the latest WithGeX build to withgex-test.agex.site and verify that Agent Mission, Context Scope, i18n, and the final sidebar logo are live.',
    status: 'done',
    priority: 'high',
    owner: 'Emily Johnson',
    dueDate: '2026-09-01',
    locked: false,
    dependencies: ['item_i18n_context_scope'],
    createdBy: 'human',
    updatedBy: 'human',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'item_chrome_webmcp_judge_test',
    title: 'Run Chrome WebMCP Judge Test',
    description:
      'Verify document.modelContext and all five WebMCP tools in a real Chrome environment with WebMCP testing enabled.',
    status: 'doing',
    priority: 'high',
    owner: 'Emily Johnson',
    dueDate: '2026-09-02',
    locked: false,
    dependencies: ['item_latest_deploy'],
    createdBy: 'human',
    updatedBy: 'human',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'item_record_final_demo',
    title: 'Record Final Demo Video',
    description:
      'Record the final two-minute demo showing shared context, Agent Mission, plan analysis, proposal review, human approval, lock protection, and Activity history.',
    status: 'planned',
    priority: 'high',
    owner: 'Emily Johnson',
    dueDate: '2026-09-02',
    locked: false,
    dependencies: ['item_chrome_webmcp_judge_test'],
    createdBy: 'human',
    updatedBy: 'human',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'item_final_submission_qa',
    title: 'Final Submission QA',
    description:
      'Run the complete submission checklist: live URL, reset demo, README, screenshots, video link, repository visibility, license, and final regression pass.',
    status: 'planned',
    priority: 'high',
    owner: 'Emily Johnson',
    dueDate: '2026-09-03',
    locked: false,
    dependencies: ['item_record_final_demo'],
    createdBy: 'human',
    updatedBy: 'human',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'item_submit_devpost',
    title: 'Submit Final Devpost Entry',
    description:
      'Submit the final WithGeX entry to the WebMCP Challenge after the judge test, demo video, and final QA are complete.',
    status: 'backlog',
    priority: 'high',
    owner: 'Emily Johnson',
    dueDate: '2026-09-03',
    locked: true,
    dependencies: ['item_final_submission_qa'],
    createdBy: 'human',
    updatedBy: 'human',
    createdAt: now,
    updatedAt: now,
  },
];

export const demoWorkspace: Workspace = {
  id: 'workspace_1',
  title: 'WithGeX — WebMCP Challenge Final Submission',
  items: demoItems,
  selectedItemId: 'item_chrome_webmcp_judge_test',
  updatedAt: now,
};
