import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORY_COLORS } from "@/lib/categoryColors";

interface ColorPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentColor: string;
  onSubmit: (color: string) => void;
}

export function ColorPickerDialog({ open, onOpenChange, currentColor, onSubmit }: ColorPickerDialogProps) {
  const [custom, setCustom] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Pick Category Colour</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-5 gap-2">
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { onSubmit(c); onOpenChange(false); }}
              className="h-10 w-10 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: c === currentColor ? "hsl(var(--foreground))" : "transparent",
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Input
            placeholder="Custom hex, e.g. #ff6600"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="flex-1"
          />
          <Button
            size="sm"
            disabled={!custom.trim()}
            onClick={() => {
              onSubmit(custom.trim());
              setCustom("");
              onOpenChange(false);
            }}
          >
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
