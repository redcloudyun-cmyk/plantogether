# PlanTogether

**Plan together. Human and agent.**

Built by [WithGex](https://github.com/redcloudyun-cmyk) for the OpenAI × Devpost WebMCP Challenge.

## What it is

PlanTogether is a Kanban planning board where a human works on the board directly, and an AI agent reads and writes the **same live workspace** through [WebMCP](https://github.com/webmachinelearning/webmcp) (`document.modelContext`).

It isn't a chat assistant that you copy-paste context into, and it isn't an agent that quietly edits a separate copy of your plan on a server somewhere. The human and the agent share one live board.

## Why WebMCP

PlanTogether does not give an agent a separate copy of the plan.

WebMCP exposes the same live workspace the human is actively editing.

Human actions immediately become agent context,
and agent actions immediately become visible human workspace changes.

There's no export step, no sync delay, and no second source of truth. The board *is* the interface both the human and the agent act through.

## Live Demo

**[redcloudyun-cmyk.github.io/plantogether](https://redcloudyun-cmyk.github.io/plantogether/)**

Deployed automatically from `main` via GitHub Actions (`.github/workflows/deploy.yml`) to GitHub Pages.

## Human-Agent Collaboration

Every card on the board shows who last touched it — **Human** or **Agent** — and agent-authored changes get a brief highlight animation so they're never a silent surprise. The two sides aren't equal by default, either: the human's intent stays authoritative (see [Human Control](#human-control)).

## Live Human Context

The sidebar's **Live Human Context** panel always shows exactly what the human currently has selected — status, due date, owner — and updates the instant the selection changes.

When the agent calls `get_current_focus`, it gets that same card back. It isn't reading a snapshot of "the project" in the abstract; it's picking up the exact thing the human is looking at right now, with no extra explanation required.

## WebMCP Tools

Registered live via `document.modelContext.registerTool(...)` — no mocking:

| Tool | Type | Purpose |
|---|---|---|
| `get_workspace_state` | read | Full board state: every item, status, owner, due date, lock, dependencies, current selection |
| `get_current_focus` | read | The item the human currently has selected |
| `add_item` | write | Create a new planning item |
| `update_item` | write | Edit an existing item (blocked on locked items — see below) |
| `analyze_plan` | read | Structured breakdown of the plan: grouped by status, locked items, dependency/blocked items — a starting point before calling `update_item` |

All write results follow a consistent shape (`{ success, reason?, message? }`) with a fixed set of reason codes: `TITLE_REQUIRED`, `ITEM_ID_REQUIRED`, `ITEM_NOT_FOUND`, `INVALID_STATUS`, `INVALID_DATE_FORMAT`, `ITEM_LOCKED_BY_HUMAN`, `DEPENDENCIES_INCOMPLETE`.

## Human Control

### Lock

> Human establishes constraints. Agent works within them.

A human can lock any card from the board UI. Locking is a **human-only** action — there is no `lock_item` WebMCP tool, so the agent can never lock or unlock a card itself. Once locked, every write path (`update_item`, and the board's own drag-and-drop) rejects agent edits with `ITEM_LOCKED_BY_HUMAN`.

### Dependency Blocking

An item can't be moved to Done while any of its dependencies are still incomplete — enforced in the store, not just the UI, so it applies equally to a human drag-and-drop and an agent's `update_item` call. Blocked cards show a "⛔ Blocked by N" badge.

### Revert

Agent changes are immediately visible and independently reversible by the human.

Every time the agent edits a card, PlanTogether snapshots what it looked like just before. An "↩ Revert" button appears on that card — visible and clickable only by the human — that restores the pre-edit state in one click. There's no agent-facing "undo" tool; reverting is exclusively a human action.

## Architecture

```
                    HUMAN
                      │
        select / drag / edit / lock
                      │
                      ▼
            LIVE WORKSPACE STATE  (Zustand store)
                      │
            document.modelContext
                      │
                      ▼
                    AGENT
                      │
        ┌─────────────┼──────────────┐
        ▼             ▼              ▼
     READ          CREATE          UPDATE
     context        work            plan
        │             │              │
        └─────────────┼──────────────┘
                      ▼
              SAME LIVE BOARD
                      │
         Human sees changes instantly
                      │
               ┌───────┴───────┐
               ▼               ▼
             LOCK            REVERT
               │               │
               └────── HUMAN ──┘
```

The UI and the WebMCP tools both read and write the same Zustand store (`src/store/workspaceStore.ts`) — there is no separate agent-facing data layer. State persists to `localStorage` so a refresh doesn't lose the board.

Stack: React 19 + TypeScript + Vite, Zustand (with `persist`), @dnd-kit for drag-and-drop, Tailwind CSS 4.

## Testing with WebMCP

WebMCP is currently available behind a Chrome experimental flag:

```
chrome://flags/#enable-webmcp-testing
```

With the flag on, open the app, then drive it from an MCP-capable agent/client pointed at the page's `document.modelContext`. Without the flag (or in an unsupported browser), the app still works fully as a normal Kanban board — the header shows "WebMCP Unavailable" and the tools simply aren't registered, per the fallback in `src/webmcp/registerTools.ts`.

## Local Development

```bash
npm install
npm run dev       # start the dev server
npm run build     # type-check + production build
npm run lint      # oxlint
npm test          # vitest (store + component tests)
```

## Challenge Demo Flow

A ~90 second walkthrough of the concept:

1. **Live Human Context** — select "Record demo" on the board; the sidebar updates instantly. Ask the agent to continue planning from what's selected; it calls `get_current_focus` and `get_workspace_state`.
2. **Agent creates work** — the agent calls `add_item`; the new card appears on the board immediately, and shows up in WebMCP Live Activity.
3. **Human override** — the human changes a card's due date and locks another card.
4. **Agent reconciles** — asked to rebalance the plan, the agent calls `analyze_plan` then `update_item` for each change. The locked card's update is rejected with `ITEM_LOCKED_BY_HUMAN`.
5. **Human reverts** — the human clicks "↩ Revert" on one of the agent's changes; it's undone instantly.

## License

[MIT](LICENSE)
