import { useState } from "react";
import { useProject } from "@/hooks/useProject";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TopNav } from "@/components/TopNav";
import { House, Plus, Image as ImageIcon, Upload, Download } from "lucide-react";
import { MoodBoardCard } from "./MoodBoardCard";
import { CsvUploadDialog } from "@/components/CsvUploadDialog";

export function MoodboardPage() {
  const {
    project,
    loading,
    addBoard,
    renameBoard,
    deleteBoard,
    addMoodItem,
    updateMoodItem,
    deleteMoodItem,
    promoteMoodItemToCost,
    bulkImport,
    fullImport,
  } = useProject();

  const [importOpen, setImportOpen] = useState(false);

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const boards = project.moodboard?.boards || [];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addBoard(newName.trim());
    setNewName("");
    setAdding(false);
  };

  const handleExport = () => {
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      project: {
        name: project.name,
        categories: project.categories,
        reminders: project.reminders || [],
        moodboard: project.moodboard || { boards: [] },
      },
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `Cost-Cocoon-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{project.name}</h1>
            <p className="text-sm text-muted-foreground">Moodboard</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <TopNav />
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4 mr-1.5" /> Import
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1.5" /> Export
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Collect product ideas, links and inspiration. Items can be promoted to the Cost Tracker.
          </p>
          {!adding && (
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> New board
            </Button>
          )}
        </div>

        {adding && (
          <form
            onSubmit={handleAdd}
            className="flex items-center gap-2 rounded-xl border border-border bg-card p-3"
          >
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Board name (e.g. Kitchen, Lighting)"
              className="max-w-sm"
            />
            <Button type="submit" size="sm">
              Add
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                setNewName("");
              }}
            >
              Cancel
            </Button>
          </form>
        )}

        {boards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            <ImageIcon className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">
              No boards yet. Create your first board to start collecting product ideas.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {boards.map((board) => (
              <MoodBoardCard
                key={board.id}
                board={board}
                categories={project.categories}
                onRename={(name) => renameBoard(board.id, name)}
                onDelete={() => deleteBoard(board.id)}
                onAddItem={(item) => addMoodItem(board.id, item)}
                onUpdateItem={(itemId, updates) => updateMoodItem(board.id, itemId, updates)}
                onDeleteItem={(itemId) => deleteMoodItem(board.id, itemId)}
                onPromote={(itemId, categoryId) =>
                  promoteMoodItemToCost(board.id, itemId, categoryId)
                }
              />
            ))}
          </div>
        )}
      </main>

      <CsvUploadDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={bulkImport}
        onFullImport={fullImport}
      />
    </div>
  );
}
