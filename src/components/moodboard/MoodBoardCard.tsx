import { useState } from "react";
import type { MoodBoard, MoodItem, Category } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronRight,
  PlusCircle,
  Trash2,
  Pencil,
} from "lucide-react";
import { MoodItemCard } from "./MoodItemCard";
import { AddMoodItemDialog } from "./AddMoodItemDialog";
import { PromoteToCostDialog } from "./PromoteToCostDialog";

interface MoodBoardCardProps {
  board: MoodBoard;
  categories: Category[];
  onRename: (name: string) => void;
  onDelete: () => void;
  onAddItem: (item: Omit<MoodItem, "id" | "createdAt">) => void;
  onUpdateItem: (itemId: string, updates: Partial<Omit<MoodItem, "id" | "createdAt">>) => void;
  onDeleteItem: (itemId: string) => void;
  onPromote: (itemId: string, categoryId: string) => void;
}

export function MoodBoardCard({
  board,
  categories,
  onRename,
  onDelete,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onPromote,
}: MoodBoardCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(board.name);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<MoodItem | null>(null);
  const [promoting, setPromoting] = useState<MoodItem | null>(null);

  const handleSaveName = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== board.name) onRename(trimmed);
    setEditingName(false);
  };

  return (
    <div className="rounded-xl">
      <div className="flex items-center gap-2 py-1.5">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="p-0.5 -ml-0.5 rounded hover:bg-accent text-muted-foreground"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
        <span
          className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: board.color }}
          title={board.name}
        />
        {editingName ? (
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveName();
              if (e.key === "Escape") {
                setName(board.name);
                setEditingName(false);
              }
            }}
            autoFocus
            className="h-7 max-w-xs text-sm"
          />
        ) : (
          <button
            className="text-sm font-semibold text-foreground hover:underline"
            onClick={() => setEditingName(true)}
          >
            {board.name}
          </button>
        )}
        <span className="text-xs text-muted-foreground">
          {board.items.length}
        </span>
        <div className="ml-auto flex items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity">
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setAddOpen(true)}>
            <PlusCircle className="h-3.5 w-3.5 mr-1" /> Add
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setEditingName(true)}
            className="h-7 w-7 text-muted-foreground"
            title="Rename board"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              if (
                board.items.length === 0 ||
                confirm(`Delete "${board.name}" and its ${board.items.length} items?`)
              ) {
                onDelete();
              }
            }}
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            title="Delete board"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="pb-2">
          {board.items.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3">
              No items yet. Click <span className="font-medium">Add</span> to paste a product link.
            </p>
          ) : (
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
              {board.items.map((item) => (
                <div key={item.id} className="mb-3 break-inside-avoid">
                  <MoodItemCard
                    item={item}
                    onEdit={() => setEditing(item)}
                    onDelete={() => {
                      if (confirm(`Delete "${item.title}"?`)) onDeleteItem(item.id);
                    }}
                    onPromote={() => setPromoting(item)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AddMoodItemDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        boardName={board.name}
        onSubmit={onAddItem}
      />
      <AddMoodItemDialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        boardName={board.name}
        initial={editing ?? undefined}
        onSubmit={(updates) => {
          if (editing) onUpdateItem(editing.id, updates);
        }}
      />
      <PromoteToCostDialog
        open={promoting !== null}
        onOpenChange={(o) => !o && setPromoting(null)}
        itemTitle={promoting?.title ?? ""}
        categories={categories}
        onConfirm={(categoryId) => {
          if (promoting) onPromote(promoting.id, categoryId);
        }}
      />
    </div>
  );
}
