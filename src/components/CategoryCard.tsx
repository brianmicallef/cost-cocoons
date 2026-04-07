import { useState } from "react";
import type { Category } from "@/types/project";
import { LineItemRow } from "./LineItemRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Plus, Trash2, Pencil, Check, X } from "lucide-react";

interface CategoryCardProps {
  category: Category;
  onAddLineItem: (categoryId: string, name: string, predictedCost: number) => void;
  onUpdateCategory: (categoryId: string, name: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onUpdateLineItem: (categoryId: string, itemId: string, updates: { name?: string; predictedCost?: number }) => void;
  onAddPayment: (categoryId: string, itemId: string, amount: number, description: string, date: string) => void;
  onDeletePayment: (categoryId: string, itemId: string, paymentId: string) => void;
  onDeleteItem: (categoryId: string, itemId: string) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

export function CategoryCard({
  category,
  onAddLineItem,
  onUpdateCategory,
  onDeleteCategory,
  onUpdateLineItem,
  onAddPayment,
  onDeletePayment,
  onDeleteItem,
}: CategoryCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCost, setNewCost] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState(category.name);

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
    onAddLineItem(category.id, newName.trim(), cost);
    setNewName("");
    setNewCost("");
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

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-primary/5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-foreground"
        >
          {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>

        {editingName ? (
          <div className="flex items-center gap-2 flex-1">
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
          <h2
            className="text-lg font-semibold text-foreground flex-1 group flex items-center gap-2 cursor-pointer"
            onDoubleClick={() => setEditingName(true)}
          >
            {category.name}
            <button
              onClick={() => setEditingName(true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </h2>
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
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDeleteCategory(category.id)}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile totals */}
      <div className="sm:hidden px-5 py-2 grid grid-cols-3 gap-2 text-sm text-center bg-primary/5 border-t border-border/50">
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
          {category.items.map((item) => (
            <LineItemRow
              key={item.id}
              item={item}
              categoryId={category.id}
              onAddPayment={onAddPayment}
              onDeletePayment={onDeletePayment}
              onDeleteItem={onDeleteItem}
              onUpdateItem={onUpdateLineItem}
            />
          ))}

          {adding ? (
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
              <div className="w-32 space-y-1">
                <label className="text-xs text-muted-foreground">Budget (£)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={newCost}
                  onChange={(e) => setNewCost(e.target.value)}
                />
              </div>
              <Button type="submit" size="sm">Add</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </form>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Item
            </button>
          )}
        </div>
      )}
    </div>
  );
}
