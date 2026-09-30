import { Category } from "@/models";
import { updateDemoCategory, DEMO_CATEGORIES, savePersistedData, ensureLoaded } from "@/lib/demoData";

/**
 * Normalizes all categories for a business to sequential numbers (1, 2, 3, ...) without gaps or duplicates.
 */
export async function normalizeCategoryDisplayOrders(businessId?: any): Promise<void> {
  ensureLoaded(true);
  try {
    const query: any = {};
    if (businessId) {
      query.$or = [
        { businessId },
        { businessId: { $exists: false } },
      ];
    }

    const categories = await Category.find(query).sort({ displayOrder: 1, createdAt: 1 });
    let expectedOrder = 1;
    for (const cat of categories) {
      if (cat.displayOrder !== expectedOrder) {
        await Category.findByIdAndUpdate(cat._id, { $set: { displayOrder: expectedOrder } });
      }
      try {
        updateDemoCategory(cat._id.toString(), { displayOrder: expectedOrder });
      } catch {}
      expectedOrder++;
    }
  } catch (err) {
    console.warn("normalizeCategoryDisplayOrders DB error:", err);
  }

  // Also normalize DEMO_CATEGORIES in memory
  try {
    DEMO_CATEGORIES.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    DEMO_CATEGORIES.forEach((cat, index) => {
      cat.displayOrder = index + 1;
    });
    savePersistedData();
  } catch {}
}

/**
 * Shifts and reorders all categories when a category's display order is set.
 * - When editing: moves category to targetOrder and shifts other categories accordingly.
 * - When creating: inserts new item at targetOrder and shifts existing categories with order >= targetOrder down by +1.
 * Returns the final assigned displayOrder.
 */
export async function handleCategoryDisplayOrder({
  categoryId,
  targetOrder,
  businessId,
}: {
  categoryId?: string | null;
  targetOrder: number;
  businessId?: any;
}): Promise<number> {
  const desired = Math.max(1, Math.floor(Number(targetOrder) || 1));

  try {
    const query: any = {};
    if (businessId) {
      query.$or = [
        { businessId },
        { businessId: { $exists: false } },
      ];
    }

    let allCats = await Category.find(query).sort({ displayOrder: 1, createdAt: 1 });

    if (categoryId) {
      // EDIT MODE: Move existing category to targetOrder and shift the rest
      const currentIdStr = String(categoryId);
      const targetCat = allCats.find(
        (c) => c._id.toString() === currentIdStr || c.slug === currentIdStr
      );

      const remaining = allCats.filter(
        (c) => c._id.toString() !== currentIdStr && c.slug !== currentIdStr
      );

      const insertIndex = Math.max(0, Math.min(remaining.length, desired - 1));

      if (targetCat) {
        remaining.splice(insertIndex, 0, targetCat);
      }

      for (let i = 0; i < remaining.length; i++) {
        const cat = remaining[i];
        const newOrder = i + 1;
        if (cat.displayOrder !== newOrder) {
          await Category.findByIdAndUpdate(cat._id, { $set: { displayOrder: newOrder } });
          try {
            updateDemoCategory(cat._id.toString(), { displayOrder: newOrder });
          } catch {}
        }
      }

      return insertIndex + 1;
    } else {
      // CREATE MODE: Insert placeholder at targetOrder and shift the rest down
      const insertIndex = Math.max(0, Math.min(allCats.length, desired - 1));
      const placeholder: any = { _isNew: true };
      const reorderedList: any[] = [...allCats];
      reorderedList.splice(insertIndex, 0, placeholder);

      for (let i = 0; i < reorderedList.length; i++) {
        const cat = reorderedList[i];
        if (!cat._isNew) {
          const newOrder = i + 1;
          if (cat.displayOrder !== newOrder) {
            await Category.findByIdAndUpdate(cat._id, { $set: { displayOrder: newOrder } });
            try {
              updateDemoCategory(cat._id.toString(), { displayOrder: newOrder });
            } catch {}
          }
        }
      }

      return insertIndex + 1;
    }
  } catch (err) {
    console.warn("handleCategoryDisplayOrder DB error (handling in demo store):", err);
  }

  // Handle in memory / demo store as well
  try {
    if (categoryId) {
      const currentIdStr = String(categoryId);
      const targetDemo = DEMO_CATEGORIES.find(
        (c) => c._id === currentIdStr || c.slug === currentIdStr
      );
      const remaining = DEMO_CATEGORIES.filter(
        (c) => c._id !== currentIdStr && c.slug !== currentIdStr
      );
      const insertIndex = Math.max(0, Math.min(remaining.length, desired - 1));
      if (targetDemo) {
        remaining.splice(insertIndex, 0, targetDemo);
      }
      remaining.forEach((cat, index) => {
        cat.displayOrder = index + 1;
      });
      DEMO_CATEGORIES.length = 0;
      DEMO_CATEGORIES.push(...remaining);
    } else {
      const insertIndex = Math.max(0, Math.min(DEMO_CATEGORIES.length, desired - 1));
      const placeholder: any = { _isNew: true };
      const reorderedList: any[] = [...DEMO_CATEGORIES];
      reorderedList.splice(insertIndex, 0, placeholder);
      reorderedList.forEach((cat, index) => {
        if (!cat._isNew) {
          cat.displayOrder = index + 1;
        }
      });
      const filtered = reorderedList.filter((c) => !c._isNew);
      DEMO_CATEGORIES.length = 0;
      DEMO_CATEGORIES.push(...filtered);
    }
    savePersistedData();
  } catch {}

  return desired;
}
