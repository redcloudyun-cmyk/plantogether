# 인수인계 문서 (2026-09-01 갱신, Claude Sonnet 5)

이 문서는 세션 간 인계용 상태 스냅샷입니다. 최신 정보는 항상 `PLAN_TOGETHER_DEVELOPMENT_PLAN.md`(상단 안내문 + 하단 "43. 구현 상태" 절)를 우선하고, 이 문서는 "지금 당장 뭘 해야 하는지"에 집중합니다.

## 현재 커밋 상태

- 최신 커밋: `b8e7643` — "Add i18n, real WithGeX logo/sidebar, priority field, and Agent Mission"
- 브랜치: `main`, `origin/main`과 완전히 동기화됨. CI/배포 확인 완료 (통과).
- 라이브 URL:
  - **https://redcloudyun-cmyk.github.io/plantogether/** — 이 저장소의 GitHub Actions가 직접 배포, 항상 `main` 최신 커밋과 동기화됨. **신뢰 가능, 확인 결과 최신 반영됨.**
  - **https://withgex-test.agex.site/** — 다른 세션/도구가 운영하는 별도 배포로 추정. **2026-09-01 기준 최신 커밋(`b8e7643`)을 반영하지 못하고 있음을 확인** — 여전히 텍스트 로고, "Mina Park" 구버전 owner 표기, Agent Mission 카드 없음. 이 세션은 여기 배포 권한이 없어 직접 갱신 불가. **다음 작업자는 이 URL을 사용하기 전에 최신 화면인지 반드시 재확인할 것.**

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

## 아직 안 한 일 / 알려진 이슈

1. **`withgex-test.agex.site` 배포 지연** — 위 참고. 이 배포를 누가/어떻게 갱신하는지 이 세션은 모름. Devpost 제출 전 반드시 확인·해결 필요.
2. **Chrome 실환경 WebMCP Judge Test 미수행** — 자동화 환경(Playwright)에서는 `document.modelContext`를 모킹해서 5개 도구 호출/UI 갱신/Proposal/Lock/Revert를 전부 검증했지만, **실제 Chrome 149+ 의 `chrome://flags/#enable-webmcp-testing` 활성화 환경 + 실제 MCP 클라이언트로는 검증하지 못함** — 이 환경엔 그런 브라우저/클라이언트가 없음. 사람이 실제 Chrome에서 한 번 더 확인해야 함.
3. **§36 데모 영상 실제 녹화 + 내레이션 타이밍 리허설** — 사람이 직접 해야 함.
4. Context Scope 토글은 아직 정적 표시(값은 store에 있지만 UI에서 실제로 토글해서 도구 동작을 바꾸지는 않음).
5. `mockup/`(ChatGPT 생성 참고 이미지 4장)과 `logo/withgex logo png.png`(중복 파일, `src/assets/withgex-logo.png`와 동일)는 의도적으로 커밋 제외함 — 필요 없으면 정리해도 됨.

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
