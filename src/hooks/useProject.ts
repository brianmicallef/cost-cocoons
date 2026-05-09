import { useState, useEffect, useRef, useMemo } from "react";
import type {
  Project,
  Category,
  LineItem,
  Payment,
  Attachment,
  ItemStatus,
  Reminder,
  MoodBoard,
  MoodItem,
  MoodVote,
} from "@/types/project";
import { getNextColor } from "@/lib/categoryColors";
import { useCurrentUser } from "@/contexts/UserContext";

const generateId = () => crypto.randomUUID();
const DEFAULT_USER = "Brian";

const migrateProject = (p: Project): Project => ({
  ...p,
  reminders: (p.reminders || []).map((r) => ({ ...r, createdBy: r.createdBy || DEFAULT_USER })),
  moodboard: {
    boards: (p.moodboard?.boards || []).map((b) => ({
      ...b,
      createdBy: b.createdBy || DEFAULT_USER,
      items: (b.items || []).map((i) => {
        // Migrate single reaction → votes array
        let votes: MoodVote[] | undefined = i.votes;
        if (!votes && i.reaction) {
          votes = [{ user: DEFAULT_USER, type: i.reaction }];
        }
        return {
          ...i,
          votes: votes || [],
          reaction: undefined,
          createdBy: i.createdBy || DEFAULT_USER,
        };
      }),
    })),
  },
  categories: p.categories.map((c, i) => ({
    ...c,
    color: c.color || `hsl(${(i * 137) % 360}, 65%, 55%)`,
    createdBy: c.createdBy || DEFAULT_USER,
    items: c.items.map((item) => ({
      ...item,
      attachments: item.attachments || [],
      vendor: item.vendor || "",
      status: item.status || (item.completed ? "done" : "idea"),
      createdBy: item.createdBy || DEFAULT_USER,
    })),
  })),
});

const defaultProject = (): Project => ({
  id: generateId(),
  name: "Roebuck Lane",
  categories: [],
  reminders: [],
  moodboard: { boards: [] },
});

// Filter out anything marked as deleted (cascading into items, payments, etc).
const visibleProjectOf = (p: Project): Project => ({
  ...p,
  reminders: (p.reminders || []).filter((r) => !r.deleted),
  moodboard: {
    boards: (p.moodboard?.boards || [])
      .filter((b) => !b.deleted)
      .map((b) => ({ ...b, items: b.items.filter((i) => !i.deleted) })),
  },
  categories: p.categories
    .filter((c) => !c.deleted)
    .map((c) => ({
      ...c,
      items: c.items
        .filter((i) => !i.deleted)
        .map((i) => ({
          ...i,
          payments: i.payments.filter((pay) => !pay.deleted),
          attachments: i.attachments.filter((a) => !a.deleted),
        })),
    })),
});

export function useProject() {
  const currentUser = useCurrentUser();
  const [rawProject, setRawProject] = useState<Project>(defaultProject);
  const [loading, setLoading] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    fetch("/.netlify/functions/project")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.id) {
          setRawProject(migrateProject(data));
        }
        initialLoadDone.current = true;
        setLoading(false);
      })
      .catch(() => {
        initialLoadDone.current = true;
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!initialLoadDone.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      fetch("/.netlify/functions/project", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rawProject),
      }).catch(() => {});
    }, 500);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [rawProject]);

  const project = useMemo(() => visibleProjectOf(rawProject), [rawProject]);

  const updateProject = (updater: (p: Project) => Project) => {
    setRawProject((prev) => updater(prev));
  };

  const setProjectName = (name: string) => updateProject((p) => ({ ...p, name }));

  const addCategory = (name: string) => {
    const usedColors = rawProject.categories.filter((c) => !c.deleted).map((c) => c.color);
    const color = getNextColor(usedColors);
    updateProject((p) => ({
      ...p,
      categories: [
        ...p.categories,
        { id: generateId(), name, color, items: [], createdBy: currentUser },
      ],
    }));
  };

  const updateCategory = (categoryId: string, name: string) =>
    updateProject((p) => ({
      ...p,
      categories: p.categories.map((c) => (c.id === categoryId ? { ...c, name } : c)),
    }));

  const updateCategoryColor = (categoryId: string, color: string) =>
    updateProject((p) => ({
      ...p,
      categories: p.categories.map((c) => (c.id === categoryId ? { ...c, color } : c)),
    }));

  const deleteCategory = (categoryId: string) =>
    updateProject((p) => ({
      ...p,
      categories: p.categories.map((c) => (c.id === categoryId ? { ...c, deleted: true } : c)),
    }));

  const reorderCategories = (fromIndex: number, toIndex: number) =>
    updateProject((p) => {
      const visibleIds = p.categories.filter((c) => !c.deleted).map((c) => c.id);
      const movedId = visibleIds[fromIndex];
      const targetId = visibleIds[toIndex];
      const fromIdx = p.categories.findIndex((c) => c.id === movedId);
      const toIdx = p.categories.findIndex((c) => c.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return p;
      const cats = [...p.categories];
      const [moved] = cats.splice(fromIdx, 1);
      cats.splice(toIdx, 0, moved);
      return { ...p, categories: cats };
    });

  const reorderLineItems = (categoryId: string, fromIndex: number, toIndex: number) =>
    updateProject((p) => ({
      ...p,
      categories: p.categories.map((c) => {
        if (c.id !== categoryId) return c;
        const visibleIds = c.items.filter((i) => !i.deleted).map((i) => i.id);
        const movedId = visibleIds[fromIndex];
        const targetId = visibleIds[toIndex];
        const fromIdx = c.items.findIndex((i) => i.id === movedId);
        const toIdx = c.items.findIndex((i) => i.id === targetId);
        if (fromIdx === -1 || toIdx === -1) return c;
        const items = [...c.items];
        const [moved] = items.splice(fromIdx, 1);
        items.splice(toIdx, 0, moved);
        return { ...c, items };
      }),
    }));

  const moveLineItem = (
    fromCategoryId: string,
    toCategoryId: string,
    itemId: string,
    toIndex: number
  ) =>
    updateProject((p) => {
      const fromCat = p.categories.find((c) => c.id === fromCategoryId);
      if (!fromCat) return p;
      const item = fromCat.items.find((i) => i.id === itemId);
      if (!item) return p;
      return {
        ...p,
        categories: p.categories.map((c) => {
          if (c.id === fromCategoryId) {
            return { ...c, items: c.items.filter((i) => i.id !== itemId) };
          }
          if (c.id === toCategoryId) {
            const visibleIds = c.items.filter((i) => !i.deleted).map((i) => i.id);
            const targetId = visibleIds[toIndex];
            const insertAt =
              targetId === undefined ? c.items.length : c.items.findIndex((i) => i.id === targetId);
            const items = [...c.items];
            items.splice(insertAt < 0 ? c.items.length : insertAt, 0, item);
            return { ...c, items };
          }
          return c;
        }),
      };
    });

  const addLineItem = (
    categoryId: string,
    name: string,
    predictedCost: number,
    vendor: string = ""
  ) =>
    updateProject((p) => ({
      ...p,
      categories: p.categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              items: [
                ...c.items,
                {
                  id: generateId(),
                  name,
                  predictedCost,
                  vendor,
                  payments: [],
                  attachments: [],
                  status: "idea" as ItemStatus,
                  createdBy: currentUser,
                },
              ],
            }
          : c
      ),
    }));

  const updateLineItem = (
    categoryId: string,
    itemId: string,
    updates: Partial<Pick<LineItem, "name" | "predictedCost" | "vendor">>
  ) =>
    updateProject((p) => ({
      ...p,
      categories: p.categories.map((c) =>
        c.id === categoryId
          ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, ...updates } : i)) }
          : c
      ),
    }));

  const statusOrder: ItemStatus[] = ["idea", "quote", "started", "done"];

  const cycleLineItemStatus = (categoryId: string, itemId: string) =>
    updateProject((p) => ({
      ...p,
      categories: p.categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              items: c.items.map((i) => {
                if (i.id !== itemId) return i;
                const currentIndex = statusOrder.indexOf(i.status || "idea");
                const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
                return { ...i, status: nextStatus };
              }),
            }
          : c
      ),
    }));

  const deleteLineItem = (categoryId: string, itemId: string) =>
    updateProject((p) => ({
      ...p,
      categories: p.categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              items: c.items.map((i) => (i.id === itemId ? { ...i, deleted: true } : i)),
            }
          : c
      ),
      // Also unlink any moodboard items that pointed to this line item
      moodboard: {
        boards: (p.moodboard?.boards || []).map((b) => ({
          ...b,
          items: b.items.map((mi) =>
            mi.linkedCostItemId === itemId ? { ...mi, linkedCostItemId: undefined } : mi
          ),
        })),
      },
    }));

  const addPayment = (
    categoryId: string,
    itemId: string,
    amount: number,
    description: string,
    date: string
  ) =>
    updateProject((p) => ({
      ...p,
      categories: p.categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              items: c.items.map((i) =>
                i.id === itemId
                  ? { ...i, payments: [...i.payments, { id: generateId(), amount, description, date }] }
                  : i
              ),
            }
          : c
      ),
    }));

  const deletePayment = (categoryId: string, itemId: string, paymentId: string) =>
    updateProject((p) => ({
      ...p,
      categories: p.categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              items: c.items.map((i) =>
                i.id === itemId
                  ? {
                      ...i,
                      payments: i.payments.map((pay) =>
                        pay.id === paymentId ? { ...pay, deleted: true } : pay
                      ),
                    }
                  : i
              ),
            }
          : c
      ),
    }));

  const addAttachment = (
    categoryId: string,
    itemId: string,
    name: string,
    url: string,
    type: "link" | "file"
  ) =>
    updateProject((p) => ({
      ...p,
      categories: p.categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              items: c.items.map((i) =>
                i.id === itemId
                  ? {
                      ...i,
                      attachments: [...i.attachments, { id: generateId(), name, url, type }],
                    }
                  : i
              ),
            }
          : c
      ),
    }));

  const deleteAttachment = (categoryId: string, itemId: string, attachmentId: string) =>
    updateProject((p) => ({
      ...p,
      categories: p.categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              items: c.items.map((i) =>
                i.id === itemId
                  ? {
                      ...i,
                      attachments: i.attachments.map((a) =>
                        a.id === attachmentId ? { ...a, deleted: true } : a
                      ),
                    }
                  : i
              ),
            }
          : c
      ),
    }));

  const bulkImport = (
    rows: { category: string; item: string; cost: number; vendor: string }[]
  ) => {
    updateProject((p) => {
      const updated = { ...p, categories: [...p.categories] };
      for (const row of rows) {
        let cat = updated.categories.find(
          (c) => !c.deleted && c.name.toLowerCase() === row.category.toLowerCase()
        );
        if (!cat) {
          const usedColors = updated.categories.filter((c) => !c.deleted).map((c) => c.color);
          cat = {
            id: generateId(),
            name: row.category,
            color: getNextColor(usedColors),
            items: [],
            createdBy: currentUser,
          };
          updated.categories.push(cat);
        }
        cat.items.push({
          id: generateId(),
          name: row.item,
          predictedCost: row.cost,
          vendor: row.vendor,
          payments: [],
          attachments: [],
          status: "idea",
          createdBy: currentUser,
        });
      }
      return updated;
    });
  };

  const fullImport = (
    categories: Category[],
    reminders?: Reminder[],
    moodboard?: { boards: MoodBoard[] }
  ) => {
    updateProject((p) => {
      const updated = {
        ...p,
        categories: [...p.categories],
        reminders: [...(p.reminders || [])],
        moodboard: { boards: [...(p.moodboard?.boards || [])] },
      };
      const categoryIdMap = new Map<string, string>();
      const itemIdMap = new Map<string, string>();
      for (const importCat of categories) {
        let existing = updated.categories.find(
          (c) => !c.deleted && c.name.toLowerCase() === importCat.name.toLowerCase()
        );
        if (!existing) {
          const usedColors = updated.categories.filter((c) => !c.deleted).map((c) => c.color);
          existing = {
            id: generateId(),
            name: importCat.name,
            color: importCat.color || getNextColor(usedColors),
            items: [],
            createdBy: importCat.createdBy || DEFAULT_USER,
            deleted: importCat.deleted,
          };
          updated.categories.push(existing);
        }
        if (importCat.id) categoryIdMap.set(importCat.id, existing.id);
        for (const item of importCat.items) {
          const newId = generateId();
          if (item.id) itemIdMap.set(item.id, newId);
          existing.items.push({
            ...item,
            id: newId,
            createdBy: item.createdBy || DEFAULT_USER,
            payments: (item.payments || []).map((p) => ({ ...p, id: generateId() })),
            attachments: (item.attachments || []).map((a) => ({ ...a, id: generateId() })),
          });
        }
      }
      if (reminders && reminders.length > 0) {
        for (const r of reminders) {
          const mappedCategoryId = r.categoryId ? categoryIdMap.get(r.categoryId) : undefined;
          const mappedItemId = r.itemId ? itemIdMap.get(r.itemId) : undefined;
          updated.reminders.push({
            id: generateId(),
            text: r.text,
            categoryId: mappedCategoryId,
            itemId: mappedItemId,
            createdBy: r.createdBy || DEFAULT_USER,
            deleted: r.deleted,
          });
        }
      }
      if (moodboard?.boards?.length) {
        for (const importBoard of moodboard.boards) {
          let existingBoard = updated.moodboard.boards.find(
            (b) => !b.deleted && b.name.toLowerCase() === importBoard.name.toLowerCase()
          );
          if (!existingBoard) {
            const usedColors = updated.moodboard.boards.filter((b) => !b.deleted).map((b) => b.color);
            existingBoard = {
              id: generateId(),
              name: importBoard.name,
              color: importBoard.color || getNextColor(usedColors),
              items: [],
              createdBy: importBoard.createdBy || DEFAULT_USER,
              deleted: importBoard.deleted,
            };
            updated.moodboard.boards.push(existingBoard);
          }
          for (const mItem of importBoard.items || []) {
            const linkedMapped = mItem.linkedCostItemId
              ? itemIdMap.get(mItem.linkedCostItemId)
              : undefined;
            // Migrate legacy reaction -> votes
            let votes: MoodVote[] = mItem.votes || [];
            if ((!votes || votes.length === 0) && mItem.reaction) {
              votes = [{ user: mItem.createdBy || DEFAULT_USER, type: mItem.reaction }];
            }
            existingBoard.items.push({
              ...mItem,
              id: generateId(),
              linkedCostItemId: linkedMapped,
              votes,
              reaction: undefined,
              createdBy: mItem.createdBy || DEFAULT_USER,
            });
          }
        }
      }
      return updated;
    });
  };

  const addReminder = (text: string, categoryId?: string, itemId?: string) =>
    updateProject((p) => ({
      ...p,
      reminders: [
        ...(p.reminders || []),
        { id: generateId(), text, categoryId, itemId, createdBy: currentUser },
      ],
    }));

  const updateReminder = (
    reminderId: string,
    updates: Partial<Pick<Reminder, "text" | "categoryId" | "itemId">>
  ) =>
    updateProject((p) => ({
      ...p,
      reminders: (p.reminders || []).map((r) => (r.id === reminderId ? { ...r, ...updates } : r)),
    }));

  const deleteReminder = (reminderId: string) =>
    updateProject((p) => ({
      ...p,
      reminders: (p.reminders || []).map((r) =>
        r.id === reminderId ? { ...r, deleted: true } : r
      ),
    }));

  // ===== Moodboard =====
  const getBoards = (p: Project) => p.moodboard?.boards || [];

  const addBoard = (name: string) =>
    updateProject((p) => {
      const boards = getBoards(p);
      const usedColors = boards.filter((b) => !b.deleted).map((b) => b.color);
      const color = getNextColor(usedColors);
      return {
        ...p,
        moodboard: {
          boards: [
            ...boards,
            { id: generateId(), name, color, items: [], createdBy: currentUser },
          ],
        },
      };
    });

  const renameBoard = (boardId: string, name: string) =>
    updateProject((p) => ({
      ...p,
      moodboard: {
        boards: getBoards(p).map((b) => (b.id === boardId ? { ...b, name } : b)),
      },
    }));

  const updateBoardColor = (boardId: string, color: string) =>
    updateProject((p) => ({
      ...p,
      moodboard: {
        boards: getBoards(p).map((b) => (b.id === boardId ? { ...b, color } : b)),
      },
    }));

  const deleteBoard = (boardId: string) =>
    updateProject((p) => ({
      ...p,
      moodboard: {
        boards: getBoards(p).map((b) => (b.id === boardId ? { ...b, deleted: true } : b)),
      },
    }));

  const reorderBoards = (fromIndex: number, toIndex: number) =>
    updateProject((p) => {
      const boards = [...getBoards(p)];
      const [moved] = boards.splice(fromIndex, 1);
      boards.splice(toIndex, 0, moved);
      return { ...p, moodboard: { boards } };
    });

  const addMoodItem = (
    boardId: string,
    item: Omit<MoodItem, "id" | "createdAt">
  ) =>
    updateProject((p) => ({
      ...p,
      moodboard: {
        boards: getBoards(p).map((b) =>
          b.id === boardId
            ? {
                ...b,
                items: [
                  ...b.items,
                  {
                    ...item,
                    id: generateId(),
                    createdAt: new Date().toISOString(),
                    createdBy: item.createdBy || currentUser,
                    votes: item.votes || [],
                  },
                ],
              }
            : b
        ),
      },
    }));

  const updateMoodItem = (
    boardId: string,
    itemId: string,
    updates: Partial<Omit<MoodItem, "id" | "createdAt">>
  ) =>
    updateProject((p) => ({
      ...p,
      moodboard: {
        boards: getBoards(p).map((b) =>
          b.id === boardId
            ? { ...b, items: b.items.map((i) => (i.id === itemId ? { ...i, ...updates } : i)) }
            : b
        ),
      },
    }));

  const deleteMoodItem = (boardId: string, itemId: string) =>
    updateProject((p) => ({
      ...p,
      moodboard: {
        boards: getBoards(p).map((b) =>
          b.id === boardId
            ? { ...b, items: b.items.map((i) => (i.id === itemId ? { ...i, deleted: true } : i)) }
            : b
        ),
      },
    }));

  const reorderMoodItems = (boardId: string, fromIndex: number, toIndex: number) =>
    updateProject((p) => ({
      ...p,
      moodboard: {
        boards: getBoards(p).map((b) => {
          if (b.id !== boardId) return b;
          const items = [...b.items];
          const [moved] = items.splice(fromIndex, 1);
          items.splice(toIndex, 0, moved);
          return { ...b, items };
        }),
      },
    }));

  const moveMoodItem = (
    fromBoardId: string,
    toBoardId: string,
    itemId: string,
    toIndex: number
  ) =>
    updateProject((p) => {
      const boards = getBoards(p);
      const fromBoard = boards.find((b) => b.id === fromBoardId);
      if (!fromBoard) return p;
      const item = fromBoard.items.find((i) => i.id === itemId);
      if (!item) return p;
      return {
        ...p,
        moodboard: {
          boards: boards.map((b) => {
            if (b.id === fromBoardId) {
              return { ...b, items: b.items.filter((i) => i.id !== itemId) };
            }
            if (b.id === toBoardId) {
              const items = [...b.items];
              items.splice(toIndex, 0, item);
              return { ...b, items };
            }
            return b;
          }),
        },
      };
    });

  // Toggle current user's vote on a moodboard item.
  // Clicking the same vote type removes it; clicking opposite switches it.
  const voteMoodItem = (boardId: string, itemId: string, type: "up" | "down") =>
    updateProject((p) => ({
      ...p,
      moodboard: {
        boards: getBoards(p).map((b) =>
          b.id === boardId
            ? {
                ...b,
                items: b.items.map((i) => {
                  if (i.id !== itemId) return i;
                  const votes = i.votes || [];
                  const existing = votes.find((v) => v.user === currentUser);
                  let nextVotes: MoodVote[];
                  if (existing && existing.type === type) {
                    nextVotes = votes.filter((v) => v.user !== currentUser);
                  } else if (existing) {
                    nextVotes = votes.map((v) =>
                      v.user === currentUser ? { ...v, type } : v
                    );
                  } else {
                    nextVotes = [...votes, { user: currentUser, type }];
                  }
                  return { ...i, votes: nextVotes };
                }),
              }
            : b
        ),
      },
    }));

  const promoteMoodItemToCost = (
    boardId: string,
    itemId: string,
    targetCategoryId: string
  ) =>
    updateProject((p) => {
      const boards = getBoards(p);
      const board = boards.find((b) => b.id === boardId);
      const moodItem = board?.items.find((i) => i.id === itemId);
      if (!board || !moodItem) return p;
      const newLineItemId = generateId();
      const newLineItem: LineItem = {
        id: newLineItemId,
        name: moodItem.title,
        vendor: "",
        predictedCost: moodItem.price ?? 0,
        payments: [],
        attachments: moodItem.url
          ? [
              {
                id: generateId(),
                name: moodItem.title || "Source",
                url: moodItem.url,
                type: "link",
              },
            ]
          : [],
        status: "idea",
        createdBy: currentUser,
      };
      return {
        ...p,
        categories: p.categories.map((c) =>
          c.id === targetCategoryId ? { ...c, items: [...c.items, newLineItem] } : c
        ),
        moodboard: {
          boards: boards.map((b) =>
            b.id === boardId
              ? {
                  ...b,
                  items: b.items.map((i) =>
                    i.id === itemId ? { ...i, linkedCostItemId: newLineItemId } : i
                  ),
                }
              : b
          ),
        },
      };
    });

  // Untick "added to costs": remove the link AND soft-delete the line item.
  const unpromoteMoodItem = (boardId: string, itemId: string) =>
    updateProject((p) => {
      const boards = getBoards(p);
      const board = boards.find((b) => b.id === boardId);
      const moodItem = board?.items.find((i) => i.id === itemId);
      const linkedId = moodItem?.linkedCostItemId;
      return {
        ...p,
        categories: linkedId
          ? p.categories.map((c) => ({
              ...c,
              items: c.items.map((i) =>
                i.id === linkedId ? { ...i, deleted: true } : i
              ),
            }))
          : p.categories,
        moodboard: {
          boards: boards.map((b) =>
            b.id === boardId
              ? {
                  ...b,
                  items: b.items.map((i) =>
                    i.id === itemId ? { ...i, linkedCostItemId: undefined } : i
                  ),
                }
              : b
          ),
        },
      };
    });

  return {
    project,        // visible (non-deleted) — for UI
    rawProject,     // full data — for export
    loading,
    setProjectName,
    addCategory,
    bulkImport,
    fullImport,
    updateCategory,
    updateCategoryColor,
    deleteCategory,
    reorderCategories,
    reorderLineItems,
    moveLineItem,
    addLineItem,
    updateLineItem,
    cycleLineItemStatus,
    deleteLineItem,
    addPayment,
    deletePayment,
    addAttachment,
    deleteAttachment,
    addReminder,
    updateReminder,
    deleteReminder,
    // moodboard
    addBoard,
    renameBoard,
    updateBoardColor,
    deleteBoard,
    reorderBoards,
    addMoodItem,
    updateMoodItem,
    deleteMoodItem,
    reorderMoodItems,
    moveMoodItem,
    voteMoodItem,
    promoteMoodItemToCost,
    unpromoteMoodItem,
  };
}
