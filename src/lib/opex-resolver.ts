// OPEX resolver — resolves milestone-based operational costs for a given subscriber count
// Pure function, no server dependencies

export interface OpexMilestoneData {
  memberCount: number;
  monthlyCost: number;
  notes?: string;
}

export interface OpexItemData {
  id: string;
  name: string;
  vendor?: string;
  isActive: boolean;
  milestones: OpexMilestoneData[];
}

export interface OpexCategoryData {
  id: string;
  name: string;
  icon?: string;
  color: string;
  isActive: boolean;
  items: OpexItemData[];
}

export interface OpexBreakdownEntry {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  itemName: string;
  cost: number;
  milestoneThreshold: number;
}

export interface ResolvedOpex {
  total: number;
  breakdown: OpexBreakdownEntry[];
  byCategory: { categoryId: string; categoryName: string; categoryColor: string; total: number }[];
}

/**
 * For a given member count, resolve the monthly OPEX from milestone-based data.
 * For each active item, finds the highest milestone threshold at-or-below the member count.
 * If no milestone is at-or-below, uses the lowest available milestone (pre-launch cost).
 */
export function resolveOpexForMemberCount(
  categories: OpexCategoryData[],
  memberCount: number
): ResolvedOpex {
  const breakdown: OpexBreakdownEntry[] = [];

  for (const category of categories) {
    if (!category.isActive) continue;

    for (const item of category.items) {
      if (!item.isActive) continue;
      if (item.milestones.length === 0) continue;

      // Sort milestones by memberCount ascending
      const sorted = [...item.milestones].sort((a, b) => a.memberCount - b.memberCount);

      // Find the highest milestone at-or-below the current member count
      let matched = sorted[0]; // fallback to lowest
      for (const ms of sorted) {
        if (ms.memberCount <= memberCount) {
          matched = ms;
        } else {
          break;
        }
      }

      breakdown.push({
        categoryId: category.id,
        categoryName: category.name,
        categoryColor: category.color,
        itemName: item.name,
        cost: Number(matched.monthlyCost),
        milestoneThreshold: matched.memberCount,
      });
    }
  }

  // Aggregate by category
  const categoryMap = new Map<string, { categoryId: string; categoryName: string; categoryColor: string; total: number }>();
  for (const entry of breakdown) {
    const existing = categoryMap.get(entry.categoryId);
    if (existing) {
      existing.total += entry.cost;
    } else {
      categoryMap.set(entry.categoryId, {
        categoryId: entry.categoryId,
        categoryName: entry.categoryName,
        categoryColor: entry.categoryColor,
        total: entry.cost,
      });
    }
  }

  const total = breakdown.reduce((sum, e) => sum + e.cost, 0);

  return {
    total,
    breakdown,
    byCategory: Array.from(categoryMap.values()),
  };
}
