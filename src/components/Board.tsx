import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useWorkspaceStore } from '../store/workspaceStore';
import type { PlanItem, ItemStatus } from '../types/workspace';
import { COLUMNS } from '../types/workspace';
import Column from './Column';
import CardEditor from './CardEditor';
import PlanCard from './PlanCard';

export default function Board() {
  const items = useWorkspaceStore((s) => s.items);
  const moveItem = useWorkspaceStore((s) => s.moveItem);
  const selectItem = useWorkspaceStore((s) => s.selectItem);
  const addActivityLog = useWorkspaceStore((s) => s.addActivityLog);

  const [activeItem, setActiveItem] = useState<PlanItem | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PlanItem | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<ItemStatus>('backlog');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columnItems = useMemo(() => {
    const grouped: Record<ItemStatus, PlanItem[]> = {
      backlog: [],
      planned: [],
      doing: [],
      done: [],
    };
    items.forEach((item) => {
      grouped[item.status].push(item);
    });
    return grouped;
  }, [items]);

  const handleDragStart = (event: DragStartEvent) => {
    const item = items.find((i) => i.id === event.active.id);
    if (item) setActiveItem(item);
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // We handle moves in onDragEnd for simplicity
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dropped over a column
    const targetColumn = COLUMNS.find((c) => c.id === overId);
    if (targetColumn) {
      applyMove(activeId, targetColumn.id);
      return;
    }

    // Check if dropped over another card — move to that card's column
    const overItem = items.find((i) => i.id === overId);
    if (overItem) {
      const currentItem = items.find((i) => i.id === activeId);
      if (currentItem && currentItem.status !== overItem.status) {
        applyMove(activeId, overItem.status);
      }
    }
  };

  const applyMove = (itemId: string, newStatus: ItemStatus) => {
    const result = moveItem(itemId, newStatus, 'human');
    if (!result.success) {
      const item = items.find((i) => i.id === itemId);
      addActivityLog({
        source: 'human',
        action: 'Blocked',
        detail: `"${item?.title}"\n${result.reason}`,
        status: 'blocked',
      });
    }
  };

  const handleEditCard = (item: PlanItem) => {
    setEditingItem(item);
    setEditorOpen(true);
  };

  const handleAddCard = (status: ItemStatus) => {
    setEditingItem(null);
    setDefaultStatus(status);
    setEditorOpen(true);
  };

  const handleBoardClick = () => {
    selectItem(null);
  };

  return (
    <>
      <div className="p-4 pb-0" onClick={handleBoardClick}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-4 gap-3">
            {COLUMNS.map((col) => (
              <Column
                key={col.id}
                id={col.id}
                items={columnItems[col.id]}
                onEditCard={handleEditCard}
                onAddCard={handleAddCard}
              />
            ))}
          </div>

          <DragOverlay>
            {activeItem ? (
              <div className="rotate-2 opacity-90">
                <PlanCard item={activeItem} onEdit={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {editorOpen && (
        <CardEditor
          item={editingItem}
          defaultStatus={defaultStatus}
          onClose={() => {
            setEditorOpen(false);
            setEditingItem(null);
          }}
        />
      )}
    </>
  );
}
