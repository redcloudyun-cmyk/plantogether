# PlanTogether — WebMCP Native Human-Agent Collaboration Platform

**Version:** 1.4
**Target:** OpenAI × Devpost WebMCP Challenge
**Primary Branch:** `main`
**Product Direction:** WebMCP-native Human-Agent Collaboration Platform
**Challenge Strategy:** Product depth + user clarity + judge clarity + test reliability
**Core Message:** Same workspace. Same context. Human + Agent.

> **v1.1 → v1.4 전환 (2026-09-01)**: v1.1(단일 Kanban 화면, 5 tools, Reset Demo)은 완료·배포되어 있음. v1.4는 이를 4-screen 제품(Dashboard/Workspace/Activity/Settings)으로 확장하고, 이번 버전의 핵심 신규 기능인 **Agent Proposal / Human Approval** 워크플로우, Risk Classification, Plan Health, Conflict Detection, Critical Path를 추가한다. 아래 내용은 v1.4 원본 계획서를 기준으로 재정리한 것이며, 진행 상황은 문서 하단 "구현 상태" 절 참고.
>
> **병행 세션 합류 (2026-09-01)**: 같은 저장소에서 다른 Claude 세션(Antigravity IDE)이 동시에 Proposal/Approval·Risk 기반 Autonomy·Plan Health/Conflict Detection/Critical Path/Dashboard를 독립적으로 구현했음. 중복 확인 후 `feature/agent-proposal-approval` 브랜치를 리뷰(tsc/lint/vitest 33개/build/Playwright 통과)하고 `main`에 머지함(커밋 `8353911`). 이 세션에서 진행 중이던 동일 범위의 미완성 구현은 폐기하고, 이 문서와 데모 데이터셋만 선별적으로 이어받음. 이어서 이 세션이 Activity 화면과 Settings/WebMCP 화면을 병합된 코드 위에 추가 구현함(커밋 `60f015b`).
>
> **Test Gate 실행 완료 (2026-09-01)**: §37/§38을 Playwright E2E로 실제 수행 — 그 과정에서 **agent의 `update_item`이 status를 건드리지 않아도 아이템의 status를 지워서 WebMCP 전체가 영구적으로 죽는 치명적 버그**를 발견해 수정함(커밋 `4f52c94`). Reset Demo 5회 연속, 전체 데모 시나리오 3회 연속, Live URL 새 브라우저 검증까지 전부 통과. 자세한 결과는 §37/§38 바로 아래 "Test Gate / Judge Access Test 실행 결과" 절 참고.
>
> **Workspace를 목업에 맞게 재구성 (2026-09-01)**: 사용자가 제공한 실제 목업 이미지와 비교해 Workspace가 부족하다는 피드백에 따라 Plan Analysis(헬스 게이지 + Detected Issues), Critical Path(체인 + 지연 배너), 인라인 Agent Proposal 테이블을 보드 아래에 추가하고, 우측 레일을 Live Human Context / AI Plan Analysis / Context Scope(What AI Sees) / AI Permissions로 재구성함(커밋 `2f2291c`). 기존 모달 방식 `ProposalModal`은 인라인 `AgentProposalPanel`로 대체. 테스트 셋업에 RTL cleanup이 빠져있던 버그도 함께 발견·수정.
>
> **WithGeX로 브랜드명 통일 (2026-09-01)**: 공식 제품명이 "PlanTogether"가 아니라 "WithGeX"임을 확정. UI/README/WebMCP 설명/localStorage 키 전부 전환(커밋 `2951a2a`, `20a5b8e`). GitHub 저장소 이름(및 그에 종속된 Pages 배포 경로)은 실제 인프라라 별도 결정 없이는 유지. README의 Live Demo 링크는 이제 `https://withgex-test.agex.site`(다른 세션이 운영하는 것으로 보이는 별도 배포)를 1순위로, 기존 GitHub Pages를 미러로 안내.

---

# 0. Version 1.4 핵심 결정

PlanTogether는 단순 Kanban demo로 끝나지 않는다.

동시에 범용 SaaS의 모든 기능을 구현하지도 않는다.

목표는 다음이다.

> **A working miniature of a WebMCP-native Human-Agent Collaboration Platform.**

최종 제품은 다음 4개 화면을 갖는다.

```text
1. Dashboard
2. Workspace
3. Activity
4. Settings / WebMCP
```

그러나 핵심 데모의 절대 가치는 Workspace에 집중한다.

모든 UI/UX는 두 관점에서 검토한다.

```text
USER VIEW
실제 사용자가 이해하기 쉽고 안전하게 Human-Agent 협업을 할 수 있는가?

JUDGE VIEW
심사관이 짧은 시간 안에 WebMCP 활용도와 제품 완성도를 이해할 수 있는가?
```

---

# 1. 공식 Challenge 기준

제출물은 반드시 실제 동작해야 한다.

필수:

```text
[ ] Working Live URL
[ ] Public Repository
[ ] Open Source License
[ ] Project Description
[ ] Testing Instructions
[ ] WebMCP Implementation
[ ] Public Demo Video under 3 minutes with audio
```

심사관은 실제 Live URL을 열어 테스트할 수 있다.

따라서 모든 핵심 기능은 실제 상태의 실제 WebMCP Tool Call 기반이어야 한다.

---

# 2. Judging-Oriented Product Strategy

공식 평가 기준:

```text
WebMCP Leverage
Execution
Potential Impact
Creativity & Ambition
```

PlanTogether는 각 기준을 UI에서 직접 증명해야 한다.

## WebMCP Leverage

보여줄 것:

```text
Live Context
Actual Tool Calls
Tool Permissions
Context Scope
Agent Proposal
Human Approval
Lock Enforcement
Revert
```

## Execution

보여줄 것:

```text
Coherent 4-screen product
No dead buttons
No fake data
Stable state
Responsive desktop UI
Predictable demo
```

## Potential Impact

보여줄 것:

```text
Real project planning problem
Schedule conflicts
Dependency risk
Human-Agent joint planning
Human authority
```

## Creativity & Ambition

보여줄 것:

```text
Context-aware agent collaboration
Risk-aware autonomy
Proposal / Approval
Explain Why
Agent action diff
Plan health
```

---

# 3. Product Architecture

```text
                         HUMAN
                           │
                 WORKSPACE UI
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
                         WebMCP
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

---

# 4. UI/UX Design Principle

모든 화면은 다음 질문에 답해야 한다.

## User UX Questions

```text
지금 내가 어디에 있는가?
AI가 무엇을 보고 있는가?
AI가 무엇을 할 수 있는가?
AI가 지금 무엇을 하고 있는가?
왜 이런 제안을 했는가?
내가 최종 통제권을 가지고 있는가?
중요할 때 되돌릴 수 있는가?
```

## Judge UX Questions

```text
이 앱이 왜 WebMCP인가?
Agent가 실제 Live UI State를 읽는가?
WebMCP Tool이 실제로 호출되는가?
Human과 Agent가 같은 Workspace에서 협업하는가?
Human Authority가 실제로 작동하는가?
이것이 단순 Proof-of-Concept 이상인가?
```

---

# 5. Global Visual Design

## Style

```text
Light Theme
Modern Enterprise SaaS
Minimal Gradient
Soft Card Borders
High Information Clarity
Strong Status Contrast
```

참고 톤: Linear / Notion / Vercel / OpenAI / Asana

## Layout

Desktop first: `1280px ~ 1600px`. Challenge Demo는 Desktop 최적화 우선.

---

# 6. Screen 1 — Dashboard

Dashboard는 일반 KPI 페이지가 아니다.

Human-Agent Collaboration Summary를 보여준다.

## 6.1 User View

사용자는 Dashboard에서 즉시 알아야 한다: 현재 Plan 상태, 문제 발생 여부, Agent 상태, 최근 Human-Agent 협업.

예:

```text
TODAY'S COLLABORATION

Human Actions       12
Agent Actions       18
Proposals            4
Approved             3
Rejected             1
Reverted             1

PLAN HEALTH

82 / 100
⚠ 1 conflict
⛔ 2 blocked
🔒 1 protected

AGENT

● WebMCP Connected
Assist Mode
5 Tools Available

[Open Workspace]
```

## 6.2 Judge View

심사관은 Dashboard 첫 5초 안에 다음을 이해해야 한다: 이건 단순 Project Dashboard가 아니다 / Human + Agent Collaboration이 진짜 중심이다 / WebMCP가 실제 연결되어 있다 / Human Authority가 존재한다.

따라서 일반 SaaS 숫자보다 **Agent Actions / Proposals / Blocked Agent Actions / Reverts / WebMCP Status**를 우선 표시한다.

---

# 7. Screen 2 — Workspace

Workspace가 Challenge 핵심 화면이다.

권장 구조:

```text
┌──────────────────────────────────────────────────────────────────┐
│ PlanTogether     WebMCP ● Connected     Assist Mode    Reset Demo│
├─────────────────────────────────────────────┬────────────────────┤
│                                              │ LIVE HUMAN CONTEXT │
│                                              ├────────────────────┤
│                                              │ WHAT AI SEES       │
│             KANBAN BOARD                    ├────────────────────┤
│                                              │ AI PERMISSIONS     │
│ Backlog Planned Doing Done                  ├────────────────────┤
│                                              │ PLAN HEALTH        │
│ [Cards]                                     ├────────────────────┤
│                                              │ WEBMCP LIVE ACTIVITY│
├─────────────────────────────────────────────┴────────────────────┤
│ CRITICAL PATH / DEPENDENCY FLOW                                  │
└─────────────────────────────────────────────────────────────────┘
```

권장 비율: Board 68~72% / Right Rail 28~32%.

---

# 8. Live Human Context

현재 사용자가 무엇을 작업하는지 보여준다.

```text
LIVE HUMAN CONTEXT

Record Demo

Status: Doing
Due: Sep 5
Owner: Mina
Priority: High
🔒 Locked

✓ Shared with Agent
```

User UX: "AI가 내가 지금 보고 있는 작업을 이해하고 있구나."
Judge UX: "get_current_focus가 실제 live state를 읽는구나."

---

# 9. What AI Sees

Agent Context Scope를 UI로 노출한다.

```text
WHAT AI SEES

✓ Current item
✓ Current board
✓ Dependencies
✓ Plan status

Not Shared
✗ Other workspace
✗ Account details
✗ External services
```

가능하면 다음도 지원(선택):

```text
SHARE WITH AGENT
✓ Current item / ✓ Board / ✓ Dependencies
⬡ Activity History / ⬡ Completed Items
```

---

# 10. AI Permissions

실제 Tool Surface 기반으로 표시한다.

```text
AI PERMISSIONS

Allowed
✓ Read workspace / ✓ Read focus / ✓ Create item / ✓ Update item / ✓ Analyze plan

Restricted
✗ Delete workspace / ✗ Lock human item / ✗ Manage users / ✗ Workspace settings
```

이 UI는 RBAC 시스템이 아니라 **Agent Capability Transparency**다.

---

# 11. Task Detail Drawer

카드 선택 시 Drawer.

```text
TASK DETAIL

Record Demo

Status: Doing / Owner: Mina / Due: Sep 5 / Priority: High

Dependencies
✓ Build WebMCP Tools
✓ Submit to Devpost

Description
Record final WebMCP walkthrough.

AI Context
"This task blocks final submission."

Recent Changes
Human — Due Sep 4 → Sep 5
Agent — Added dependency
```

---

# 12. Plan Health

현재 Workspace에서 deterministic 계산.

```text
PLAN HEALTH
82 / 100
⚠ Schedule Conflict   1
⛔ Blocked             2
🔒 Protected           1
```

점수 계산:

```text
100 - conflict×15 - blocked×8 - overdue×10   (0 이하로는 내려가지 않음)
```

---

# 13. Conflict Detection

탐지 대상: Schedule Conflict / Blocked Dependency / Overdue Task / Locked Critical Task / Dependency Conflict.

예:

```text
⚠ SCHEDULE CONFLICT

Record Demo (Sep 5) blocks Submit to Devpost (Sep 5)

Potential impact: Submission deadline at risk.
```

---

# 14. Critical Path

간단한 dependency graph 기반.

```text
Define MVP → Build Board → Build WebMCP → Record Demo → Final QA → Submit
```

가장 긴 의존성 체인에 속한 항목에 `CRITICAL` 배지.

---

# 15. Agent Proposal / Human Approval — Version 1.4 핵심 기능

중요한 Agent Mutation은 즉시 적용하지 않고 Change Set(Proposal)을 생성한다.

```text
AGENT PROPOSAL

Your change created a schedule conflict.

Proposed Changes
QA            Sep 4 → Sep 5
Record Demo   Sep 5 → Sep 6
Submit        Sep 6 → Sep 7

Impact
3 tasks affected / 1 conflict resolved / 0 locked items changed

Why?
Record Demo was manually delayed.

[Reject]  [Review Individually]  [Apply Changes]
```

---

# 16. Proposal UX — User View

사용자는 즉시 이해해야 한다: 무엇이 바뀌는가 / 왜 바뀌는가 / 어떤 영향이 있는가 / 내가 승인해야 하는가. 불필요한 기술 용어를 쓰지 않는다.

# 17. Proposal UX — Judge View

심사관은 Proposal UI만 보고도: Agent가 분석했다 → Agent가 제안했다 → Human이 승인했다 → Agent가 실행했다 — 즉 Human-Agent loop 자체가 화면에서 보여야 한다.

# 18. Individual Proposal Review

가능하면 부분 승인.

```text
QA             ✓ Accept
Record Demo    ✓ Accept
Submit         ✗ Reject
```

---

# 19. Agent Autonomy

Settings에서:

```text
AGENT AUTONOMY
○ Observe   ○ Assist   ○ Autonomous
```

Challenge Default: **Assist**

# 20. Risk Classification

```text
LOW      Create Item / Add Description / Add Metadata
MEDIUM   Change Due Date / Move Status / Change Priority
HIGH     Change Dependency / Change Critical Milestone
```

Delete는 Restricted(항상 차단).

Policy:

```text
Observe     → no mutation
Assist      → low auto-apply / medium·high → proposal
Autonomous  → low·medium auto-apply / high → proposal
```

---

# 21. Explain Why

Agent Change에는 이유를 보여준다.

```text
WHY DID THE AGENT DO THIS?

Changed: QA — Sep 4 → Sep 5
Because: Record Demo was delayed.
Evidence: Record Demo, Due Sep 6
Dependency: QA → Record Demo
Tool: analyze_plan
```

# 22. Before / After Diff

```text
BEFORE          AFTER
Sep 4       →   Sep 5
Planned     →   Doing
No Owner    →   Mina
```

---

# 23. Human Lock

Human만 Lock 가능.

```text
🔒 Locked by Human
```

Agent:

```json
{ "success": false, "reason": "ITEM_LOCKED_BY_HUMAN" }
```

Lock은 Autonomy보다 우선한다.

# 24. Revert

Agent Change에 `↩ Revert` 제공. Challenge에서는 item-level 마지막 agent change만 지원한다.

---

# 25. WebMCP Tool Surface

```text
get_workspace_state
get_current_focus
add_item
update_item
analyze_plan
```

# 26. Tool Execution UX

Tool 실행 시 Board만 변하면 안 된다. 오른쪽 Activity에서도 즉시 보여준다.

```text
→ get_current_focus     Record Demo
→ get_workspace_state   6 items read
→ analyze_plan          1 conflict
✦ update_item           QA Sep 4 → Sep 5
✗ update_item           ITEM_LOCKED_BY_HUMAN
```

---

# 27. Screen 3 — Activity

실제 Human + Agent Session History.

```text
All | Human | Agent | Blocked | Proposal

11:24 Human  — Changed Record Demo, Sep 4 → Sep 5
11:25 Agent  — get_current_focus SUCCESS
11:25 Agent  — analyze_plan, 1 conflict
11:26 Agent  — Proposal #12, 3 changes
11:27 Human  — Approved 2 / Rejected 1
11:27 Agent  — Applied changes
```

# 28. Activity Summary

실제 Store 기반: Events / Human / Agent / System / Successful / Blocked / Rejected / Reverted. 하드코딩 금지.

# 29. Activity Detail

Event click 시:

```text
ACTIVITY DETAIL
Actor: Agent / Tool: update_item / Target: Record Demo
Before: Sep 4 / After: Sep 5
Reason: Dependency conflict resolution
Result: Applied
```

---

# 30. Screen 4 — Settings / WebMCP

```text
WEBMCP STATUS
● Connected

TOOLS
✓ get_workspace_state / ✓ get_current_focus / ✓ add_item / ✓ update_item / ✓ analyze_plan

AUTONOMY
● Assist

CONTEXT
✓ Current focus / ✓ Workspace / ✓ Dependencies

RESTRICTED
✗ Delete / ✗ Human Lock / ✗ User Management

DEMO
[Reset Demo]
```

---

# 31. User-Centered UX Requirements

## Navigation

사용자가 길을 잃지 않아야 한다. Sidebar는 **Dashboard / Workspace / Activity / Settings** 4개만 사용.

## Terminology

사용자 UI에서는 기술 용어보다 업무 용어 우선. 예: "Agent Proposal"(좋음) vs "Tool Mutation Candidate"(나쁨).

## Feedback

모든 Action은 1초 이내 visual feedback. 예: "Agent updated this item", "Human locked this item", "Proposal created", "Change reverted".

## Safety

Destructive 또는 consequential Action은 항상 명확한 상태를 보여준다.

---

# 32. Judge-Centered UX Requirements

심사관은 첫 30초 안에 다음을 봐야 한다: WebMCP Connected / Current Human Focus / Actual Tool Calls / Agent Capability / Human Lock / Proposal Approval / Agent Change / Revert. 즉 중요한 기능은 메뉴 깊은 곳에 숨기지 않는다.

# 33. Judge Demo Shortcuts

대회 제출용 Demo Mode에서는 다음 버튼을 허용한다: `Reset Demo`, `Load Demo Scenario`.

단, `Agent Tool 직접 실행 버튼`, `Fake Activity 생성 버튼`, `Fake Score 생성 버튼`은 사용자 화면에 노출하지 않는다.

---

# 34. Demo Dataset

6개 아이템만 사용.

```text
DONE      Define MVP
DOING     Polish Workspace
PLANNED   Build WebMCP Tools 🔒 / Record Demo
BACKLOG   Final QA / Submit to Devpost
```

Dependency chain:

```text
Define MVP → Polish Workspace → Build WebMCP Tools → Record Demo → Final QA → Submit
```

최소: 1 locked / 1 blocked / 1 conflict-capable chain.

# 35. Real Logs

Activity는 실제 테스트를 통해 쌓인다. localStorage persist 키: `plantogether-workspace`, `plantogether-activity`, `plantogether-settings`. 가짜 Activity seed 금지.

---

# 36. Challenge Demo Flow

목표: 90~150초.

1. **Dashboard** — Plan Health, WebMCP Connected, Recent Collaboration, Agent Mode.
2. **Human Focus** — Workspace에서 "Record Demo" 선택 → Live Human Context 즉시 변경.
3. **WebMCP Read** — Agent: "Continue planning from what I'm working on." → `get_current_focus`, `get_workspace_state` 호출, Activity에 즉시 표시.
4. **Conflict** — Human이 Due Date 변경 → Plan Health에 "⚠ Conflict detected".
5. **Agent Analysis** — Agent: `analyze_plan` → Proposal 생성.
6. **Human Approval** — Human: "Apply 2 / Reject 1" → Workspace 즉시 변경.
7. **Human Authority** — Human Lock → Agent modification 시도 시 `ITEM_LOCKED_BY_HUMAN`.
8. **Revert** — Agent change에 `↩ Revert`.
9. **Activity** — Session timeline으로 Human + Agent collaboration 증명.

---

# 37. Hackathon Test Gate

제출 전 전부 통과해야 한다.

**Build**: `[ ] npm install` `[ ] npm run build` `[ ] npm run lint` `[ ] production build load`

**WebMCP**: `document.modelContext` 존재 환경 확인 / 5 tools register / duplicate registration crash 없음 / 5개 tool 각각 정상 동작

**State**: tool call 시 page refresh 없음 / Agent change UI 즉시 반영 / Human change를 Agent가 다시 읽을 수 있음 / localStorage restore 정상

**Human Authority**: locked item update/move 차단 / proposal reject/apply 정상 / revert 정상

**Reliability**: Reset Demo 5회 연속 정상 / Full Demo 3회 연속 성공 / Live URL fresh browser 정상 / Console fatal error 없음

# 38. Judge Access Test

실제 심사 환경 가정: Live URL 직접 접속 → 별도 설명 없이 UI 이해 → WebMCP 상태 확인 → Agent tool test → Human action test → Refresh → Reset → Repeat. 한 번이라도 치명적 오류가 발생하면 제출 전 이슈.

# 39. Submission Repository

필수: LICENSE / README.md / source code / assets / build instructions / WebMCP testing instructions / Live URL / Demo URL.

README에는 반드시: Why WebMCP / Human-Agent Collaboration / Tools / Human Authority / Testing / Architecture / Demo Flow.

# 40. 구현하지 않는 것

대회 전 제외: Full Multi-user / Team invitation / Billing / Documents / Knowledge RAG / External Integrations / Realtime Cursor / Slack / Google Calendar / Marketplace / Complex RBAC / MCP Server / Vector DB / Multi Agent.

---

# 41. Priority

**P0 — Submission Safety**: main branch / LICENSE / README / Live Deployment / WebMCP E2E / Demo Reliability

**P1 — Core Product**: Dashboard / Workspace / Live Context / AI Permissions / Context Scope / Activity / Settings / Lock / Dependency / Revert / Reset

**P1+ — Competitive Depth**: Plan Health / Conflict Detection / Critical Path / Agent Proposal / Human Approval / Before-After Diff / Explain Why

**P2 — Ambition**: Autonomy Level / Action Risk Level / Partial Proposal Approval / Context Sharing Controls / Activity Detail

---

# 42. Final Product Standard

PlanTogether는 다음 세 가지 시각을 동시에 만족해야 한다.

**USER**: Easy to understand / Easy to control / Safe to collaborate / Easy to recover

**AGENT**: Structured context / Clear tools / Explicit boundaries / Reliable state

**JUDGE**: WebMCP is obvious / Human-Agent collaboration is visible / The product feels complete / The idea feels ambitious / The demo is reliable

최종 기준:

> **One coherent product. Real WebMCP. Visible intelligence. Human authority. Judge clarity.**

---

# 43. 구현 상태 (진행 중 갱신)

> 이 절은 v1.4 계획서 자체에는 없던, 진행 상황 추적용 섹션이다. 아래 각 항목은 작업이 끝날 때마다 갱신한다.

## P0 — Submission Safety

- [x] main branch, LICENSE, README(v1.1 버전), Live Deployment(GitHub Pages) — v1.1에서 완료, v1.4 스크린 확장에 맞춰 README는 재작성 필요
- [x] WebMCP E2E — Playwright + 모킹된 `document.modelContext`로 5개 tool 전부 실제 호출 검증, 치명적 버그(위 참고) 발견·수정
- [x] Demo Reliability — Reset Demo 5회 연속 + 데모 시나리오 3회 연속, 콘솔 에러 0건

## P1 — Core Product

- [x] 4-screen shell (Dashboard / Workspace / Activity / Settings) — Header의 4-tab 토글로 구현 (별도 사이드바는 아님, 기존 Header 패턴을 확장)
- [x] Dashboard 화면 (`src/components/Dashboard.tsx`) — Today's Collaboration / Plan Health / Agent 카드, Conflicts 목록, Critical Path, 전부 실제 store 계산값
- [x] Workspace 화면 (기존 Board + 우측 레일: Live Human Context + WebMCP Live Activity)
- [x] Live Human Context — v1.1에서 완료
- [ ] What AI Sees 패널 — 미구현 (P2 Context Sharing Controls와 함께 보류)
- [ ] AI Permissions 패널 — 미구현 (독립 패널은 없음; Risk 정보는 Proposal 카드/Activity 로그에 노출됨)
- [x] Activity 화면 (`ActivityScreen.tsx`) — All/Human/Agent/Blocked/Proposals 필터, 행 클릭 시 Actor/Tool/Result/Detail 펼침, 실제 activityLog 기반 요약 스탯
- [x] Settings / WebMCP 화면 (`SettingsScreen.tsx`) — 연결 상태, 5개 Tool 목록, Autonomy 선택(Header 토글과 동일 store 액션 공유), Context/Restricted 목록, Reset Demo
- [x] Lock / Dependency / Revert / Reset — v1.1에서 완료

## P1+ — Competitive Depth

- [x] Plan Health 점수 계산 + 카드 (`src/lib/planAnalysis.ts`)
- [x] Conflict Detection — schedule conflict / blocked dependency / overdue / locked critical task / dependency cycle 전부 구현
- [x] Critical Path 계산 + Dashboard에 표시 (Workspace 화면 자체에는 아직 없음)
- [x] Agent Proposal / Human Approval 워크플로우 (`src/lib/risk.ts` + store의 `proposals`/`autonomyMode` + `ProposalModal.tsx`)
- [x] Before/After Diff — ProposalModal 내 필드별 before→after 표시
- [x] Explain Why — update_item의 `reason` 인자 → Proposal의 "Why?" 섹션

## P2 — Ambition

- [x] Autonomy Level 설정 (Observe/Assist/Autonomous) — Header 토글, `src/lib/risk.ts`의 `decideAutonomyAction`
- [x] Action Risk Level 노출 — Proposal 카드의 Risk 배지, Dashboard 미노출은 아님
- [x] Partial Proposal Approval — ProposalModal의 "Review Individually"
- [ ] Context Sharing Controls (토글) — 미구현 (What AI Sees와 함께 보류, 우선순위 최하위로 유지하기로 함)
- [x] Activity Detail 뷰 — ActivityScreen 각 행 클릭 시 인라인으로 펼쳐짐 (별도 페이지/모달은 아님)

> **2026-09-01 기준 남은 작업 (우선순위 순)**: 1) Test Gate(§37) 체크리스트 + Judge Access Test(§38) 실제 수행, 2) 데모 스크립트(§36) 리허설 및 타이밍 확인. Context Scope 토글(§9)과 What AI Sees/AI Permissions 패널은 최하위 우선순위로 남겨둔다 — Risk 정보 자체는 Proposal 카드와 Activity 로그에 이미 노출되어 있음.

## Test Gate (§37) / Judge Access Test (§38) 실행 결과 — 2026-09-01

Playwright로 `document.modelContext`를 모킹해 5개 Tool을 실제로 호출하는 End-to-End 스크립트, Reset Demo 5회 연속, 전체 데모 시나리오(9씬) 3회 연속, 그리고 배포된 Live URL을 새 브라우저 컨텍스트로 검증했다. 사람이 영상 녹화 타이밍을 재는 것 등 순수 수동 항목을 빼고는 전부 자동 검증했다.

**Build**: `npm install` / `npm run build` / `npm run lint` — 전부 통과.

**WebMCP**: `document.modelContext` 존재 확인, 5 tools 정확히 등록(React StrictMode의 이중 effect 실행 후에도 정확히 5개로 안정화), duplicate registration으로 인한 크래시 없음, 5개 tool 각각(`get_workspace_state`/`get_current_focus`/`add_item`/`update_item`/`analyze_plan`) 정상 동작 — 전부 통과.

**State**: tool call 시 page refresh/navigation 없음, agent 변경이 UI에 즉시 반영, human이 수정한 값을 agent가 `get_workspace_state`로 다시 읽을 수 있음, localStorage restore 정상 — 전부 통과.

**Human Authority**: locked item에 대한 agent `update_item` 차단(`ITEM_LOCKED_BY_HUMAN`), Proposal apply/reject 정상, Revert 정상 — 전부 통과.

**Reliability**: Reset Demo 5회 연속 정상(매번 6개 아이템/1개 잠금으로 정확히 복원), 전체 데모 시나리오 3회 연속 성공(콘솔 에러 0건), Live URL을 새 브라우저 컨텍스트(로컬스토리지 없음, WebMCP 미지원 상태 포함)에서 확인 — 정상 로드·정상 폴백(WebMCP Unavailable 표시)·4개 화면 전부 동작·Reset Demo·새로고침 전부 정상.

**🐛 발견 및 수정한 치명적 버그**: `update_item`이 `status`를 바꾸지 않는 호출에서도 내부적으로 `status: undefined`를 강제로 포함시켜서, 이 값이 store의 객체 스프레드(`{ ...item, ...changes }`)로 아이템에 그대로 덮어써져 실제 status가 사라지는 문제가 있었다. 이후 Board의 상태별 그룹핑(`grouped[item.status].push(...)`)이 `undefined` 키에 접근해 렌더링이 크래시하고, App의 effect cleanup이 실행되며 WebMCP 5개 tool이 통째로 등록 해제되어 이후 어떤 tool도 호출할 수 없게 됐다 — 즉 **agent가 status를 건드리지 않는 첫 update_item 호출(또는 그 결과로 만들어진 Proposal의 승인) 직후 WebMCP가 영구적으로 죽는** 심각한 버그였다. Proposal 승인 플로우를 End-to-End로 테스트하다가 발견했고, `status`를 실제로 변경할 때만 changeset에 포함하도록 수정했다(커밋 `4f52c94`). 수정 후 전체 재검증 통과.

**보류(사람이 직접 확인 필요)**: §36 데모 스크립트의 실제 90~150초 내레이션 타이밍, 최종 데모 영상 녹화.
