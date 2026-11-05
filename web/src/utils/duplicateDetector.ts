/**
 * Duplicate Garment Heuristic Detector for OTD Intake Atelier.
 *
 * NOTE: This is a client-side heuristic comparison tool. It performs
 * calibrated metadata and image source comparisons against active wardrobe items.
 * Final visual embedding and feature matching will be executed by backend AI services.
 */

import type { ClosetItem } from '../context/ClosetContext';
import type { GarmentDraft } from '../components/ClosetUploadView';

export interface DuplicateMatchResult {
  existingItem: ClosetItem;
  reason: 'exact_name' | 'brand_and_silhouette' | 'identical_image';
  explanation: string;
}

/**
 * Clean and normalize text for comparison.
 */
function normalizeText(text?: string): string {
  return (text || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Checks a garment draft against the active closet items.
 * Returns the matching closet item and reason if a possible duplicate is detected, or null otherwise.
 */
export function detectDuplicateGarment(
  draft: GarmentDraft,
  existingCloset: ClosetItem[]
): DuplicateMatchResult | null {
  const activeItems = existingCloset.filter((item) => !item.isArchived);

  const draftName = normalizeText(draft.name);
  const draftBrand = normalizeText(draft.brand);
  const draftSubType = normalizeText(draft.subType);
  const draftColor = normalizeText(draft.color);

  // Skip heuristic check for default placeholder names
  const isGenericName =
    !draftName ||
    draftName === 'captured garment' ||
    draftName.startsWith('garment ') ||
    draftName === 'new garment';

  for (const item of activeItems) {
    const itemName = normalizeText(item.name);
    const itemBrand = normalizeText(item.brand);
    const itemSubType = normalizeText(item.subType);
    const itemColor = normalizeText(item.color);

    // 1. Identical Image Source (same data URL or same remote asset URL)
    if (draft.imageUrl && item.imageUrl && draft.imageUrl === item.imageUrl) {
      return {
        existingItem: item,
        reason: 'identical_image',
        explanation: 'Both entries share the exact same source photograph.',
      };
    }

    // 2. Exact Garment Name match (when not generic)
    if (!isGenericName && itemName && draftName === itemName) {
      return {
        existingItem: item,
        reason: 'exact_name',
        explanation: `Matches existing wardrobe piece "${item.name}".`,
      };
    }

    // 3. High-confidence metadata overlap: Brand + Category + SubType + Color
    const hasBrand = draftBrand && draftBrand !== 'bespoke' && draftBrand !== 'bespoke atelier';
    if (
      hasBrand &&
      draftBrand === itemBrand &&
      draft.category === item.category &&
      draftSubType === itemSubType &&
      draftColor &&
      itemColor &&
      draftColor === itemColor
    ) {
      return {
        existingItem: item,
        reason: 'brand_and_silhouette',
        explanation: `Shares identical brand (${item.brand}), silhouette (${item.subType}), and color (${item.color}).`,
      };
    }
  }

  return null;
}
