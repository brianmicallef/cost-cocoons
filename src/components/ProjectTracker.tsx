import { useState, useEffect, useRef } from "react";
import { useProject } from "@/hooks/useProject";
import { CategoryCard } from "./CategoryCard";
import { ContingencySection } from "./ContingencySection";
import { CsvUploadDialog } from "./CsvUploadDialog";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { House, Plus, AlertTriangle, Upload, Download, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import type { ItemStatus } from "@/types/project";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

export function ProjectTracker() {
  const {
    project,
    loading,
    addCategory,
    bulkImport,
    fullImport,
    updateCategory,
    updateCategoryColor,
    deleteCategory,
    reorderCategories,
    addLineItem,
    deleteLineItem,
    cycleLineItemStatus,
    updateLineItem,
    addPayment,
    deletePayment,
    addAttachment,
    deleteAttachment,
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

  const spendToDate = allItems.reduce(
    (s, i) => s + i.payments.reduce((ps, p) => ps + p.amount, 0), 0
  );
  const quotedSpend = allItems
    .filter((i) => i.status === 'quote' || i.status === 'started')
    .reduce((s, i) => s + i.predictedCost, 0);
  const unquotedSpend = allItems
    .filter((i) => i.status === 'idea' || i.status === 'done')
    .reduce((s, i) => s + i.predictedCost, 0);
  const totalSpend = quotedSpend + unquotedSpend + totalContingency;
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
      version: 1,
      exportedAt: new Date().toISOString(),
      project: {
        name: project.name,
        categories: project.categories,
      },
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, "_")}_export.json`;
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
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
            <House className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{project.name}</h1>
            <p className="text-sm text-muted-foreground">Cost Tracker v0.2</p>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => setCsvDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-1.5" /> Import
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1.5" /> Export
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Spend to Date</p>
            <p className="text-2xl font-bold text-foreground mt-1">{fmt(spendToDate)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Quoted Spend</p>
            <p className="text-2xl font-bold text-foreground mt-1">{fmt(quotedSpend)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Ideas</p>
            <p className="text-2xl font-bold text-foreground mt-1">{fmt(unquotedSpend)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Contingency</p>
            <p className="text-2xl font-bold text-foreground mt-1">{fmt(totalContingency)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Total Spend</p>
            <p className="text-2xl font-bold text-foreground mt-1">{fmt(totalSpend)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Overspend</p>
            <p className={`text-2xl font-bold mt-1 ${overspend > 0 ? "text-destructive" : "text-success"}`}>
              {fmt(overspend)}
            </p>
          </div>
        </div>

        {/* Item count row – clickable filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {([
            { status: 'done' as ItemStatus, label: 'Completed', count: completedCount },
            { status: 'started' as ItemStatus, label: 'Started', count: startedCount },
            { status: 'quote' as ItemStatus, label: 'Quoted', count: quotedCount },
            { status: 'idea' as ItemStatus, label: 'Unquoted', count: unquotedCount },
          ]).map(({ status, label, count }) => {
            const active = visibleStatuses.has(status);
            return (
              <button
                key={status}
                onClick={() => {
                  setVisibleStatuses((prev) => {
                    const next = new Set(prev);
                    if (next.has(status)) next.delete(status);
                    else next.add(status);
                    return next;
                  });
                }}
                className={`rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                  active
                    ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                    : "border-border bg-card opacity-60 hover:opacity-80"
                }`}
              >
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-bold text-foreground mt-0.5">{count}</p>
              </button>
            );
          })}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total Items</p>
            <p className="text-lg font-bold text-foreground mt-0.5">{totalItemCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Overbudget</p>
            <p className={`text-lg font-bold mt-0.5 ${overspendCount > 0 ? "text-destructive" : "text-success"}`}>
              {overspendCount}
            </p>
          </div>
        </div>

        {/* Overall progress - two bars showing spend vs budget and spend vs total (with contingency) */}
        {totalBudget > 0 && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            {/* Spend vs Budget (without contingency) */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Spend vs Budget</span>
                <span className="font-medium">
                  {fmt(totalSpent)} / {fmt(totalBudget)} ({Math.round(spendPctOfBudget)}%)
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                {categoryData.map((c) =>
                  c.spent > 0 ? (
                    <div
                      key={c.id}
                      className="h-full transition-all first:rounded-l-full last:rounded-r-full"
                      style={{
                        width: `${(c.spent / totalBudget) * 100}%`,
                        backgroundColor: c.color,
                      }}
                      title={`${c.name}: ${fmt(c.spent)}`}
                    />
                  ) : null
                )}
              </div>
            </div>

            {/* Spend vs Total Budget (with contingency) */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Spend vs Total Budget (incl. contingency)</span>
                <span className="font-medium">
                  {fmt(totalSpent)} / {fmt(totalWithContingency)} ({Math.round(spendPctOfTotal)}%)
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                {categoryData.map((c) =>
                  c.spent > 0 ? (
                    <div
                      key={c.id}
                      className="h-full transition-all first:rounded-l-full last:rounded-r-full"
                      style={{
                        width: `${(c.spent / totalWithContingency) * 100}%`,
                        backgroundColor: c.color,
                      }}
                      title={`${c.name}: ${fmt(c.spent)}`}
                    />
                  ) : null
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {categoryData.map((c) => (
                <div key={c.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  {c.name}
                </div>
              ))}
            </div>
          </div>
        )}

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

        {project.categories.map((cat, index) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            forceExpanded={allExpanded}
            collapseSignal={collapseSignal}
            visibleStatuses={visibleStatuses}
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
            onMoveUp={index > 0 ? () => reorderCategories(index, index - 1) : undefined}
            onMoveDown={index < project.categories.length - 1 ? () => reorderCategories(index, index + 1) : undefined}
          />
        ))}

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
    </div>
  );
}
