import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import type { Category, Reminder, MoodBoard } from "@/types/project";

interface ParsedRow {
  category: string;
  item: string;
  cost: number;
  vendor: string;
}

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: ParsedRow[]) => void;
  onFullImport: (categories: Category[], reminders?: Reminder[], moodboard?: { boards: MoodBoard[] }) => void;
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of lines[i]) {
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        parts.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    parts.push(current.trim());

    if (parts.length < 3) continue;

    const category = parts[0];
    const item = parts[1];
    const costRaw = parts[2].replace(/[£$€,]/g, "");
    const cost = parseFloat(costRaw);
    const vendor = parts[3] || "";

    if (!category || !item || isNaN(cost)) continue;

    rows.push({ category, item, cost, vendor });
  }
  return rows;
}

type ImportMode = null | "csv" | "json";

interface JsonImportData {
  categories: Category[];
  reminders: Reminder[];
  moodboard: { boards: MoodBoard[] };
  summary: { categories: number; items: number; payments: number; attachments: number; reminders: number; boards: number; moodItems: number };
}

function parseJsonImport(text: string): JsonImportData | null {
  try {
    const data = JSON.parse(text);
    const categories: Category[] = data?.project?.categories || data?.categories;
    if (!Array.isArray(categories)) return null;

    const remindersRaw = data?.project?.reminders || data?.reminders;
    const reminders: Reminder[] = Array.isArray(remindersRaw)
      ? remindersRaw.filter((r) => r && typeof r.text === "string")
      : [];

    const moodboardRaw = data?.project?.moodboard || data?.moodboard;
    const boards: MoodBoard[] = Array.isArray(moodboardRaw?.boards) ? moodboardRaw.boards : [];

    let items = 0, payments = 0, attachments = 0;
    for (const cat of categories) {
      if (!cat.name || !Array.isArray(cat.items)) return null;
      items += cat.items.length;
      for (const item of cat.items) {
        payments += (item.payments || []).length;
        attachments += (item.attachments || []).length;
      }
    }
    let moodItems = 0;
    for (const b of boards) moodItems += (b.items || []).length;

    return {
      categories,
      reminders,
      moodboard: { boards },
      summary: { categories: categories.length, items, payments, attachments, reminders: reminders.length, boards: boards.length, moodItems },
    };
  } catch {
    return null;
  }
}

export function CsvUploadDialog({ open, onOpenChange, onImport, onFullImport }: ImportDialogProps) {
  const [csvRows, setCsvRows] = useState<ParsedRow[]>([]);
  const [jsonData, setJsonData] = useState<JsonImportData | null>(null);
  const [mode, setMode] = useState<ImportMode>(null);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;

      // Try JSON first
      if (file.name.endsWith(".json") || text.trimStart().startsWith("{")) {
        const parsed = parseJsonImport(text);
        if (parsed) {
          setMode("json");
          setJsonData(parsed);
          setCsvRows([]);
          return;
        }
      }

      // Fall back to CSV
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        toast.error("No valid data found. Supported formats: JSON export or CSV (category, item, cost, vendor)");
        return;
      }
      setMode("csv");
      setCsvRows(parsed);
      setJsonData(null);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (mode === "json" && jsonData) {
      onFullImport(jsonData.categories, jsonData.reminders);
      const s = jsonData.summary;
      toast.success(`Imported ${s.categories} categories, ${s.items} items, ${s.payments} payments, ${s.attachments} attachments, ${s.reminders} reminders`);
    } else if (mode === "csv" && csvRows.length > 0) {
      onImport(csvRows);
      toast.success(`Imported ${csvRows.length} items`);
    }
    resetAndClose();
  };

  const resetAndClose = () => {
    setCsvRows([]);
    setJsonData(null);
    setMode(null);
    setFileName("");
    onOpenChange(false);
  };

  const handleClose = (val: boolean) => {
    if (!val) resetAndClose();
    else onOpenChange(val);
  };

  const hasData = mode === "json" ? !!jsonData : csvRows.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Data</DialogTitle>
          <DialogDescription>
            Upload a <strong>JSON export</strong> (full data with payments & attachments) or a <strong>CSV</strong> (category, item, cost, vendor).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 cursor-pointer hover:border-foreground/30 transition-colors"
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {fileName || "Click to select a JSON or CSV file"}
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.csv,application/json,text/csv"
            className="hidden"
            onChange={handleFile}
          />

          {/* JSON preview */}
          {mode === "json" && jsonData && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">JSON Export Detected</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <span>Categories: <strong className="text-foreground">{jsonData.summary.categories}</strong></span>
                <span>Items: <strong className="text-foreground">{jsonData.summary.items}</strong></span>
                <span>Payments: <strong className="text-foreground">{jsonData.summary.payments}</strong></span>
                <span>Attachments: <strong className="text-foreground">{jsonData.summary.attachments}</strong></span>
                <span>Reminders: <strong className="text-foreground">{jsonData.summary.reminders}</strong></span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">All data including payments, links, and attachments will be imported.</p>
            </div>
          )}

          {/* CSV preview */}
          {mode === "csv" && csvRows.length > 0 && (
            <div className="max-h-48 overflow-auto rounded-lg border border-border text-sm">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Category</th>
                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Item</th>
                    <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Cost</th>
                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Vendor</th>
                  </tr>
                </thead>
                <tbody>
                  {csvRows.map((r, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-1.5">{r.category}</td>
                      <td className="px-3 py-1.5">{r.item}</td>
                      <td className="px-3 py-1.5 text-right">£{r.cost.toLocaleString()}</td>
                      <td className="px-3 py-1.5">{r.vendor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          <Button disabled={!hasData} onClick={handleImport}>
            {mode === "json"
              ? `Import full project data`
              : `Import ${csvRows.length} items`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
