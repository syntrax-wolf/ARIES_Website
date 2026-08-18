"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Columns2,
  RectangleHorizontal,
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
} from "lucide-react";
import type { ProfileBlock, ProfileBlockType } from "@/lib/types";
import { cn } from "@/lib/utils";

export const BLOCK_TYPE_LABELS: Record<ProfileBlockType, string> = {
  text: "About / Text",
  tools: "Tools & Skills",
  achievements: "Achievements",
  projects: "Projects",
  coursework: "Coursework",
  hobbies: "Hobbies & Interests",
  internships: "Internships / Experience",
  research: "Research / Publications",
};

export function emptyDataForType(type: ProfileBlockType): unknown {
  switch (type) {
    case "tools":
    case "hobbies":
    case "achievements":
    case "projects":
    case "coursework":
    case "internships":
      return [];
    case "text":
    case "research":
    default:
      return "";
  }
}

export function createBlock(type: ProfileBlockType): ProfileBlock {
  const id = `${type}-${Date.now()}`;
  return {
    id,
    type,
    span: "full",
    title: BLOCK_TYPE_LABELS[type],
    data: emptyDataForType(type),
  };
}

/** Drag-reorder, add, edit, delete profile content blocks. */
export function ProfileBlocksManager({
  blocks,
  onChange,
  editingBlockId,
  onEditingBlockIdChange,
  variant = "admin",
}: {
  blocks: ProfileBlock[];
  onChange: (blocks: ProfileBlock[]) => void;
  editingBlockId: string | null;
  onEditingBlockIdChange: (id: string | null) => void;
  variant?: "admin" | "profile";
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = blocks.map((b) => b.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    onChange(arrayMove(blocks, from, to));
  };

  const toggleSpan = (id: string) =>
    onChange(
      blocks.map((b) =>
        b.id === id ? { ...b, span: b.span === "full" ? "half" : "full" } : b,
      ),
    );

  const addBlock = (type: ProfileBlockType) => {
    const block = createBlock(type);
    onChange([...blocks, block]);
    onEditingBlockIdChange(block.id);
  };

  const shell =
    variant === "profile"
      ? "rounded-2xl bg-white/95 p-5 shadow-card-sm md:p-6"
      : "rounded-2xl bg-white p-6 shadow-card-sm";

  return (
    <div className={shell}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-ink">Page sections</h3>
          <p className="mt-1 text-xs text-ink/60">
            Add, edit, reorder, or remove sections on your profile.
          </p>
        </div>
        <AddBlockButton onAdd={addBlock} />
      </div>

      <DndContext
        id="profile-blocks-dnd"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <ul className="mt-5 grid grid-cols-2 gap-3">
            {blocks.map((b) => (
              <SortableBlockRow
                key={b.id}
                block={b}
                active={editingBlockId === b.id}
                onToggleSpan={() => toggleSpan(b.id)}
                onEdit={() =>
                  onEditingBlockIdChange(editingBlockId === b.id ? null : b.id)
                }
                onDelete={() => {
                  onChange(blocks.filter((x) => x.id !== b.id));
                  if (editingBlockId === b.id) onEditingBlockIdChange(null);
                }}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {blocks.length === 0 && (
        <p className="mt-4 text-xs text-ink/50">
          No sections yet — add one to build your profile page.
        </p>
      )}

      {editingBlockId && blocks.find((b) => b.id === editingBlockId) && (
        <BlockDataEditor
          block={blocks.find((b) => b.id === editingBlockId)!}
          onChange={(updated) =>
            onChange(blocks.map((b) => (b.id === updated.id ? updated : b)))
          }
          onClose={() => onEditingBlockIdChange(null)}
        />
      )}
    </div>
  );
}

function SortableBlockRow({
  block,
  active,
  onToggleSpan,
  onEdit,
  onDelete,
}: {
  block: ProfileBlock;
  active: boolean;
  onToggleSpan: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        gridColumn: block.span === "full" ? "1 / -1" : undefined,
      }}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2.5",
        active
          ? "border-purple/40 bg-purple/5"
          : "border-ink/10 bg-[#f8f4fc]",
        isDragging && "z-10 shadow-lg",
      )}
    >
      <button type="button" className="cursor-grab text-ink/40" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </button>
      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink">
        {block.title || block.type}
      </span>
      <button
        type="button"
        onClick={onEdit}
        className="rounded-lg p-1.5 text-ink/50 hover:bg-purple/10 hover:text-purple"
        title="Edit content"
      >
        <Pencil size={14} />
      </button>
      <button
        type="button"
        onClick={onToggleSpan}
        className="rounded-lg p-1.5 text-ink/50 hover:bg-white"
        title={block.span === "full" ? "Make half width" : "Make full width"}
      >
        {block.span === "full" ? <RectangleHorizontal size={14} /> : <Columns2 size={14} />}
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded-lg p-1.5 text-ink/40 hover:bg-red-50 hover:text-red-600"
        title="Delete section"
      >
        <Trash2 size={14} />
      </button>
    </li>
  );
}

function AddBlockButton({ onAdd }: { onAdd: (type: ProfileBlockType) => void }) {
  const [open, setOpen] = useState(false);
  const types = Object.entries(BLOCK_TYPE_LABELS) as [ProfileBlockType, string][];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg bg-purple px-3 py-2 text-xs font-bold text-white shadow-cta hover:opacity-90"
      >
        <Plus size={14} /> Add section <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-ink/10 bg-white py-1 shadow-lg">
          {types.map(([type, label]) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                onAdd(type);
                setOpen(false);
              }}
              className="block w-full px-4 py-2 text-left text-xs font-medium text-ink hover:bg-lilac"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BlockDataEditor({
  block,
  onChange,
  onClose,
}: {
  block: ProfileBlock;
  onChange: (block: ProfileBlock) => void;
  onClose: () => void;
}) {
  const update = (data: unknown) => onChange({ ...block, data });
  const updateTitle = (title: string) => onChange({ ...block, title });

  return (
    <div className="mt-5 rounded-xl border border-purple/20 bg-[#faf7ff] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-bold text-ink">
          Editing: {block.title || BLOCK_TYPE_LABELS[block.type]}
        </h4>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-bold text-purple hover:underline"
        >
          Done
        </button>
      </div>

      <label className="mb-4 block">
        <span className="text-xs font-semibold text-ink">Section title</span>
        <input
          value={block.title ?? ""}
          onChange={(e) => updateTitle(e.target.value)}
          className="mt-1 w-full rounded-lg bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple/40"
        />
      </label>

      {(block.type === "text" || block.type === "research") && (
        <TextBlockEditor data={block.data as string} onChange={update} />
      )}
      {(block.type === "tools" || block.type === "hobbies") && (
        <TagListEditor data={block.data as string[]} onChange={update} />
      )}
      {block.type === "achievements" && (
        <AchievementsEditor
          data={
            block.data as {
              year: string;
              title: string;
              org: string;
              description: string;
            }[]
          }
          onChange={update}
        />
      )}
      {block.type === "internships" && (
        <InternshipsEditor
          data={block.data as { role: string; org?: string; description: string }[]}
          onChange={update}
        />
      )}
      {block.type === "coursework" && (
        <CourseworkEditor
          data={block.data as { name: string; topics: string }[]}
          onChange={update}
        />
      )}
      {block.type === "projects" && (
        <ProjectsBlockEditor
          data={
            block.data as {
              name: string;
              description: string;
              tags: string[];
              links: { label: string; url: string }[];
            }[]
          }
          onChange={update}
        />
      )}
    </div>
  );
}

function TextBlockEditor({ data, onChange }: { data: string; onChange: (d: string) => void }) {
  return (
    <textarea
      value={data ?? ""}
      onChange={(e) => onChange(e.target.value)}
      rows={6}
      placeholder="Write your content here. Use blank lines for paragraphs."
      className="w-full rounded-lg bg-white px-3.5 py-2.5 text-sm leading-6 outline-none focus:ring-2 focus:ring-purple/40"
    />
  );
}

function TagListEditor({ data, onChange }: { data: string[]; onChange: (d: string[]) => void }) {
  const [input, setInput] = useState("");
  const items = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {items.map((tag, i) => (
          <span
            key={i}
            className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-ink shadow-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="ml-1 text-ink/40 hover:text-red-600"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) {
              e.preventDefault();
              onChange([...items, input.trim()]);
              setInput("");
            }
          }}
          placeholder="Type and press Enter"
          className="flex-1 rounded-lg bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple/40"
        />
        <button
          type="button"
          onClick={() => {
            if (input.trim()) {
              onChange([...items, input.trim()]);
              setInput("");
            }
          }}
          className="rounded-lg bg-purple/10 px-3 py-2 text-xs font-bold text-purple"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function AchievementsEditor({
  data,
  onChange,
}: {
  data: { year: string; title: string; org: string; description: string }[];
  onChange: (d: typeof data) => void;
}) {
  const items = Array.isArray(data) ? data : [];
  const addItem = () => onChange([...items, { year: "", title: "", org: "", description: "" }]);
  const updateItem = (i: number, patch: Partial<(typeof items)[0]>) =>
    onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const removeItem = (i: number) => onChange(items.filter((_, j) => j !== i));

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-ink/10 bg-white p-4">
          <div className="flex gap-2">
            <input
              value={item.year}
              onChange={(e) => updateItem(i, { year: e.target.value })}
              placeholder="Year"
              className="w-20 rounded bg-[#f3eef8] px-2 py-1.5 text-xs outline-none"
            />
            <input
              value={item.title}
              onChange={(e) => updateItem(i, { title: e.target.value })}
              placeholder="Title"
              className="flex-1 rounded bg-[#f3eef8] px-2 py-1.5 text-xs outline-none"
            />
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="text-ink/40 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <input
            value={item.org}
            onChange={(e) => updateItem(i, { org: e.target.value })}
            placeholder="Organization"
            className="w-full rounded bg-[#f3eef8] px-2 py-1.5 text-xs outline-none"
          />
          <textarea
            value={item.description}
            onChange={(e) => updateItem(i, { description: e.target.value })}
            placeholder="Description"
            rows={2}
            className="w-full rounded bg-[#f3eef8] px-2 py-1.5 text-xs outline-none"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1 text-xs font-bold text-purple"
      >
        <Plus size={14} /> Add achievement
      </button>
    </div>
  );
}

function InternshipsEditor({
  data,
  onChange,
}: {
  data: { role: string; org?: string; description: string }[];
  onChange: (d: typeof data) => void;
}) {
  const items = Array.isArray(data) ? data : [];
  const addItem = () => onChange([...items, { role: "", org: "", description: "" }]);
  const updateItem = (i: number, patch: Partial<(typeof items)[0]>) =>
    onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const removeItem = (i: number) => onChange(items.filter((_, j) => j !== i));

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-ink/10 bg-white p-4">
          <div className="flex gap-2">
            <input
              value={item.role}
              onChange={(e) => updateItem(i, { role: e.target.value })}
              placeholder="Role"
              className="flex-1 rounded bg-[#f3eef8] px-2 py-1.5 text-xs outline-none"
            />
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="text-ink/40 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <input
            value={item.org ?? ""}
            onChange={(e) => updateItem(i, { org: e.target.value })}
            placeholder="Organization"
            className="w-full rounded bg-[#f3eef8] px-2 py-1.5 text-xs outline-none"
          />
          <textarea
            value={item.description}
            onChange={(e) => updateItem(i, { description: e.target.value })}
            placeholder="Description"
            rows={2}
            className="w-full rounded bg-[#f3eef8] px-2 py-1.5 text-xs outline-none"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1 text-xs font-bold text-purple"
      >
        <Plus size={14} /> Add experience
      </button>
    </div>
  );
}

function CourseworkEditor({
  data,
  onChange,
}: {
  data: { name: string; topics: string }[];
  onChange: (d: typeof data) => void;
}) {
  const items = Array.isArray(data) ? data : [];
  const addItem = () => onChange([...items, { name: "", topics: "" }]);
  const updateItem = (i: number, patch: Partial<(typeof items)[0]>) =>
    onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const removeItem = (i: number) => onChange(items.filter((_, j) => j !== i));

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <input
            value={item.name}
            onChange={(e) => updateItem(i, { name: e.target.value })}
            placeholder="Course name"
            className="w-48 rounded bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-purple/40"
          />
          <input
            value={item.topics}
            onChange={(e) => updateItem(i, { topics: e.target.value })}
            placeholder="Topics covered"
            className="flex-1 rounded bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-purple/40"
          />
          <button
            type="button"
            onClick={() => removeItem(i)}
            className="text-ink/40 hover:text-red-600"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1 text-xs font-bold text-purple"
      >
        <Plus size={14} /> Add course
      </button>
    </div>
  );
}

function ProjectsBlockEditor({
  data,
  onChange,
}: {
  data: {
    name: string;
    description: string;
    tags: string[];
    links: { label: string; url: string }[];
  }[];
  onChange: (d: typeof data) => void;
}) {
  const items = Array.isArray(data) ? data : [];
  const addItem = () => onChange([...items, { name: "", description: "", tags: [], links: [] }]);
  const updateItem = (i: number, patch: Partial<(typeof items)[0]>) =>
    onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const removeItem = (i: number) => onChange(items.filter((_, j) => j !== i));

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-ink/10 bg-white p-4">
          <div className="flex gap-2">
            <input
              value={item.name}
              onChange={(e) => updateItem(i, { name: e.target.value })}
              placeholder="Project name"
              className="flex-1 rounded bg-[#f3eef8] px-2 py-1.5 text-xs outline-none"
            />
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="text-ink/40 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <textarea
            value={item.description}
            onChange={(e) => updateItem(i, { description: e.target.value })}
            placeholder="Description"
            rows={2}
            className="w-full rounded bg-[#f3eef8] px-2 py-1.5 text-xs outline-none"
          />
          <input
            value={(item.tags ?? []).join(", ")}
            onChange={(e) =>
              updateItem(i, {
                tags: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
            placeholder="Tags (comma-separated)"
            className="w-full rounded bg-[#f3eef8] px-2 py-1.5 text-xs outline-none"
          />
          {(item.links ?? []).map((link, li) => (
            <div key={li} className="flex gap-2">
              <input
                value={link.label}
                onChange={(e) => {
                  const links = [...(item.links ?? [])];
                  links[li] = { ...links[li], label: e.target.value };
                  updateItem(i, { links });
                }}
                placeholder="Link label"
                className="w-28 rounded bg-[#f3eef8] px-2 py-1.5 text-xs outline-none"
              />
              <input
                value={link.url}
                onChange={(e) => {
                  const links = [...(item.links ?? [])];
                  links[li] = { ...links[li], url: e.target.value };
                  updateItem(i, { links });
                }}
                placeholder="https://…"
                className="flex-1 rounded bg-[#f3eef8] px-2 py-1.5 text-xs outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  updateItem(i, { links: (item.links ?? []).filter((_, j) => j !== li) })
                }
                className="text-ink/40 hover:text-red-600"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              updateItem(i, { links: [...(item.links ?? []), { label: "", url: "" }] })
            }
            className="text-[11px] font-bold text-purple"
          >
            + Add link
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1 text-xs font-bold text-purple"
      >
        <Plus size={14} /> Add project
      </button>
    </div>
  );
}
