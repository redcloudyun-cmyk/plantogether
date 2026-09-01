import { useWorkspaceStore } from '../store/workspaceStore';
import type { AutonomyMode } from '../types/workspace';
import ResetDemoButton from './ResetDemoButton';
import { useLanguageStore, useTranslation, type Language, type TranslationKey } from '../i18n';

const TOOLS = [
  { name: 'get_workspace_state', description: 'Read the full board — every item, status, owner, due date, lock, dependencies.' },
  { name: 'get_current_focus', description: 'Read the item the human currently has selected.' },
  { name: 'add_item', description: 'Create a new planning item. Always low-risk — applies immediately.' },
  { name: 'update_item', description: 'Edit an item. Risk depends on which fields change; risky changes become proposals.' },
  { name: 'analyze_plan', description: 'Read-only structured analysis of the plan, grouped by status and blockers.' },
];

const AUTONOMY_MODES: { id: AutonomyMode; labelKey: TranslationKey; hint: string }[] = [
  { id: 'observe', labelKey: 'observeMode', hint: 'Agent can read the workspace but cannot make any changes at all.' },
  { id: 'assist', labelKey: 'assistMode', hint: 'Low-risk edits apply automatically. Due date, status, and dependency changes need your approval.' },
  { id: 'autonomous', labelKey: 'autonomousMode', hint: 'Low & medium-risk edits apply automatically. Only high-risk changes (dependencies) need your approval.' },
];

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4 min-h-[190px]">
      <h2 className="text-xs font-semibold text-text-secondary tracking-wide mb-3">{title}</h2>
      {children}
    </div>
  );
}

export default function SettingsScreen() {
  const webmcpAvailable = useWorkspaceStore((s) => s.webmcpAvailable);
  const autonomyMode = useWorkspaceStore((s) => s.autonomyMode);
  const setAutonomyMode = useWorkspaceStore((s) => s.setAutonomyMode);
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const { t } = useTranslation();

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={t('language').toUpperCase()}>
          <label className="block text-xs text-text-tertiary mb-2" htmlFor="language-select">{t('language')}</label>
          <select id="language-select" value={language} onChange={(event) => setLanguage(event.target.value as Language)} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm">
            <option value="en">{t('english')}</option>
            <option value="ko">{t('korean')}</option>
          </select>
          <p className="text-xs text-text-tertiary mt-3">{t('languageDefaultNote')}</p>
        </Card>
        <Card title={t('webmcpStatusTitle')}>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${webmcpAvailable ? 'bg-green-500' : 'bg-text-tertiary'}`} />
            <span className="text-sm font-medium text-text-primary">
              {webmcpAvailable ? t('connected') : t('unavailable')}
            </span>
          </div>
          {!webmcpAvailable && (
            <p className="text-xs text-amber-600 mt-2">
              Enable WebMCP in Chrome 149+ via chrome://flags/#enable-webmcp-testing, then reload.
            </p>
          )}
        </Card>

        <Card title={t('toolsTitle')}>
          <div className="flex flex-col gap-2.5">
            {TOOLS.map((tool) => (
              <div key={tool.name} className="flex items-start gap-2 text-sm">
                <span className="text-green-600 mt-0.5">✓</span>
                <div>
                  <span className="font-mono text-text-primary">{tool.name}</span>
                  <p className="text-xs text-text-tertiary">{tool.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t('autonomyTitle')}>
          <div className="flex flex-col gap-2">
            {AUTONOMY_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setAutonomyMode(mode.id)}
                className={`text-left rounded-lg border px-3 py-2.5 transition-colors ${
                  autonomyMode === mode.id
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-border hover:bg-surface-secondary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                      autonomyMode === mode.id ? 'border-primary-600 bg-primary-600' : 'border-border'
                    }`}
                  />
                  <span className="text-sm font-medium text-text-primary">{t(mode.labelKey)}</span>
                </div>
                <p className="text-xs text-text-tertiary mt-1 ml-5">{mode.hint}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card title={t('contextTitle')}>
          <div className="flex flex-col gap-1.5">
            {([t('contextCurrentFocus'), t('contextWorkspaceState'), t('dependencies')]).map((label) => (
              <div key={label} className="flex items-center gap-2 text-sm text-text-primary">
                <span className="text-green-600">✓</span>
                {label}
              </div>
            ))}
          </div>
        </Card>

        <Card title={t('restrictedTitle')}>
          <div className="flex flex-col gap-1.5">
            {([t('restrictedDeleteItems'), t('restrictedLockUnlock'), t('restrictedManageUsers')]).map((label) => (
              <div key={label} className="flex items-center gap-2 text-sm text-text-tertiary">
                <span className="text-red-500">✗</span>
                {label}
              </div>
            ))}
          </div>
        </Card>

        <Card title={t('demoTitle')}>
          <ResetDemoButton variant="button" />
        </Card>
      </div>
    </div>
  );
}
