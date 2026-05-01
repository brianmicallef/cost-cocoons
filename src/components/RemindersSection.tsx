import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, ChevronDown, ChevronRight, PlusCircle } from "lucide-react";
import type { Category, Reminder } from "@/types/project";
import {
  ReminderItem,
  parseTargetValue,
  renderTargetOptions,
} from "./ReminderItem";

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

export function RemindersSection({
  reminders,
  categories,
  onAddReminder,
  onUpdateReminder,
  onDeleteReminder,
  forceExpanded,
  collapseSignal,
}: RemindersSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [newTarget, setNewTarget] = useState<string>(UNLINKED_VALUE);

  useEffect(() => {
    if (collapseSignal !== undefined && forceExpanded === false) {
      setExpanded(false);
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
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleStartAdd();
          }}
          aria-label="Add reminder"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <PlusCircle className="h-3.5 w-3.5 mr-1" /> Add reminder
        </Button>
        <span className="text-sm text-muted-foreground ml-auto">
          {reminders.length} {reminders.length === 1 ? "item" : "items"}
        </span>
      </div>

      {expanded && (
        <div className="px-5 pb-4 space-y-3">
          {reminders.length > 0 && (
            <div className="space-y-2">
              {reminders.map((r) => (
                <ReminderItem
                  key={r.id}
                  reminder={r}
                  categories={categories}
                  onUpdate={onUpdateReminder}
                  onDelete={onDeleteReminder}
                />
              ))}
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
