const SHARED = ['Current item', 'Board state', 'Dependencies', 'Plan status'];
const NOT_SHARED = ['Activity history', 'Completed items', 'Team information'];

export default function ContextScope() {
  return (
    <div className="px-4 py-3 border-b border-border flex-shrink-0">
      <h3 className="text-xs font-semibold text-text-secondary tracking-wide mb-3">
        CONTEXT SCOPE (What AI Sees)
      </h3>

      <div className="flex flex-col gap-1.5 mb-2">
        {SHARED.map((label) => (
          <div key={label} className="flex items-center gap-2 text-xs text-text-primary">
            <span className="w-3.5 h-3.5 rounded-sm bg-green-100 text-green-700 flex items-center justify-center text-[9px] flex-shrink-0">✓</span>
            {label}
          </div>
        ))}
        {NOT_SHARED.map((label) => (
          <div key={label} className="flex items-center gap-2 text-xs text-text-tertiary">
            <span className="w-3.5 h-3.5 rounded-sm border border-border flex-shrink-0" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
