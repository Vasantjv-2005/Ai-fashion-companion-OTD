import React, { useState } from 'react';
import { Plus, X, Check, Ban, Sparkles, ShieldAlert } from 'lucide-react';

interface GarmentConstraintsSectionProps {
  mustInclude: string[];
  avoidItems: string[];
  onAddInclude: (item: string) => void;
  onRemoveInclude: (item: string) => void;
  onAddAvoid: (item: string) => void;
  onRemoveAvoid: (item: string) => void;
}

const QUICK_INCLUDE_SUGGESTIONS = [
  'White sneakers',
  'Black blazer',
  'Denim jacket',
  'My favourite watch',
  'Tailored trousers',
  'Loafers',
];

const QUICK_AVOID_SUGGESTIONS = [
  'No leather shoes',
  'Avoid wool',
  'No bright colours',
  'Avoid formal clothing',
  'No ties',
  'Avoid synthetic poly',
];

export const GarmentConstraintsSection: React.FC<GarmentConstraintsSectionProps> = ({
  mustInclude,
  avoidItems,
  onAddInclude,
  onRemoveInclude,
  onAddAvoid,
  onRemoveAvoid,
}) => {
  const [includeInput, setIncludeInput] = useState('');
  const [avoidInput, setAvoidInput] = useState('');
  const [includeFeedback, setIncludeFeedback] = useState<string | null>(null);
  const [avoidFeedback, setAvoidFeedback] = useState<string | null>(null);

  const handleIncludeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = includeInput.trim();
    if (!clean) return;

    if (mustInclude.some((item) => item.toLowerCase() === clean.toLowerCase())) {
      setIncludeFeedback(`"${clean}" is already included`);
      setTimeout(() => setIncludeFeedback(null), 2500);
      return;
    }

    onAddInclude(clean);
    setIncludeInput('');
    setIncludeFeedback(null);
  };

  const handleAvoidSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = avoidInput.trim();
    if (!clean) return;

    if (avoidItems.some((item) => item.toLowerCase() === clean.toLowerCase())) {
      setAvoidFeedback(`"${clean}" is already on avoid list`);
      setTimeout(() => setAvoidFeedback(null), 2500);
      return;
    }

    onAddAvoid(clean);
    setAvoidInput('');
    setAvoidFeedback(null);
  };

  return (
    <div className="space-y-4 rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-card)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--gold-primary)]" />
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[var(--gold-primary)]">
              Piece-Level Conditioning
            </span>
          </div>
          <h3 className="font-playfair text-base sm:text-lg font-bold text-[var(--text-heading)] mt-0.5">
            Anything OTD should include or avoid?
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Specify hero closet items you want to feature, or textures and garments you wish to exclude.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--pill-bg)] border border-[var(--border-gold)] text-[11px] text-[var(--text-muted)] self-start sm:self-auto">
          <Sparkles className="w-3.5 h-3.5 text-[var(--gold-primary)] shrink-0" />
          <span>Explicit Constraints</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
        {/* MUST INCLUDE COLUMN */}
        <div className="space-y-3 p-4 rounded-2xl bg-[var(--pill-bg)]/40 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Check className="w-3 h-3 stroke-[2.5]" />
              </div>
              <h4 className="font-playfair text-xs sm:text-sm font-bold text-[var(--text-heading)]">
                Must Include <span className="font-sans text-[11px] font-normal text-[var(--text-muted)]">(Required Pieces)</span>
              </h4>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {mustInclude.length} selected
            </span>
          </div>

          <form onSubmit={handleIncludeSubmit} className="flex gap-2">
            <input
              type="text"
              value={includeInput}
              onChange={(e) => setIncludeInput(e.target.value)}
              placeholder="e.g. White sneakers, Black blazer..."
              aria-label="Piece to must include"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!includeInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 transition-all cursor-pointer shrink-0 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          {includeFeedback && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              {includeFeedback}
            </p>
          )}

          {/* Quick Suggestions */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block">
              Quick Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_INCLUDE_SUGGESTIONS.map((sug) => {
                const isAdded = mustInclude.some((i) => i.toLowerCase() === sug.toLowerCase());
                return (
                  <button
                    key={sug}
                    type="button"
                    disabled={isAdded}
                    onClick={() => onAddInclude(sug)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                      isAdded
                        ? 'opacity-40 bg-[var(--pill-bg)] border-transparent cursor-default'
                        : 'bg-[var(--bg-card)] border-[var(--border-card)] text-[var(--text-body)] hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400'
                    }`}
                  >
                    <span>+</span>
                    <span>{sug}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tags */}
          {mustInclude.length > 0 && (
            <div className="pt-2 border-t border-[var(--border-card)] space-y-1.5">
              <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block">
                Active Included Pieces:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {mustInclude.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-medium animate-in fade-in"
                  >
                    <Check className="w-3 h-3 stroke-[3] text-emerald-600 dark:text-emerald-400" />
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveInclude(item)}
                      aria-label={`Remove ${item}`}
                      className="p-0.5 rounded-full hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AVOID COLUMN */}
        <div className="space-y-3 p-4 rounded-2xl bg-[var(--pill-bg)]/40 border border-rose-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Ban className="w-3 h-3 stroke-[2.5]" />
              </div>
              <h4 className="font-playfair text-xs sm:text-sm font-bold text-[var(--text-heading)]">
                Avoid <span className="font-sans text-[11px] font-normal text-[var(--text-muted)]">(Exclude Items / Fabrics)</span>
              </h4>
            </div>
            <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400">
              {avoidItems.length} selected
            </span>
          </div>

          <form onSubmit={handleAvoidSubmit} className="flex gap-2">
            <input
              type="text"
              value={avoidInput}
              onChange={(e) => setAvoidInput(e.target.value)}
              placeholder="e.g. Wool, Bright colours, Ties..."
              aria-label="Piece or fabric to avoid"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none focus:border-rose-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!avoidInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 transition-all cursor-pointer shrink-0 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Exclude</span>
            </button>
          </form>

          {avoidFeedback && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              {avoidFeedback}
            </p>
          )}

          {/* Quick Suggestions */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block">
              Quick Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_AVOID_SUGGESTIONS.map((sug) => {
                const isAdded = avoidItems.some((i) => i.toLowerCase() === sug.toLowerCase());
                return (
                  <button
                    key={sug}
                    type="button"
                    disabled={isAdded}
                    onClick={() => onAddAvoid(sug)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                      isAdded
                        ? 'opacity-40 bg-[var(--pill-bg)] border-transparent cursor-default'
                        : 'bg-[var(--bg-card)] border-[var(--border-card)] text-[var(--text-body)] hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400'
                    }`}
                  >
                    <span>✕</span>
                    <span>{sug}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tags */}
          {avoidItems.length > 0 && (
            <div className="pt-2 border-t border-[var(--border-card)] space-y-1.5">
              <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block">
                Active Excluded Items:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {avoidItems.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs font-medium animate-in fade-in"
                  >
                    <Ban className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveAvoid(item)}
                      aria-label={`Remove avoidance for ${item}`}
                      className="p-0.5 rounded-full hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] pt-1">
        <ShieldAlert className="w-3.5 h-3.5 text-[var(--gold-primary)] shrink-0" />
        <span>
          Client-side styling guidance: Required pieces will anchor your outfit composition, while excluded fabrics will be omitted from curated recommendations.
        </span>
      </div>
    </div>
  );
};
