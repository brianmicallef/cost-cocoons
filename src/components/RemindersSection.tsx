import { useState, useEffect, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import type { Category, Reminder } from "@/types/project";

interface RemindersSectionProps {
  reminders: Reminder[];
  categories: Category[];
  onAddReminder: (text: string, categoryId?: string, itemId?: string) => void;
  onUpdateReminder: (
    reminderId: string,
    updates: Partial<Pick<Reminder, "text" | "categoryId" | "itemId">>
  ) => void;
  onDeleteReminder: (reminderId: string) => void;
  forceExpanded?: boolean;
  collapseSignal?: number;
}

const UNLINKED_VALUE = "__none__";

function buildTargetValue(r: Pick<Reminder, "categoryId" | "itemId">) {
  if (r.itemId && r.categoryId) return `item:${r.categoryId}:${r.itemId}`;
  if (r.categoryId) return `cat:${r.categoryId}`;
  return UNLINKED_VALUE;
}

function parseTargetValue(value: string): { categoryId?: string; itemId?: string } {
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

function renderTargetOptions(categories: Category[]) {
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

export function RemindersSection({
  reminders,
  categories,
  onAddReminder,
  onUpdateReminder,
  onDeleteReminder,
  forceExpanded,
  collapseSignal,
}: RemindersSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [newTarget, setNewTarget] = useState<string>(UNLINKED_VALUE);

  useEffect(() => {
    if (collapseSignal !== undefined && forceExpanded !== undefined) {
      setExpanded(forceExpanded);
    }
  }, [collapseSignal]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newText.trim();
    if (!trimmed) return;
    const parsed = parseTargetValue(newTarget);
    onAddReminder(trimmed, parsed.categoryId, parsed.itemId);
    setNewText("");
    setNewTarget(UNLINKED_VALUE);
    setAdding(false);
  };

  const handleCancelAdd = () => {
    setNewText("");
    setNewTarget(UNLINKED_VALUE);
    setAdding(false);
  };

  const handleStartAdd = () => {
    setExpanded(true);
    setAdding(true);
  };

  const getTargetLabel = (r: Reminder): { label: string; color?: string } => {
    if (!r.categoryId) return { label: "Unlinked" };
    const cat = categories.find((c) => c.id === r.categoryId);
    if (!cat) return { label: "Unlinked" };
    if (r.itemId) {
      const item = cat.items.find((i) => i.id === r.itemId);
      if (item) return { label: `${cat.name} · ${item.name}`, color: cat.color };
    }
    return { label: cat.name, color: cat.color };
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="h-1.5 bg-amber-500/60" />

      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-foreground">
          {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </span>
        <Bell className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Reminders</h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            handleStartAdd();
          }}
          aria-label="Add reminder"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground ml-auto">
          {reminders.length} {reminders.length === 1 ? "item" : "items"}
        </span>
      </div>

      {expanded && (
        <div className="px-5 pb-4 space-y-3">
          {reminders.length > 0 && (
            <div className="space-y-2">
              {reminders.map((r) => {
                const target = getTargetLabel(r);
                return (
                  <div
                    key={r.id}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_220px_auto] gap-2 items-center px-3 py-2 rounded-lg border border-border bg-muted/20"
                  >
                    <Input
                      value={r.text}
                      onChange={(e) => onUpdateReminder(r.id, { text: e.target.value })}
                      placeholder="Reminder text"
                      className="h-9"
                    />
                    <Select
                      value={buildTargetValue(r)}
                      onValueChange={(v) => {
                        const parsed = parseTargetValue(v);
                        onUpdateReminder(r.id, {
                          categoryId: parsed.categoryId,
                          itemId: parsed.itemId,
                        });
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue>
                          <span className="flex items-center gap-2 truncate">
                            {target.color && (
                              <span
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: target.color }}
                              />
                            )}
                            <span className="truncate">{target.label}</span>
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>{renderTargetOptions(categories)}</SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteReminder(r.id)}
                      aria-label="Delete reminder"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {adding && (
            <form
              onSubmit={handleAdd}
              className="grid grid-cols-1 sm:grid-cols-[1fr_220px_auto_auto] gap-2 items-center px-3 py-2 rounded-lg border border-dashed border-border bg-card"
            >
              <Input
                placeholder="Add a reminder…"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                className="h-9"
                autoFocus
              />
              <Select value={newTarget} onValueChange={setNewTarget}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Link to…" />
                </SelectTrigger>
                <SelectContent>{renderTargetOptions(categories)}</SelectContent>
              </Select>
              <Button type="submit" size="sm" disabled={!newText.trim()}>
                Add
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleCancelAdd}
              >
                Cancel
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
