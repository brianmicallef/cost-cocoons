import { useState, useEffect, useRef } from "react";
import type { Project, Category, LineItem, Payment, Attachment, ItemStatus, Reminder, MoodBoard, MoodItem } from "@/types/project";
import { getNextColor } from "@/lib/categoryColors";

const generateId = () => crypto.randomUUID();

const migrateProject = (p: Project): Project => ({
  ...p,
  reminders: p.reminders || [],
  moodboard: p.moodboard || { boards: [] },
  categories: p.categories.map((c, i) => ({
    ...c,
    color: c.color || `hsl(${(i * 137) % 360}, 65%, 55%)`,
    items: c.items.map((item) => ({
      ...item,
      attachments: item.attachments || [],
      vendor: item.vendor || "",
      status: item.status || (item.completed ? 'done' : 'idea'),
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

export function useProject() {
  const [project, setProject] = useState<Project>(defaultProject);
  const [loading, setLoading] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadDone = useRef(false);

  // Load project from API on mount
  useEffect(() => {
    fetch("/.netlify/functions/project")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.id) {
          setProject(migrateProject(data));
        }
        initialLoadDone.current = true;
        setLoading(false);
      })
      .catch(() => {
        initialLoadDone.current = true;
        setLoading(false);
      });
  }, []);

  // Save project to API (debounced) whenever it changes
  useEffect(() => {
    if (!initialLoadDone.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      fetch("/.netlify/functions/project", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      }).catch(() => {});
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [project]);

  const updateProject = (updater: (p: Project) => Project) => {
    setProject((prev) => updater(prev));
  };

  const setProjectName = (name: string) =>
    updateProject((p) => ({ ...p, name }));

  const addCategory = (name: string) => {
    const usedColors = project.categories.map((c) => c.color);
    const color = getNextColor(usedColors);
    updateProject((p) => ({
      ...p,
      categories: [...p.categories, { id: generateId(), name, color, items: [] }],
    }));
  };

  const updateCategory = (categoryId: string, name: string) =>
    updateProject((p) => ({
      ...p,
      categories: p.categories.map((c) =>
        c.id === categoryId ? { ...c, name } : c
      ),
    }));

  const updateCategoryColor = (categoryId: string, color: string) =>
    updateProject((p) => ({
      ...p,
      categories: p.categories.map((c) =>
        c.id === categoryId ? { ...c, color } : c
      ),
    }));

  const deleteCategory = (categoryId: string) =>
    updateProject((p) => ({
      ...p,
      categories: p.categories.filter((c) => c.id !== categoryId),
    }));

  const reorderCategories = (fromIndex: number, toIndex: number) =>
    updateProject((p) => {
      const cats = [...p.categories];
      const [moved] = cats.splice(fromIndex, 1);
      cats.splice(toIndex, 0, moved);
      return { ...p, categories: cats };
    });

  const reorderLineItems = (categoryId: string, fromIndex: number, toIndex: number) =>
    updateProject((p) => ({
      ...p,
      categories: p.categories.map((c) => {
        if (c.id !== categoryId) return c;
        const items = [...c.items];
        const [moved] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, moved);
        return { ...c, items };
      }),
    }));

  const moveLineItem = (fromCategoryId: string, toCategoryId: string, itemId: string, toIndex: number) =>
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
            const items = [...c.items];
            items.splice(toIndex, 0, item);
            return { ...c, items };
          }
          return c;
        }),
      };
    });

  const addLineItem = (categoryId: string, name: string, predictedCost: number, vendor: string = "") =>
    updateProject((p) => ({
      ...p,
      categories: p.categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              items: [
                ...c.items,
                { id: generateId(), name, predictedCost, vendor, payments: [], attachments: [], status: 'idea' as ItemStatus },
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
          ? {
              ...c,
              items: c.items.map((i) =>
                i.id === itemId ? { ...i, ...updates } : i
              ),
            }
          : c
      ),
    }));

  const statusOrder: ItemStatus[] = ['idea', 'quote', 'started', 'done'];

  const cycleLineItemStatus = (categoryId: string, itemId: string) =>
    updateProject((p) => ({
      ...p,
      categories: p.categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              items: c.items.map((i) => {
                if (i.id !== itemId) return i;
                const currentIndex = statusOrder.indexOf(i.status || 'idea');
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
          ? { ...c, items: c.items.filter((i) => i.id !== itemId) }
          : c
      ),
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
                  ? {
                      ...i,
                      payments: [
                        ...i.payments,
                        { id: generateId(), amount, description, date },
                      ],
                    }
                  : i
              ),
            }
          : c
      ),
    }));

  const deletePayment = (
    categoryId: string,
    itemId: string,
    paymentId: string
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
                      payments: i.payments.filter((pay) => pay.id !== paymentId),
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
    type: 'link' | 'file'
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
                      attachments: [
                        ...i.attachments,
                        { id: generateId(), name, url, type },
                      ],
                    }
                  : i
              ),
            }
          : c
      ),
    }));

  const deleteAttachment = (
    categoryId: string,
    itemId: string,
    attachmentId: string
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
                      attachments: i.attachments.filter((a) => a.id !== attachmentId),
                    }
                  : i
              ),
            }
          : c
      ),
    }));

  const bulkImport = (rows: { category: string; item: string; cost: number; vendor: string }[]) => {
    updateProject((p) => {
      const updated = { ...p, categories: [...p.categories] };
      for (const row of rows) {
        let cat = updated.categories.find(
          (c) => c.name.toLowerCase() === row.category.toLowerCase()
        );
        if (!cat) {
          const usedColors = updated.categories.map((c) => c.color);
          cat = { id: generateId(), name: row.category, color: getNextColor(usedColors), items: [] };
          updated.categories.push(cat);
        }
        cat.items.push({
          id: generateId(),
          name: row.item,
          predictedCost: row.cost,
          vendor: row.vendor,
          payments: [],
          attachments: [],
          status: 'idea',
        });
      }
      return updated;
    });
  };

  const fullImport = (categories: Category[], reminders?: Reminder[]) => {
    updateProject((p) => {
      const updated = { ...p, categories: [...p.categories], reminders: [...(p.reminders || [])] };
      const categoryIdMap = new Map<string, string>();
      const itemIdMap = new Map<string, string>();
      for (const importCat of categories) {
        let existing = updated.categories.find(
          (c) => c.name.toLowerCase() === importCat.name.toLowerCase()
        );
        if (!existing) {
          const usedColors = updated.categories.map((c) => c.color);
          existing = {
            id: generateId(),
            name: importCat.name,
            color: importCat.color || getNextColor(usedColors),
            items: [],
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
          });
        }
      }
      return updated;
    });
  };

  const addReminder = (text: string, categoryId?: string, itemId?: string) =>
    updateProject((p) => ({
      ...p,
      reminders: [...(p.reminders || []), { id: generateId(), text, categoryId, itemId }],
    }));

  const updateReminder = (
    reminderId: string,
    updates: Partial<Pick<Reminder, "text" | "categoryId" | "itemId">>
  ) =>
    updateProject((p) => ({
      ...p,
      reminders: (p.reminders || []).map((r) =>
        r.id === reminderId ? { ...r, ...updates } : r
      ),
    }));

  const deleteReminder = (reminderId: string) =>
    updateProject((p) => ({
      ...p,
      reminders: (p.reminders || []).filter((r) => r.id !== reminderId),
    }));

  return {
    project,
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
  };
}
