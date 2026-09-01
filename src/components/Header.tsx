import { useWorkspaceStore } from '../store/workspaceStore';
import withgexLogo from '../assets/withgex-logo.png';
import { useTranslation, type TranslationKey } from '../i18n';

export type ScreenId = 'dashboard' | 'workspace' | 'activity' | 'settings';

const NAV: { id: ScreenId; label: TranslationKey; icon: string }[] = [
  { id: 'dashboard', label: 'dashboard', icon: '⌂' },
  { id: 'workspace', label: 'workspace', icon: '◇' },
  { id: 'activity', label: 'activity', icon: '✧' },
  { id: 'settings', label: 'settings', icon: '⚙' },
];

interface HeaderProps {
  screen: ScreenId;
  onScreenChange: (screen: ScreenId) => void;
}

export default function Header({ screen, onScreenChange }: HeaderProps) {
  const webmcpAvailable = useWorkspaceStore((state) => state.webmcpAvailable);
  const { t } = useTranslation();

  return (
    <aside className="w-48 xl:w-52 flex-shrink-0 bg-[#071b31] text-white flex flex-col px-3 py-5">
      <div className="px-2 mb-10">
        <img
          src={withgexLogo}
          alt="WithGeX"
          className="w-full max-w-[168px] h-auto object-contain"
        />
      </div>

      <nav className="flex flex-col gap-2" aria-label="Primary navigation">
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => onScreenChange(item.id)}
            className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-left transition-colors ${
              screen === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-200 hover:bg-white/10'
            }`}
          >
            <span className="w-5 text-center text-lg" aria-hidden="true">{item.icon}</span>
            {t(item.label)}
          </button>
        ))}
      </nav>

      <div className="mt-auto">
        <div className="flex items-center gap-2 px-3 py-3 border-b border-white/10">
          <span className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold">EJ</span>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">Emily Johnson</p>
            <p className="text-[10px] text-slate-400">{t('owner')}</p>
          </div>
        </div>
        <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className={`w-2 h-2 rounded-full ${webmcpAvailable ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            {t('webmcp')}
          </div>
          <p className={`text-xs mt-1 ml-4 ${webmcpAvailable ? 'text-emerald-400' : 'text-slate-400'}`}>
            {webmcpAvailable ? t('connected') : t('unavailable')}
          </p>
          <p className="text-[10px] text-slate-400 mt-4">{t('toolsAvailable')} <span className="float-right text-blue-400">5 / 5</span></p>
        </div>
      </div>
    </aside>
  );
}
