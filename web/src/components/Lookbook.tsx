import React, { useState } from 'react';
import { ArrowUpRight, X, Sparkles } from 'lucide-react';
import { useFocusTrap } from '../utils/focusTrap';

interface EditorialLook {
  title: string;
  aesthetic: string;
  palette: { hex: string; name: string }[];
  caption: string;
  model: string;
  icon: string;
  pieces: string[];
  occasionHint: string;
}

const EDITORIAL_LOOKS: EditorialLook[] = [
  {
    title: 'The Milanese Nocturne',
    aesthetic: 'Evening Sartorial',
    palette: [
      { hex: '#0B1325', name: 'Midnight Navy' },
      { hex: '#FAFAFA', name: 'Ivory Silk' },
      { hex: '#D4AF37', name: 'Burnished Gold' },
    ],
    caption: 'Double-breasted barathea wool paired with silk grosgrain collar and evening velvet slippers.',
    model: 'Lookbook Edition IV · Milan',
    icon: '🍸',
    pieces: [
      'Double-Breasted Barathea Dinner Jacket',
      'Silk-Grosgrain Spread Collar Shirt',
      'High-Rise Forward-Pleat Tuxedo Trousers',
      'Monogrammed Velvet Evening Slippers',
    ],
    occasionHint: 'Fine dining bistro & formal evening soirées',
  },
  {
    title: 'Alpine Cashmere Monolith',
    aesthetic: 'Quiet Luxury Leisure',
    palette: [
      { hex: '#8E5A3C', name: 'Hazelnut Suede' },
      { hex: '#DED5C4', name: 'Undyed Oatmeal' },
      { hex: '#2D3A2F', name: 'Forest Pine' },
    ],
    caption: 'Undyed 6-ply Scottish cashmere layered beneath Spanish entrefino shearling with brushed corduroy.',
    model: 'Lookbook Edition VII · St. Moritz',
    icon: '🏔️',
    pieces: [
      'Spanish Entrefino Shearling Field Coat',
      'Undyed 6-Ply Scottish Cashmere Rollneck',
      'Heavywale Italian Corduroy Trousers',
      'Norwegian-Welted Leather Boots',
    ],
    occasionHint: 'Cool-climate weekend travel & fireside dinners',
  },
  {
    title: 'Architectural Shadowplay',
    aesthetic: 'Contemporary Minimalist',
    palette: [
      { hex: '#111113', name: 'Obsidian Matte' },
      { hex: '#4A4D55', name: 'Slate Graphite' },
      { hex: '#E6E4DD', name: 'Bone Stone' },
    ],
    caption: 'Unstructured wool crepe draped with seamless mock-neck and fluid Japanese triacetate.',
    model: 'Lookbook Edition IX · Tokyo Aoyama',
    icon: '🏛️',
    pieces: [
      'Unstructured High-Twist Wool Crepe Blazer',
      'Seamless 18-Gauge Silk-Cashmere Mock-Neck',
      'Wide-Leg Japanese Triacetate Trousers',
      'Hardware-Free Venetian Calfskin Loafers',
    ],
    occasionHint: 'Gallery openings & modern studio briefings',
  },
];

export const Lookbook: React.FC = () => {
  const [selectedLook, setSelectedLook] = useState<EditorialLook | null>(null);
  const modalRef = useFocusTrap<HTMLDivElement>({
    isOpen: selectedLook !== null,
    onClose: () => setSelectedLook(null),
  });

  return (
    <section id="lookbook" className="py-24 relative bg-[var(--bg-canvas-subtle)] border-t border-[var(--border-card)] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-3">
            <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[var(--gold-primary)] block font-mono">
              EDITORIAL CURATION
            </span>
            <h2 className="font-serif-luxury text-3xl sm:text-5xl font-normal text-[var(--text-heading)]">
              OTD Lookbook <br />
              <span className="italic font-light gold-gradient-text">Outfit Of The Day Curation</span>
            </h2>

          </div>
          <p className="text-sm text-[var(--text-body)] max-w-md font-light">
            A perpetual stream of bespoke sartorial compositions curated by our international fashion directors and neural networks.
          </p>
        </div>

        {/* Editorial 3-Card Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {EDITORIAL_LOOKS.map((look) => (
            <button
              key={look.title}
              type="button"
              onClick={() => setSelectedLook(look)}
              className="glass-card glass-card-interactive rounded-3xl p-6 sm:p-8 border border-[var(--border-card)] flex flex-col justify-between group text-left cursor-pointer"
            >
              <div className="w-full">
                {/* Lookbook Badge / Location */}
                <div className="flex items-center justify-between pb-4 border-b border-[var(--border-card)] mb-6">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--gold-primary)] font-medium">
                    {look.model}
                  </span>
                  <span className="text-2xl">{look.icon}</span>
                </div>

                {/* Aesthetic Tag */}
                <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)] block mb-1 font-medium">
                  {look.aesthetic}
                </span>

                {/* Title */}
                <h3 className="font-serif-luxury text-2xl sm:text-3xl text-[var(--text-heading)] mb-4 group-hover:text-[var(--gold-primary)] transition-colors">
                  {look.title}
                </h3>

                {/* Caption */}
                <p className="text-xs text-[var(--text-body)] font-light leading-relaxed mb-6">
                  "{look.caption}"
                </p>
              </div>

              {/* Palette & Synergy */}
              <div className="w-full pt-4 border-t border-[var(--border-card)] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {look.palette.map((swatch) => (
                    <span
                      key={swatch.name}
                      title={swatch.name}
                      aria-label={swatch.name}
                      className="w-4 h-4 rounded-full border border-black/10 dark:border-white/20 shadow-sm inline-block"
                      style={{ backgroundColor: swatch.hex }}
                    />
                  ))}
                  <span className="text-[10px] text-[var(--text-muted)] ml-1 font-medium">Chromatic DNA</span>
                </div>

                <span className="text-[11px] font-mono text-[var(--gold-primary)] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform font-medium">
                  <span>Explore</span>
                  <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>

            </button>
          ))}
        </div>

      </div>

      {/* Editorial Lookbook Detail Modal */}
      {selectedLook && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lookbook-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedLook(null);
            }
          }}
        >
          <div
            ref={modalRef}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto glass-card rounded-3xl p-6 sm:p-8 border border-[var(--border-gold)] shadow-2xl bg-[var(--bg-card-elevated)] text-[var(--text-body)] space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedLook(null)}
              aria-label="Close editorial look details"
              className="absolute top-5 right-5 p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1.5 pr-8">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--gold-primary)] font-semibold block">
                {selectedLook.model} · {selectedLook.aesthetic}
              </span>
              <h3 id="lookbook-modal-title" className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[var(--text-heading)] flex items-center gap-2">
                <span>{selectedLook.icon}</span>
                <span>{selectedLook.title}</span>
              </h3>
              <p className="text-xs text-[var(--text-body)] leading-relaxed pt-1">
                "{selectedLook.caption}"
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-card-inner)] border border-[var(--border-card)] space-y-2.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)] font-semibold block">
                Key Ensemble Architecture
              </span>
              <ul className="space-y-1.5 text-xs text-[var(--text-heading)] list-disc pl-4">
                {selectedLook.pieces.map((piece) => (
                  <li key={piece}>{piece}</li>
                ))}
              </ul>
              <p className="text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-card)]">
                Ideal for: <strong className="text-[var(--text-heading)]">{selectedLook.occasionHint}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)] font-semibold block">
                Chromatic DNA
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedLook.palette.map((swatch) => (
                  <div
                    key={swatch.name}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-card)] bg-[var(--bg-card)] text-xs"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/15 dark:border-white/20 shrink-0"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <span className="text-[var(--text-heading)] font-medium">{swatch.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedLook(null);
                  document.getElementById('context-studio')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="gold-btn flex-1 py-3.5 px-5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Curate Similar in Context Engine</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedLook(null)}
                className="px-5 py-3.5 rounded-2xl border border-[var(--border-card)] text-xs font-semibold hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
