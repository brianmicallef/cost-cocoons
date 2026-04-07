import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, ShieldAlert } from "lucide-react";

interface CategoryContingencyData {
  id: string;
  name: string;
  color: string;
  budget: number;
  spent: number;
}

interface ContingencySectionProps {
  categories: CategoryContingencyData[];
  contingencyRates: Record<string, number>;
  onUpdateRate: (categoryId: string, rate: number) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

export function ContingencySection({ categories, contingencyRates, onUpdateRate }: ContingencySectionProps) {
  const [expanded, setExpanded] = useState(true);

  const rows = categories.map((c) => {
    const rate = contingencyRates[c.id] || 0;
    const remaining = c.budget - c.spent;
    const contingency = remaining * (rate / 100);
    return { ...c, rate, remaining, contingency };
  });

  const totalContingency = rows.reduce((s, r) => s + r.contingency, 0);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="h-1.5 bg-muted-foreground/30" />

      <div className="flex items-center gap-3 px-5 py-4">
        <button onClick={() => setExpanded(!expanded)} className="text-foreground">
          {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
        <ShieldAlert className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground flex-1">Contingency</h2>
        <div className="text-right">
          <span className="text-muted-foreground text-xs block">Total Contingency</span>
          <span className="font-bold text-foreground">{fmt(totalContingency)}</span>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-4 space-y-2">
          {/* Header */}
          <div className="grid grid-cols-[1fr_100px_100px_100px_100px] gap-3 text-xs text-muted-foreground font-medium px-3 pb-1">
            <span>Category</span>
            <span className="text-right">Budget</span>
            <span className="text-right">Remaining</span>
            <span className="text-right">Rate %</span>
            <span className="text-right">Contingency</span>
          </div>

          {rows.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[1fr_100px_100px_100px_100px] gap-3 items-center px-3 py-2 rounded-lg border border-border bg-muted/20"
            >
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                <span className="text-sm font-medium text-foreground">{r.name}</span>
              </div>
              <span className="text-sm text-right text-muted-foreground">{fmt(r.budget)}</span>
              <span className="text-sm text-right text-muted-foreground">{fmt(r.remaining)}</span>
              <div className="flex justify-end">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={r.rate || ""}
                  onChange={(e) => onUpdateRate(r.id, parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="h-7 w-16 text-sm text-right"
                />
              </div>
              <span className="text-sm text-right font-medium text-foreground">{fmt(r.contingency)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
