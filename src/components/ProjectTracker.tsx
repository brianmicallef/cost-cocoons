import { useState } from "react";
import { useProject } from "@/hooks/useProject";
import { CategoryCard } from "./CategoryCard";
import { ContingencySection } from "./ContingencySection";
import { CsvUploadDialog } from "./CsvUploadDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HardHat, Plus, AlertTriangle, Upload } from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

export function ProjectTracker() {
  const {
    project,
    addCategory,
    bulkImport,
    updateCategory,
    updateCategoryColor,
    deleteCategory,
    addLineItem,
    deleteLineItem,
    updateLineItem,
    addPayment,
    deletePayment,
    addAttachment,
    deleteAttachment,
  } = useProject();

  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [contingencyRates, setContingencyRates] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem("contingency-rates");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const handleUpdateContingencyRate = (categoryId: string, rate: number) => {
    setContingencyRates((prev) => {
      const next = { ...prev, [categoryId]: rate };
      localStorage.setItem("contingency-rates", JSON.stringify(next));
      return next;
    });
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName.trim());
    setNewCategoryName("");
    setAddingCategory(false);
  };

  // When project categories change, set default 10% for any new ones
  const ensureDefaultContingency = () => {
    let updated = false;
    const next = { ...contingencyRates };
    for (const cat of project.categories) {
      if (!(cat.id in next)) {
        next[cat.id] = 10;
        updated = true;
      }
    }
    if (updated) {
      localStorage.setItem("contingency-rates", JSON.stringify(next));
      setContingencyRates(next);
    }
  };

  // Run after each render where categories may have changed
  import { useEffect } from "react";


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

  // Contingency calculation: (budget - spent) * rate%
  const totalContingency = categoryData.reduce((s, c) => {
    const rate = contingencyRates[c.id] || 0;
    const remaining = c.budget - c.spent;
    return s + remaining * (rate / 100);
  }, 0);

  const totalWithContingency = totalBudget + totalContingency;
  const totalRemaining = totalWithContingency - totalSpent;

  // Count items over budget
  const overBudgetCount = project.categories.reduce((count, c) => {
    return count + c.items.filter((i) => {
      const itemSpent = i.payments.reduce((s, p) => s + p.amount, 0);
      return itemSpent > i.predictedCost;
    }).length;
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
            <HardHat className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{project.name}</h1>
            <p className="text-sm text-muted-foreground">Cost Tracker</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCsvDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-1.5" /> Import CSV
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Budget</p>
            <p className="text-2xl font-bold text-foreground mt-1">{fmt(totalBudget)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Contingency</p>
            <p className="text-2xl font-bold text-foreground mt-1">{fmt(totalContingency)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Total Budget</p>
            <p className="text-2xl font-bold text-foreground mt-1">{fmt(totalWithContingency)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className={`text-2xl font-bold mt-1 ${totalRemaining < 0 ? "text-destructive" : "text-success"}`}>
              {fmt(totalRemaining)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 col-span-2 sm:col-span-1">
            <p className="text-sm text-muted-foreground">Over Budget</p>
            <div className="flex items-center gap-2 mt-1">
              <p className={`text-2xl font-bold ${overBudgetCount > 0 ? "text-destructive" : "text-success"}`}>
                {overBudgetCount}
              </p>
              {overBudgetCount > 0 && <AlertTriangle className="h-5 w-5 text-destructive" />}
              <span className="text-sm text-muted-foreground">
                {overBudgetCount === 1 ? "item" : "items"}
              </span>
            </div>
          </div>
        </div>

        {/* Overall progress - segmented by category colour */}
        {totalBudget > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Overall Spend</span>
              <span className="font-medium">{Math.round((totalSpent / totalBudget) * 100)}%</span>
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
            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
              {categoryData.map((c) => (
                <div key={c.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  {c.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        {project.categories.map((cat) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            onAddLineItem={addLineItem}
            onDeleteCategory={deleteCategory}
            onUpdateCategory={updateCategory}
            onUpdateCategoryColor={updateCategoryColor}
            onUpdateLineItem={updateLineItem}
            onAddPayment={addPayment}
            onDeletePayment={deletePayment}
            onDeleteItem={deleteLineItem}
            onAddAttachment={addAttachment}
            onDeleteAttachment={deleteAttachment}
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

        {/* Contingency section - always at the bottom */}
        {project.categories.length > 0 && (
          <ContingencySection
            categories={categoryData}
            contingencyRates={contingencyRates}
            onUpdateRate={handleUpdateContingencyRate}
          />
        )}
        <CsvUploadDialog
          open={csvDialogOpen}
          onOpenChange={setCsvDialogOpen}
          onImport={bulkImport}
        />
      </main>
    </div>
  );
}
