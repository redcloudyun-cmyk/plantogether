# WithGeX

**Plan together. Human and agent.**

Built for the OpenAI × Devpost WebMCP Challenge.

## What it is

WithGeX is a Human-Agent Collaboration Platform: a human works on a live planning workspace directly, and an AI agent reads and writes that **same live workspace** through [WebMCP](https://github.com/webmachinelearning/webmcp) (`document.modelContext`) — not a copy, not a chat transcript, the same board.

It isn't a chat assistant you copy-paste context into, and it isn't an agent that quietly edits a separate copy of your plan on a server somewhere. The human and the agent share one live board, and the human keeps final authority over what actually changes.

## Why WebMCP

WithGeX does not give an agent a separate copy of the plan.

WebMCP exposes the same live workspace the human is actively editing.

Human actions immediately become agent context,
and agent actions immediately become visible human workspace changes.

There's no export step, no sync delay, and no second source of truth. The board *is* the interface both the human and the agent act through.

## Live Demo

**[redcloudyun-cmyk.github.io/plantogether](https://redcloudyun-cmyk.github.io/plantogether/)**

Deployed automatically from `main` via GitHub Actions (`.github/workflows/deploy.yml`) to GitHub Pages.

## Human-Agent Collaboration

Four screens, one shared live state:

- **Dashboard** — today's Human vs. Agent activity, plan health, conflicts, and the critical path, computed live from the workspace (nothing hardcoded).
- **Workspace** — the Kanban board, plus Plan Analysis, Critical Path, and any pending Agent Proposal, with Live Human Context / Context Scope / AI Permissions in the side rail.
- **Activity** — the full Human + Agent session history, filterable and expandable per event.
- **Settings** — WebMCP connection status, the registered tools, and the agent's autonomy level.

Every card shows who last touched it — **Human** or **Agent** — and agent-authored changes get a brief highlight so they're never a silent surprise.

## Live Human Context

The **Live Human Context** panel always shows exactly what the human currently has selected — status, due date, owner, lock state — and updates the instant the selection changes.

When the agent calls `get_current_focus`, it gets that same card back. It isn't reading a snapshot of "the project" in the abstract; it's picking up the exact thing the human is looking at right now, with no extra explanation required.

## WebMCP Tools

Registered live via `document.modelContext.registerTool(...)` — no mocking:

| Tool | Type | Purpose |
|---|---|---|
| `get_workspace_state` | read | Full board state: every item, status, owner, due date, lock, dependencies, current selection |
| `get_current_focus` | read | The item the human currently has selected |
| `add_item` | write | Create a new planning item — always low-risk, applies immediately (unless the human has set the agent to Observe mode) |
| `update_item` | write | Edit an existing item. Blocked outright on locked items. Otherwise routed by risk (see below) |
| `analyze_plan` | read | Structured breakdown of the plan: status groups, locked/blocked items, schedule conflicts, and the critical path |

All write results follow a consistent shape (`{ success, reason?, message? }`) with a fixed set of reason codes: `TITLE_REQUIRED`, `ITEM_ID_REQUIRED`, `ITEM_NOT_FOUND`, `INVALID_STATUS`, `INVALID_DATE_FORMAT`, `ITEM_LOCKED_BY_HUMAN`, `DEPENDENCIES_INCOMPLETE`.

## Human Authority

### Lock beats everything

> Human establishes constraints. Agent works within them.

A human can lock any card from the board UI. Locking is a **human-only** action — there's no `lock_item` WebMCP tool, so the agent can never lock or unlock a card itself. A locked item rejects every agent write with `ITEM_LOCKED_BY_HUMAN`, regardless of autonomy level.

### Risk-based Agent Proposals

Not every agent edit applies immediately. Each `update_item` call is classified by risk (`src/lib/risk.ts`):

| Risk | Fields |
|---|---|
| Low | title, description, owner |
| Medium | due date, status |
| High | dependencies |

...and routed by the current **autonomy level** (Settings screen, default **Assist**):

| Autonomy | Low risk | Medium risk | High risk |
|---|---|---|---|
| Observe | blocked | blocked | blocked |
| Assist | auto-apply | → Proposal | → Proposal |
| Autonomous | auto-apply | auto-apply | → Proposal |

A change that isn't auto-applied becomes a **Proposal**: it shows up in the Workspace's Agent Proposal panel with a before/after diff and the agent's stated reason, and only takes effect once a human accepts it (in full or per-change, via "Review Individually").

### Dependency Blocking

An item can't be moved to Done while any of its dependencies are still incomplete — enforced in the store, not just the UI, so it applies equally to a human drag-and-drop and an agent's `update_item` call.

### Revert

Agent changes are immediately visible and independently reversible by the human.

Every time the agent edits a card, WithGeX snapshots what it looked like just before. An "↩ Revert" button appears on that card — visible and clickable only by the human — that restores the pre-edit state in one click. There's no agent-facing "undo" tool; reverting is exclusively a human action.

## Architecture

```
                         HUMAN
                           │
                 select / edit / drag / lock
                           │
                           ▼
                  LIVE WORKSPACE STORE
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
         CONTEXT        PLAN GRAPH      ACTIVITY
            │              │              │
            └──────────────┼──────────────┘
                           ▼
                document.modelContext
                           │
                           ▼
                          AGENT
                           │
               ┌───────────┼───────────┐
               ▼           ▼           ▼
             READ       ANALYZE       ACT
               │           │           │
               └───────────┼───────────┘
                           ▼
                    RISK CLASSIFIER
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
            SAFE                    IMPORTANT
              │                         │
          AUTO APPLY                  PROPOSAL
                                         │
                                  HUMAN APPROVAL
                                  │            │
                               APPLY        REJECT
                                  │
                                  ▼
                           LIVE WORKSPACE
                                  │
                             DIFF / REVERT
                                  │
                                  ▼
                           SESSION HISTORY
```

The UI and the WebMCP tools both read and write the same Zustand store (`src/store/workspaceStore.ts`) — there is no separate agent-facing data layer. State persists to `localStorage` so a refresh doesn't lose the board.

Stack: React 19 + TypeScript + Vite, Zustand (with `persist`), @dnd-kit for drag-and-drop, Tailwind CSS 4.

## Testing with WebMCP

WebMCP is currently available behind a Chrome experimental flag:

```
chrome://flags/#enable-webmcp-testing
```

With the flag on, open the app, then drive it from an MCP-capable agent/client pointed at the page's `document.modelContext`. Without the flag (or in an unsupported browser), the app still works fully as a normal Kanban board — Header/Settings show "WebMCP Unavailable" and the tools simply aren't registered, per the fallback in `src/webmcp/registerTools.ts`.

To exercise the tools without a real MCP client, inject a mock before the page loads (e.g. via Playwright's `addInitScript`) that implements `document.modelContext.registerTool`, capture the registered tools, and call their `execute(args)` functions directly — this is how the project's own end-to-end verification works.

## Local Development

```bash
npm install
npm run dev       # start the dev server
npm run build     # type-check + production build
npm run lint      # oxlint
npm test          # vitest (store + component tests)
```

## Challenge Demo Flow

A ~90–150 second walkthrough:

1. **Dashboard** — Plan Health, WebMCP connection status, today's Human vs. Agent activity.
2. **Human Focus** — select a card in Workspace; Live Human Context updates instantly.
3. **WebMCP Read** — the agent calls `get_current_focus` and `get_workspace_state`, visible immediately in Activity.
4. **Conflict** — the human edits a due date that creates a schedule conflict; Plan Health flags it.
5. **Agent Analysis** — the agent calls `analyze_plan`, then proposes fixes via `update_item`.
6. **Human Approval** — the human reviews and applies (or rejects) the proposal in the Workspace's Agent Proposal panel.
7. **Human Authority** — the human locks a card; a further agent edit is rejected with `ITEM_LOCKED_BY_HUMAN`.
8. **Revert** — the human clicks "↩ Revert" on one of the agent's changes.
9. **Activity** — the full session history proves the whole loop happened.

## License

[MIT](LICENSE)
