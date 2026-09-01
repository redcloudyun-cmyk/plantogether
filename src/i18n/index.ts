import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'ko';

const en = {
  dashboard: 'Dashboard', workspace: 'Workspace', activity: 'Activity', settings: 'Settings',
  owner: 'Owner', tagline: 'Human + Agent collaborative planning', connected: 'Connected', unavailable: 'Unavailable',
  webmcp: 'WebMCP', resetDemo: 'Reset Demo', observeMode: 'Observe Mode', assistMode: 'Assist Mode', autonomousMode: 'Autonomous Mode',
  language: 'Language', english: 'English', korean: '한국어', liveHumanContext: 'AGENT CONTEXT', selected: 'Human currently focused on',
  status: 'Status', due: 'Due', priority: 'Priority', locked: 'Locked', byYou: 'By you', lastEdited: 'Last Edited', sharedWithAgent: 'Context updated just now',
  noCardSelected: 'No card selected. Select a card to share it as live context with the agent.', aiPlanAnalysis: 'AI PLAN ANALYSIS',
  conflicts: 'Conflicts', blocked: 'Blocked', atRisk: 'At Risk', onTrack: 'On Track', viewAnalysis: 'View Analysis', hideAnalysis: 'Hide Analysis', noConflicts: 'No conflicts detected.',
  contextScope: 'CONTEXT SCOPE (What AI Sees)', currentItem: 'Current item', boardState: 'Board state', dependencies: 'Dependencies', planStatus: 'Plan status', activityHistory: 'Activity history', completedItems: 'Completed items', teamInformation: 'Team information',
  aiPermissions: 'AI PERMISSIONS', readWorkspace: 'Read workspace', createItem: 'Create item', updateLow: 'Update (low risk)', updateMedium: 'Update (medium risk)', updateHigh: 'Update (high risk)', delete: 'Delete', lockUnlock: 'Lock / unlock',
  allowed: 'Allowed', autoApply: 'Auto Apply', requireApproval: 'Require Approval', noItems: 'No items',
  todaysCollaboration: "TODAY'S COLLABORATION", humanActions: 'Human Actions', agentActions: 'Agent Actions', proposals: 'Proposals', approved: 'Approved', rejected: 'Rejected', reverted: 'Reverted', planHealth: 'PLAN HEALTH', agent: 'AGENT', toolsAvailable: 'Tools Available', openWorkspace: 'Open Workspace', criticalPath: 'CRITICAL PATH',
  settingsSubtitle: 'Manage connection, tools, permissions, autonomy and AI context.', activitySubtitle: 'Real-time activity and audit trail of human and agent actions.', workspaceSubtitle: 'One workspace. Human and agent. Working together.', dashboardSubtitle: 'One shared source of truth with human authority.',
  sharedWorkspace: 'HUMAN-AGENT SHARED WORKSPACE', sharedWorkspaceHeadline: 'One workspace. Human and agent. Working together.', sharedWorkspaceBody: 'See what is at risk, what the agent found, and which decisions still require human approval.', analyzeImprove: 'Analyze & Improve My Plan',
  agentMission: 'AGENT MISSION', missionGoal: 'Review the launch plan and identify anything that could delay delivery.', waitingApproval: 'WAITING FOR HUMAN APPROVAL', analysisComplete: 'ANALYSIS COMPLETE', ready: 'READY', workspaceRead: 'Workspace context read', focusDetected: 'Human focus detected', tasksAvailable: 'tasks available for analysis', planRisksFound: 'plan risks found', criticalCalculated: 'Critical path calculated', improvementsProposed: 'improvements proposed',
  agentProposal: 'Agent Proposal', changesProposed: 'changes proposed', itemsUpdated: 'items will be updated', reviewIndividually: 'Review Individually', rejectAll: 'Reject All', acceptAll: 'Accept All', currentPlan: 'CURRENT PLAN', proposedPlan: 'PROPOSED PLAN', health: 'health', task: 'Task', field: 'Field', current: 'Current', proposed: 'Proposed', risk: 'Risk', reason: 'Why', impact: 'Impact', decision: 'Decision', cancel: 'Cancel', applySelected: 'Apply Selected',
  all: 'All', human: 'Human', agentActionsFilter: 'Agent', proposalsFilter: 'Proposals', actor: 'Actor', tool: 'Tool', result: 'Result', detail: 'Detail', noActivity: 'No activity yet. Human and agent actions will appear here as they happen.', noMatchingEvents: 'No events match this filter.',
  resetWorkspace: 'Reset Workspace', resetQuestion: 'Reset demo workspace?', resetExplanation: 'This clears every card, lock, activity entry, and pending proposal back to the starting demo state.', reset: 'Reset',
};

const ko: typeof en = {
  dashboard: '대시보드', workspace: '워크스페이스', activity: '활동', settings: '설정',
  owner: '소유자', tagline: '사람과 에이전트의 협업 계획', connected: '연결됨', unavailable: '사용 불가',
  webmcp: 'WebMCP', resetDemo: '데모 초기화', observeMode: '관찰 모드', assistMode: '지원 모드', autonomousMode: '자율 모드',
  language: '언어', english: 'English', korean: '한국어', liveHumanContext: '에이전트 컨텍스트', selected: '사람이 현재 보고 있는 항목',
  status: '상태', due: '마감일', priority: '우선순위', locked: '잠김', byYou: '사용자가 잠금', lastEdited: '마지막 수정', sharedWithAgent: '방금 컨텍스트가 갱신됨',
  noCardSelected: '선택된 카드가 없습니다. 카드를 선택하면 에이전트와 실시간 컨텍스트를 공유합니다.', aiPlanAnalysis: 'AI 계획 분석',
  conflicts: '충돌', blocked: '차단됨', atRisk: '위험', onTrack: '정상', viewAnalysis: '분석 보기', hideAnalysis: '분석 숨기기', noConflicts: '감지된 충돌이 없습니다.',
  contextScope: '컨텍스트 범위 (AI가 보는 정보)', currentItem: '현재 항목', boardState: '보드 상태', dependencies: '의존성', planStatus: '계획 상태', activityHistory: '활동 기록', completedItems: '완료 항목', teamInformation: '팀 정보',
  aiPermissions: 'AI 권한', readWorkspace: '워크스페이스 읽기', createItem: '항목 생성', updateLow: '업데이트 (낮은 위험)', updateMedium: '업데이트 (중간 위험)', updateHigh: '업데이트 (높은 위험)', delete: '삭제', lockUnlock: '잠금 / 해제',
  allowed: '허용', autoApply: '자동 적용', requireApproval: '승인 필요', noItems: '항목 없음',
  todaysCollaboration: '오늘의 협업', humanActions: '사람 작업', agentActions: '에이전트 작업', proposals: '제안', approved: '승인됨', rejected: '거절됨', reverted: '되돌림', planHealth: '계획 상태', agent: '에이전트', toolsAvailable: '사용 가능한 도구', openWorkspace: '워크스페이스 열기', criticalPath: '주요 경로',
  settingsSubtitle: '연결, 도구, 권한, 자율성과 AI 컨텍스트를 관리합니다.', activitySubtitle: '사람과 에이전트 작업의 실시간 활동 및 감사 기록입니다.', workspaceSubtitle: '하나의 워크스페이스. 사람과 에이전트가 함께 일합니다.', dashboardSubtitle: '사람의 통제권이 유지되는 하나의 공유 정보 원천입니다.',
  sharedWorkspace: '사람-에이전트 공유 워크스페이스', sharedWorkspaceHeadline: '하나의 워크스페이스. 사람과 에이전트가 함께 일합니다.', sharedWorkspaceBody: '계획의 위험, 에이전트가 발견한 내용, 사람의 승인이 필요한 결정을 확인하세요.', analyzeImprove: '계획 분석 및 개선',
  agentMission: '에이전트 미션', missionGoal: '출시 계획을 검토하고 일정 지연 가능성을 찾습니다.', waitingApproval: '사람의 승인 대기 중', analysisComplete: '분석 완료', ready: '준비됨', workspaceRead: '워크스페이스 컨텍스트 확인', focusDetected: '사람의 현재 포커스 확인', tasksAvailable: '개 작업 분석 가능', planRisksFound: '개의 계획 위험 발견', criticalCalculated: '주요 경로 계산 완료', improvementsProposed: '개의 개선안 제안',
  agentProposal: '에이전트 제안', changesProposed: '개 변경 제안', itemsUpdated: '개 항목 업데이트 예정', reviewIndividually: '개별 검토', rejectAll: '모두 거절', acceptAll: '모두 승인', currentPlan: '현재 계획', proposedPlan: '제안 계획', health: '계획 점수', task: '업무', field: '필드', current: '현재', proposed: '제안', risk: '위험', reason: '이유', impact: '영향', decision: '결정', cancel: '취소', applySelected: '선택 적용',
  all: '전체', human: '사람', agentActionsFilter: '에이전트', proposalsFilter: '제안', actor: '행위자', tool: '도구', result: '결과', detail: '상세', noActivity: '아직 활동이 없습니다. 사람과 에이전트의 작업이 여기에 표시됩니다.', noMatchingEvents: '이 필터와 일치하는 이벤트가 없습니다.',
  resetWorkspace: '워크스페이스 초기화', resetQuestion: '데모 워크스페이스를 초기화할까요?', resetExplanation: '모든 카드, 잠금, 활동 기록과 대기 중인 제안을 시작 상태로 되돌립니다.', reset: '초기화',
};

export type TranslationKey = keyof typeof en;
const dictionaries = { en, ko };

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist((set) => ({ language: 'en', setLanguage: (language) => set({ language }) }), { name: 'withgex-language' })
);

export function useTranslation() {
  const language = useLanguageStore((state) => state.language);
  return { language, t: (key: TranslationKey) => dictionaries[language][key] };
}
