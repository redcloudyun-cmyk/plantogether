import { useWorkspaceStore } from '../store/workspaceStore';

export type ScreenId = 'dashboard' | 'workspace' | 'activity' | 'settings';

const NAV: { id: ScreenId; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '⌂' },
  { id: 'workspace', label: 'Workspace', icon: '◇' },
  { id: 'activity', label: 'Activity', icon: '✧' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

interface HeaderProps {
  screen: ScreenId;
  onScreenChange: (screen: ScreenId) => void;
}

export default function Header({ screen, onScreenChange }: HeaderProps) {
  const webmcpAvailable = useWorkspaceStore((state) => state.webmcpAvailable);

  return (
    <aside className="w-48 xl:w-52 flex-shrink-0 bg-[#071b31] text-white flex flex-col px-3 py-5">
      <div className="px-3 mb-10">
        <div className="text-[27px] font-bold tracking-tight leading-none bg-gradient-to-r from-sky-400 via-white to-emerald-400 bg-clip-text text-transparent">
          WithGeX
        </div>
        <p className="text-xs text-slate-300 mt-2">PlanTogether</p>
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
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto">
        <div className="flex items-center gap-2 px-3 py-3 border-b border-white/10">
          <span className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold">MP</span>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">Mina Park</p>
            <p className="text-[10px] text-slate-400">Owner</p>
          </div>
        </div>
        <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className={`w-2 h-2 rounded-full ${webmcpAvailable ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            WebMCP
          </div>
          <p className={`text-xs mt-1 ml-4 ${webmcpAvailable ? 'text-emerald-400' : 'text-slate-400'}`}>
            {webmcpAvailable ? 'Connected' : 'Unavailable'}
          </p>
          <p className="text-[10px] text-slate-400 mt-4">Tools Available <span className="float-right text-blue-400">5 / 5</span></p>
        </div>
      </div>
    </aside>
  );
}
