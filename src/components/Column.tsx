import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { PlanItem, ItemStatus } from '../types/workspace';
import PlanCard from './PlanCard';
import { useTranslation } from '../i18n';

interface ColumnProps {
  id: ItemStatus;
  items: PlanItem[];
  onEditCard: (item: PlanItem) => void;
  onAddCard: (status: ItemStatus) => void;
}

const columnColors: Record<ItemStatus, string> = {
  backlog: 'bg-slate-400',
  planned: 'bg-blue-400',
  doing: 'bg-amber-400',
  done: 'bg-green-400',
};

export default function Column({ id, items, onEditCard, onAddCard }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const { t } = useTranslation();

  return (
    <div
      className={`flex flex-col min-h-[390px] rounded-xl border transition-colors duration-200 ${
        id === 'doing' ? 'border-orange-200 bg-orange-50/30' : id === 'done' ? 'border-emerald-200 bg-emerald-50/30' : id === 'planned' ? 'border-blue-200 bg-blue-50/30' : 'border-border bg-white/60'
      } ${
        isOver ? 'ring-2 ring-primary-200' : ''
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-inherit">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${columnColors[id]}`} />
          <h2 className="text-sm font-semibold text-text-primary">{t(id)}</h2>
          <span className="text-xs text-text-tertiary bg-surface-secondary px-1.5 py-0.5 rounded-full font-medium">
            {items.length}
          </span>
        </div>
        <button
          onClick={() => onAddCard(id)}
          className="w-6 h-6 flex items-center justify-center rounded-md text-text-tertiary hover:text-text-secondary hover:bg-surface-secondary transition-all text-lg leading-none"
          title={`${t('addTask')}: ${t(id)}`}
        >
          +
        </button>
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        className="flex-1 flex flex-col gap-2 p-2 min-h-[100px]"
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <PlanCard key={item.id} item={item} onEdit={onEditCard} />
          ))}
        </SortableContext>

        {items.length === 0 && (
          <div className="flex-1 flex items-center justify-center min-h-[80px]">
            <p className="text-xs text-text-tertiary">{t('noItems')}</p>
          </div>
        )}
        <button onClick={() => onAddCard(id)} className="mt-auto w-full rounded-md border border-border bg-white py-2 text-xs text-text-secondary hover:text-primary-600 hover:border-primary-300">
          + {t('addTask')}
        </button>
      </div>
    </div>
  );
}
