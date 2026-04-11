import { useState } from "react";
import type { LineItem, ItemStatus } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaymentDialog } from "./PaymentDialog";
import { AttachmentDialog } from "./AttachmentDialog";
import { ChevronDown, ChevronRight, Plus, Trash2, Pencil, Check, X, Link, Paperclip, ExternalLink, Lightbulb, FileText, Play, CircleCheck } from "lucide-react";

interface LineItemRowProps {
  item: LineItem;
  categoryId: string;
  categoryColor: string;
  onAddPayment: (categoryId: string, itemId: string, amount: number, description: string, date: string) => void;
  onDeletePayment: (categoryId: string, itemId: string, paymentId: string) => void;
  onDeleteItem: (categoryId: string, itemId: string) => void;
  onCycleStatus: (categoryId: string, itemId: string) => void;
  onUpdateItem: (categoryId: string, itemId: string, updates: { name?: string; predictedCost?: number; vendor?: string }) => void;
  onAddAttachment: (categoryId: string, itemId: string, name: string, url: string, type: 'link' | 'file') => void;
  onDeleteAttachment: (categoryId: string, itemId: string, attachmentId: string) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const statusConfig: Record<ItemStatus, { label: string; icon: typeof Lightbulb; color: string; nextLabel: string }> = {
  idea: { label: "Idea", icon: Lightbulb, color: "text-muted-foreground", nextLabel: "Quote" },
  quote: { label: "Quote", icon: FileText, color: "text-blue-500", nextLabel: "Started" },
  started: { label: "Started", icon: Play, color: "text-amber-500", nextLabel: "Done" },
  done: { label: "Done", icon: CircleCheck, color: "text-success", nextLabel: "Idea" },
};

export function LineItemRow({
  item,
  categoryId,
  categoryColor,
  onAddPayment,
  onDeletePayment,
  onDeleteItem,
  onCycleStatus,
  onUpdateItem,
  onAddAttachment,
  onDeleteAttachment,
}: LineItemRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editVendor, setEditVendor] = useState(item.vendor || "");
  const [editCost, setEditCost] = useState(String(item.predictedCost));

  const spent = item.payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = item.predictedCost - spent;
  const overBudget = remaining < 0;

  const handleSave = () => {
    const cost = parseFloat(editCost);
    const updates: { name?: string; predictedCost?: number; vendor?: string } = {};
    if (editName.trim() && editName.trim() !== item.name) updates.name = editName.trim();
    if (editVendor.trim() !== (item.vendor || "")) updates.vendor = editVendor.trim();
    if (!isNaN(cost) && cost > 0 && cost !== item.predictedCost) updates.predictedCost = cost;
    if (Object.keys(updates).length > 0) {
      onUpdateItem(categoryId, item.id, updates);
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setEditName(item.name);
    setEditVendor(item.vendor || "");
    setEditCost(String(item.predictedCost));
    setEditing(false);
  };

  return (
    <>
      <div className={`border border-border rounded-lg bg-card overflow-hidden ${item.status === 'done' ? "opacity-60" : ""}`}>
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
                placeholder="Item name"
                className="h-7 text-sm font-medium flex-1"
              />
              <Input
                value={editVendor}
                onChange={(e) => setEditVendor(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
                placeholder="Vendor"
                className="h-7 text-sm w-32"
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
              <div
                className="flex-1 group flex items-center gap-2 cursor-pointer"
                onDoubleClick={() => setEditing(true)}
              >
                <span className={`font-medium text-foreground ${item.status === 'done' ? "line-through" : ""}`}>{item.name}</span>
                {item.vendor && (
                  <span className="text-muted-foreground text-xs">· {item.vendor}</span>
                )}
                {item.attachments.length > 0 && (
                  <span className="text-muted-foreground text-xs flex items-center gap-0.5">
                    <Paperclip className="h-3 w-3" /> {item.attachments.length}
                  </span>
                )}
                <button
                  onClick={() => setEditing(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>

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
            <div className="flex items-center gap-1 ml-2">
              <Button size="sm" variant="outline" onClick={() => setPaymentOpen(true)} title="Add payment" className="h-7 w-7 p-0 text-xs font-semibold">
                +£
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAttachmentOpen(true)} title="Add link/attachment">
                <Link className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onCycleStatus(categoryId, item.id)} title={`${statusConfig[item.status || 'idea'].label} — click for ${statusConfig[item.status || 'idea'].nextLabel}`} className={`${statusConfig[item.status || 'idea'].color} gap-1 text-xs px-2 w-[80px] justify-start`}>
                {(() => { const Icon = statusConfig[item.status || 'idea'].icon; return <Icon className="h-3.5 w-3.5" />; })()}
                {statusConfig[item.status || 'idea'].label}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDeleteItem(categoryId, item.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
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
            className="h-full transition-all"
            style={{
              width: `${Math.min((spent / item.predictedCost) * 100, 100)}%`,
              backgroundColor: overBudget ? "hsl(var(--destructive))" : categoryColor,
            }}
          />
        </div>

        {expanded && (
          <div className="border-t border-border">
            {/* Payments */}
            {item.payments.length > 0 && (
              <div className="bg-muted/30">
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

            {/* Attachments */}
            {item.attachments.length > 0 && (
              <div className="bg-muted/20 border-t border-border/50">
                <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Links & Attachments
                </div>
                {item.attachments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between px-4 py-2 text-sm border-t border-border/50"
                  >
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-accent hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {a.name}
                    </a>
                    <button
                      onClick={() => onDeleteAttachment(categoryId, item.id, a.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {item.payments.length === 0 && item.attachments.length === 0 && (
              <div className="px-4 py-4 text-sm text-muted-foreground text-center">
                No payments or attachments yet
              </div>
            )}
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
      <AttachmentDialog
        open={attachmentOpen}
        onOpenChange={setAttachmentOpen}
        itemName={item.name}
        onSubmit={(name, url, type) =>
          onAddAttachment(categoryId, item.id, name, url, type)
        }
      />
    </>
  );
}
