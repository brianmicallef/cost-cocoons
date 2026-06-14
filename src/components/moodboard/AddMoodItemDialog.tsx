import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Wand2, Upload, Instagram, Globe } from "lucide-react";
import { detectSource } from "@/lib/moodSources";
import type { MoodBoard, MoodItem } from "@/types/project";

interface AddMoodItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boards: MoodBoard[];
  defaultBoardId?: string;
  initial?: MoodItem;
  initialBoardId?: string;
  onSubmit: (boardId: string, item: Omit<MoodItem, "id" | "createdAt">) => void;
}

export function AddMoodItemDialog({
  open,
  onOpenChange,
  boards,
  defaultBoardId,
  initial,
  initialBoardId,
  onSubmit,
}: AddMoodItemDialogProps) {
  const [boardId, setBoardId] = useState<string>("");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [tags, setTags] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setBoardId(initialBoardId || defaultBoardId || boards[0]?.id || "");
      setUrl(initial?.url ?? "");
      setTitle(initial?.title ?? "");
      setImageUrl(initial?.imageUrl ?? "");
      setNotes(initial?.notes ?? "");
      setPrice(initial?.price !== undefined ? String(initial.price) : "");
      setTags((initial?.tags || []).join(", "));
      setFetchError(null);
      setUploadError(null);
    }
  }, [open, initial, initialBoardId, defaultBoardId, boards]);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const res = await fetch("/.netlify/functions/upload-image", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
        return;
      }
      setImageUrl(data.url);
      if (!title) {
        const name = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
        setTitle(name);
      }
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFetch = async () => {
    if (!url.trim()) return;
    setFetching(true);
    setFetchError(null);
    try {
      const res = await fetch(`/.netlify/functions/og?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      if (data.title && !title) setTitle(data.title);
      if (data.image && !imageUrl) setImageUrl(data.image);
      if (data.description && !notes) setNotes(data.description);
    } catch {
      setFetchError("Couldn't fetch preview. You can fill in the fields manually.");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardId) return;
    if (!title.trim() && !url.trim() && !imageUrl.trim()) return;
    const parsedPrice = price.trim() === "" ? undefined : Number(price);
    onSubmit(boardId, {
      title: title.trim() || (url.trim() ? new URL(url.trim()).hostname : "Untitled"),
      url: url.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      price: parsedPrice !== undefined && !Number.isNaN(parsedPrice) ? parsedPrice : undefined,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      linkedCostItemId: initial?.linkedCostItemId,
      votes: initial?.votes,
      createdBy: initial?.createdBy,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit item" : "Add item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="mb-board">Category</Label>
            <Select value={boardId} onValueChange={setBoardId}>
              <SelectTrigger id="mb-board">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {boards.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: b.color }}
                      />
                      {b.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mb-url">Product URL</Label>
            <div className="flex gap-2">
              <Input
                id="mb-url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleFetch}
                disabled={!url.trim() || fetching}
              >
                {fetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-1.5" /> Fetch
                  </>
                )}
              </Button>
            </div>
            {fetchError && (
              <p className="text-xs text-muted-foreground">{fetchError}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mb-title">Title</Label>
            <Input
              id="mb-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Brass pendant light"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mb-image">Image</Label>
            <div className="flex gap-2">
              <Input
                id="mb-image"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste URL or upload a picture…"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = () => {
                    const file = input.files?.[0];
                    if (file) handleImageUpload(file);
                  };
                  input.click();
                }}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-1.5" /> Upload
                  </>
                )}
              </Button>
            </div>
            {uploadError && (
              <p className="text-xs text-destructive">{uploadError}</p>
            )}
            {imageUrl && (
              <img
                src={imageUrl}
                alt="preview"
                className="mt-2 h-32 w-full object-contain rounded border bg-muted"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mb-price">Price (£)</Label>
              <Input
                id="mb-price"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mb-tags">Tags (comma-separated)</Label>
              <Input
                id="mb-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="kitchen, brass"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mb-notes">Notes</Label>
            <Textarea
              id="mb-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes…"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!boardId}>
              {initial ? "Save" : "Add item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
