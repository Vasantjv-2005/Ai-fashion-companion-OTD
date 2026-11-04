import React from 'react';
import { CheckCircle2, AlertCircle, ShieldCheck, Tag, HelpCircle, ArrowLeftRight } from 'lucide-react';
import type { ClosetItem } from '../../context/ClosetContext';
import type { OutfitSlotItem } from './AvatarOutfitCanvas';

interface OutfitSlotsListProps {
  slots: OutfitSlotItem[];
  closet: ClosetItem[];
  onSlotClick?: (slot: OutfitSlotItem) => void;
  onSlotChangeClick?: (slot: OutfitSlotItem) => void;
  selectedSlotKey?: string;
}

const SLOT_ORDER = ['outerwear', 'top', 'bottom', 'footwear', 'accessory'] as const;

const SLOT_ROLE_TITLES: Record<string, string> = {
  top: 'Foundation Layer',
  outerwear: 'Structured Tailoring',
  bottom: 'Silhouette Line',
  footwear: 'Stance & Posture',
  accessory: 'Horological / Accent Detail',
};

const SLOT_NUMBERS: Record<string, string> = {
  top: '01',
  outerwear: '02',
  bottom: '03',
  footwear: '04',
  accessory: '05',
};

export const OutfitSlotsList: React.FC<OutfitSlotsListProps> = ({
  slots,
  closet,
  onSlotClick,
  onSlotChangeClick,
  selectedSlotKey,
}) => {
  // Strict frontend verification function:
  // An item can only receive an 'owned' status if its closetItemId strictly matches an ID in the user's active closet.
  const verifyOwnership = (slot: OutfitSlotItem): { isVerifiedOwned: boolean; verifiedItem?: ClosetItem } => {
    if (!slot.closetItemId) {
      return { isVerifiedOwned: false };
    }
    const matched = closet.find((c) => c.id === slot.closetItemId);
    return {
      isVerifiedOwned: Boolean(matched),
      verifiedItem: matched,
    };
  };

  // Sort slots in logical anatomical order: Outerwear -> Top -> Bottom -> Footwear -> Accessory
  const sortedSlots = [...slots].sort((a, b) => {
    return SLOT_ORDER.indexOf(a.slot as any) - SLOT_ORDER.indexOf(b.slot as any);
  });

  return (
    <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 sm:p-6 shadow-sm space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3.5">
        <div>
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[var(--gold-primary)] block">
            Garment Composition • 5 Standardized Slots
          </span>
          <h3 className="font-playfair text-lg sm:text-xl font-bold text-[var(--text-heading)]">
            Ensemble Anatomy
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)] bg-[var(--pill-bg)] px-2.5 py-1 rounded-full border border-[var(--border-card)]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Strict Closet Verification</span>
        </div>
      </div>

      {/* Standardized Slots List */}
      <div className="space-y-3">
        {sortedSlots.map((slot) => {
          const { isVerifiedOwned, verifiedItem } = verifyOwnership(slot);
          const isGap = !isVerifiedOwned && slot.status === 'missing';
          const isSelected = selectedSlotKey === slot.slot;
          const slotNum = SLOT_NUMBERS[slot.slot] || '01';
          const roleSubtitle = SLOT_ROLE_TITLES[slot.slot] || 'Wardrobe Component';

          return (
            <div
              key={slot.slot}
              onClick={() => {
                if (onSlotChangeClick) {
                  onSlotChangeClick(slot);
                } else if (onSlotClick) {
                  onSlotClick(slot);
                }
              }}
              className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col gap-2.5 ${
                isSelected
                  ? 'border-[var(--gold-primary)] bg-[var(--pill-bg)] ring-1 ring-[var(--gold-primary)]/50 shadow-sm'
                  : isVerifiedOwned
                  ? 'border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[var(--border-gold)]/80 hover:bg-[var(--pill-bg)]/30'
                  : 'border-amber-500/35 bg-amber-500/5 hover:border-amber-500/70'
              }`}
            >
              {/* Top Row: Slot Number, Label, and Ownership Badge */}
              <div className="flex items-center justify-between gap-2 border-b border-[var(--border-hairline)] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[var(--pill-bg)] border border-[var(--border-card)] text-[var(--gold-primary)]">
                    {slotNum}
                  </span>
                  <div>
                    <span className="text-[11px] uppercase font-mono font-bold text-[var(--text-heading)]">
                      {slot.slotLabel}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] hidden sm:inline ml-1.5 font-sans">
                      • {roleSubtitle}
                    </span>
                  </div>
                </div>

                {/* Strict Ownership Badge */}
                <div>
                  {isVerifiedOwned ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>Owned ({slot.closetItemId})</span>
                    </span>
                  ) : isGap ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-[10px] font-semibold">
                      <AlertCircle className="w-3 h-3 text-amber-500" />
                      <span>Wardrobe Gap</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-500/10 border border-neutral-500/30 text-neutral-600 dark:text-neutral-400 text-[10px]">
                      <HelpCircle className="w-3 h-3 text-neutral-500" />
                      <span>Unverified</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Main Garment Body */}
              <div className="flex items-start gap-3.5">
                {/* Garment Image / Icon Thumbnail */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-neutral-900 border border-[var(--border-card)] overflow-hidden shrink-0 flex items-center justify-center text-2xl relative shadow-2xs">
                  {slot.imageUrl ? (
                    <img
                      src={slot.imageUrl}
                      alt={slot.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span>{slot.icon || '👕'}</span>
                  )}
                  {slot.isOptional && (
                    <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[7px] font-mono uppercase text-center text-amber-200 py-0.2">
                      Optional
                    </span>
                  )}
                </div>

                {/* Garment Title and Metas */}
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="font-semibold text-xs sm:text-sm text-[var(--text-heading)] leading-snug">
                    {slot.name}
                  </h4>

                  {/* Metas Row: Brand, Color, Fit */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
                    {verifiedItem?.brand && (
                      <span className="font-medium text-[var(--gold-primary)]">
                        {verifiedItem.brand}
                      </span>
                    )}
                    {slot.color && (
                      <span className="flex items-center gap-1">
                        <span>•</span>
                        <span>{slot.color}</span>
                      </span>
                    )}
                    {slot.fit && (
                      <span className="hidden sm:inline-flex items-center gap-1">
                        <span>•</span>
                        <span>{slot.fit}</span>
                      </span>
                    )}
                    {slot.isOptional && (
                      <span className="text-[9px] font-mono text-[var(--text-muted)] bg-[var(--pill-bg)] px-1.5 py-0.2 rounded-md">
                        Climate-adaptive
                      </span>
                    )}
                  </div>

                  {/* Editorial Styling Note */}
                  {slot.stylingNote && (
                    <p className="text-[11px] text-[var(--text-body)]/90 italic pt-0.5 leading-relaxed">
                      "{slot.stylingNote}"
                    </p>
                  )}

                  {/* Slot Replacement Action Row */}
                  <div className="flex items-center justify-between pt-2 mt-1 border-t border-[var(--border-hairline)]">
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      {isVerifiedOwned ? 'Verified Closet Item' : 'Wardrobe Gap'}
                    </span>
                    <button
                      type="button"
                      id={`change-piece-btn-${slot.slot}`}
                      data-slot={slot.slot}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSlotChangeClick) onSlotChangeClick(slot);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[var(--pill-bg)] border border-[var(--border-card)] text-[var(--text-heading)] hover:border-[var(--gold-primary)] hover:text-[var(--gold-primary)] transition-all cursor-pointer shadow-2xs group"
                      title={`Swap ${slot.slotLabel} with another piece from your closet`}
                    >
                      <ArrowLeftRight className="w-3 h-3 text-[var(--gold-primary)] group-hover:rotate-180 transition-transform duration-300" />
                      <span>Change Piece</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Wardrobe Completeness Footer */}
      <div className="pt-2 border-t border-[var(--border-card)] flex flex-wrap items-center justify-between text-xs text-[var(--text-muted)] gap-2">
        <span className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
          <span>
            {slots.filter((s) => verifyOwnership(s).isVerifiedOwned).length} of {slots.length} pieces verified in closet
          </span>
        </span>
        {slots.some((s) => !verifyOwnership(s).isVerifiedOwned) && (
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            ✦ Wardrobe gaps recommend pieces to complete the look
          </span>
        )}
      </div>
    </div>
  );
};
