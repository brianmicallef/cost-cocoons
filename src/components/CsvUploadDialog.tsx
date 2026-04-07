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

interface ParsedRow {
  category: string;
  item: string;
  cost: number;
  vendor: string;
}

interface CsvUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: ParsedRow[]) => void;
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  // Skip header row
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    // Handle quoted CSV fields
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
    const cost = parseFloat(parts[2]);
    const vendor = parts[3] || "";

    if (!category || !item || isNaN(cost)) continue;

    rows.push({ category, item, cost, vendor });
  }
  return rows;
}

export function CsvUploadDialog({ open, onOpenChange, onImport }: CsvUploadDialogProps) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCsv(reader.result as string);
      if (parsed.length === 0) {
        toast.error("No valid rows found. Expected: category, item, cost, vendor");
        return;
      }
      setRows(parsed);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    onImport(rows);
    toast.success(`Imported ${rows.length} items`);
    setRows([]);
    setFileName("");
    onOpenChange(false);
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setRows([]);
      setFileName("");
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV with columns: <strong>category, item, cost, vendor</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 cursor-pointer hover:border-foreground/30 transition-colors"
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {fileName || "Click to select a CSV file"}
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFile}
          />

          {rows.length > 0 && (
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
                  {rows.map((r, i) => (
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
          <Button disabled={rows.length === 0} onClick={handleImport}>
            Import {rows.length} items
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
