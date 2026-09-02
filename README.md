# WithGeX

**One workspace. Human and agent. Working together.**

WithGeX is a human-agent collaborative planning workspace built for the **OpenAI × Devpost WebMCP Challenge**.

Instead of moving work into a separate AI chat, WithGeX lets the human and the agent operate on the **same live planning workspace** through WebMCP (`document.modelContext`).

The human establishes constraints.  
The agent works within them.  
The human keeps final authority.

---

## Live Demo

- **Live App:** https://withgex-test.agex.site/
- **Demo Video:** https://youtu.be/L2PN-DdYttQ
- **GitHub Pages Mirror:** https://redcloudyun-cmyk.github.io/plantogether/

> For WebMCP testing in Chrome, enable:
>
> `chrome://flags/#enable-webmcp-testing`

---

## What WithGeX Demonstrates

WithGeX is designed around one simple idea:

> **Human focus becomes agent context — without copy/paste, exports, or a second source of truth.**

The human works directly in the planning board.  
The agent reads and acts on that same live state through WebMCP.

### Core workflow

1. A human selects or edits a planning item.
2. The selected task immediately becomes live agent context.
3. The agent reads the workspace through WebMCP.
4. The agent analyzes blockers, dependencies, schedule risk, and critical path.
5. Safe changes can apply immediately depending on autonomy mode.
6. Meaningful changes become proposals.
7. The human accepts or rejects those proposals.
8. Locked work cannot be changed by the agent.
9. Actions and decisions remain visible in Activity history.

---

## WebMCP Tools

WithGeX registers five live tools via `document.modelContext.registerTool(...)`.

| Tool | Type | Purpose |
|---|---|---|
| `get_workspace_state` | Read | Returns the live planning workspace, including items, status, due dates, owners, locks, dependencies, and current selection |
| `get_current_focus` | Read | Returns the item currently selected by the human |
| `add_item` | Write | Adds a planning item directly to the live board |
| `update_item` | Write | Updates an existing item, subject to lock, risk, and autonomy rules |
| `analyze_plan` | Read | Returns structured plan analysis including blockers, risks, and critical path |

These are real WebMCP tools registered against the live page state — not mocked UI controls.

---

## Human Authority

WithGeX is intentionally not “agent has full control.”

### Autonomy modes

| Mode | Low-risk changes | Medium-risk changes | High-risk changes |
|---|---|---|---|
| **Observe** | Blocked | Blocked | Blocked |
| **Assist** | Auto-apply | Proposal | Proposal |
| **Autonomous** | Auto-apply | Auto-apply | Proposal |

### Risk classification

| Risk | Examples |
|---|---|
| **Low** | title, description, owner |
| **Medium** | due date, status, priority |
| **High** | dependencies |

### Human lock protection

A human can lock a planning item.

A locked item rejects agent writes with:

`ITEM_LOCKED_BY_HUMAN`

There is no WebMCP tool that lets the agent lock or unlock a card. Human constraints take priority over autonomy mode.

---

## Agent Proposals

In Assist mode, medium- and high-risk edits become proposals instead of silent changes.

The Proposal panel shows:

- current value
- proposed value
- risk level
- agent reason
- plan impact
- human accept / reject controls

This makes the approval boundary visible in the same workspace where the work is happening.

> **The agent proposes. The human decides.**

---

## Shared Context

The right-side Agent Context reflects the human's current focus.

When a card is selected, the agent context can include:

- task title
- status
- due date
- owner
- priority
- dependencies

When nothing is selected, the UI explicitly shows that no card is selected.

The WebMCP tool `get_current_focus` returns that same live focus.

---

## Activity & Audit Trail

WithGeX records Human + Agent activity in a shared timeline.

Examples include:

- workspace reads
- current-focus reads
- plan analysis
- proposal creation
- human approval or rejection
- blocked writes against locked items

Seeded demonstration history is explicitly marked as **DEMO** so it is not confused with actual WebMCP runtime activity.

---

## Architecture

```text
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
```

The UI and WebMCP tools use the same Zustand workspace store. There is no separate agent-side copy of the board.

---

## Screens

### Dashboard
- Agent Mission
- Plan Health
- Human vs. Agent activity
- detected issues
- critical path
- WebMCP connection status

### Workspace
- Kanban planning board
- live Agent Context
- Context Scope controls
- AI Permissions
- plan analysis
- critical path
- Agent Proposal panel

### Activity
- Human + Agent history
- proposal and rejection events
- real WebMCP runtime events
- DEMO seed labeling

### Settings
- WebMCP connection status
- registered tools
- autonomy mode
- context controls

---

## Demo Flow

The final demo video shows this sequence:

1. Human-Agent shared workspace
2. Human focus becoming Agent Context
3. Real WebMCP connection and five registered tools
4. Plan analysis and critical path
5. WebMCP-generated proposal
6. Human rejection of the proposal
7. Human lock blocking an agent write
8. Shared Activity audit trail
9. WithGeX architecture and closing message

**Demo Video:** https://youtu.be/L2PN-DdYttQ

---

## Tech Stack

- React 19
- TypeScript
- Vite
- Zustand with persistence
- `@dnd-kit`
- Tailwind CSS 4
- WebMCP via `document.modelContext`

State persists to `localStorage` so the workspace survives refreshes.

---

## Local Development

```bash
npm install
npm run dev
npm run build
npm run lint
npm test
```

---

## WebMCP Testing

In a compatible Chrome build:

```text
chrome://flags/#enable-webmcp-testing
```

Enable WebMCP testing, reload Chrome, then open the WithGeX live app.

With WebMCP available, the app registers all five tools and displays **WebMCP Connected**.

Without WebMCP, WithGeX still works as a normal planning workspace; the UI shows WebMCP as unavailable and does not register the tools.

---

## Challenge Positioning

WithGeX is not a chat assistant layered beside a task board.

It is a **shared operating surface** where:

- the human works directly,
- the agent receives the same live context,
- WebMCP exposes the page as structured tools,
- risky actions remain under human control,
- and every action remains visible.

**One workspace. Human and agent. Working together.**

---

## License

[MIT](LICENSE)
