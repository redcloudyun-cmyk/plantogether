# PlanTogether 개발 계획

> Human + Agent가 함께 계획을 짜는 협업 Kanban 워크스페이스.
> 브라우저 내장 WebMCP(`document.modelContext`)를 통해 AI 에이전트가 사람과 같은 보드를 직접 조작한다.

마지막 갱신: 2026-09-01
기준: 현재 저장소 코드 상태 (`src/` 전체 스캔, git 이력 없음 — 로컬 전용 프로젝트)

> **진행 상황**: Phase 5(의존성 시각화 & 검증), Phase 6(신뢰 경계 — 되돌리기) 구현 완료. 아래 "4. 알려진 갭"의 상위 두 항목은 해소됨 — 섹션 5.1, 5.2 참고.

---

## 1. 프로젝트 개요

- **컨셉**: 사람이 쓰는 Kanban 보드를 AI 에이전트도 동일하게 읽고 쓸 수 있게 만들어, "같은 화면을 보며 함께 계획을 조정하는" 경험을 데모한다.
- **핵심 차별점**: 별도 채팅창이 아니라 **보드 자체가 공유 상태**다. 에이전트가 카드를 추가/수정하면 사람이 보는 화면에 실시간으로 반영되고, 누가 마지막으로 바꿨는지(`human` / `agent`) 카드에 표시된다.
- **락(lock) 메커니즘**: 사람이 특정 카드를 잠그면 에이전트는 그 카드를 수정할 수 없다 — 신뢰 경계를 UI로 표현.

## 2. 기술 스택

| 영역 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | React 19 + Vite 8 + TypeScript | |
| 상태관리 | Zustand 5 (`persist` 미들웨어, localStorage) | 새로고침해도 보드 유지 |
| 드래그앤드롭 | @dnd-kit/core, /sortable, /utilities | 컬럼 간 이동 + 정렬 |
| 스타일 | Tailwind CSS 4 (`@tailwindcss/vite`) | `index.css`의 `@theme`로 디자인 토큰 정의 |
| Agent 연동 | WebMCP (`document.modelContext.registerTool`) | Chrome 149+ 실험 플래그 필요 |
| 린트 | oxlint | |

## 3. 현재까지 구현된 것 (완료)

### Phase 1 — 데이터 모델 & 스토어
- `src/types/workspace.ts`: `PlanItem`(상태 4단계: backlog/planned/doing/done), `ActivityLogEntry`, `Workspace` 타입 정의.
- `src/store/workspaceStore.ts`: `addItem`, `updateItem`, `moveItem`, `lockItem`/`unlockItem`, `selectItem`, `getWorkspace`, `getSelectedItem`, `addActivityLog` 구현. `persist`로 localStorage 저장.
- `src/data/demoWorkspace.ts`: 데모용 초기 아이템 5개.

### Phase 2 — Kanban 보드 UI
- `src/components/Board.tsx`: dnd-kit `DndContext`로 4개 컬럼 간 드래그앤드롭. `DragOverlay`로 드래그 중 카드 미리보기.
- `src/components/Column.tsx`: 컬럼별 헤더(개수 뱃지, `+` 추가 버튼), `useDroppable`.
- `src/components/PlanCard.tsx`: 카드 UI — 마감일/담당자 뱃지, human/agent 배지, lock 토글 버튼, agent가 방금 수정한 카드에 하이라이트 애니메이션(`animate-agent-highlight`).
- `src/components/CardEditor.tsx`: 모달 폼으로 카드 생성/수정 (제목/설명/담당자/마감일/상태).

### Phase 3 — WebMCP 에이전트 연동
- `src/webmcp/registerTools.ts`: 6개 도구 등록
  1. `get_workspace_state` (읽기) — 보드 전체 상태
  2. `get_current_focus` (읽기) — 사람이 현재 선택한 카드
  3. `add_item` — 카드 생성 (입력 검증 포함: 제목 필수, 상태 enum, 날짜 포맷)
  4. `update_item` — 카드 수정 (락 체크: 잠긴 카드는 agent가 수정 불가)
  5. `lock_item` — 카드 잠금
  6. `rebalance_plan` (읽기) — 락/의존성 상태를 구조화해 반환, 에이전트가 재계획 시작점으로 사용
- `App.tsx`에서 마운트 시 등록, 언마운트 시 `AbortController`로 해제.
- `AgentActivity.tsx` + `StatusBar.tsx`: 에이전트 행동 로그(최근 50개)와 WebMCP 연결 상태 표시.

### Phase 4 — 마무리 폴리시
- `Header.tsx`: 브랜딩, WebMCP 연결 인디케이터, Reset 버튼.
- `index.css`: 디자인 토큰, 하이라이트/슬라이드인 애니메이션.
- 프로덕션 빌드 확인됨 (`dist/` 존재).

## 4. 알려진 갭 (다음에 다뤄야 할 것)

- ~~`dependencies` 필드가 데이터에만 존재하고 시각화되지 않음~~ — **해결됨 (Phase 5)**, 섹션 5.1 참고.
- ~~`unlock_item`이 store에는 있지만 WebMCP 도구로 노출되지 않음~~ — **결정됨 (Phase 6)**: 의도적으로 노출하지 않음. 사람이 건 락을 에이전트가 스스로 풀 수 있으면 락 기능 자체의 신뢰 경계가 무의미해지므로, 락 해제는 계속 사람 전용으로 유지. 섹션 5.2 참고.
- **`get_current_focus` / `rebalance_plan`을 제외하면 실시간 다중 에이전트·다중 사용자 동기화가 없음** — 지금은 단일 브라우저 탭 + localStorage뿐이라 "함께 계획한다"는 컨셉이 실제로는 한 사람 + 한 에이전트로 국한됨.
- **테스트 없음** — 컴포넌트/스토어 단위 테스트, WebMCP 도구 입력 검증 테스트 전무.
- **에이전트 쪽 검증 vs. 사람 쪽 검증 비대칭** — `CardEditor.tsx`(사람이 쓰는 폼)는 날짜/상태 검증이 없고, `registerTools.ts`(에이전트 경로)만 엄격히 검증함.
- **`Board.tsx`의 `handleDragOver`가 빈 함수** — 컬럼 간 드래그 중 실시간 미리보기 이동이 없어 드롭 전까지 카드가 원래 컬럼에 남아있음 (기능은 하지만 UX 개선 여지).

## 5. 다음 단계 로드맵

### Phase 5 — 의존성 시각화 & 검증 ✅ 완료 (2026-09-01)
- `PlanCard.tsx`: 의존성이 `done`이 아닌 카드에 "⛔ Blocked by N" 배지 표시 (호버 시 어떤 카드에 막혀있는지 툴팁).
- `workspaceStore.ts`: `moveItem`/`updateItem`이 `done`으로 전환 시 미완료 의존성이 있으면 `{ success: false, reason: 'DEPENDENCIES_INCOMPLETE' }`를 반환하고 상태 변경을 거부. 새 셀렉터 `getIncompleteDependencies(id)` 추가.
- `Board.tsx`: 드래그로 Done에 놓아도 막히면 원래 컬럼에 남고, Agent Activity 로그에 "Blocked ..." 항목이 남음.
- `CardEditor.tsx`: 사람이 폼에서 상태를 Done으로 바꿔도 동일하게 막히고 인라인 경고 메시지 표시.
- `registerTools.ts`: `update_item` 실패 시 에이전트에게 어떤 카드에 막혀있는지 알려주는 `message` 포함. `rebalance_plan`이 `modifiableItems[].blockedBy`와 최상위 `blockedItems[]`로 의존성 그래프를 명시적으로 반환.
- 검증: Playwright로 헤드리스 브라우저에서 실제 드래그앤드롭 시나리오 확인 완료 (배지 렌더링, 드롭 거부, 활동 로그 메시지 모두 정상).

### Phase 6 — 신뢰 경계 강화 ✅ 완료 (2026-09-01)
- **결정**: `unlock_item`은 WebMCP 도구로 노출하지 않는다 (에이전트가 스스로 락 해제 불가). 사람만 락을 걸고 풀 수 있어야 "락"이 실제 신뢰 경계로 기능한다.
- **"되돌리기" 안전망 구현**: `PlanItem.previousState`에 에이전트의 직전 변경 전 스냅샷(제목/설명/상태/담당자/마감일)을 저장. `updateItem`이 `actor === 'agent'`로 성공할 때마다 갱신되고, 사람이 수정하면 초기화됨.
  - `workspaceStore.ts`: `revertItem(id)` 액션 추가 — 스냅샷으로 복원하고 `updatedBy: 'human'`으로 기록, 활동 로그에 "Reverted" 항목 남김.
  - `PlanCard.tsx`: 에이전트가 마지막으로 수정한 카드에 "↩ Revert" 버튼 표시 (사람만 볼 수 있고 누를 수 있음 — 에이전트에게는 WebMCP 도구로 노출되지 않음).
  - 검증: Playwright로 에이전트가 수정한 카드 → Revert 클릭 → 제목/상태 원복 + 활동 로그 확인, 정상 동작 확인.
- **보류(다음 후보)**: 대량 변경(예: `rebalance_plan` 이후 여러 `update_item` 연속 호출) 전체를 한 번에 승인/취소하는 "제안 미리보기" 흐름은 아직 없음 — 지금은 카드 단위 되돌리기만 가능. 필요성이 커지면 별도 Phase로 분리.

### Phase 7 — 실시간 협업 확장
- localStorage → 서버 기반 동기화(WebSocket 또는 CRDT)로 전환해 실제로 여러 탭/기기에서 "함께" 볼 수 있게.
- 여러 워크스페이스 지원 (`Workspace.id`는 이미 있으나 UI에서 전환 불가).

### Phase 8 — 품질 & 배포
- Vitest + React Testing Library로 스토어/컴포넌트 테스트 추가.
- `CardEditor` 쪽에도 날짜 포맷 검증 등 동일한 유효성 검사 적용.
- CI(빌드+린트) 파이프라인, 배포 타겟 결정 (Vercel/Netlify 등).

## 6. 결정이 필요한 열린 질문

1. 이 프로젝트가 데모/포트폴리오용인지, 실제 다중 사용자 제품으로 확장할지에 따라 Phase 7의 우선순위가 크게 달라짐.
2. ~~에이전트의 자율성 범위 — 락 해제~~는 Phase 6에서 "사람 전용"으로 결정됨. 남은 질문: 대량 수정(여러 카드 연속 변경)까지 사람 승인 없이 허용할지 — 지금은 카드 단위 되돌리기로 완화만 해둔 상태.
3. 다중 워크스페이스가 필요한 시점 (지금은 단일 워크스페이스로 충분한지).
