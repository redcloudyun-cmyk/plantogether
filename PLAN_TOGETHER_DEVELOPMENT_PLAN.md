# PlanTogether — WebMCP Challenge 개발 실행 계획

> **진행 상황 (2026-09-01)**: P0 중 main branch 정리 / LICENSE / README 완료. P1(Live Human Context, Reset Demo + Demo Dataset, WebMCP Live Activity Trace), P1 Refactor(lock_item 제거, analyze_plan 개명), P2(moveItem lock 일관성, validation 통일, activity log UUID) 전부 완료. 남은 것은 **Live Deployment(P0-4)**와 **P3**(UI polish, Demo video, Devpost 제출 — 후자 둘은 사람이 직접 진행). 자세한 내용은 섹션 18의 체크리스트 참고.

**Version:** 1.1
**Target:** OpenAI × Devpost WebMCP Challenge
**Repository:** `redcloudyun-cmyk/plantogether`
**Primary Branch:** `main`
**Development Priority:** 완성 가능성이 높은 작은 MVP
**Core Concept:** Live Human-Agent Collaborative Workspace
**Brand:** WithGex (`logo/withgex logo.png`)

---

## 0. 현재 개발 상태

PlanTogether는 기본 MVP 구현이 완료된 상태입니다.

이미 구현된 핵심 기능:

- React + TypeScript + Vite
- Zustand 기반 단일 Workspace State
- 4-Column Kanban Board
- 카드 생성 / 수정
- Drag & Drop
- 카드 선택 / Current Focus
- Human / Agent actor 구분
- Human Lock
- Dependency Blocking
- Agent 변경 Highlight
- Agent 변경분 개별 Revert
- Agent Activity Log
- WebMCP `document.modelContext.registerTool(...)`
- WebMCP 기반 workspace read/write
- localStorage persistence
- WebMCP 미지원 브라우저 fallback

현재 단계부터는 대규모 신규 기능을 추가하지 않습니다.

목표는 다음 3가지입니다.

> **1. WebMCP가 왜 필요한지 명확하게 보이게 한다.**
> **2. Human-Agent 협업의 차별점을 첫 화면과 데모에서 바로 이해하게 한다.**
> **3. 제출 필수요건과 데모 완성도를 완성한다.**

---

# 1. 프로젝트 목표

PlanTogether는 사람이 웹 화면에서 직접 작업하고, AI Agent가 **동일한 작업 상태를 WebMCP Tool을 통해 읽고 쓰며 화면을 공유 작업하는 협업 Planning Board**입니다.

일반 AI 챗봇처럼 사용자가 정보를 복사해서 AI에게 전달하거나, AI가 별도 서버 데이터만 조회하는 방식이 아닙니다.

핵심:

> **Human and Agent work on the same live workspace.**

사람이 직접 수정한 작업 화면 상태를 Agent가 즉시 이해하고, Agent가 작업한 결과는 같은 화면에 즉시 반영됩니다.

---

# 2. 핵심 메시지

PlanTogether의 메시지는 단순한 "AI Kanban"이 아닙니다.

핵심 메시지:

> **The human and agent continuously adapt the same live plan — while human intent remains authoritative.**

또는:

> **Not human or agent. Human with agent.**

서비스 Tagline:

> **Plan together. Human and agent.**

---

# 3. 이번 버전의 우선 개발 목표

추가 개발은 원칙적으로 **3개 기능만 필수**로 한다.

## MUST-01 — Live Human Context / Handoff

현재 `get_current_focus` 기능을 UI와 Agent Activity에서 더 명확하게 보여준다.

사람이 지금 선택한 카드를 Agent가 별도 설명 없이 그대로 이어받을 수 있어야 한다.

UI 예시:

```text
┌────────────────────────────────────┐
│ LIVE HUMAN CONTEXT                 │
│                                    │
│ Selected                           │
│ Design landing page                │
│                                    │
│ Status       Planned               │
│ Due          Sep 5                 │
│ Owner        Mina                  │
│                                    │
│ ✓ Shared with Agent                │
└────────────────────────────────────┘
```

사용자가 다른 카드를 선택하면 즉시 변경된다.

Agent가 `get_current_focus`를 호출하면 Activity에는 다음과 같이 표시한다.

```text
→ get_current_focus
  Design landing page
```

### 목적

이 기능은 PlanTogether의 핵심 차별점을 보여준다.

> Agent가 단순히 프로젝트 데이터를 읽는 것이 아니라,
> **사람이 지금 작업 중인 live context를 그대로 이어받는다.**

---

## MUST-02 — Demo Reset + Strong Demo Dataset

현재 Store의 `resetWorkspace()`를 실제 UI에서 사용할 수 있게 한다.

Header에:

```text
Reset Demo
```

버튼을 추가한다.

동작:

```text
Reset demo workspace?

[Cancel] [Reset]
```

Reset 시:

- Demo Workspace 초기화
- Activity Log 초기화
- Selected Item 초기화
- Agent Highlight 제거
- localStorage는 동일한 초기 상태로 갱신

### Demo Dataset 변경

기존 Demo Dataset은 lock과 dependency가 첫 화면에서 보이지 않는다.

초기 상태를 다음처럼 바꾼다.

```text
BACKLOG
────────────────
Submit to Devpost
⛔ Blocked by 1


PLANNED
────────────────
Build WebMCP tools 🔒
Sep 2

Record demo
Sep 3
⛔ Blocked by 1


DOING
────────────────
Polish board UI
Sep 2


DONE
────────────────
Define MVP
```

Dependencies:

```text
Record demo
  → depends on
Build WebMCP tools

Submit to Devpost
  → depends on
Record demo
```

Locked:

```text
Build WebMCP tools
locked: true
```

### 목적

사이트 첫 진입만으로 다음이 보여야 한다.

- Human Lock
- Dependency
- Blocked State
- Live Workspace
- Human Intent

---

## MUST-03 — WebMCP Live Activity Trace

기존 `Agent Activity`를 데모용으로 강화한다.

패널 이름:

```text
WebMCP Live Activity
```

Tool 이름을 실제로 노출한다.

예:

```text
WEBMCP LIVE ACTIVITY

12:41:03
→ get_current_focus
  Design landing page

12:41:04
→ get_workspace_state
  5 live items read

12:41:06
✦ add_item
  Record demo

12:41:07
✦ update_item
  QA → Sep 3

12:41:09
✗ update_item
  Build WebMCP tools
  ITEM_LOCKED_BY_HUMAN
```

Activity Entry 데이터 모델은 다음 형태를 권장한다.

```typescript
interface ActivityLogEntry {
  id: string;
  timestamp: string;
  source: 'webmcp' | 'human' | 'system';
  toolName?: string;
  action: string;
  detail: string;
  status?: 'success' | 'blocked' | 'error';
}
```

### 목적

심사위원이 영상만 보고도:

> "이 앱은 실제 WebMCP Tool을 호출하고 있다."

는 사실을 이해하도록 한다.

---

# 4. WebMCP Tool 재정리

기존 6개 Tool을 무조건 유지할 필요는 없다.

추천 최종 Tool:

```text
get_workspace_state
get_current_focus
add_item
update_item
analyze_plan
```

---

## 4.1 `lock_item` 제거 권장

현재 Human Lock은 UI에서 사람이 직접 설정할 수 있다.

Agent가 스스로 `lock_item`을 호출하는 구조는 핵심 메시지를 약하게 만든다.

PlanTogether의 Lock 철학:

```text
Human establishes constraints.
Agent works within them.
```

따라서:

### Human

```text
🔒 Lock
```

### Agent

```text
update_item
```

Agent가 Locked Item을 수정하면:

```json
{
  "success": false,
  "reason": "ITEM_LOCKED_BY_HUMAN"
}
```

이 구조를 유지한다.

---

## 4.2 `rebalance_plan` → `analyze_plan` 변경 권장

현재 `rebalance_plan`은 실제 mutation이 아니라 read-only analysis Tool이다.

따라서 Tool 이름을:

```text
rebalance_plan
```

에서:

```text
analyze_plan
```

으로 변경하는 것이 정확하다.

Agent Flow:

```text
analyze_plan
      ↓
update_item
      ↓
update_item
      ↓
update_item
```

이 방식은 WebMCP Tool orchestration을 더 명확하게 보여준다.

---

# 5. WebMCP 핵심 구조

```text
                    HUMAN
                      │
        select / drag / edit / lock
                      │
                      ▼
            LIVE WORKSPACE STATE
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

---

# 6. 핵심 WebMCP Tools

## Tool 1 — `get_workspace_state`

전체 live workspace를 읽는다.

반환:

```json
{
  "workspaceTitle": "Launch PlanTogether",
  "items": [],
  "selectedItemId": "item_3"
}
```

용도:

- 전체 계획 파악
- Dependency 분석
- 변경 전 최신 상태 확인

---

## Tool 2 — `get_current_focus`

현재 Human이 선택한 Item을 반환한다.

```json
{
  "id": "task_01",
  "title": "Design landing page",
  "status": "planned",
  "dueDate": "2026-09-05",
  "owner": "Mina"
}
```

이 Tool은 PlanTogether의 핵심 WebMCP 차별점이다.

---

## Tool 3 — `add_item`

Agent가 Planning Item을 추가한다.

```json
{
  "title": "Record demo",
  "status": "planned",
  "dueDate": "2026-09-03"
}
```

---

## Tool 4 — `update_item`

Agent가 기존 Item을 수정한다.

```json
{
  "itemId": "task_03",
  "dueDate": "2026-09-04"
}
```

Locked Item은 수정 불가.

---

## Tool 5 — `analyze_plan`

현재 Workspace를 read-only로 분석한다.

반환 정보:

- 전체 Item
- Status별 Item
- Locked Items
- Dependencies
- Blocked Items
- Modifiable Items
- 사용자 Constraints

Agent는 결과를 보고 `update_item`을 개별 호출한다.

---

# 7. WebMCP 구현 원칙

반드시 실제 API를 사용한다.

```typescript
document.modelContext.registerTool(...)
```

Mock WebMCP 금지.

Tool registration 실패 시 앱 자체는 정상 동작해야 한다.

```typescript
if (!document.modelContext) {
  showWebMcpUnsupported();
}
```

Tool 호출 때문에 Page Refresh가 발생하면 안 된다.

UI와 WebMCP는 반드시 동일한 Zustand Store를 사용한다.

---

# 8. State Safety

현재 설계 중 반드시 유지할 기능:

## Human Lock

Agent는 Locked Item을 수정할 수 없다.

```typescript
if (item.locked && actor === 'agent') {
  return {
    success: false,
    reason: 'ITEM_LOCKED_BY_HUMAN'
  };
}
```

---

## Dependency Blocking

미완료 Dependency가 있는 Item을 Done으로 변경하지 못한다.

```text
⛔ Blocked by 2
```

---

## Agent Revert

Agent가 Item을 변경하면 이전 상태를 snapshot으로 보관한다.

Human UI에서:

```text
↩ Revert
```

가능해야 한다.

원칙:

> Agent changes are immediately visible and independently reversible by the human.

이 문구는 README의 제출 설명에 포함한다.

---

# 9. Store Consistency 개선

## `moveItem` Lock Check 추가

현재 Agent가 직접 `moveItem`을 호출하지 않더라도 Store API 일관성을 위해 다음 검사를 추가한다.

```typescript
if (item.locked && actor === 'agent') {
  return {
    success: false,
    reason: 'ITEM_LOCKED_BY_HUMAN'
  };
}
```

---

## Activity Log ID 개선

기존:

```typescript
id: `log_${Date.now()}`
```

보다:

```typescript
id: crypto.randomUUID()
```

권장.

동일 millisecond Tool Call의 key 충돌을 예방한다.

---

# 10. Input Validation 정리

`add_item`과 `update_item` validation 결과를 통일한다.

공통 Error Shape:

```json
{
  "success": false,
  "reason": "INVALID_STATUS",
  "message": "Status must be one of: backlog, planned, doing, done"
}
```

처리 대상:

```text
TITLE_REQUIRED
ITEM_ID_REQUIRED
ITEM_NOT_FOUND
INVALID_STATUS
INVALID_DATE_FORMAT
ITEM_LOCKED_BY_HUMAN
DEPENDENCIES_INCOMPLETE
```

---

# 11. UI 구성

권장 화면:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ PlanTogether               Human + Agent              Reset Demo     │
│ Plan together. Human and agent.                                      │
├─────────────────────────────────────────────┬────────────────────────┤
│                                              │ LIVE HUMAN CONTEXT     │
│ Backlog | Planned | Doing | Done            │                        │
│                                              │ Selected:              │
│ [cards]                                     │ Design landing page    │
│                                              │ Due: Sep 5             │
│                                              │ Owner: Mina            │
│                                              │ ✓ Shared with Agent    │
│                                              ├────────────────────────┤
│                                              │ WEBMCP LIVE ACTIVITY   │
│                                              │ → get_current_focus    │
│                                              │ ✦ add_item             │
│                                              │ ✗ update_item          │
├─────────────────────────────────────────────┴────────────────────────┤
│ WebMCP status | items | done                                         │
└────────────────────────────────────────────────────────────────────┘
```

---

# 12. Demo Script

전체 데모는 **약 90초**를 목표로 한다.

## Scene 1 — Live Human Context

Human이:

```text
Record demo
```

카드를 선택한다.

Live Human Context가 즉시 변경된다.

Agent 요청:

```text
Continue planning from what I'm working on.
```

Agent:

```text
get_current_focus
get_workspace_state
```

---

## Scene 2 — Agent Creates Work

Agent:

```text
add_item
```

으로 필요한 Item 추가.

Board에 즉시 표시.

Activity:

```text
✦ add_item
```

---

## Scene 3 — Human Override

Human이 카드 Due Date 변경.

다른 카드 하나를 Lock.

---

## Scene 4 — Agent Reconcile

사용자:

```text
Rebalance the rest of the plan around my changes.
```

Agent:

```text
analyze_plan
update_item
update_item
```

Locked Item 수정 시도는 차단.

```text
✗ ITEM_LOCKED_BY_HUMAN
```

---

## Scene 5 — Human Revert

Agent가 변경한 카드 중 하나에서:

```text
↩ Revert
```

클릭.

Human이 Agent 변경을 즉시 되돌린다.

---

## Closing

Narration:

```text
The human doesn't hand work to the agent.

They share the same live context,
adapt the same plan,
and the human stays authoritative.

This is PlanTogether, built with WebMCP.
```

---

# 13. Git Branch 이슈

공식 개발 브랜치는:

```text
main
```

으로 통일한다. **완료됨 (2026-09-01)** — GitHub 기본 브랜치가 `main`으로 전환되었고, 로컬 저장소도 `origin/main`을 정상 추적 중이다.

---

# 14. Git Commit 권장 순서

```text
chore: rename default branch to main

docs: add MIT license

docs: replace vite readme with challenge documentation

feat: add live human context panel

feat: add demo reset workflow

feat: strengthen challenge demo dataset

refactor: simplify webmcp tool surface

refactor: rename rebalance tool to analyze plan

feat: expose webmcp live activity trace

fix: enforce lock policy consistently in store

fix: normalize webmcp validation responses

feat: polish challenge demo experience

chore: add deployment configuration
```

---

# 15. 제출 필수요건

## LICENSE

Repository root:

```text
LICENSE
```

MIT License 추가.

---

## README

기존 Vite 기본 README 제거.

최종 README 구조:

```text
# PlanTogether

## What it is

## Why WebMCP

## Live Demo

## Human-Agent Collaboration

## Live Human Context

## WebMCP Tools

## Human Control
- Lock
- Dependency Blocking
- Revert

## Architecture

## Testing with WebMCP

## Local Development

## Challenge Demo Flow

## License
```

---

## Live Deployment

반드시 Public Live URL 제공.

우선순위:

```text
1. Vercel
2. Cloudflare Pages
3. Existing server
```

배포 후 반드시 실제 WebMCP 테스트 환경에서 E2E 확인한다.

---

# 16. README 핵심 설명

README에는 아래 메시지를 반드시 포함한다.

```text
PlanTogether does not give an agent a separate copy of the plan.

WebMCP exposes the same live workspace the human is actively editing.

Human actions immediately become agent context,
and agent actions immediately become visible human workspace changes.
```

그리고:

```text
Agent changes are immediately visible and independently reversible by the human.
```

---

# 17. 하지 말아야 할 개발

Challenge 제출 전 다음 기능을 추가하지 않는다.

```text
Authentication
Database
Backend API
Multi Workspace
Multi User
WebSocket
Comments
Attachments
Calendar
Timeline
Gantt
Slack integration
Google Calendar integration
Notifications
AI Chat UI
External LLM API
MCP Server
RAG
Vector DB
Multi Agent
```

이 기능들에 대한 논의는 이후 Product Phase에서 검토한다.

> 참고: 이전 버전 계획서(Phase 5-8)에서 제안했던 "실시간 다중 사용자 협업(WebSocket/CRDT)"은 이 목록에 의해 명시적으로 제외됨. 지금부터는 이 v1.1 계획서가 우선한다.

---

# 18. 개발 완료 기준

## Core

- [x] Human 카드 생성
- [x] Human 카드 수정
- [x] Drag & Drop
- [x] Human Focus 선택
- [x] Human Lock
- [x] Dependency Blocking
- [x] Agent Revert

## WebMCP

- [x] `get_workspace_state`
- [x] `get_current_focus`
- [x] `add_item`
- [x] `update_item`
- [x] `analyze_plan` (rename from `rebalance_plan`)
- [x] `lock_item` 제거
- [x] Locked Item Agent 수정 차단 (`update_item` + `moveItem` 모두)
- [x] Tool execution refresh 없음 (Playwright로 재확인됨)

## New Must-Have

- [x] Live Human Context 패널
- [x] Reset Demo
- [x] Strong Demo Dataset
- [x] WebMCP Live Activity Trace

## Repository

- [x] default branch = `main`
- [x] MIT LICENSE
- [x] Challenge README
- [x] Public repository
- [ ] Live deployment URL — **대기 중**: 배포 플랫폼(Vercel/Cloudflare Pages/기타)과 계정 연동은 사용자 확인 필요

## Quality

- [x] npm run build 통과
- [x] npm run lint 통과
- [x] Vitest 단위 테스트 (스토어 + 컴포넌트)
- [x] WebMCP actual browser E2E 통과 (Playwright 헤드리스로 새 레이아웃/데이터셋/Reset 확인)
- [ ] Demo reset 3회 연속 정상 — 수동 반복 확인 아직 안 함
- [ ] 90초 Demo Scenario 연속 재현 가능 — 실제 WebMCP 클라이언트로 아직 미검증

---

# 19. 최종 우선순위

지금부터 작업 진행 기준:

```text
P0
1. main branch 정리                 [완료]
2. LICENSE                          [완료]
3. README                           [완료]
4. Live Deployment                  [대기 — 플랫폼/계정 확인 필요]

P1
5. Live Human Context                [완료]
6. Reset Demo + Demo Dataset         [완료]
7. WebMCP Live Activity Trace        [완료]

P1 Refactor
8. lock_item 제거                    [완료]
9. rebalance_plan → analyze_plan     [완료]

P2
10. moveItem lock consistency        [완료]
11. validation consistency           [완료]
12. activity log ID 개선             [완료]

P3
13. UI polish                        [진행 예정]
14. Demo video
15. Devpost submission
```

---

# 20. FINAL PRODUCT PRINCIPLE

PlanTogether는 Project Management SaaS를 만드는 프로젝트가 아니다.

**WebMCP가 왜 필요한지를 가장 짧고 명확하게 보여주는 Human-Agent Collaborative Workspace를 만드는 프로젝트다.**

성공 기준은 기능 수가 아니다.

심사위원이 데모 영상을 보고 다음을 즉시 이해하면 성공이다.

> 사람이 지금 보고 있는 작업을 Agent가 그대로 이어받고,
> 같은 live workspace를 함께 수정하며,
> 사람의 Lock과 Revert가 최종 권한으로 작동한다.

즉:

> **Same workspace. Same context. Human + Agent.**
