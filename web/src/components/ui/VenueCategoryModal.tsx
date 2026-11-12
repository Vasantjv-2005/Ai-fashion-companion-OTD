import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Search, Check, Sparkles, Building2 } from 'lucide-react';
import { useFocusTrap } from '../../utils/focusTrap';

export interface VenueCategoryItem {
  id: string;
  name: string;
  description: string;
  ambienceTag: string;
  img: string;
}

const ALL_VENUE_CATEGORIES: VenueCategoryItem[] = [
  {
    id: 'restaurant',
    name: 'Restaurant',
    description: 'Fine dining rooms, bistros, brasseries and casual eateries.',
    ambienceTag: 'Intimate / Dining',
    img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'cafe',
    name: 'Café',
    description: 'Specialty coffee bars, artisanal bakeries and sidewalk terraces.',
    ambienceTag: 'Relaxed Daytime',
    img: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'bar_club',
    name: 'Bar / Club',
    description: 'Cocktail lounges, subterranean speakeasies and late-night clubs.',
    ambienceTag: 'Nightlife / High Energy',
    img: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'mall',
    name: 'Mall',
    description: 'Flagship shopping arcades, luxury promenades and lifestyle centers.',
    ambienceTag: 'Walkable / Urban',
    img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'movie_theater',
    name: 'Movie / Theater',
    description: 'Cinema auditoriums, historic playhouses and Broadway theatres.',
    ambienceTag: 'Indoor Seated',
    img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'resort',
    name: 'Resort',
    description: 'Hilltop retreats, wellness sanctuaries and luxury weekend getaways.',
    ambienceTag: 'Resort Elegance',
    img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'outdoor',
    name: 'Outdoor',
    description: 'Alfresco parks, botanical pavilions and lakefront promenades.',
    ambienceTag: 'Open Air / Sun',
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'gallery_museum',
    name: 'Art Gallery & Museum',
    description: 'Contemporary white cubes, sculpture halls and heritage museums.',
    ambienceTag: 'Cultural / Quiet',
    img: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'rooftop_lounge',
    name: 'Rooftop Lounge',
    description: 'High-altitude terraces with skyline views and sunset cocktails.',
    ambienceTag: 'Breezy / Glamorous',
    img: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'beach_club',
    name: 'Beach Club & Cabana',
    description: 'Seaside cabanas, ocean decks and sun-drenched coastal venues.',
    ambienceTag: 'Coastal Chic',
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'coworking_studio',
    name: 'Coworking & Studio',
    description: 'Modern design studios, creative offices and entrepreneur hubs.',
    ambienceTag: 'Creative Professional',
    img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'hotel_lobby',
    name: 'Hotel Lobby & Terrace',
    description: 'Grand hotel atriums, mezzanine cocktail bars and courtyard gardens.',
    ambienceTag: 'Sophisticated / Polished',
    img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'concert_hall',
    name: 'Concert Hall & Arena',
    description: 'Symphony auditoriums, amphitheaters and live festival grounds.',
    ambienceTag: 'Dynamic Soundstage',
    img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'private_dining',
    name: 'Private Dining Room',
    description: 'Exclusive chef tables, cellar tasting rooms and celebratory salons.',
    ambienceTag: 'Exclusive / Tailored',
    img: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=600&q=80',
  },
];

interface VenueCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
}

export const VenueCategoryModal: React.FC<VenueCategoryModalProps> = ({
  isOpen,
  onClose,
  selectedCategory,
  onSelectCategory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus trap, restoration & Escape key dismiss
  const modalRef = useFocusTrap<HTMLDivElement>({ isOpen, onClose });

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => searchInputRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const filteredCategories = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return ALL_VENUE_CATEGORIES;
    return ALL_VENUE_CATEGORIES.filter(
      (cat) =>
        cat.name.toLowerCase().includes(term) ||
        cat.description.toLowerCase().includes(term) ||
        cat.ambienceTag.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="venue-category-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-2xl text-[var(--text-body)] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-card)] space-y-4 bg-[var(--bg-header)]">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[var(--gold-primary)]" />
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[var(--gold-primary)]">
                  Setting Taxonomy
                </span>
              </div>
              <h3
                id="venue-category-modal-title"
                className="font-playfair text-2xl font-bold text-[var(--text-heading)]"
              >
                Explore Venue Categories
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Select your setting archetype to tune appropriate thermal layers and dress codes.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close category selector"
              className="p-2 rounded-full border border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--gold-primary)]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Filter venue categories"
              placeholder="Filter categories (e.g. Rooftop, Gallery, Speakeasy, Resort...)"
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] text-xs text-[var(--text-heading)] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] focus:border-[var(--gold-primary)]"
            />
            {searchTerm && (
              <button
                type="button"
                aria-label="Clear venue category filter"
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto flex-1">
          {filteredCategories.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-semibold text-[var(--text-heading)]">No venue categories found</p>
              <p className="text-xs text-[var(--text-muted)]">Try a different keyword or choose a standard setting.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredCategories.map((cat) => {
                const isSelected = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      onSelectCategory(cat.name);
                      onClose();
                    }}
                    className={`group relative p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 text-left items-start w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] ${
                      isSelected
                        ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black ring-2 ring-[var(--gold-primary)] shadow-lg scale-[1.01]'
                        : 'border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[var(--gold-primary)] hover:bg-[var(--pill-bg)]/40'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative bg-neutral-900 border border-[var(--border-card)]">
                      <img
                        src={cat.img}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-playfair font-bold text-sm truncate">{cat.name}</h4>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 dark:bg-emerald-100 dark:text-emerald-800 dark:border-emerald-700/40 shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            Active
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[11px] line-clamp-1 leading-snug ${
                          isSelected ? 'text-neutral-200 dark:text-neutral-700' : 'text-[var(--text-body)]'
                        }`}
                      >
                        {cat.description}
                      </p>
                      <span
                        className={`inline-block text-[10px] px-2 py-0.5 rounded-md font-medium ${
                          isSelected
                            ? 'bg-white/15 dark:bg-black/10 text-white dark:text-black'
                            : 'bg-[var(--pill-bg)] text-[var(--text-body)]'
                        }`}
                      >
                        {cat.ambienceTag}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[var(--border-card)] flex items-center justify-between bg-[var(--bg-header)] text-xs">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
            <span>Selected category: <strong className="text-[var(--text-heading)]">{selectedCategory}</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full border border-[var(--border-card)] text-xs font-semibold hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
