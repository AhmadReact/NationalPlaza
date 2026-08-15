"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function DragHandle({
  setActivatorNodeRef,
  attributes,
  listeners,
  disabled,
}: {
  setActivatorNodeRef: (node: HTMLElement | null) => void;
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      disabled={disabled}
      aria-label="Drag to reorder"
      className="grid h-8 w-8 shrink-0 cursor-grab place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-brand-50 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden
      >
        <circle cx="5" cy="3.5" r="1.25" />
        <circle cx="11" cy="3.5" r="1.25" />
        <circle cx="5" cy="8" r="1.25" />
        <circle cx="11" cy="8" r="1.25" />
        <circle cx="5" cy="12.5" r="1.25" />
        <circle cx="11" cy="12.5" r="1.25" />
      </svg>
    </button>
  );
}

function SortableRow({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.85 : undefined,
        zIndex: isDragging ? 10 : undefined,
        position: "relative",
      }}
      className={isDragging ? "shadow-lg" : undefined}
    >
      <div className="flex gap-2">
        <div className="pt-2.5">
          <DragHandle
            setActivatorNodeRef={setActivatorNodeRef}
            attributes={attributes}
            listeners={listeners}
            disabled={disabled}
          />
        </div>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  disabled,
  className,
  renderItem,
}: {
  items: T[];
  onReorder: (nextItems: T[]) => void;
  disabled?: boolean;
  className?: string;
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    if (disabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === String(active.id));
    const newIndex = items.findIndex((item) => item.id === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
        disabled={disabled}
      >
        <div className={className}>
          {items.map((item, index) => (
            <SortableRow key={item.id} id={item.id} disabled={disabled}>
              {renderItem(item, index)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
