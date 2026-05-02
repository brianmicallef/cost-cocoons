import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/types/project";

interface PromoteToCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemTitle: string;
  categories: Category[];
  onConfirm: (categoryId: string) => void;
}

export function PromoteToCostDialog({
  open,
  onOpenChange,
  itemTitle,
  categories,
  onConfirm,
}: PromoteToCostDialogProps) {
  const [selected, setSelected] = useState<string>("");

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected);
    onOpenChange(false);
    setSelected("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Cost Tracker — {itemTitle}</DialogTitle>
        </DialogHeader>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You don't have any cost categories yet. Create one in the Cost Tracker first.
          </p>
        ) : (
          <div className="space-y-3">
            <Label>Choose a category</Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger>
                <SelectValue placeholder="Select category…" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              A new line item will be created using this moodboard item's title, price and link.
            </p>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selected || categories.length === 0}>
            Add to Cost Tracker
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
