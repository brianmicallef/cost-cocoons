import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useProject } from "@/hooks/useProject";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TopNav } from "@/components/TopNav";
import { UserMenu } from "@/components/UserMenu";
import { BottomNav } from "@/components/BottomNav";
import { HeaderActions } from "@/components/HeaderActions";
import {
  House,
  Plus,
  Image as ImageIcon,
  Sparkles,
  Pencil,
  Trash2,
  Check,
  X,
  Users,
} from "lucide-react";
import { MoodTile } from "./MoodTile";
import { AddMoodItemDialog } from "./AddMoodItemDialog";
import { PromoteToCostDialog } from "./PromoteToCostDialog";
import { CsvUploadDialog } from "@/components/CsvUploadDialog";
import { ACCOUNTS } from "@/contexts/UserContext";
import type { MoodBoard, MoodItem } from "@/types/project";

const TAGLINES = [
  "Curate your dream space",
  "Every great room starts with an idea",
  "Collect. Compose. Create.",
  "Inspiration, beautifully organised",
  "Where ideas become rooms",
];

export function MoodboardPage({ readOnly }: { readOnly?: boolean }) {
  const {
    project,
    rawProject,
    loading,
    addBoard,
    renameBoard,
    deleteBoard,
    addMoodItem,
    updateMoodItem,
    deleteMoodItem,
    promoteMoodItemToCost,
    unpromoteMoodItem,
    voteMoodItem,
    bulkImport,
    fullImport,
  } = useProject();

  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<{ item: MoodItem; boardId: string } | null>(null);
  const [promoting, setPromoting] = useState<{ item: MoodItem; boardId: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [manageMode, setManageMode] = useState(false);
  const [renamingBoardId, setRenamingBoardId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [tagline] = useState(() => TAGLINES[Math.floor(Math.random() * TAGLINES.length)]);
  const [activeBoardIds, setActiveBoardIds] = useState<Set<string>>(new Set());
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set());

  const boards = project.moodboard?.boards || [];
  const boardById = useMemo(() => {
    const m = new Map<string, MoodBoard>();
    boards.forEach((b) => m.set(b.id, b));
    return m;
  }, [boards]);

  const showAllBoards = activeBoardIds.size === 0;
  const showAllUsers = activeUsers.size === 0;
  const visibleBoards = showAllBoards ? boards : boards.filter((b) => activeBoardIds.has(b.id));

  const allItems = useMemo(() => {
    const items: { item: MoodItem; boardId: string }[] = [];
    visibleBoards.forEach((b) => {
      b.items.forEach((i) => {
        if (!showAllUsers && !activeUsers.has(i.createdBy || "Brian")) return;
        items.push({ item: i, boardId: b.id });
      });
    });
    return items;
  }, [visibleBoards, showAllUsers, activeUsers]);

  const toggleBoard = (id: string) => {
    setActiveBoardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleUser = (u: string) => {
    setActiveUsers((prev) => {
      const next = new Set(prev);
      if (next.has(u)) next.delete(u);
      else next.add(u);
      return next;
    });
  };

  // Per-user item counts (across visible boards)
  const userCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    visibleBoards.forEach((b) =>
      b.items.forEach((i) => {
        const u = i.createdBy || "Brian";
        counts[u] = (counts[u] || 0) + 1;
      })
    );
    return counts;
  }, [visibleBoards]);

  const handleAddBoard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addBoard(newName.trim());
    setNewName("");
    setAdding(false);
  };

  const handleExport = () => {
    const exportData = {
      version: 2,
      exportedAt: new Date().toISOString(),
      project: {
        name: rawProject.name,
        categories: rawProject.categories,
        reminders: rawProject.reminders || [],
        moodboard: rawProject.moodboard || { boards: [] },
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
      <header className="border-b border-border/40 bg-gradient-to-r from-accent/10 via-background to-accent/5 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shadow-lg shadow-accent/20 ring-1 ring-accent/30">
            <ImageIcon className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent flex items-center gap-1.5 truncate">
              {project.name}
              <Sparkles className="h-4 w-4 text-accent shrink-0" />
            </h1>
            <p className="hidden sm:block text-sm text-muted-foreground italic">{tagline}</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
            <TopNav />
            <ThemeToggle />
            {!readOnly && (
              <>
                <HeaderActions onImport={() => setImportOpen(true)} onExport={handleExport} />
                <UserMenu />
              </>
            )}
            {readOnly && (
              <Link to="/moodboard">
                <Button variant="outline" size="sm" className="rounded-full">
                  Sign in
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {readOnly && (
        <div className="bg-muted/50 border-b border-border/40 text-center py-1.5 text-xs text-muted-foreground">
          Viewing as guest — browse only
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-3 pb-24 sm:pb-5">
        {/* Category filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveBoardIds(new Set())}
            className={`text-xs font-medium rounded-full px-3 py-1.5 border transition-colors ${
              showAllBoards
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            All <span className="opacity-60 ml-1">{boards.reduce((n, b) => n + b.items.length, 0)}</span>
          </button>

          {boards.map((b) => {
            const active = activeBoardIds.has(b.id);
            const isRenaming = renamingBoardId === b.id;
            if (manageMode && isRenaming) {
              return (
                <div key={b.id} className="flex items-center gap-1 rounded-full border border-border bg-background pl-2 pr-1 py-0.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
                  <Input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (renameValue.trim()) renameBoard(b.id, renameValue.trim());
                        setRenamingBoardId(null);
                      }
                      if (e.key === "Escape") setRenamingBoardId(null);
                    }}
                    className="h-6 w-32 text-xs border-0 focus-visible:ring-0 px-1"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => {
                      if (renameValue.trim()) renameBoard(b.id, renameValue.trim());
                      setRenamingBoardId(null);
                    }}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              );
            }
            return (
              <div
                key={b.id}
                className={`group flex items-center gap-1.5 rounded-full px-3 py-1.5 border text-xs font-medium transition-colors ${
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-border hover:bg-muted"
                }`}
              >
                <button onClick={() => toggleBoard(b.id)} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
                  <span>{b.name}</span>
                  <span className="opacity-60">{b.items.length}</span>
                </button>
                {manageMode && (
                  <div className="flex items-center gap-0.5 ml-1 -mr-1">
                    <button
                      onClick={() => {
                        setRenamingBoardId(b.id);
                        setRenameValue(b.name);
                      }}
                      className="p-0.5 rounded hover:bg-background/20"
                      title="Rename"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          b.items.length === 0 ||
                          confirm(`Delete "${b.name}" and its ${b.items.length} items?`)
                        ) {
                          deleteBoard(b.id);
                          setActiveBoardIds((prev) => {
                            const n = new Set(prev);
                            n.delete(b.id);
                            return n;
                          });
                        }
                      }}
                      className="p-0.5 rounded hover:bg-background/20"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {adding ? (
            <form onSubmit={handleAddBoard} className="flex items-center gap-1">
              <Input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New category"
                className="h-8 w-40 text-xs rounded-full"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setAdding(false);
                    setNewName("");
                  }
                }}
              />
              <Button type="submit" size="icon" variant="ghost" className="h-7 w-7 rounded-full">
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-full"
                onClick={() => {
                  setAdding(false);
                  setNewName("");
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </form>
          ) : !readOnly && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-xs h-8 text-muted-foreground"
              onClick={() => setAdding(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Category
            </Button>
          )}

          {!readOnly && (
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant={manageMode ? "secondary" : "ghost"}
              size="sm"
              className="rounded-full text-xs h-8"
              onClick={() => setManageMode((v) => !v)}
            >
              {manageMode ? "Done" : "Manage"}
            </Button>
            <Button
              size="sm"
              className="rounded-full h-8"
              onClick={() => setAddOpen(true)}
              disabled={boards.length === 0}
            >
              <Plus className="h-4 w-4 mr-1" /> Add item
            </Button>
          </div>
          )}
        </div>

        {/* User filter bar */}
        {!readOnly && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Added by
          </div>
          <button
            onClick={() => setActiveUsers(new Set())}
            className={`text-xs font-medium rounded-full px-3 py-1 border transition-colors ${
              showAllUsers
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            Anyone
          </button>
          {ACCOUNTS.map((u) => {
            const active = activeUsers.has(u);
            const count = userCounts[u] || 0;
            return (
              <button
                key={u}
                onClick={() => toggleUser(u)}
                className={`text-xs font-medium rounded-full px-3 py-1 border transition-colors ${
                  active
                    ? "bg-foreground text-background border-foreground"
                    : count === 0
                    ? "bg-background text-muted-foreground/60 border-border opacity-60"
                    : "bg-background text-foreground border-border hover:bg-muted"
                }`}
              >
                {u} <span className="opacity-60 ml-1">{count}</span>
              </button>
            );
          })}
        </div>
        )}


        {/* Wall */}
        {boards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            <ImageIcon className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">
              No categories yet. Create your first category to start collecting ideas.
            </p>
          </div>
        ) : allItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            <ImageIcon className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">
              No items match the current filters.
            </p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
            {allItems.map(({ item, boardId }) => {
              const board = boardById.get(boardId)!;
              return (
                <div key={item.id} className="mb-3 break-inside-avoid">
                  <MoodTile
                    item={item}
                    board={board}
                    expanded={expandedId === item.id}
                    readOnly={readOnly}
                    onToggleExpand={() =>
                      setExpandedId((prev) => (prev === item.id ? null : item.id))
                    }
                    onEdit={() => setEditing({ item, boardId })}
                    onDelete={() => {
                      if (confirm(`Delete "${item.title}"?`)) deleteMoodItem(boardId, item.id);
                    }}
                    onPromote={() => setPromoting({ item, boardId })}
                    onUnpromote={() => unpromoteMoodItem(boardId, item.id)}
                    onVote={(type) => voteMoodItem(boardId, item.id, type)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>

      {!readOnly && (
        <>
          <AddMoodItemDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            boards={boards}
            defaultBoardId={
              activeBoardIds.size === 1 ? Array.from(activeBoardIds)[0] : boards[0]?.id
            }
            onSubmit={(boardId, item) => addMoodItem(boardId, item)}
          />
          <AddMoodItemDialog
            open={editing !== null}
            onOpenChange={(o) => !o && setEditing(null)}
            boards={boards}
            initial={editing?.item}
            initialBoardId={editing?.boardId}
            onSubmit={(boardId, updates) => {
              if (!editing) return;
              if (boardId !== editing.boardId) {
                deleteMoodItem(editing.boardId, editing.item.id);
                addMoodItem(boardId, updates);
              } else {
                updateMoodItem(editing.boardId, editing.item.id, updates);
              }
            }}
          />
          <PromoteToCostDialog
            open={promoting !== null}
            onOpenChange={(o) => !o && setPromoting(null)}
            itemTitle={promoting?.item.title ?? ""}
            categories={project.categories}
            onConfirm={(categoryId) => {
              if (promoting) promoteMoodItemToCost(promoting.boardId, promoting.item.id, categoryId);
            }}
          />
          <CsvUploadDialog
            open={importOpen}
            onOpenChange={setImportOpen}
            onImport={bulkImport}
            onFullImport={fullImport}
          />
        </>
      )}
      <BottomNav readOnly={readOnly} />
    </div>
  );
}
