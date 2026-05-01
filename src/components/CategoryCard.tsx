import { useState, useEffect } from "react";
import type { Category, ItemStatus, Reminder } from "@/types/project";
import { LineItemRow } from "./LineItemRow";
import { ReminderItem } from "./ReminderItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColorPickerDialog } from "./ColorPickerDialog";
import { ChevronDown, ChevronRight, PlusCircle, Trash2, Pencil, Check, X, Bell } from "lucide-react";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CategoryCardProps {
  category: Category;
  forceExpanded?: boolean;
  collapseSignal?: number;
  visibleStatuses?: Set<ItemStatus>;
  reminders?: Reminder[];
  allCategories?: Category[];
  onAddLineItem: (categoryId: string, name: string, predictedCost: number, vendor: string) => void;
  onUpdateCategory: (categoryId: string, name: string) => void;
  onUpdateCategoryColor: (categoryId: string, color: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onUpdateLineItem: (categoryId: string, itemId: string, updates: { name?: string; predictedCost?: number; vendor?: string }) => void;
  onAddPayment: (categoryId: string, itemId: string, amount: number, description: string, date: string) => void;
  onDeletePayment: (categoryId: string, itemId: string, paymentId: string) => void;
  onDeleteItem: (categoryId: string, itemId: string) => void;
  onCycleStatus: (categoryId: string, itemId: string) => void;
  onAddAttachment: (categoryId: string, itemId: string, name: string, url: string, type: 'link' | 'file') => void;
  onDeleteAttachment: (categoryId: string, itemId: string, attachmentId: string) => void;
  onAddReminder?: (text: string, categoryId?: string, itemId?: string) => void;
  onUpdateReminder?: (
    reminderId: string,
    updates: Partial<Pick<Reminder, "text" | "categoryId" | "itemId">>
  ) => void;
  onDeleteReminder?: (reminderId: string) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

function SortableItemWrapper({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export function CategoryCard({
  category,
  forceExpanded,
  collapseSignal,
  visibleStatuses,
  reminders = [],
  allCategories,
  onAddLineItem,
  onUpdateCategory,
  onUpdateCategoryColor,
  onDeleteCategory,
  onUpdateLineItem,
  onAddPayment,
  onDeletePayment,
  onDeleteItem,
  onCycleStatus,
  onAddAttachment,
  onDeleteAttachment,
  onUpdateReminder,
  onDeleteReminder,
}: CategoryCardProps) {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (collapseSignal !== undefined && forceExpanded !== undefined) {
      setExpanded(forceExpanded);
    }
  }, [collapseSignal]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCost, setNewCost] = useState("");
  const [newVendor, setNewVendor] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const totalBudget = category.items.reduce((s, i) => s + i.predictedCost, 0);
  const totalSpent = category.items.reduce(
    (s, i) => s + i.payments.reduce((ps, p) => ps + p.amount, 0),
    0
  );
  const totalRemaining = totalBudget - totalSpent;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(newCost);
    if (!newName.trim() || isNaN(cost) || cost <= 0) return;
    onAddLineItem(category.id, newName.trim(), cost, newVendor.trim());
    setNewName("");
    setNewCost("");
    setNewVendor("");
    setAdding(false);
  };

  const handleSaveName = () => {
    if (editName.trim()) {
      onUpdateCategory(category.id, editName.trim());
    }
    setEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditName(category.name);
    setEditingName(false);
  };

  const filteredItems = category.items.filter(
    (item) => !visibleStatuses || visibleStatuses.has(item.status)
  );

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Color stripe */}
      <div className="h-1.5" style={{ backgroundColor: category.color }} />

      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-foreground">
          {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </span>

        {/* Color dot + picker */}
        <button
          onClick={(e) => { e.stopPropagation(); setColorPickerOpen(true); }}
          className="h-4 w-4 rounded-full border border-border/50 shrink-0 hover:scale-125 transition-transform"
          style={{ backgroundColor: category.color }}
          title="Change colour"
        />

        {editingName ? (
          <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
                if (e.key === "Escape") handleCancelEdit();
              }}
              autoFocus
              className="h-8 text-lg font-semibold"
            />
            <Button size="sm" variant="ghost" onClick={handleSaveName} className="h-7 w-7 p-0 text-success">
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-7 w-7 p-0 text-muted-foreground">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1 flex-1">
            <h2
              className="text-lg font-semibold text-foreground group flex items-center gap-2 cursor-pointer"
              onDoubleClick={(e) => { e.stopPropagation(); setEditingName(true); }}
            >
              {category.name}
              <button
                onClick={(e) => { e.stopPropagation(); setEditingName(true); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(true);
                setAdding(true);
              }}
              aria-label="Add item"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-6 text-sm">
          <div className="text-right">
            <span className="text-muted-foreground text-xs block">Budget</span>
            <span className="font-semibold">{fmt(totalBudget)}</span>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground text-xs block">Spent</span>
            <span className="font-semibold">{fmt(totalSpent)}</span>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground text-xs block">Remaining</span>
            <span className={`font-bold ${totalRemaining < 0 ? "text-destructive" : "text-success"}`}>
              {fmt(totalRemaining)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDeleteCategory(category.id)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile totals */}
      <div className="sm:hidden px-5 py-2 grid grid-cols-3 gap-2 text-sm text-center border-t border-border/50">
        <div>
          <span className="text-muted-foreground text-xs block">Budget</span>
          <span className="font-semibold">{fmt(totalBudget)}</span>
        </div>
        <div>
          <span className="text-muted-foreground text-xs block">Spent</span>
          <span className="font-semibold">{fmt(totalSpent)}</span>
        </div>
        <div>
          <span className="text-muted-foreground text-xs block">Remaining</span>
          <span className={`font-bold ${totalRemaining < 0 ? "text-destructive" : "text-success"}`}>
            {fmt(totalRemaining)}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="px-5 py-4 space-y-3">
          {reminders.length > 0 && onUpdateReminder && onDeleteReminder && (
            <div className="space-y-2">
              {reminders.map((r) => (
                <ReminderItem
                  key={r.id}
                  reminder={r}
                  categories={allCategories ?? [category]}
                  showTargetLabel={false}
                  onUpdate={onUpdateReminder}
                  onDelete={onDeleteReminder}
                />
              ))}
            </div>
          )}
          <SortableContext
            items={filteredItems.map((item) => `item-${item.id}`)}
            strategy={verticalListSortingStrategy}
          >
            {filteredItems.map((item) => (
              <SortableItemWrapper key={item.id} id={`item-${item.id}`}>
                <LineItemRow
                  item={item}
                  categoryId={category.id}
                  categoryColor={category.color}
                  onAddPayment={onAddPayment}
                  onDeletePayment={onDeletePayment}
                  onDeleteItem={onDeleteItem}
                  onCycleStatus={onCycleStatus}
                  onUpdateItem={onUpdateLineItem}
                  onAddAttachment={onAddAttachment}
                  onDeleteAttachment={onDeleteAttachment}
                />
              </SortableItemWrapper>
            ))}
          </SortableContext>

          {adding && (
            <form onSubmit={handleAddItem} className="flex items-end gap-2 p-3 rounded-lg border border-dashed border-border bg-muted/30">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">Item Name</label>
                <Input
                  placeholder="e.g. Plastering"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">Vendor</label>
                <Input
                  placeholder="e.g. Smith & Sons"
                  value={newVendor}
                  onChange={(e) => setNewVendor(e.target.value)}
                />
              </div>
              <div className="w-32 space-y-1">
                <label className="text-xs text-muted-foreground">Budget (£)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0"
                  value={newCost}
                  onChange={(e) => setNewCost(e.target.value)}
                />
              </div>
              <Button type="submit" size="sm">Add</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </form>
          )}
        </div>
      )}

      <ColorPickerDialog
        open={colorPickerOpen}
        onOpenChange={setColorPickerOpen}
        currentColor={category.color}
        onSubmit={(color) => onUpdateCategoryColor(category.id, color)}
      />
    </div>
  );
}
