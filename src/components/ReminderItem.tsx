import { useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Check, Pencil, Trash2, X } from "lucide-react";
import type { Category, Reminder } from "@/types/project";

const UNLINKED_VALUE = "__none__";

export function buildTargetValue(r: Pick<Reminder, "categoryId" | "itemId">) {
  if (r.itemId && r.categoryId) return `item:${r.categoryId}:${r.itemId}`;
  if (r.categoryId) return `cat:${r.categoryId}`;
  return UNLINKED_VALUE;
}

export function parseTargetValue(value: string): { categoryId?: string; itemId?: string } {
  if (value === UNLINKED_VALUE) return {};
  if (value.startsWith("cat:")) {
    return { categoryId: value.slice(4) };
  }
  if (value.startsWith("item:")) {
    const rest = value.slice(5);
    const sep = rest.indexOf(":");
    if (sep === -1) return {};
    return { categoryId: rest.slice(0, sep), itemId: rest.slice(sep + 1) };
  }
  return {};
}

export function renderTargetOptions(categories: Category[]) {
  const nodes: ReactNode[] = [];
  nodes.push(
    <SelectItem key="__none__" value={UNLINKED_VALUE}>
      Unlinked
    </SelectItem>
  );
  for (const c of categories) {
    nodes.push(
      <SelectItem key={`cat-${c.id}`} value={`cat:${c.id}`}>
        <span className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: c.color }}
          />
          {c.name}
        </span>
      </SelectItem>
    );
    for (const i of c.items) {
      nodes.push(
        <SelectItem key={`item-${c.id}-${i.id}`} value={`item:${c.id}:${i.id}`}>
          <span className="flex items-center gap-2 pl-4">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: c.color }}
            />
            <span className="text-muted-foreground">{c.name} ·</span>
            {i.name}
          </span>
        </SelectItem>
      );
    }
  }
  return nodes;
}

interface ReminderItemProps {
  reminder: Reminder;
  categories: Category[];
  showTargetLabel?: boolean;
  /** When true, show only a colored dot (with hover tooltip) instead of the category name text. */
  targetAsDotOnly?: boolean;
  onUpdate: (
    reminderId: string,
    updates: Partial<Pick<Reminder, "text" | "categoryId" | "itemId">>
  ) => void;
  onDelete: (reminderId: string) => void;
}

export function ReminderItem({
  reminder,
  categories,
  showTargetLabel = true,
  targetAsDotOnly = false,
  onUpdate,
  onDelete,
}: ReminderItemProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(reminder.text);
  const [editTarget, setEditTarget] = useState<string>(buildTargetValue(reminder));

  const getTargetLabel = (): { label: string; color?: string } | null => {
    if (!reminder.categoryId) return null;
    const cat = categories.find((c) => c.id === reminder.categoryId);
    if (!cat) return null;
    if (reminder.itemId) {
      const item = cat.items.find((i) => i.id === reminder.itemId);
      if (item) return { label: `${cat.name} · ${item.name}`, color: cat.color };
    }
    return { label: cat.name, color: cat.color };
  };

  const handleSave = () => {
    const trimmed = editText.trim();
    const updates: Partial<Pick<Reminder, "text" | "categoryId" | "itemId">> = {};
    if (trimmed && trimmed !== reminder.text) updates.text = trimmed;
    const parsed = parseTargetValue(editTarget);
    if (parsed.categoryId !== reminder.categoryId) updates.categoryId = parsed.categoryId;
    if (parsed.itemId !== reminder.itemId) updates.itemId = parsed.itemId;
    if (Object.keys(updates).length > 0) {
      onUpdate(reminder.id, updates);
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setEditText(reminder.text);
    setEditTarget(buildTargetValue(reminder));
    setEditing(false);
  };

  const handleStartEdit = () => {
    setEditText(reminder.text);
    setEditTarget(buildTargetValue(reminder));
    setEditing(true);
  };

  const target = getTargetLabel();

  if (editing) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px_auto_auto] gap-2 items-center px-3 py-2 rounded-lg border border-border bg-muted/20">
        <Input
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          placeholder="Reminder text"
          className="h-9"
          autoFocus
        />
        <Select value={editTarget} onValueChange={setEditTarget}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Link to…" />
          </SelectTrigger>
          <SelectContent>{renderTargetOptions(categories)}</SelectContent>
        </Select>
        <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 w-8 p-0 text-success">
          <Check className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 w-8 p-0 text-muted-foreground">
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="group flex items-start gap-2 px-3 py-2 rounded-lg border border-border bg-muted/20 cursor-pointer"
      onDoubleClick={() => handleStartEdit()}
    >
      {targetAsDotOnly && target?.color ? (
        <span
          className="h-2.5 w-2.5 mt-1.5 rounded-full shrink-0 border border-border/40"
          style={{ backgroundColor: target.color }}
          title={target.label}
          aria-label={target.label}
        />
      ) : (
        <Bell className="h-3.5 w-3.5 mt-1 shrink-0 text-muted-foreground" />
      )}
      <div className="flex-1 min-w-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-sm text-foreground break-words whitespace-pre-wrap">
          {reminder.text}
        </span>
        {showTargetLabel && !targetAsDotOnly && target && (
          <span className="text-muted-foreground text-xs flex items-center gap-1.5">
            <span>·</span>
            {target.color && (
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: target.color }}
              />
            )}
            <span>{target.label}</span>
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={handleStartEdit}
        aria-label="Edit reminder"
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(reminder.id)}
        aria-label="Delete reminder"
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
