import { useState } from "react";
import { useProject } from "@/hooks/useProject";
import { CategoryCard } from "./CategoryCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HardHat, Plus } from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

export function ProjectTracker() {
  const {
    project,
    addCategory,
    deleteCategory,
    addLineItem,
    deleteLineItem,
    addPayment,
    deletePayment,
  } = useProject();

  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName.trim());
    setNewCategoryName("");
    setAddingCategory(false);
  };

  const totalBudget = project.categories.reduce(
    (s, c) => s + c.items.reduce((is, i) => is + i.predictedCost, 0),
    0
  );
  const totalSpent = project.categories.reduce(
    (s, c) =>
      s + c.items.reduce((is, i) => is + i.payments.reduce((ps, p) => ps + p.amount, 0), 0),
    0
  );
  const totalRemaining = totalBudget - totalSpent;

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
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Total Budget</p>
            <p className="text-2xl font-bold text-foreground mt-1">{fmt(totalBudget)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-bold text-foreground mt-1">{fmt(totalSpent)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className={`text-2xl font-bold mt-1 ${totalRemaining < 0 ? "text-destructive" : "text-success"}`}>
              {fmt(totalRemaining)}
            </p>
          </div>
        </div>

        {/* Overall progress */}
        {totalBudget > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Overall Spend</span>
              <span className="font-medium">{Math.round((totalSpent / totalBudget) * 100)}%</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${totalRemaining < 0 ? "bg-destructive" : "bg-accent"}`}
                style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
              />
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
            onAddPayment={addPayment}
            onDeletePayment={deletePayment}
            onDeleteItem={deleteLineItem}
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
      </main>
    </div>
  );
}
