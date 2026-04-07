import { useState } from "react";
import type { LineItem } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaymentDialog } from "./PaymentDialog";
import { ChevronDown, ChevronRight, Plus, Trash2, Pencil, Check, X } from "lucide-react";

interface LineItemRowProps {
  item: LineItem;
  categoryId: string;
  onAddPayment: (categoryId: string, itemId: string, amount: number, description: string, date: string) => void;
  onDeletePayment: (categoryId: string, itemId: string, paymentId: string) => void;
  onDeleteItem: (categoryId: string, itemId: string) => void;
  onUpdateItem: (categoryId: string, itemId: string, updates: { name?: string; predictedCost?: number }) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

export function LineItemRow({
  item,
  categoryId,
  onAddPayment,
  onDeletePayment,
  onDeleteItem,
  onUpdateItem,
}: LineItemRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editCost, setEditCost] = useState(String(item.predictedCost));

  const spent = item.payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = item.predictedCost - spent;
  const overBudget = remaining < 0;

  const handleSave = () => {
    const cost = parseFloat(editCost);
    const updates: { name?: string; predictedCost?: number } = {};
    if (editName.trim() && editName.trim() !== item.name) updates.name = editName.trim();
    if (!isNaN(cost) && cost > 0 && cost !== item.predictedCost) updates.predictedCost = cost;
    if (Object.keys(updates).length > 0) {
      onUpdateItem(categoryId, item.id, updates);
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setEditName(item.name);
    setEditCost(String(item.predictedCost));
    setEditing(false);
  };

  return (
    <>
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {editing ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
                autoFocus
                className="h-7 text-sm font-medium flex-1"
              />
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">£</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editCost}
                  onChange={(e) => setEditCost(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") handleCancel();
                  }}
                  className="h-7 text-sm w-28"
                />
              </div>
              <Button size="sm" variant="ghost" onClick={handleSave} className="h-7 w-7 p-0 text-success">
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 w-7 p-0 text-muted-foreground">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <span
                className="font-medium text-foreground flex-1 group flex items-center gap-2 cursor-pointer"
                onDoubleClick={() => setEditing(true)}
              >
                {item.name}
                <button
                  onClick={() => setEditing(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </span>

              <div className="hidden sm:grid grid-cols-3 gap-6 text-sm text-right min-w-[300px]">
                <div>
                  <span className="text-muted-foreground text-xs block">Budget</span>
                  <span className="font-medium">{fmt(item.predictedCost)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Spent</span>
                  <span className="font-medium">{fmt(spent)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Remaining</span>
                  <span className={`font-semibold ${overBudget ? "text-destructive" : "text-success"}`}>
                    {fmt(remaining)}
                  </span>
                </div>
              </div>
            </>
          )}

          {!editing && (
            <>
              <Button size="sm" variant="outline" onClick={() => setPaymentOpen(true)} className="ml-2">
                <Plus className="h-3.5 w-3.5 mr-1" /> Payment
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDeleteItem(categoryId, item.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>

        {/* Mobile summary */}
        {!editing && (
          <div className="sm:hidden px-4 pb-3 grid grid-cols-3 gap-2 text-sm text-center">
            <div>
              <span className="text-muted-foreground text-xs block">Budget</span>
              <span className="font-medium">{fmt(item.predictedCost)}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs block">Spent</span>
              <span className="font-medium">{fmt(spent)}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs block">Remaining</span>
              <span className={`font-semibold ${overBudget ? "text-destructive" : "text-success"}`}>
                {fmt(remaining)}
              </span>
            </div>
          </div>
        )}

        {/* Budget bar */}
        <div className="h-1.5 bg-muted">
          <div
            className={`h-full transition-all ${overBudget ? "bg-destructive" : "bg-success"}`}
            style={{ width: `${Math.min((spent / item.predictedCost) * 100, 100)}%` }}
          />
        </div>

        {expanded && item.payments.length > 0 && (
          <div className="border-t border-border bg-muted/30">
            <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Payment History
            </div>
            {item.payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-4 py-2 text-sm border-t border-border/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">{p.date}</span>
                  <span>{p.description || "Payment"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{fmt(p.amount)}</span>
                  <button
                    onClick={() => onDeletePayment(categoryId, item.id, p.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {expanded && item.payments.length === 0 && (
          <div className="border-t border-border px-4 py-4 text-sm text-muted-foreground text-center">
            No payments logged yet
          </div>
        )}
      </div>

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        itemName={item.name}
        onSubmit={(amount, desc, date) =>
          onAddPayment(categoryId, item.id, amount, desc, date)
        }
      />
    </>
  );
}
