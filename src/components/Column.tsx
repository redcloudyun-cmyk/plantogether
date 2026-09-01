import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { PlanItem, ItemStatus } from '../types/workspace';
import PlanCard from './PlanCard';

interface ColumnProps {
  id: ItemStatus;
  title: string;
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

export default function Column({ id, title, items, onEditCard, onAddCard }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className={`flex flex-col min-h-0 rounded-xl transition-colors duration-200 ${
        isOver ? 'bg-primary-50/50' : ''
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-2 py-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${columnColors[id]}`} />
          <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
          <span className="text-xs text-text-tertiary bg-surface-secondary px-1.5 py-0.5 rounded-full font-medium">
            {items.length}
          </span>
        </div>
        <button
          onClick={() => onAddCard(id)}
          className="w-6 h-6 flex items-center justify-center rounded-md text-text-tertiary hover:text-text-secondary hover:bg-surface-secondary transition-all text-lg leading-none"
          title={`Add item to ${title}`}
        >
          +
        </button>
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        className="flex-1 flex flex-col gap-2 px-1 pb-2 min-h-[100px]"
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <PlanCard key={item.id} item={item} onEdit={onEditCard} />
          ))}
        </SortableContext>

        {items.length === 0 && (
          <div className="flex-1 flex items-center justify-center min-h-[80px]">
            <p className="text-xs text-text-tertiary">No items</p>
          </div>
        )}
      </div>
    </div>
  );
}
