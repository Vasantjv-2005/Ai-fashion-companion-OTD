import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Sparkles,
  ArrowRight,
  Filter,
  Search,
  Check,
  Plus,
  Shirt,
  Calendar,
  Database
} from 'lucide-react';
import { useCloset, type ShoppingListItem, type ClosetItem } from '../context/ClosetContext';

interface ShoppingListViewProps {
  onNavigateToStylist: () => void;
  onNavigateToCloset?: (searchTerm?: string) => void;
  onOpenAddPiece?: () => void;
}

type FilterStatus = 'all' | 'missing' | 'owned';
type CategoryFilter = 'all' | 'tops' | 'bottoms' | 'outerwear' | 'footwear' | 'accessories';

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  onNavigateToStylist,
  onNavigateToCloset,
}) => {
  const { shoppingList, removeFromShoppingList, clearShoppingList, checkItemOwnership, addClosetItem } = useCloset();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [intakeSuccessId, setIntakeSuccessId] = useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // Compute live ownership status for every shopping list item against active closet
  const evaluatedItems = useMemo(() => {
    return shoppingList.map((item) => {
      const ownership = checkItemOwnership({
        name: item.name,
        category: item.category,
        subType: item.subType,
        color: item.color,
      });
      return {
        item,
        isOwned: ownership.isOwned,
        matchedClosetItem: ownership.matchedItem,
      };
    });
  }, [shoppingList, checkItemOwnership]);

  // Overall counts
  const totalCount = evaluatedItems.length;
  const ownedCount = evaluatedItems.filter((e) => e.isOwned).length;
  const missingCount = totalCount - ownedCount;

  // Filter and search
  const filteredItems = useMemo(() => {
    return evaluatedItems.filter(({ item, isOwned }) => {
      // Status filter
      if (statusFilter === 'missing' && isOwned) return false;
      if (statusFilter === 'owned' && !isOwned) return false;

      // Category filter
      if (categoryFilter !== 'all') {
        const itemCat = (item.category || '').toLowerCase();
        if (!itemCat.includes(categoryFilter.toLowerCase())) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCategory = (item.category || '').toLowerCase().includes(q);
        const matchesSubType = (item.subType || '').toLowerCase().includes(q);
        const matchesColor = (item.color || '').toLowerCase().includes(q);
        const matchesOccasion = item.outfitContext?.occasion?.toLowerCase().includes(q) || false;
        const matchesVenue = item.outfitContext?.venue?.toLowerCase().includes(q) || false;
        return matchesName || matchesCategory || matchesSubType || matchesColor || matchesOccasion || matchesVenue;
      }

      return true;
    });
  }, [evaluatedItems, statusFilter, categoryFilter, searchQuery]);

  // Quick action: Intake missing item directly into user's Digital Closet
  const handleIntakeToCloset = (item: ShoppingListItem) => {
    const defaultCategory = (
      ['tops', 'bottoms', 'outerwear', 'footwear', 'accessories'].includes(item.category.toLowerCase())
        ? item.category.toLowerCase()
        : 'tops'
    ) as ClosetItem['category'];

    addClosetItem({
      name: item.name,
      category: defaultCategory,
      subType: item.subType || item.name,
      brand: item.brand || 'Wardrobe Acquisition',
      color: item.color || 'Classic Tone',
      fit: (item.fit as ClosetItem['fit']) || 'Regular',
      formality: (item.formality as ClosetItem['formality']) || 3,
      icon: item.icon || '✨',
      imageUrl: item.imageUrl,
      description: item.stylingNote || `Acquired via OTD Shopping List for ${item.outfitContext?.occasion || 'everyday rotation'}.`,
    });

    setIntakeSuccessId(item.id);
    setTimeout(() => {
      setIntakeSuccessId((curr) => (curr === item.id ? null : curr));
    }, 3500);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--bg-canvas)] text-[var(--text-body)] p-4 sm:p-6 lg:p-8 space-y-8 select-none">
      
      {/* 1. Header & Context */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border-card)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-mono font-bold tracking-[0.2em] text-[var(--gold-primary)]">
              Curated Acquisition Ledger • Wardrobe Synergy
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)]" />
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              Frontend-Local
            </span>
          </div>
          <h1 className="font-playfair text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--text-heading)] tracking-tight">
            Wardrobe Shopping List
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-2xl mt-1.5 leading-relaxed font-light">
            Intentional wardrobe essentials and missing layers identified by your AI Stylist to eliminate sartorial bottlenecks and complete high-harmony ensembles.
          </p>
        </div>

        {/* Quick Nav / Clear Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onNavigateToStylist}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--gold-primary)] text-black hover:opacity-90 transition-all cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Consult AI Stylist</span>
          </button>

          {totalCount > 0 && (
            <button
              onClick={() => setConfirmClearOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 border border-[var(--border-card)] transition-all cursor-pointer"
              title="Clear all shopping list items"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear List</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total Ledger Count */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
              Total Saved Pieces
            </span>
            <span className="font-playfair text-2xl font-bold text-[var(--text-heading)]">
              {totalCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--pill-bg)] border border-[var(--border-card)] flex items-center justify-center text-[var(--gold-primary)]">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* Missing Wardrobe Staples */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-amber-500/30 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 block font-semibold">
              Missing Essentials
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-playfair text-2xl font-bold text-amber-700 dark:text-amber-300">
                {missingCount}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                {totalCount > 0 ? `${Math.round((missingCount / totalCount) * 100)}% unacquired` : '0%'}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Already Acquired in Closet */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-emerald-500/30 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block font-semibold">
              Acquired in Wardrobe
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-playfair text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {ownedCount}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                already verified
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Search */}
      {totalCount > 0 && (
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-3.5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Status Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-black text-white dark:bg-white dark:text-black font-semibold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--pill-bg)]'
                }`}
              >
                All Items ({totalCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('missing')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'missing'
                    ? 'bg-amber-500 text-black font-semibold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--pill-bg)]'
                }`}
              >
                <span>Missing Essentials ({missingCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('owned')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'owned'
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--pill-bg)]'
                }`}
              >
                <span>In Closet ({ownedCount})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search shopping list..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--pill-bg)] text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] pl-8 pr-3 py-1.5 rounded-xl border border-[var(--border-card)] focus:outline-none focus:border-[var(--gold-primary)] transition-colors"
              />
            </div>
          </div>

          {/* Category Filter Sub-row */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--border-hairline)] text-[11px]">
            <span className="text-[var(--text-muted)] font-mono flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" />
              <span>Category:</span>
            </span>
            {(['all', 'tops', 'outerwear', 'bottoms', 'footwear', 'accessories'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[var(--gold-primary)] text-black font-semibold shadow-2xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-heading)] bg-[var(--pill-bg)]/60 border border-[var(--border-card)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Garment Cards Grid or Empty State */}
      {totalCount === 0 ? (
        /* Empty State (Feature B) */
        <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-8 sm:p-14 text-center space-y-5 max-w-2xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-gold)]/60 flex items-center justify-center text-[var(--gold-primary)] mx-auto shadow-sm">
            <ShoppingBag className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--gold-primary)] font-bold block">
              Acquisition Ledger Clean
            </span>
            <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-[var(--text-heading)]">
              No Missing Wardrobe Items
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed font-light">
              Your shopping list is currently clear. When the AI Stylist detects gaps in your wardrobe during ensemble synthesis, missing garments will be recommended here.
            </p>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onNavigateToStylist}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold bg-[var(--gold-primary)] text-black hover:opacity-90 transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Consult AI Stylist</span>
            </button>

            {onNavigateToCloset && (
              <button
                onClick={() => onNavigateToCloset()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium text-[var(--text-heading)] bg-[var(--pill-bg)] border border-[var(--border-card)] hover:border-[var(--gold-primary)] transition-all cursor-pointer"
              >
                <Shirt className="w-4 h-4 text-[var(--gold-primary)]" />
                <span>View Digital Closet</span>
              </button>
            )}
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        /* Filter Zero State */
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-[var(--text-heading)]">
            No shopping list items match your current filter.
          </p>
          <button
            onClick={() => {
              setStatusFilter('all');
              setCategoryFilter('all');
              setSearchQuery('');
            }}
            className="text-xs text-[var(--gold-primary)] hover:underline font-medium cursor-pointer"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        /* Garment Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredItems.map(({ item, isOwned, matchedClosetItem }) => {
            const isJustIntaken = intakeSuccessId === item.id;

            return (
              <div
                key={item.id}
                className={`rounded-3xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-2xs ${
                  isOwned
                    ? 'border-emerald-500/30 bg-[var(--bg-card)] hover:border-emerald-500/60'
                    : 'border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[var(--border-gold)]/80 hover:shadow-sm'
                }`}
              >
                {/* Card Top: Thumbnail, Title, Category */}
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Status Pill Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-[var(--border-hairline)] pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--gold-primary)] font-bold">
                      {item.category} {item.subType ? `• ${item.subType}` : ''}
                    </span>

                    {/* Feature C: Live Wardrobe-Aware Status Pill */}
                    {isOwned ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Already in your closet</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[10px] font-semibold">
                        <AlertCircle className="w-3 h-3 text-amber-500" />
                        <span>Missing Staple</span>
                      </span>
                    )}
                  </div>

                  {/* Thumbnail and Title */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-neutral-900 border border-[var(--border-card)] overflow-hidden shrink-0 flex items-center justify-center text-3xl relative shadow-2xs">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span>{item.icon || '👔'}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="font-playfair text-base sm:text-lg font-bold text-[var(--text-heading)] leading-snug">
                        {item.name}
                      </h3>

                      {/* Attributes */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)] pt-0.5">
                        {item.color && (
                          <span className="inline-flex items-center gap-1 text-[11px]">
                            <span className="w-2 h-2 rounded-full border border-black/20 bg-neutral-400" />
                            <span>{item.color}</span>
                          </span>
                        )}
                        {item.fit && (
                          <span className="text-[11px] text-[var(--text-muted)]">
                            • {item.fit}
                          </span>
                        )}
                        {item.formality && (
                          <span className="text-[10px] font-mono text-[var(--gold-primary)] bg-[var(--pill-bg)] px-1.5 py-0.2 rounded-md">
                            Formality {item.formality}/5
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Outfit Context (Feature A & B) */}
                  {item.outfitContext && (
                    <div className="p-3 rounded-xl bg-[var(--pill-bg)] border border-[var(--border-card)] text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--gold-primary)] font-semibold uppercase tracking-wider">
                        <Calendar className="w-3 h-3" />
                        <span>Styling Origin</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-heading)] font-medium truncate">
                        {item.outfitContext.outfitTitle || 'Stylist Ensemble'}
                      </p>
                      {(item.outfitContext.occasion || item.outfitContext.venue) && (
                        <p className="text-[10px] text-[var(--text-muted)] truncate">
                          Recommended for {item.outfitContext.occasion || 'Event'} {item.outfitContext.venue ? `at ${item.outfitContext.venue}` : ''}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Editorial Note */}
                  {item.stylingNote && (
                    <p className="text-xs text-[var(--text-body)]/90 italic font-light leading-relaxed">
                      "{item.stylingNote}"
                    </p>
                  )}

                  {/* Wardrobe Match Detail (Feature C) */}
                  {isOwned && matchedClosetItem && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
                      <span className="truncate">
                        ✦ Matched with: <span className="font-semibold">{matchedClosetItem.name}</span>
                      </span>
                      {onNavigateToCloset && (
                        <button
                          type="button"
                          onClick={() => onNavigateToCloset(matchedClosetItem.name)}
                          className="text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-300 hover:underline shrink-0 ml-2"
                        >
                          View in Closet →
                        </button>
                      )}
                    </div>
                  )}

                  {/* Intake Success Confirmation Feedback */}
                  {isJustIntaken && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Added to your Digital Closet! Now verified as owned.</span>
                    </div>
                  )}
                </div>

                {/* Card Footer: Action Row */}
                <div className="p-4 sm:p-5 bg-[var(--bg-card)]/50 border-t border-[var(--border-hairline)] flex items-center justify-between gap-2">
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeFromShoppingList(item.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Remove item from shopping list"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>

                  {/* Action: Add to Closet if missing; or View Closet if already acquired */}
                  {!isOwned ? (
                    <button
                      type="button"
                      id={`intake-btn-${item.id}`}
                      onClick={() => handleIntakeToCloset(item)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[var(--gold-primary)] text-black dark:text-neutral-900 hover:opacity-90 transition-all cursor-pointer shadow-2xs group"
                      title="Directly intake this garment into your Digital Closet"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Add to Closet</span>
                    </button>
                  ) : onNavigateToCloset ? (
                    <button
                      type="button"
                      onClick={() => onNavigateToCloset(matchedClosetItem?.name)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[var(--text-heading)] bg-[var(--pill-bg)] border border-[var(--border-card)] hover:border-[var(--gold-primary)] transition-all cursor-pointer"
                    >
                      <span>In Wardrobe</span>
                      <ArrowRight className="w-3 h-3 text-[var(--gold-primary)]" />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Editorial Footer & Local Persistence Document */}
      <div className="pt-6 border-t border-[var(--border-card)] flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-muted)] gap-3 font-light">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
          <span>
            Frontend-Local Storage • Persisted in browser localStorage (Key: <code className="font-mono text-[10px] text-[var(--gold-primary)]">otd_shopping_list</code>).
          </span>
        </div>
        <div className="text-[11px] font-mono">
          OTD AI Fashion Companion • Wardrobe Intelligence
        </div>
      </div>

      {/* Clear List Confirmation Modal */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-card)] p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="font-playfair text-lg font-bold text-[var(--text-heading)]">
                Clear Shopping List?
              </h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                This will remove all {totalCount} saved garment suggestions from your local shopping list.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearShoppingList();
                  setConfirmClearOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer shadow-sm"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
