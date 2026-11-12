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
  Database,
  IndianRupee,
  Pencil,
  X,
  Tag,
  Info,
} from 'lucide-react';
import {
  useCloset,
  type ShoppingListItem,
  type ClosetItem,
  findOwnedAlternatives,
  type OwnedAlternative,
} from '../context/ClosetContext';
import { useAuth } from '../hooks/useAuth';
import { useFocusTrap } from '../utils/focusTrap';
import {
  CLOSET_SEARCH_MAX_LENGTH,
  GARMENT_COLOR_MAX_LENGTH,
  GARMENT_NAME_MAX_LENGTH,
  GARMENT_NOTES_MAX_LENGTH,
  GARMENT_SUBTYPE_MAX_LENGTH,
} from '../utils/garmentValidation';
import {
  GuestRegistrationPromptModal,
  type GuestRestrictedAction,
} from './auth/GuestRegistrationPromptModal';

interface ShoppingListViewProps {
  onNavigateToStylist: () => void;
  onNavigateToCloset?: (searchTerm?: string) => void;
  onOpenAddPiece?: () => void;
  onRequireRegistration?: (action: GuestRestrictedAction, actionTitle?: string) => boolean;
}

type FilterStatus = 'all' | 'missing' | 'owned';
type CategoryFilter = 'all' | 'tops' | 'bottoms' | 'outerwear' | 'footwear' | 'accessories';

/**
 * Format numbers into standard Indian Rupee currency representation (e.g. ₹4,500).
 */
function formatINR(amount: number): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString()}`;
  }
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  onNavigateToStylist,
  onNavigateToCloset,
  onOpenAddPiece,
  onRequireRegistration,
}) => {
  const { isAuthenticated } = useAuth();
  const {
    closet,
    shoppingList,
    addToShoppingList,
    updateShoppingListItem,
    removeFromShoppingList,
    clearShoppingList,
    checkItemOwnership,
    isItemInShoppingList,
    addClosetItem,
  } = useCloset();

  const [guestPromptState, setGuestPromptState] = useState<{
    action: GuestRestrictedAction;
    actionTitle?: string;
  } | null>(null);

  if (isAuthenticated && guestPromptState !== null) {
    setGuestPromptState(null);
  }

  const requireRegistered = (action: GuestRestrictedAction, actionTitle?: string): boolean => {
    if (isAuthenticated) return true;
    if (onRequireRegistration) {
      return onRequireRegistration(action, actionTitle);
    }
    setGuestPromptState({ action, actionTitle });
    return false;
  };

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [intakeSuccessId, setIntakeSuccessId] = useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // Task 10: Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeAlternativeItem, setActiveAlternativeItem] = useState<ShoppingListItem | null>(null);

  // Task 10: Inline Budget Editing State
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editingBudgetValue, setEditingBudgetValue] = useState<string>('');

  // Task 10: Wear-instead confirmation feedback
  const [wearInsteadNote, setWearInsteadNote] = useState<{ itemId: string; altName: string } | null>(null);

  // Focus trap for clear confirmation dialog
  const confirmClearModalRef = useFocusTrap<HTMLDivElement>({
    isOpen: confirmClearOpen,
    onClose: () => setConfirmClearOpen(false),
  });

  // Compute live ownership status and owned alternatives for every wishlist item
  const evaluatedItems = useMemo(() => {
    return shoppingList.map((item) => {
      const ownership = checkItemOwnership({
        name: item.name,
        category: item.category,
        subType: item.subType,
        color: item.color,
      });

      // Find compatible alternatives from active closet
      const alternatives = findOwnedAlternatives(closet, {
        name: item.name,
        category: item.category,
        subType: item.subType,
        color: item.color,
        formality: item.formality,
      });

      return {
        item,
        isOwned: ownership.isOwned,
        matchedClosetItem: ownership.matchedItem,
        alternatives,
      };
    });
  }, [shoppingList, closet, checkItemOwnership]);

  // Overall counts
  const totalCount = evaluatedItems.length;
  const ownedCount = evaluatedItems.filter((e) => e.isOwned).length;
  const missingCount = totalCount - ownedCount;

  // Task 10: Total Wishlist Budget calculation
  // Computes the total estimated budget across all items where users specified a budget.
  const budgetedItems = useMemo(() => {
    return evaluatedItems.filter(
      ({ item }) => typeof item.estimatedBudget === 'number' && item.estimatedBudget > 0
    );
  }, [evaluatedItems]);

  const totalEstimatedBudget = useMemo(() => {
    return budgetedItems.reduce((acc, { item }) => acc + (item.estimatedBudget || 0), 0);
  }, [budgetedItems]);

  const missingBudgetedItems = useMemo(() => {
    return evaluatedItems.filter(
      ({ item, isOwned }) => !isOwned && typeof item.estimatedBudget === 'number' && item.estimatedBudget > 0
    );
  }, [evaluatedItems]);

  const missingEstimatedBudget = useMemo(() => {
    return missingBudgetedItems.reduce((acc, { item }) => acc + (item.estimatedBudget || 0), 0);
  }, [missingBudgetedItems]);

  // Filtered and searched list
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
    if (!requireRegistered('upload', `Add "${item.name}" to Your Closet`)) {
      return;
    }
    const defaultCategory = (
      ['tops', 'bottoms', 'outerwear', 'footwear', 'accessories'].includes(item.category.toLowerCase())
        ? item.category.toLowerCase()
        : 'tops'
    ) as ClosetItem['category'];

    addClosetItem({
      name: item.name,
      category: defaultCategory,
      subType: item.subType || item.name,
      brand: item.brand?.trim() || '',
      color: item.color || 'Classic Tone',
      fit: (item.fit as ClosetItem['fit']) || 'Regular',
      formality: (item.formality as ClosetItem['formality']) || 3,
      icon: item.icon || '✨',
      imageUrl: item.imageUrl,
      description: item.stylingNote || `Acquired via OTD Wishlist for ${item.outfitContext?.occasion || 'everyday rotation'}.`,
    });

    setIntakeSuccessId(item.id);
    setTimeout(() => {
      setIntakeSuccessId((curr) => (curr === item.id ? null : curr));
    }, 3500);
  };

  // Start inline budget editing
  const handleStartBudgetEdit = (item: ShoppingListItem) => {
    if (!requireRegistered('wishlist', `Set Budget for "${item.name}"`)) {
      return;
    }
    setEditingBudgetId(item.id);
    setEditingBudgetValue(item.estimatedBudget ? String(item.estimatedBudget) : '');
  };

  // Save inline budget editing
  const handleSaveBudget = (itemId: string) => {
    const trimmed = editingBudgetValue.trim();
    if (!trimmed) {
      updateShoppingListItem(itemId, { estimatedBudget: undefined });
    } else {
      const parsed = parseFloat(trimmed);
      if (!isNaN(parsed) && parsed >= 0) {
        updateShoppingListItem(itemId, { estimatedBudget: Math.round(parsed) });
      }
    }
    setEditingBudgetId(null);
  };

  // Cancel inline budget editing
  const handleCancelBudgetEdit = () => {
    setEditingBudgetId(null);
    setEditingBudgetValue('');
  };

  // Clear budget directly
  const handleClearBudget = (itemId: string) => {
    if (!requireRegistered('wishlist', 'Update Wishlist Budget')) {
      return;
    }
    updateShoppingListItem(itemId, { estimatedBudget: undefined });
  };

  // Handle wear-instead selection
  const handleWearInstead = (itemId: string, altName: string) => {
    setWearInsteadNote({ itemId, altName });
    setActiveAlternativeItem(null);
    setTimeout(() => {
      setWearInsteadNote((current) => (current?.itemId === itemId ? null : current));
    }, 4500);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--bg-canvas)] text-[var(--text-body)] p-4 sm:p-6 lg:p-8 space-y-8 select-none">
      
      {/* 1. Header & Context */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border-card)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-mono font-bold tracking-[0.2em] text-[var(--gold-primary)]">
              Curated Wardrobe Wishlist • Gap Planning
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)]" />
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              Frontend-Local • Zero Paid APIs
            </span>
          </div>
          <h1 className="font-playfair text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--text-heading)] tracking-tight">
            Wardrobe Wishlist
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-2xl mt-1.5 leading-relaxed font-light">
            A personal wardrobe planning ledger. Track missing pieces identified during styling, estimate acquisition budgets in INR, or discover alternatives already waiting in your Digital Closet without purchasing anything new.
          </p>
        </div>

        {/* Top Actions: Add Piece, Consult Stylist, Clear */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (!requireRegistered('wishlist', 'Add Item to Wardrobe Wishlist')) return;
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--gold-primary)] text-black hover:opacity-90 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Wishlist Item</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToStylist}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--pill-bg)] text-[var(--text-heading)] border border-[var(--border-card)] hover:border-[var(--gold-primary)] transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
            <span>Consult Stylist</span>
          </button>

          {totalCount > 0 && (
            <button
              type="button"
              onClick={() => {
                if (!requireRegistered('wishlist', 'Clear Wardrobe Wishlist')) return;
                setConfirmClearOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 border border-[var(--border-card)] transition-all cursor-pointer"
              title="Clear all wishlist items"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Key Metrics Bar (Including Total Estimated Budget - Task 10D) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Total Wishlist Count */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
              Saved Wishlist Pieces
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
                {totalCount > 0 ? `${Math.round((missingCount / totalCount) * 100)}% gaps` : '0%'}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Acquired in Closet */}
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
                verified owned
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Task 10D: Total Wishlist Estimated Budget */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-gold)]/40 shadow-2xs flex items-center justify-between relative overflow-hidden">
          <div className="space-y-0.5 min-w-0 pr-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--gold-primary)] block font-semibold truncate">
              Estimated Wishlist Budget (INR ₹)
            </span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-playfair text-xl sm:text-2xl font-bold text-[var(--text-heading)]">
                {totalEstimatedBudget > 0 ? formatINR(totalEstimatedBudget) : '₹0'}
              </span>
              {budgetedItems.length > 0 && (
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  ({budgetedItems.length} budgeted)
                </span>
              )}
            </div>
            <p className="text-[9px] text-[var(--text-muted)] leading-tight pt-0.5 truncate">
              {missingCount > 0 && missingEstimatedBudget > 0
                ? `${formatINR(missingEstimatedBudget)} pending for ${missingCount} gap${missingCount === 1 ? '' : 's'}`
                : 'Estimated planning budget • Not actual spending'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--pill-bg)] border border-[var(--border-gold)] flex items-center justify-center text-[var(--gold-primary)] shrink-0">
            <IndianRupee className="w-5 h-5" />
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
                maxLength={CLOSET_SEARCH_MAX_LENGTH}
                placeholder="Search wishlist..."
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

      {/* 4. Global Wear-Instead Confirmation Banner */}
      {wearInsteadNote && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-sm">
          <div className="flex items-center gap-2">
            <Shirt className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Smart sartorial choice:</strong> You chose to wear <strong>"{wearInsteadNote.altName}"</strong> from your Digital Closet instead of acquiring a new garment.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setWearInsteadNote(null)}
            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-amber-800 dark:text-amber-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 5. Wishlist Cards Grid or Empty State */}
      {totalCount === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-8 sm:p-14 text-center space-y-5 max-w-2xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-gold)]/60 flex items-center justify-center text-[var(--gold-primary)] mx-auto shadow-sm">
            <ShoppingBag className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--gold-primary)] font-bold block">
              Wishlist Archive Clear
            </span>
            <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-[var(--text-heading)]">
              No Missing Wardrobe Items
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed font-light">
              Your personal wishlist is currently clear. Add missing staples manually or let your AI Stylist detect wardrobe gaps during outfit synthesis.
            </p>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (!requireRegistered('wishlist', 'Add Item to Wardrobe Wishlist')) return;
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-[var(--gold-primary)] text-black hover:opacity-90 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Wishlist Item</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToStylist}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium text-[var(--text-heading)] bg-[var(--pill-bg)] border border-[var(--border-card)] hover:border-[var(--gold-primary)] transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[var(--gold-primary)]" />
              <span>Consult AI Stylist</span>
            </button>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        /* Filter Zero State */
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-[var(--text-heading)]">
            No wishlist items match your current filter.
          </p>
          <button
            type="button"
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
        /* Wishlist Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredItems.map(({ item, isOwned, matchedClosetItem, alternatives }) => {
            const isJustIntaken = intakeSuccessId === item.id;
            const isEditingBudget = editingBudgetId === item.id;

            return (
              <div
                key={item.id}
                className={`rounded-3xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-2xs ${
                  isOwned
                    ? 'border-emerald-500/30 bg-[var(--bg-card)] hover:border-emerald-500/60'
                    : 'border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[var(--border-gold)]/80 hover:shadow-sm'
                }`}
              >
                {/* Card Top: Header, Thumbnail, Title, Metas */}
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Status Pill Header (Task 10B) */}
                  <div className="flex items-center justify-between gap-2 border-b border-[var(--border-hairline)] pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--gold-primary)] font-bold truncate">
                      {item.category} {item.subType ? `• ${item.subType}` : ''}
                    </span>

                    {/* Live Wardrobe-Aware Status Pill */}
                    {isOwned ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Already in your closet</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[10px] font-semibold shrink-0">
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

                  {/* Task 10C: Estimated Budget Field */}
                  <div className="p-3 rounded-2xl bg-[var(--pill-bg)]/80 border border-[var(--border-card)] text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[var(--gold-primary)] uppercase tracking-wider font-semibold flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        <span>Estimated Budget</span>
                      </span>

                      {!isEditingBudget && item.estimatedBudget !== undefined && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartBudgetEdit(item)}
                            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors cursor-pointer"
                            title="Edit estimated budget"
                            aria-label={`Edit budget for ${item.name}`}
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleClearBudget(item.id)}
                            className="p-1 text-[var(--text-muted)] hover:text-red-500 transition-colors cursor-pointer"
                            title="Clear budget"
                            aria-label={`Clear budget for ${item.name}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditingBudget ? (
                      /* Inline Budget Editor */
                      <div className="flex items-center gap-1.5 pt-1">
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--gold-primary)] font-bold">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            placeholder="Enter amount (e.g. 3500)"
                            value={editingBudgetValue}
                            onChange={(e) => setEditingBudgetValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveBudget(item.id);
                              if (e.key === 'Escape') handleCancelBudgetEdit();
                            }}
                            autoFocus
                            className="w-full bg-[var(--bg-card)] text-xs text-[var(--text-heading)] pl-6 pr-2 py-1 rounded-lg border border-[var(--border-gold)] focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSaveBudget(item.id)}
                          className="p-1.5 rounded-lg bg-[var(--gold-primary)] text-black hover:opacity-90 cursor-pointer shadow-2xs"
                          title="Save budget"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelBudgetEdit}
                          className="p-1.5 rounded-lg border border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : item.estimatedBudget !== undefined ? (
                      /* Budget Display */
                      <div className="flex items-baseline justify-between">
                        <span className="font-playfair text-base sm:text-lg font-bold text-[var(--text-heading)]">
                          {formatINR(item.estimatedBudget)}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                          INR (₹)
                        </span>
                      </div>
                    ) : (
                      /* Set Budget Button */
                      <button
                        type="button"
                        onClick={() => handleStartBudgetEdit(item)}
                        className="w-full py-1.5 px-3 rounded-xl border border-dashed border-[var(--border-gold)]/60 text-[11px] text-[var(--gold-primary)] hover:bg-[var(--gold-primary)]/10 font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Set Estimated Budget</span>
                      </button>
                    )}
                  </div>

                  {/* Task 10E: Owned-Only Alternatives Button */}
                  {!isOwned && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveAlternativeItem(item)}
                        className={`w-full py-2 px-3 rounded-2xl border text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                          alternatives.length > 0
                            ? 'bg-[var(--bg-card)] border-[var(--border-gold)] text-[var(--text-heading)] hover:bg-[var(--pill-bg)] shadow-2xs'
                            : 'bg-[var(--pill-bg)]/40 border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Shirt className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                          <span>
                            {alternatives.length > 0
                              ? `Owned Alternatives (${alternatives.length} in closet)`
                              : 'Check Closet Alternatives'}
                          </span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
                      </button>
                    </div>
                  )}

                  {/* Outfit Context (Styling Origin) */}
                  {item.outfitContext && (
                    <div className="p-2.5 rounded-xl bg-[var(--pill-bg)] border border-[var(--border-card)] text-xs space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--gold-primary)] font-semibold uppercase tracking-wider">
                        <Calendar className="w-3 h-3" />
                        <span>Styling Origin</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-heading)] font-medium truncate">
                        {item.outfitContext.outfitTitle || 'Stylist Recommendation'}
                      </p>
                      {(item.outfitContext.occasion || item.outfitContext.venue) && (
                        <p className="text-[10px] text-[var(--text-muted)] truncate">
                          Recommended for {item.outfitContext.occasion || 'Occasion'} {item.outfitContext.venue ? `at ${item.outfitContext.venue}` : ''}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Editorial Styling Note */}
                  {item.stylingNote && (
                    <p className="text-xs text-[var(--text-body)]/90 italic font-light leading-relaxed">
                      "{item.stylingNote}"
                    </p>
                  )}

                  {/* Wardrobe Match Detail for Owned Pieces */}
                  {isOwned && matchedClosetItem && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
                      <span className="truncate">
                        ✦ Matched with: <span className="font-semibold">{matchedClosetItem.name}</span>
                      </span>
                      {onNavigateToCloset && (
                        <button
                          type="button"
                          onClick={() => onNavigateToCloset(matchedClosetItem.name)}
                          className="text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-300 hover:underline shrink-0 ml-2 cursor-pointer"
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
                    onClick={() => {
                      if (!requireRegistered('wishlist', `Remove "${item.name}" from Wishlist`)) {
                        return;
                      }
                      removeFromShoppingList(item.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Remove item from wishlist"
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

      {/* 6. Editorial Footer & Local Persistence Document */}
      <div className="pt-6 border-t border-[var(--border-card)] flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-muted)] gap-3 font-light">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
          <span>
            Personal Wardrobe Ledger • Persisted in workspace-scoped browser storage.
          </span>
        </div>
        <div className="text-[11px] font-mono">
          OTD AI Fashion Companion • Personal Wishlist
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD WISHLIST ITEM MODAL (TASK 10A) */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <AddWishlistItemModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={addToShoppingList}
          checkItemOwnership={checkItemOwnership}
          isItemInShoppingList={isItemInShoppingList}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: OWNED-ONLY ALTERNATIVES DRAWER / MODAL (TASK 10E) */}
      {/* ========================================================================= */}
      {activeAlternativeItem && (
        <OwnedAlternativesModal
          item={activeAlternativeItem}
          alternatives={findOwnedAlternatives(closet, activeAlternativeItem)}
          onClose={() => setActiveAlternativeItem(null)}
          onNavigateToCloset={(searchTerm) => {
            setActiveAlternativeItem(null);
            if (onNavigateToCloset) onNavigateToCloset(searchTerm);
          }}
          onWearInstead={handleWearInstead}
          onOpenAddPiece={() => {
            setActiveAlternativeItem(null);
            if (!requireRegistered('upload', 'Add Personal Garment to Closet')) return;
            if (onOpenAddPiece) onOpenAddPiece();
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CLEAR ALL CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {confirmClearOpen && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="clear-dialog-title"
          aria-describedby="clear-dialog-desc"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmClearOpen(false);
          }}
        >
          <div
            ref={confirmClearModalRef}
            className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-card)] p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 id="clear-dialog-title" className="font-playfair text-lg font-bold text-[var(--text-heading)]">
                Clear Wardrobe Wishlist?
              </h4>
              <p id="clear-dialog-desc" className="text-xs text-[var(--text-muted)] leading-relaxed">
                This will remove all {totalCount} saved garment entries and their estimated budgets from your local wishlist.
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

      {!onRequireRegistration && (
        <GuestRegistrationPromptModal
          isOpen={!isAuthenticated && guestPromptState !== null}
          action={guestPromptState?.action || 'wishlist'}
          actionTitle={guestPromptState?.actionTitle}
          redirectTo="/shopping"
          onClose={() => setGuestPromptState(null)}
        />
      )}

    </div>
  );
};

/* ========================================================================= */
/* SUB-COMPONENT: ADD WISHLIST ITEM MODAL (Task 10A & 10C) */
/* ========================================================================= */
interface AddWishlistItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<ShoppingListItem, 'id' | 'addedAt'>) => { success: boolean; message: string; isAlreadyOwned?: boolean; isDuplicate?: boolean };
  checkItemOwnership: (garment: { name: string; category?: string; subType?: string; color?: string }) => { isOwned: boolean; matchedItem?: ClosetItem };
  isItemInShoppingList: (query: { name: string; color?: string; subType?: string } | string) => boolean;
}

const CATEGORY_OPTIONS: { id: ClosetItem['category']; label: string; icon: string }[] = [
  { id: 'tops', label: 'Tops', icon: '👔' },
  { id: 'bottoms', label: 'Bottoms', icon: '👖' },
  { id: 'outerwear', label: 'Outerwear', icon: '🧥' },
  { id: 'footwear', label: 'Footwear', icon: '👞' },
  { id: 'accessories', label: 'Accessories', icon: '🧣' },
];

const AddWishlistItemModal: React.FC<AddWishlistItemModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  checkItemOwnership,
  isItemInShoppingList,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ClosetItem['category']>('tops');
  const [subType, setSubType] = useState('');
  const [color, setColor] = useState('');
  const [estimatedBudgetStr, setEstimatedBudgetStr] = useState('');
  const [stylingNote, setStylingNote] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const modalRef = useFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  // Live ownership pre-check
  const ownershipCheck = name.trim().length > 2
    ? checkItemOwnership({ name, category, subType, color })
    : { isOwned: false };

  // Live duplicate pre-check
  const duplicateCheck = name.trim().length > 2
    ? isItemInShoppingList({ name, color, subType })
    : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Please provide a garment name.');
      return;
    }

    let parsedBudget: number | undefined = undefined;
    if (estimatedBudgetStr.trim()) {
      const b = parseFloat(estimatedBudgetStr);
      if (isNaN(b) || b < 0) {
        setErrorMessage('Estimated budget must be a positive number.');
        return;
      }
      parsedBudget = Math.round(b);
    }

    const result = onAdd({
      name: trimmedName,
      category,
      subType: subType.trim() || undefined,
      color: color.trim() || undefined,
      estimatedBudget: parsedBudget,
      stylingNote: stylingNote.trim() || undefined,
    });

    if (!result.success) {
      setErrorMessage(result.message);
    } else {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-wishlist-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-2xl p-6 sm:p-7 text-[var(--text-body)] space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-card)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--pill-bg)] border border-[var(--border-gold)] flex items-center justify-center text-[var(--gold-primary)]">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 id="add-wishlist-title" className="font-playfair text-xl font-bold text-[var(--text-heading)]">
                Add Wishlist Item
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Record a missing wardrobe staple with an optional estimated budget
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--pill-bg)] text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors cursor-pointer"
            aria-label="Close add modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Validation / Advisory Warnings */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {duplicateCheck && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>This piece is already recorded in your wishlist ledger.</span>
          </div>
        )}

        {ownershipCheck.isOwned && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>Wardrobe Synergy:</strong> You already own a matching piece in your Digital Closet: <strong>"{ownershipCheck.matchedItem?.name}"</strong>.
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Garment Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-heading)] flex items-center justify-between">
              <span>Garment Name *</span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">e.g. Charcoal Wool Trousers</span>
            </label>
            <input
              type="text"
              required
              maxLength={GARMENT_NAME_MAX_LENGTH}
              placeholder="e.g., Italian Linen Overshirt, Cashmere Crewneck"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[var(--pill-bg)] text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] px-3.5 py-2.5 rounded-xl border border-[var(--border-card)] focus:outline-none focus:border-[var(--gold-primary)] transition-colors"
              autoFocus
            />
          </div>

          {/* Category Selector Chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-heading)]">
              Category *
            </label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-2 rounded-xl text-center text-xs flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                    category === cat.id
                      ? 'border-[var(--gold-primary)] bg-[var(--gold-primary)]/15 text-[var(--gold-primary)] font-bold shadow-2xs'
                      : 'border-[var(--border-card)] bg-[var(--pill-bg)]/50 text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="text-[10px] truncate w-full">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subtype & Color (2 cols) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text-heading)]">
                Silhouette / Subtype
              </label>
              <input
                type="text"
                maxLength={GARMENT_SUBTYPE_MAX_LENGTH}
                placeholder="e.g. Pleated Trouser, Blazer"
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
                className="w-full bg-[var(--pill-bg)] text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] px-3.5 py-2 rounded-xl border border-[var(--border-card)] focus:outline-none focus:border-[var(--gold-primary)] transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text-heading)]">
                Color Tone
              </label>
              <input
                type="text"
                maxLength={GARMENT_COLOR_MAX_LENGTH}
                placeholder="e.g. Navy, Charcoal, Camel"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full bg-[var(--pill-bg)] text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] px-3.5 py-2 rounded-xl border border-[var(--border-card)] focus:outline-none focus:border-[var(--gold-primary)] transition-colors"
              />
            </div>
          </div>

          {/* Estimated Budget (INR ₹) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-heading)] flex items-center justify-between">
              <span className="flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                <span>Estimated Budget (INR ₹, Optional)</span>
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">Non-negative value</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[var(--gold-primary)]">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="100"
                placeholder="e.g., 4500"
                value={estimatedBudgetStr}
                onChange={(e) => setEstimatedBudgetStr(e.target.value)}
                className="w-full bg-[var(--pill-bg)] text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] pl-8 pr-3.5 py-2.5 rounded-xl border border-[var(--border-card)] focus:outline-none focus:border-[var(--gold-primary)] transition-colors font-mono"
              />
            </div>
          </div>

          {/* Styling Note / Need */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-heading)]">
              Styling Purpose / Reason (Optional)
            </label>
            <input
              type="text"
              maxLength={GARMENT_NOTES_MAX_LENGTH}
              placeholder="e.g. Versatile layer for evening dinner & quarterly presentations"
              value={stylingNote}
              onChange={(e) => setStylingNote(e.target.value)}
              className="w-full bg-[var(--pill-bg)] text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] px-3.5 py-2.5 rounded-xl border border-[var(--border-card)] focus:outline-none focus:border-[var(--gold-primary)] transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[var(--border-card)] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--gold-primary)] text-black hover:opacity-90 transition-opacity cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add to Wishlist</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* SUB-COMPONENT: OWNED-ONLY ALTERNATIVES MODAL (Task 10E) */
/* ========================================================================= */
interface OwnedAlternativesModalProps {
  item: ShoppingListItem;
  alternatives: OwnedAlternative[];
  onClose: () => void;
  onNavigateToCloset: (searchTerm?: string) => void;
  onWearInstead: (itemId: string, altName: string) => void;
  onOpenAddPiece: () => void;
}

const OwnedAlternativesModal: React.FC<OwnedAlternativesModalProps> = ({
  item,
  alternatives,
  onClose,
  onNavigateToCloset,
  onWearInstead,
  onOpenAddPiece,
}) => {
  const modalRef = useFocusTrap<HTMLDivElement>({
    isOpen: true,
    onClose,
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alternatives-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-2xl p-6 sm:p-7 text-[var(--text-body)] flex flex-col space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[var(--border-card)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-gold)] flex items-center justify-center text-[var(--gold-primary)] shrink-0">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <h3 id="alternatives-modal-title" className="font-playfair text-xl sm:text-2xl font-bold text-[var(--text-heading)]">
                Closet Alternatives for "{item.name}"
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Category: {item.category} {item.subType ? `• Silhouette: ${item.subType}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--pill-bg)] text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explainability / Algorithmic Transparency Banner */}
        <div className="p-3 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-card)] text-xs flex items-start gap-2.5 shrink-0">
          <Info className="w-4 h-4 text-[var(--gold-primary)] shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed text-[11px] text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-heading)] block">
              Rule-Based Wardrobe Compatibility Analysis
            </span>
            <span>
              These alternatives were determined from your active Digital Closet using silhouette type, formality tier, and color compatibility. Shopping is optional; you can substitute an existing piece to complete your outfit without purchasing anything new.
            </span>
          </div>
        </div>

        {/* Scrollable Alternatives List */}
        <div className="overflow-y-auto space-y-3 pr-1 flex-1">
          {alternatives.length === 0 ? (
            /* Honest Empty State (Requirement E & Acceptance Criterion 10) */
            <div className="p-8 rounded-2xl border border-dashed border-[var(--border-card)] text-center space-y-3 my-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--pill-bg)] flex items-center justify-center text-[var(--text-muted)] mx-auto">
                <Shirt className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-playfair text-base font-bold text-[var(--text-heading)]">
                  No Suitable Closet Alternatives Found
                </h4>
                <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
                  You don't currently have a compatible piece in the "{item.category}" category in your active Digital Closet. This confirms a genuine gap in your wardrobe collection.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={onOpenAddPiece}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--gold-primary)] text-black hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
                >
                  + Add Piece to Closet
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
                >
                  Keep on Wishlist
                </button>
              </div>
            </div>
          ) : (
            /* Alternatives Cards */
            alternatives.map(({ item: altItem, matchReason, compatibilityScore }) => (
              <div
                key={altItem.id}
                className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-[var(--border-gold)]/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-2xs"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-14 h-14 rounded-xl bg-neutral-900 border border-[var(--border-card)] overflow-hidden shrink-0 flex items-center justify-center text-2xl relative shadow-2xs">
                    {altItem.imageUrl ? (
                      <img
                        src={altItem.imageUrl}
                        alt={altItem.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span>{altItem.icon || '👔'}</span>
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-playfair text-sm font-bold text-[var(--text-heading)] truncate">
                        {altItem.name}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded-md bg-[var(--gold-primary)]/15 text-[var(--gold-primary)] font-bold">
                        {compatibilityScore}% Synergy
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
                      {altItem.brand && <span className="font-medium">{altItem.brand}</span>}
                      {altItem.subType && <span>• {altItem.subType}</span>}
                      {altItem.color && <span>• {altItem.color}</span>}
                      {altItem.formality && (
                        <span className="text-[10px] font-mono">
                          • Formality {altItem.formality}/5
                        </span>
                      )}
                    </div>

                    {/* Compatibility Reason Badge */}
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                      {matchReason}
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => onWearInstead(item.id, altItem.name)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--gold-primary)] text-black hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
                    title="Choose to wear this alternative instead of purchasing"
                  >
                    Wear Instead
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateToCloset(altItem.name)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium border border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
                    title="Inspect in Digital Closet"
                  >
                    View in Closet →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[var(--border-card)] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            {alternatives.length} closet piece{alternatives.length === 1 ? '' : 's'} analyzed
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
