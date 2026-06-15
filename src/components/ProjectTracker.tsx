import { useState, useEffect, useRef } from "react";
import { useProject } from "@/hooks/useProject";
import { CategoryCard } from "./CategoryCard";
import { ContingencySection } from "./ContingencySection";
import { RemindersSection } from "./RemindersSection";
import { CsvUploadDialog } from "./CsvUploadDialog";
import { ThemeToggle } from "./ThemeToggle";
import { TopNav } from "./TopNav";
import { UserMenu } from "./UserMenu";
import { BottomNav } from "./BottomNav";
import { HeaderActions } from "./HeaderActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { House, Plus, AlertTriangle, ChevronsDownUp, ChevronsUpDown, ChevronRight, ChevronDown, Lightbulb, FileText, Hammer, CheckCircle2, Sparkles } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { ItemStatus } from "@/types/project";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
function SortableCategoryWrapper({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

export function ProjectTracker() {
  const {
    project,
    rawProject,
    loading,
    addCategory,
    bulkImport,
    fullImport,
    updateCategory,
    updateCategoryColor,
    deleteCategory,
    reorderCategories,
    reorderLineItems,
    moveLineItem,
    addLineItem,
    deleteLineItem,
    cycleLineItemStatus,
    updateLineItem,
    addPayment,
    deletePayment,
    addAttachment,
    deleteAttachment,
    addReminder,
    updateReminder,
    deleteReminder,
  } = useProject();

  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [allExpanded, setAllExpanded] = useState(true);
  const [collapseSignal, setCollapseSignal] = useState(0);
  const [visibleStatuses, setVisibleStatuses] = useState<Set<ItemStatus>>(
    new Set(['idea', 'quote', 'started'] as ItemStatus[])
  );
  const [contingencyRates, setContingencyRates] = useState<Record<string, number>>({});
  const contingencyLoadedRef = useRef(false);
  const contingencySaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load contingency rates from API on mount
  useEffect(() => {
    fetch("/.netlify/functions/contingency")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === "object") {
          setContingencyRates(data);
        }
        contingencyLoadedRef.current = true;
      })
      .catch(() => {
        contingencyLoadedRef.current = true;
      });
  }, []);

  // Default 10% contingency for any new category
  useEffect(() => {
    if (!contingencyLoadedRef.current) return;
    let updated = false;
    const next = { ...contingencyRates };
    for (const cat of project.categories) {
      if (!(cat.id in next)) {
        next[cat.id] = 10;
        updated = true;
      }
    }
    if (updated) {
      setContingencyRates(next);
    }
  }, [project.categories]);

  // Save contingency rates to API (debounced)
  useEffect(() => {
    if (!contingencyLoadedRef.current) return;
    if (contingencySaveTimeoutRef.current) {
      clearTimeout(contingencySaveTimeoutRef.current);
    }
    contingencySaveTimeoutRef.current = setTimeout(() => {
      fetch("/.netlify/functions/contingency", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contingencyRates),
      }).catch(() => {});
    }, 500);
    return () => {
      if (contingencySaveTimeoutRef.current) {
        clearTimeout(contingencySaveTimeoutRef.current);
      }
    };
  }, [contingencyRates]);

  const handleUpdateContingencyRate = (categoryId: string, rate: number) => {
    setContingencyRates((prev) => ({ ...prev, [categoryId]: rate }));
  };

  // DnD sensors - long press (250ms delay) to activate drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Check if dragging a category (prefixed with "cat-")
    if (activeId.startsWith("cat-") && overId.startsWith("cat-")) {
      const fromIndex = project.categories.findIndex((c) => `cat-${c.id}` === activeId);
      const toIndex = project.categories.findIndex((c) => `cat-${c.id}` === overId);
      if (fromIndex !== -1 && toIndex !== -1) {
        reorderCategories(fromIndex, toIndex);
      }
      return;
    }

    // Dragging an item (prefixed with "item-")
    if (activeId.startsWith("item-")) {
      const itemId = activeId.replace("item-", "");
      // Find source category
      const fromCat = project.categories.find((c) => c.items.some((i) => i.id === itemId));
      if (!fromCat) return;

      if (overId.startsWith("item-")) {
        const overItemId = overId.replace("item-", "");
        const toCat = project.categories.find((c) => c.items.some((i) => i.id === overItemId));
        if (!toCat) return;

        if (fromCat.id === toCat.id) {
          const fromIndex = fromCat.items.findIndex((i) => i.id === itemId);
          const toIndex = toCat.items.findIndex((i) => i.id === overItemId);
          reorderLineItems(fromCat.id, fromIndex, toIndex);
        } else {
          const toIndex = toCat.items.findIndex((i) => i.id === overItemId);
          moveLineItem(fromCat.id, toCat.id, itemId, toIndex);
        }
      } else if (overId.startsWith("cat-")) {
        // Dropped on a category — move to end
        const toCatId = overId.replace("cat-", "");
        if (fromCat.id !== toCatId) {
          const toCat = project.categories.find((c) => c.id === toCatId);
          if (toCat) {
            moveLineItem(fromCat.id, toCatId, itemId, toCat.items.length);
          }
        }
      }
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName.trim());
    setNewCategoryName("");
    setAddingCategory(false);
  };

  // Per-category spend data
  const categoryData = project.categories.map((c) => {
    const budget = c.items.reduce((s, i) => s + i.predictedCost, 0);
    const spent = c.items.reduce(
      (s, i) => s + i.payments.reduce((ps, p) => ps + p.amount, 0),
      0
    );
    return { id: c.id, name: c.name, color: c.color, budget, spent };
  });

  const totalBudget = categoryData.reduce((s, c) => s + c.budget, 0);
  const totalSpent = categoryData.reduce((s, c) => s + c.spent, 0);

  const totalContingency = categoryData.reduce((s, c) => {
    const rate = contingencyRates[c.id] || 0;
    const remaining = c.budget - c.spent;
    return s + remaining * (rate / 100);
  }, 0);

  const totalWithContingency = totalBudget + totalContingency;
  const totalRemaining = totalWithContingency - totalSpent;

  // Flatten all items for summary calculations
  const allItems = project.categories.flatMap((c) => c.items);

  const sumByStatus = (status: ItemStatus) =>
    allItems.filter((i) => i.status === status).reduce((s, i) => s + i.predictedCost, 0);
  const unquotedSpend = sumByStatus('idea');
  const quotedSpend = sumByStatus('quote');
  // Started = estimated remaining to spend on items currently in progress
  const startedSpend = allItems
    .filter((i) => i.status === 'started')
    .reduce((s, i) => {
      const paid = i.payments.reduce((ps, p) => ps + p.amount, 0);
      const remaining = i.predictedCost - paid;
      return s + Math.max(remaining, 0);
    }, 0);
  // Spend to Date = total actual payments across all items (any status)
  const spendToDate = allItems.reduce(
    (s, i) => s + i.payments.reduce((ps, p) => ps + p.amount, 0),
    0
  );
  const totalSpend = unquotedSpend + quotedSpend + startedSpend + spendToDate + totalContingency;
  const overspend = allItems.reduce((s, i) => {
    const itemSpent = i.payments.reduce((ps, p) => ps + p.amount, 0);
    const remaining = i.predictedCost - itemSpent;
    return s + (remaining < 0 ? Math.abs(remaining) : 0);
  }, 0);

  // Item counts
  const completedCount = allItems.filter((i) => i.status === 'done').length;
  const startedCount = allItems.filter((i) => i.status === 'started').length;
  const quotedCount = allItems.filter((i) => i.status === 'quote').length;
  const unquotedCount = allItems.filter((i) => i.status === 'idea').length;
  const totalItemCount = allItems.length;
  const overspendCount = allItems.filter((i) => {
    const itemSpent = i.payments.reduce((ps, p) => ps + p.amount, 0);
    return itemSpent > i.predictedCost;
  }).length;

  // JSON Export (full fidelity)
  const handleExport = () => {
    const exportData = {
      version: 2,
      exportedAt: new Date().toISOString(),
      project: {
        name: rawProject.name,
        categories: rawProject.categories,
        reminders: rawProject.reminders || [],
        moodboard: rawProject.moodboard || { boards: [] },
      },
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `Cost-Cocoon-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // For the progress bars
  const spendPctOfBudget = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const spendPctOfTotal = totalWithContingency > 0 ? (totalSpent / totalWithContingency) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center mx-auto animate-pulse">
            <House className="h-5 w-5 text-accent-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">Loading project data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-gradient-to-r from-accent/10 via-background to-accent/5 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shadow-lg shadow-accent/20 ring-1 ring-accent/30">
            <House className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent flex items-center gap-1.5 truncate">
              {project.name}
              <Sparkles className="h-4 w-4 text-accent shrink-0" />
            </h1>
            <p className="hidden sm:block text-sm text-muted-foreground">Stay on budget, stress-free</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
            <TopNav />
            <ThemeToggle />
            <HeaderActions onImport={() => setCsvDialogOpen(true)} onExport={handleExport} />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 sm:pb-6">
        {/* Summary cards – cost by status + overspend */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {([
            { label: 'Unquoted', value: unquotedSpend, Icon: Lightbulb },
            { label: 'Quoted', value: quotedSpend, Icon: FileText },
            { label: 'Started', value: startedSpend, Icon: Hammer },
            { label: 'Spend to Date', value: spendToDate, Icon: CheckCircle2 },
          ]).map(({ label, value, Icon }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Icon className="h-4 w-4 text-primary" />
                {label}
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">{fmt(value)}</p>
            </div>
          ))}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Overspend
            </p>
            <p className={`text-2xl font-bold mt-1 ${overspend > 0 ? "text-destructive" : "text-success"}`}>
              {fmt(overspend)}
            </p>
          </div>
        </div>

        {/* Item count row – clickable filters with progression arrows (left → right) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 items-stretch">
          {([
            { status: 'idea' as ItemStatus, label: 'Unquoted', count: unquotedCount, Icon: Lightbulb },
            { status: 'quote' as ItemStatus, label: 'Quoted', count: quotedCount, Icon: FileText },
            { status: 'started' as ItemStatus, label: 'Started', count: startedCount, Icon: Hammer },
            { status: 'done' as ItemStatus, label: 'Completed', count: completedCount, Icon: CheckCircle2 },
          ]).map(({ status, label, count, Icon }, idx, arr) => {
            const active = visibleStatuses.has(status);
            return (
              <div key={status} className="relative flex items-center">
                <button
                  onClick={() => {
                    setVisibleStatuses((prev) => {
                      const next = new Set(prev);
                      if (next.has(status)) next.delete(status);
                      else next.add(status);
                      return next;
                    });
                  }}
                  className={`flex-1 rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                    active
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border bg-card opacity-60 hover:opacity-80"
                  }`}
                >
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    {label}
                  </p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{count}</p>
                </button>
                {idx < arr.length - 1 && (
                  <ChevronRight
                    className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 z-10"
                    aria-hidden
                  />
                )}
              </div>
            );
          })}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total Items</p>
            <p className="text-lg font-bold text-foreground mt-0.5">{totalItemCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              Overbudget
            </p>
            <p className={`text-lg font-bold mt-0.5 ${overspendCount > 0 ? "text-destructive" : "text-success"}`}>
              {overspendCount}
            </p>
          </div>
        </div>

        {/* Categories header with collapse toggle */}
        {project.categories.length > 0 && (
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAllExpanded(!allExpanded);
                setCollapseSignal((s) => s + 1);
              }}
            >
              {allExpanded ? (
                <><ChevronsDownUp className="h-4 w-4 mr-1.5" /> Collapse All</>
              ) : (
                <><ChevronsUpDown className="h-4 w-4 mr-1.5" /> Expand All</>
              )}
            </Button>
          </div>
        )}

        <RemindersSection
          reminders={project.reminders || []}
          categories={project.categories}
          onAddReminder={addReminder}
          onUpdateReminder={updateReminder}
          onDeleteReminder={deleteReminder}
          forceExpanded={allExpanded}
          collapseSignal={collapseSignal}
        />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={project.categories.map((c) => `cat-${c.id}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-6">
              {project.categories.map((cat) => (
                <SortableCategoryWrapper key={cat.id} id={`cat-${cat.id}`}>
                  <CategoryCard
                    category={cat}
                    forceExpanded={allExpanded}
                    collapseSignal={collapseSignal}
                    visibleStatuses={visibleStatuses}
                    reminders={(project.reminders || []).filter((r) => r.categoryId === cat.id)}
                    allCategories={project.categories}
                    onAddLineItem={addLineItem}
                    onDeleteCategory={deleteCategory}
                    onUpdateCategory={updateCategory}
                    onUpdateCategoryColor={updateCategoryColor}
                    onUpdateLineItem={updateLineItem}
                    onAddPayment={addPayment}
                    onDeletePayment={deletePayment}
                    onDeleteItem={deleteLineItem}
                    onCycleStatus={cycleLineItemStatus}
                    onAddAttachment={addAttachment}
                    onDeleteAttachment={deleteAttachment}
                    onUpdateReminder={updateReminder}
                    onDeleteReminder={deleteReminder}
                    onAddReminder={addReminder}
                  />
                </SortableCategoryWrapper>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add category */}
        {addingCategory ? (
          <form
            onSubmit={handleAddCategory}
            className="flex items-center gap-2 p-4 rounded-xl border border-dashed border-border bg-card"
          >
            <Input
              placeholder="Category name, e.g. Electrical"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              autoFocus
              className="flex-1"
            />
            <Button type="submit">Add</Button>
            <Button type="button" variant="ghost" onClick={() => setAddingCategory(false)}>
              Cancel
            </Button>
          </form>
        ) : (
          <button
            onClick={() => setAddingCategory(true)}
            className="w-full flex items-center justify-center gap-2 py-5 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors text-sm font-medium"
          >
            <Plus className="h-5 w-5" /> Add Category
          </button>
        )}

        {/* Contingency section */}
        {project.categories.length > 0 && (
          <ContingencySection
            categories={categoryData}
            contingencyRates={contingencyRates}
            onUpdateRate={handleUpdateContingencyRate}
            forceExpanded={allExpanded}
            collapseSignal={collapseSignal}
          />
        )}
        <CsvUploadDialog
          open={csvDialogOpen}
          onOpenChange={setCsvDialogOpen}
          onImport={bulkImport}
          onFullImport={fullImport}
        />
      </main>
      <BottomNav />
    </div>
  );
}
