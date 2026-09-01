# 인수인계 문서 (2026-09-01 갱신, Claude Sonnet 5)

이 문서는 세션 간 인계용 상태 스냅샷입니다. 최신 정보는 항상 `PLAN_TOGETHER_DEVELOPMENT_PLAN.md`(상단 안내문 + 하단 "43. 구현 상태" 절)를 우선하고, 이 문서는 "지금 당장 뭘 해야 하는지"에 집중합니다.

## 현재 커밋 상태

- 최신 커밋: `62eb579` — "Fix sidebar logo visibility and complete i18n coverage across the app"
- 브랜치: `main`, `origin/main`과 완전히 동기화됨. 커밋 직전/직후 `git fetch` + `git log HEAD..origin/main` 확인함(차이 없음). CI/배포는 push 직후 큐잉됨 — 다음 작업자는 `gh run list --repo redcloudyun-cmyk/plantogether --limit 3`로 성공 여부 재확인할 것.
- 라이브 URL:
  - **https://redcloudyun-cmyk.github.io/plantogether/** — 이 저장소의 GitHub Actions가 직접 배포, 항상 `main` 최신 커밋과 동기화됨. **신뢰 가능.**
  - **https://withgex-test.agex.site/** — 다른 세션/도구가 운영하는 별도 배포. 이 세션은 배포 권한이 없어 직접 갱신 불가. **다음 작업자는 이 URL을 사용하기 전에 최신 화면인지 반드시 재확인할 것.**
- **이번 라운드에서 고친 것**: 사용자가 스크린샷으로 "로고가 안 보임 / 다국어가 안 보임"이라고 지적. 원인 두 가지를 찾아 수정:
  1. 사이드바 로고가 검정 텍스트 PNG(`withgex-logo.png`)를 다크 네이비(`#071b31`) 배경에 쓰고 있어 실질적으로 안 보였음 → 흰색 텍스트 버전(`src/assets/withgex-logo-white.png`)으로 교체.
  2. 언어 토글이 Settings 화면 안에만 있어서 다른 화면에서는 아예 안 보였음 → `App.tsx`의 공용 TopBar에 전역 토글 추가. 또한 Board/Column/PlanCard/PlanAnalysisCard/CriticalPathCard/StatusBar/CardEditor/LiveHumanContext/Dashboard/SettingsScreen/ActivityScreen/AgentProposalPanel 전반에 걸쳐 한국어 전환 시 여전히 영어로 남아있던 카드 제목·상태/우선순위 라벨·통계 라벨·자율성 모드 라벨·테이블 헤더 등을 전부 찾아 번역 연결함. (Playwright로 EN/KO 양쪽 스크린샷 재확인 완료, 콘솔 에러 없음.)
  - **의도적으로 남겨둔 미번역 부분**(기존 세션들의 전례를 따름): `detectConflicts()`(`src/lib/planAnalysis.ts`)가 반환하는 `title`/`detail` 문자열은 하드코딩된 영어 문장이라 Plan Analysis 상세 목록, Critical Path 지연 배너, Dashboard의 "충돌" 카드 상세, Agent Mission 미니 패널에 여전히 영어로 표시됨. 완전히 고치려면 이 함수가 사전 조합된 문자열 대신 i18n 키 + 파라미터를 반환하도록 리팩터링해야 함 — 범위상 이번엔 제외. 그 외 `chrome://flags/#enable-webmcp-testing` 안내 배너, WebMCP 도구 설명(Settings›TOOLS), 자율성 모드 설명 문장(Settings›AUTONOMY)도 기술적 내용이라 영어 유지.

## 이번 세션(들)에서 한 일 (시간순 요약)

1. v1.1 → v1.4 계획 전환 (4-screen, Agent Proposal/Approval, Risk Autonomy, Plan Health 등).
2. 병행 세션(Antigravity IDE) 충돌 처리 — `feature/agent-proposal-approval` 브랜치 리뷰 후 병합(`8353911`).
3. Activity/Settings 화면 신규 구현(`60f015b`).
4. Test Gate(§37)/Judge Access Test(§38) Playwright 자동 수행 — **치명적 버그 발견·수정**: `update_item`이 status 안 건드려도 내부적으로 `status: undefined`를 넣어 WebMCP 5개 도구가 영구 등록 해제되는 버그(`4f52c94`).
5. Workspace를 목업 구조에 맞게 재구성 — Plan Analysis/Critical Path/인라인 Agent Proposal(`2f2291c`).
6. WithGeX로 브랜드명 전면 통일(`2951a2a`, `20a5b8e`, `79cfaf3`).
7. 파비콘을 WithGeX "W" 마크로 교체(`8a31dce`).
8. **(병행 세션이 완료)** 목업 시각 품질에 맞춘 UI 리빌드(`893bfa7` "Rebuild UI to match WithGeX mockups").
9. **(병행 세션이 작업, 이 세션이 검증 후 커밋)** i18n(영/한, 기본 영어, localStorage 저장) 전체 화면 연결, 실제 투명 WithGeX 로고 이미지로 좌측 다크 사이드바 구현, `priority`(low/medium/high) 필드 store/WebMCP/UI 전체 연동, localStorage 마이그레이션(`migratePersistedWorkspace`), Agent Mission 카드(실제 activity log/proposal 기반, 가짜 아님), Proposal Before/After Plan Health 계산(`proposalImpact.ts`), 테스트 47개로 확장(`b8e7643`).
10. **(이 세션)** 로고 가시성 및 i18n 커버리지 완결(`62eb579`) — 위 "이번 라운드에서 고친 것" 참고.

## 아직 안 한 일 / 알려진 이슈

1. **`withgex-test.agex.site` 배포 지연 가능성** — 이 배포를 누가/어떻게 갱신하는지 이 세션은 모름. Devpost 제출 전 반드시 최신 커밋(`62eb579`) 반영 여부 확인·해결 필요.
2. **Chrome 실환경 WebMCP Judge Test 미수행** — 자동화 환경(Playwright)에서는 `document.modelContext`를 모킹해서 5개 도구 호출/UI 갱신/Proposal/Lock/Revert를 전부 검증했지만, **실제 Chrome 149+ 의 `chrome://flags/#enable-webmcp-testing` 활성화 환경 + 실제 MCP 클라이언트로는 검증하지 못함** — 이 환경엔 그런 브라우저/클라이언트가 없음. 사람이 실제 Chrome에서 한 번 더 확인해야 함.
3. **§36 데모 영상 실제 녹화 + 내레이션 타이밍 리허설** — 사람이 직접 해야 함.
4. Context Scope 토글은 아직 정적 표시(값은 store에 있지만 UI에서 실제로 토글해서 도구 동작을 바꾸지는 않음).
5. `mockup/`(ChatGPT 생성 참고 이미지 4장)과 `logo/` 폴더의 원본 로고 파일들(`withgex logo png.png`, `withgex logo 2 png.png` — 가공된 버전이 `src/assets/withgex-logo.png`, `withgex-logo-white.png`로 이미 들어가 있음)은 의도적으로 커밋 제외함 — 필요 없으면 정리해도 됨.
6. **`detectConflicts()`의 하드코딩된 영어 문자열** — Plan Analysis 상세, Critical Path 지연 배너, Dashboard 충돌 카드, Agent Mission 미니 패널에서 여전히 영어로 표시됨(위 참고). i18n 키/파라미터 기반으로 리팩터링하면 완전히 해결 가능하지만 아직 미착수.

## 작업 전 필수 확인사항

1. **`git fetch origin` 후 `git log HEAD..origin/main`으로 차이 확인 먼저** — 병행 세션이 계속 작업 중일 수 있음. 다르면 리뷰 후 병합, 절대 덮어쓰지 말 것.
2. **"WithGeX" 브랜딩 유지** — "PlanTogether"/"plantogether" 사용자 대면 텍스트 복원 금지. 예외: 실제 GitHub repo URL, `vite.config.ts`의 base 경로, 내부 개발계획 문서의 과거 기록.
3. **커밋 전 항상 검증**: `npm run lint && npm test && npm run build` 전부 통과 확인.
4. **Devpost 챌린지 제출용 프로젝트** — §40 구현 금지 목록(Multi-user, Documents, RAG, MCP Server, Multi Agent 등) 벗어나지 말 것.

## 빠른 검증 명령어

```bash
cd "f:/개발 프로젝트/PlanTogether project"
npm install
npm run lint
npm test
npm run build
npm run dev   # 로컬 확인용
```
