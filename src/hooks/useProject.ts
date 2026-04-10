import { useState, useEffect, useRef } from "react";
import type { Project, Category, LineItem, Payment, Attachment } from "@/types/project";
import { getNextColor } from "@/lib/categoryColors";

const generateId = () => crypto.randomUUID();

const migrateProject = (p: Project): Project => ({
  ...p,
  categories: p.categories.map((c, i) => ({
    ...c,
    color: c.color || `hsl(${(i * 137) % 360}, 65%, 55%)`,
    items: c.items.map((item) => ({
      ...item,
      attachments: item.attachments || [],
      vendor: item.vendor || "",
    })),
  })),
});

const defaultProject = (): Project => ({
  id: generateId(),
  name: "Roebuck Lane",
  categories: [],
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

  const addLineItem = (categoryId: string, name: string, predictedCost: number, vendor: string = "") =>
    updateProject((p) => ({
      ...p,
      categories: p.categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              items: [
                ...c.items,
                { id: generateId(), name, predictedCost, vendor, payments: [], attachments: [] },
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
        });
      }
      return updated;
    });
  };

  const fullImport = (categories: Category[]) => {
    updateProject((p) => {
      const updated = { ...p, categories: [...p.categories] };
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
        for (const item of importCat.items) {
          existing.items.push({
            ...item,
            id: generateId(),
            payments: (item.payments || []).map((p) => ({ ...p, id: generateId() })),
            attachments: (item.attachments || []).map((a) => ({ ...a, id: generateId() })),
          });
        }
      }
      return updated;
    });
  };

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
    addLineItem,
    updateLineItem,
    deleteLineItem,
    addPayment,
    deletePayment,
    addAttachment,
    deleteAttachment,
  };
}
