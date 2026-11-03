import React from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  Edit,
  CloudSun,
  Check,
  Ban,
  ArrowRight,
} from 'lucide-react';

interface StylistReviewSummaryProps {
  selectedOccasion: string;
  selectedDestination: string;
  selectedVenueCategory: string;
  selectedVenueImg?: string;
  selectedVenueName?: string;
  selectedDate: string;
  selectedTime: string;
  weatherSummary: string;
  weatherCondition: string;
  locationStatus: 'idle' | 'requesting' | 'detected' | 'denied' | 'unsupported' | 'error';
  selectedMoods: string[];
  selectedPreferences: string[];
  mustInclude: string[];
  avoidItems: string[];
  onEditOccasion: () => void;
  onEditDestination: () => void;
  onEditMoods: () => void;
  onEditPreferences: () => void;
  onEditConstraints: () => void;
  onGenerate: () => void;
}

export const StylistReviewSummary: React.FC<StylistReviewSummaryProps> = ({
  selectedOccasion,
  selectedDestination,
  selectedVenueCategory,
  selectedVenueImg,
  selectedVenueName,
  selectedDate,
  selectedTime,
  weatherSummary,
  weatherCondition,
  locationStatus,
  selectedMoods,
  selectedPreferences,
  mustInclude,
  avoidItems,
  onEditOccasion,
  onEditDestination,
  onEditMoods,
  onEditPreferences,
  onEditConstraints,
  onGenerate,
}) => {
  return (
    <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 sm:p-6 space-y-5 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-card)]">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--gold-primary)]" />
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[var(--gold-primary)]">
              Curated Session Spec
            </span>
          </div>
          <h4 className="font-playfair text-lg font-bold text-[var(--text-heading)]">
            Review Your Styling Plan
          </h4>
        </div>
        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
          Ready to Curate
        </span>
      </div>

      {/* Destination & Occasion Highlight */}
      <div className="space-y-3">
        {selectedVenueImg && (
          <div className="h-32 rounded-2xl overflow-hidden bg-neutral-900 border border-[var(--border-card)] relative">
            <img
              src={selectedVenueImg}
              alt={selectedVenueName || 'Selected Venue'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-3.5">
              <div>
                <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-[var(--gold-primary)] block">
                  {selectedVenueCategory}
                </span>
                <h5 className="font-playfair font-bold text-white text-base leading-tight">
                  {selectedVenueName || selectedDestination}
                </h5>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Occasion */}
          <div className="p-3 rounded-2xl bg-[var(--pill-bg)]/50 border border-[var(--border-card)] flex items-start justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-[var(--text-muted)] block font-mono uppercase">
                Occasion
              </span>
              <span className="font-playfair font-bold text-sm text-[var(--text-heading)]">
                {selectedOccasion}
              </span>
            </div>
            <button
              type="button"
              onClick={onEditOccasion}
              aria-label="Edit occasion"
              className="text-[10px] text-[var(--gold-primary)] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <Edit className="w-3 h-3" /> Edit
            </button>
          </div>

          {/* Destination */}
          <div className="p-3 rounded-2xl bg-[var(--pill-bg)]/50 border border-[var(--border-card)] flex items-start justify-between">
            <div className="space-y-0.5 min-w-0 pr-2">
              <span className="text-[10px] text-[var(--text-muted)] block font-mono uppercase">
                Setting & Place
              </span>
              <span className="font-semibold text-xs text-[var(--text-heading)] block truncate">
                {selectedDestination || selectedVenueCategory}
              </span>
            </div>
            <button
              type="button"
              onClick={onEditDestination}
              aria-label="Edit destination"
              className="text-[10px] text-[var(--gold-primary)] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
            >
              <Edit className="w-3 h-3" /> Edit
            </button>
          </div>
        </div>
      </div>

      {/* Date, Time & Weather Telemetrics */}
      <div className="space-y-2 p-3.5 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-card)] text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-card)]/60 text-[11px]">
          <span className="font-mono uppercase text-[10px] text-[var(--text-muted)]">Timing & Environment</span>
          <button
            type="button"
            onClick={onEditDestination}
            className="text-[10px] text-[var(--gold-primary)] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <Edit className="w-3 h-3" /> Adjust
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <p className="flex items-center gap-1.5 text-[var(--text-body)]">
            <Calendar className="w-3.5 h-3.5 text-[var(--gold-primary)] shrink-0" />
            <span className="truncate">{selectedDate}</span>
          </p>
          <p className="flex items-center gap-1.5 text-[var(--text-body)]">
            <Clock className="w-3.5 h-3.5 text-[var(--gold-primary)] shrink-0" />
            <span className="truncate">{selectedTime}</span>
          </p>
        </div>

        <div className="pt-1.5 flex items-start gap-2 border-t border-[var(--border-card)]/50">
          <CloudSun className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-tight">
            <strong className="text-[var(--text-heading)]">{weatherCondition}</strong>
            <p className="text-[10px] text-[var(--text-muted)]">{weatherSummary}</p>
            {locationStatus === 'detected' && (
              <span className="inline-block mt-0.5 text-[9px] text-emerald-600 dark:text-emerald-400 font-mono">
                ✓ Local geographic coordinates calibrated
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Selected Style Vibes (Max 2) */}
      <div className="p-3.5 rounded-2xl bg-[var(--pill-bg)]/40 border border-[var(--border-card)] space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase text-[var(--text-muted)]">
            Style Vibes ({selectedMoods.length}/2)
          </span>
          <button
            type="button"
            onClick={onEditMoods}
            className="text-[10px] text-[var(--gold-primary)] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <Edit className="w-3 h-3" /> Change
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {selectedMoods.length > 0 ? (
            selectedMoods.map((vibe) => (
              <span
                key={vibe}
                className="px-2.5 py-1 rounded-lg bg-black text-white dark:bg-white dark:text-black font-semibold text-[11px] shadow-sm"
              >
                {vibe}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-[var(--text-muted)] italic">No specific vibe selected</span>
          )}
        </div>
      </div>

      {/* Comfort & Layering */}
      {selectedPreferences.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-[var(--pill-bg)]/40 border border-[var(--border-card)] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[var(--text-muted)]">
              Comfort & Layering
            </span>
            <button
              type="button"
              onClick={onEditPreferences}
              className="text-[10px] text-[var(--gold-primary)] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <Edit className="w-3 h-3" /> Edit
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedPreferences.map((pref) => (
              <span
                key={pref}
                className="px-2 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-card)] text-[11px] text-[var(--text-body)]"
              >
                {pref}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Constraints Summary */}
      {(mustInclude.length > 0 || avoidItems.length > 0) && (
        <div className="p-3.5 rounded-2xl bg-[var(--pill-bg)]/40 border border-[var(--border-card)] space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[var(--text-muted)]">
              Garment Constraints
            </span>
            <button
              type="button"
              onClick={onEditConstraints}
              className="text-[10px] text-[var(--gold-primary)] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <Edit className="w-3 h-3" /> Edit
            </button>
          </div>

          {mustInclude.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block flex items-center gap-1">
                <Check className="w-3 h-3" /> Include ({mustInclude.length}):
              </span>
              <div className="flex flex-wrap gap-1">
                {mustInclude.map((i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-medium"
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}

          {avoidItems.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-[var(--border-card)]/40">
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold block flex items-center gap-1">
                <Ban className="w-3 h-3" /> Avoid ({avoidItems.length}):
              </span>
              <div className="flex flex-wrap gap-1">
                {avoidItems.map((a) => (
                  <span
                    key={a}
                    className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 font-medium"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Editorial Assurance */}
      <div className="p-3 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-gold)] text-xs text-[var(--text-body)] space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-[var(--gold-primary)]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Curator Rationale Guarantee</span>
        </div>
        <p className="text-[11px] leading-snug">
          Synthesizing {selectedOccasion} dress codes, setting dynamics, thermal comfort, and explicit item constraints.
        </p>
      </div>

      {/* Main Generate CTA */}
      <button
        type="button"
        onClick={onGenerate}
        className="w-full py-3.5 px-6 rounded-full bg-black text-white dark:bg-white dark:text-black text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl"
      >
        <Sparkles className="w-4 h-4 text-[var(--gold-primary)]" />
        <span>Generate Curated Outfit</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
