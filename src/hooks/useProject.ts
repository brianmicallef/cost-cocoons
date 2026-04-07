import { useState, useEffect } from "react";
import type { Project, Category, LineItem, Payment, Attachment } from "@/types/project";
import { getNextColor } from "@/lib/categoryColors";

const STORAGE_KEY = "building-project-data";

const generateId = () => crypto.randomUUID();

const loadProject = (): Project => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const p = JSON.parse(stored) as Project;
      // Migrate old data: add missing color/attachments
      p.categories = p.categories.map((c, i) => ({
        ...c,
        color: c.color || `hsl(${(i * 137) % 360}, 65%, 55%)`,
        items: c.items.map((item) => ({
          ...item,
          attachments: item.attachments || [],
          vendor: item.vendor || "",
        })),
      }));
      return p;
    }
  } catch {}
  return { id: generateId(), name: "My Building Project", categories: [] };
};

export function useProject() {
  const [project, setProject] = useState<Project>(loadProject);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
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

  return {
    project,
    setProjectName,
    addCategory,
    bulkImport,
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
