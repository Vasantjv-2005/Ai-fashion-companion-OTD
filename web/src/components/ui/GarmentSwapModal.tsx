import React, { useState } from 'react';
import {
  X,
  Check,
  Search,
  ArrowLeftRight,
  ShieldCheck,
  AlertCircle,
  Tag,
  Info
} from 'lucide-react';
import type { ClosetItem } from '../../context/ClosetContext';
import type { OutfitSlotItem } from './AvatarOutfitCanvas';
import { useFocusTrap } from '../../utils/focusTrap';

interface GarmentSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: OutfitSlotItem | null;
  allSlots: OutfitSlotItem[];
  closet: ClosetItem[];
  onApplySwap: (slotKey: OutfitSlotItem['slot'], newItem: ClosetItem) => void;
}

// Map outfit slot keys to closet categories
const SLOT_CATEGORY_MAP: Record<OutfitSlotItem['slot'], ClosetItem['category']> = {
  top: 'tops',
  outerwear: 'outerwear',
  bottom: 'bottoms',
  footwear: 'footwear',
  accessory: 'accessories',
};

// Editorial slot display titles
const SLOT_TITLES: Record<OutfitSlotItem['slot'], string> = {
  top: 'Change Base Top',
  outerwear: 'Change Jacket / Layer',
  bottom: 'Change Trousers / Bottoms',
  footwear: 'Change Footwear',
  accessory: 'Change Accessory',
};

export const GarmentSwapModal: React.FC<GarmentSwapModalProps> = ({
  isOpen,
  onClose,
  slot,
  allSlots,
  closet,
  onApplySwap,
}) => {
  const sessionKey = isOpen ? `${slot?.slot ?? 'none'}:${slot?.closetItemId ?? 'empty'}` : 'closed';
  const [prevSessionKey, setPrevSessionKey] = useState(sessionKey);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(slot?.closetItemId || null);
  const [failedImageUrls, setFailedImageUrls] = useState<Record<string, true>>({});

  // Synchronize search and initial selection whenever the modal opens or target slot changes
  if (sessionKey !== prevSessionKey) {
    setPrevSessionKey(sessionKey);
    setSearchQuery('');
    setSelectedItemId(isOpen ? slot?.closetItemId || null : null);
    setFailedImageUrls({});
  }

  // Focus trap, restoration & Escape key dismiss
  const modalRef = useFocusTrap<HTMLDivElement>({ isOpen, onClose });

  if (!isOpen || !slot) return null;

  const targetCategory = SLOT_CATEGORY_MAP[slot.slot];
  const modalTitle = SLOT_TITLES[slot.slot] || `Change ${slot.slotLabel}`;

  // Find IDs of items worn in OTHER slots to prevent duplicate assignments
  const wornInOtherSlots = allSlots
    .filter((s) => s.slot !== slot.slot && s.closetItemId)
    .map((s) => s.closetItemId as string);

  // Filter closet items by category & search query (excluding any archived garments)
  const compatibleItems = closet.filter((item) => {
    if (item.isArchived) return false;
    if (item.category !== targetCategory) return false;
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.brand.toLowerCase().includes(query) ||
      item.color.toLowerCase().includes(query) ||
      item.subType.toLowerCase().includes(query) ||
      (item.description ? item.description.toLowerCase().includes(query) : false)
    );
  });

  const selectedItem = closet.find(
    (item) => !item.isArchived && item.category === targetCategory && item.id === selectedItemId
  );
  const isCurrentItem = Boolean(slot.closetItemId && selectedItemId === slot.closetItemId);
  const isSelectedDuplicate = Boolean(selectedItemId && wornInOtherSlots.includes(selectedItemId));

  const handleApply = () => {
    if (selectedItem && !isCurrentItem && !isSelectedDuplicate) {
      onApplySwap(slot.slot, selectedItem);
      onClose();
    }
  };

  // Names of other preserved garments for reassurance
  const preservedPieces = allSlots
    .filter((s) => s.slot !== slot.slot)
    .map((s) => s.name);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="garment-swap-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl bg-[var(--bg-card)] text-[var(--text-body)] border border-[var(--border-card)] flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ======================================================================= */}
        {/* MODAL HEADER */}
        {/* ======================================================================= */}
        <div className="p-4 sm:p-6 border-b border-[var(--border-card)] flex items-start justify-between gap-4 bg-[var(--bg-card)]/95 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider uppercase bg-[var(--pill-bg)] text-[var(--gold-primary)] font-bold border border-[var(--border-card)]">
                Slot Replacement • {slot.slotLabel}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                {compatibleItems.length} {compatibleItems.length === 1 ? 'piece' : 'pieces'} in Digital Closet
              </span>
            </div>
            <h2
              id="garment-swap-title"
              className="font-playfair text-xl sm:text-2xl font-bold text-[var(--text-heading)] leading-tight flex items-center gap-2"
            >
              <span>{modalTitle}</span>
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Select an alternative piece from your closet. All other 4 ensemble pieces remain locked.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[var(--pill-bg)] border border-[var(--border-card)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:border-[var(--gold-primary)] transition-all cursor-pointer shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ======================================================================= */}
        {/* PRESERVATION CONTEXT BANNER */}
        {/* ======================================================================= */}
        <div className="px-5 sm:px-6 py-2.5 bg-[var(--pill-bg)]/60 border-b border-[var(--border-hairline)] flex items-center gap-2 text-[11px] text-[var(--text-muted)] overflow-x-auto select-none">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="font-semibold text-[var(--text-heading)] shrink-0">Preserved in Look:</span>
          <span className="truncate">
            {preservedPieces.slice(0, 3).join(' • ')} {preservedPieces.length > 3 ? `+${preservedPieces.length - 3} more` : ''}
          </span>
        </div>

        {/* ======================================================================= */}
        {/* SEARCH & INLINE FILTERS */}
        {/* ======================================================================= */}
        <div className="p-3.5 sm:p-5 border-b border-[var(--border-hairline)] shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={`Search ${targetCategory} by name, brand, or color...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-card-inner)] border border-[var(--border-card)] text-xs text-[var(--text-heading)] outline-none focus:border-[var(--gold-primary)] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* CLOSET ITEMS LIST / SELECTION GRID */}
        {/* ======================================================================= */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 min-h-[120px]">
          {compatibleItems.length === 0 ? (
            /* Empty State */
            <div className="py-12 px-4 text-center space-y-3 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-card)] mx-auto flex items-center justify-center text-[var(--gold-primary)]">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-playfair text-base font-bold text-[var(--text-heading)]">
                No Matching {slot.slotLabel} in Closet
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {searchQuery
                  ? `No items matching "${searchQuery}" found in your ${targetCategory} collection.`
                  : `You do not have any registered items in the "${targetCategory}" category of your Digital Closet yet.`}
              </p>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-800 dark:text-amber-200 text-left flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <span>
                  <strong>Honest Wardrobe Rule:</strong> OTD will never fabricate owned status or display store products as closet items. Add garments to your closet anytime to unlock them here.
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {compatibleItems.map((item) => {
                const isSelected = selectedItemId === item.id;
                const isCurrentEquipped = slot.closetItemId === item.id;
                const isDuplicateWorn = wornInOtherSlots.includes(item.id);

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={isDuplicateWorn ? -1 : 0}
                    aria-pressed={isSelected}
                    aria-disabled={isDuplicateWorn}
                    aria-label={`Select ${item.name}, ${item.brand || ''} ${item.subType}${isDuplicateWorn ? ' (Already worn in another slot)' : ''}`}
                    onClick={() => {
                      if (!isDuplicateWorn) {
                        setSelectedItemId(item.id);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (!isDuplicateWorn && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        setSelectedItemId(item.id);
                      }
                    }}
                    className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3.5 select-none ${
                      isDuplicateWorn
                        ? 'opacity-40 cursor-not-allowed border-[var(--border-card)] bg-[var(--bg-card)]'
                        : isSelected
                        ? 'border-[var(--gold-primary)] bg-[var(--pill-bg)] ring-2 ring-[var(--gold-primary)]/40 shadow-sm cursor-pointer'
                        : 'border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[var(--border-gold)]/80 hover:bg-[var(--pill-bg)]/40 cursor-pointer'
                    }`}
                  >
                    {/* Left: Thumbnail & Details */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Image / Icon Thumbnail */}
                      <div className="w-14 h-14 rounded-xl bg-neutral-900 border border-[var(--border-card)] overflow-hidden shrink-0 flex items-center justify-center text-2xl relative shadow-xs">
                        {item.imageUrl && !failedImageUrls[item.imageUrl] ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={() => {
                              const failedSrc = item.imageUrl;
                              if (failedSrc) {
                                setFailedImageUrls((prev) => ({ ...prev, [failedSrc]: true }));
                              }
                            }}
                          />
                        ) : (
                          <span>{item.icon || '👕'}</span>
                        )}
                      </div>

                      {/* Item Metadata */}
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.brand && (
                            <span className="text-[10px] uppercase font-mono font-bold text-[var(--gold-primary)]">
                              {item.brand}
                            </span>
                          )}
                          {isCurrentEquipped && (
                            <span className="px-1.5 py-0.2 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700 text-[9px] font-mono">
                              Currently Worn
                            </span>
                          )}
                          {isDuplicateWorn && (
                            <span className="px-1.5 py-0.2 rounded-md bg-amber-950 text-amber-300 border border-amber-800 text-[9px] font-mono">
                              In Other Slot
                            </span>
                          )}
                        </div>

                        <h4 className="font-semibold text-xs sm:text-sm text-[var(--text-heading)] truncate">
                          {item.name}
                        </h4>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
                          <span>{item.color}</span>
                          <span>•</span>
                          <span>{item.fit}</span>
                          <span>•</span>
                          <span>Formality {item.formality}/5</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Selection Checkmark Button */}
                    <div className="shrink-0 pl-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs ring-2 ring-[var(--gold-primary)]'
                            : 'border border-[var(--border-card)] text-transparent hover:border-[var(--gold-primary)]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ======================================================================= */}
        {/* MODAL FOOTER */}
        {/* ======================================================================= */}
        <div className="p-4 sm:p-5 border-t border-[var(--border-card)] bg-[var(--bg-card)]/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 sticky bottom-0 z-10 shrink-0">
          <div className="text-xs text-[var(--text-muted)]">
            {selectedItem ? (
              isCurrentItem ? (
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span className="truncate max-w-xs">
                    Currently wearing <strong className="text-[var(--text-heading)]">{selectedItem.name}</strong>
                  </span>
                </span>
              ) : isSelectedDuplicate ? (
                <span className="text-amber-500 font-medium">
                  Selected piece is already worn in another slot
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                  <span className="truncate max-w-xs">
                    Ready to substitute with <strong className="text-[var(--text-heading)]">{selectedItem.name}</strong>
                  </span>
                </span>
              )
            ) : (
              <span>Select an item to apply change</span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-[var(--border-card)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={!selectedItem || isCurrentItem || isSelectedDuplicate}
              className="py-2 px-5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:scale-101 hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
              <span>Apply Changes</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
