import React, { useEffect, useRef } from 'react';
import { X, Check, Sparkles } from 'lucide-react';

export interface OccasionItem {
  id: string;
  name: string;
  category: string;
  description: string;
  dressCodeSuggestion: string;
  img: string;
}

const SECONDARY_OCCASIONS: OccasionItem[] = [
  {
    id: 'gala',
    name: 'Gala',
    category: 'Formal Evening',
    description: 'Black-tie celebrations, charity balls, and high-elegance red carpet soirées.',
    dressCodeSuggestion: 'Black Tie / Evening Tailored',
    img: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'concert',
    name: 'Concert',
    category: 'Live Music & Culture',
    description: 'Live arena performances, intimate acoustic venues, and high-energy music festivals.',
    dressCodeSuggestion: 'Edgy Casual / Statement Layers',
    img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'interview',
    name: 'Interview',
    category: 'Professional',
    description: 'Executive job discussions, creative pitch panels, and high-stakes career presentations.',
    dressCodeSuggestion: 'Sharp Corporate / Modern Tailored',
    img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'brunch',
    name: 'Brunch',
    category: 'Social Daytime',
    description: 'Weekend terrace dining, mimosa garden gatherings, and relaxed daytime reunions.',
    dressCodeSuggestion: 'Smart Daytime Casual / Relaxed Linen',
    img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'lounge',
    name: 'Lounge',
    category: 'Cocktail & Evening',
    description: 'Dimly lit cocktail dens, rooftop terraces, and sophisticated evening socializing.',
    dressCodeSuggestion: 'Elevated Evening Casual',
    img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'funeral',
    name: 'Funeral / Memorial',
    category: 'Solemn & Respectful',
    description: 'Memorial services, solemn family gatherings, and respectful observances.',
    dressCodeSuggestion: 'Subdued Formal / Dark Neutrals',
    img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'cocktail_party',
    name: 'Cocktail Party',
    category: 'Cocktail & Evening',
    description: 'Sunset receptions, gallery openings, and celebratory chic cocktail hours.',
    dressCodeSuggestion: 'Cocktail Attire / Sartorial Separates',
    img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'art_gallery',
    name: 'Art Gallery Opening',
    category: 'Arts & Culture',
    description: 'Exhibition vernissages, contemporary gallery previews, and studio visits.',
    dressCodeSuggestion: 'Creative Minimalist / Architectural Lines',
    img: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
  },
];

interface OccasionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOccasion: string;
  onSelectOccasion: (occasionName: string) => void;
}

export const OccasionModal: React.FC<OccasionModalProps> = ({
  isOpen,
  onClose,
  selectedOccasion,
  onSelectOccasion,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Close on Escape key & restore focus
  useEffect(() => {
    if (!isOpen) return;
    previousActiveElement.current = document.activeElement as HTMLElement | null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousActiveElement.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="occasion-modal-title"
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
        {/* Modal Header */}
        <div className="p-6 border-b border-[var(--border-card)] flex items-start justify-between bg-[var(--bg-header)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--gold-primary)]" />
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[var(--gold-primary)]">
                Occasion Directory
              </span>
            </div>
            <h3
              id="occasion-modal-title"
              className="font-playfair text-2xl font-bold text-[var(--text-heading)]"
            >
              Select Your Occasion
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Choose from specialized settings to calibrate dress code formality and styling rationale.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close occasion selector"
            className="p-2 rounded-full border border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Occasions Grid */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {SECONDARY_OCCASIONS.map((occ) => {
              const isSelected = selectedOccasion === occ.name;
              return (
                <div
                  key={occ.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => {
                    onSelectOccasion(occ.name);
                    onClose();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectOccasion(occ.name);
                      onClose();
                    }
                  }}
                  className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer flex gap-3.5 text-left items-start ${
                    isSelected
                      ? 'border-black bg-black text-white dark:bg-white dark:text-black shadow-lg scale-[1.01]'
                      : 'border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[var(--gold-primary)] hover:bg-[var(--pill-bg)]/40'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 relative bg-neutral-900 border border-[var(--border-card)]">
                    <img
                      src={occ.img}
                      alt={occ.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-[9px] uppercase font-mono font-bold tracking-wider ${
                          isSelected ? 'text-[var(--gold-primary)]' : 'text-[var(--gold-primary)]'
                        }`}
                      >
                        {occ.category}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-emerald-400">Selected</span>
                      )}
                    </div>
                    <h4 className="font-playfair font-bold text-sm leading-tight truncate">
                      {occ.name}
                    </h4>
                    <p
                      className={`text-[11px] line-clamp-2 leading-relaxed ${
                        isSelected ? 'text-neutral-300 dark:text-neutral-700' : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {occ.description}
                    </p>
                    <div className="pt-0.5">
                      <span
                        className={`inline-block text-[10px] px-2 py-0.5 rounded-md font-medium ${
                          isSelected
                            ? 'bg-white/15 dark:bg-black/15 text-white dark:text-black'
                            : 'bg-[var(--pill-bg)] text-[var(--text-muted)]'
                        }`}
                      >
                        {occ.dressCodeSuggestion}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-[var(--border-card)] flex items-center justify-between bg-[var(--bg-header)] text-xs">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
            <span>Currently styling for: <strong className="text-[var(--text-heading)]">{selectedOccasion}</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full border border-[var(--border-card)] text-xs font-semibold hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
