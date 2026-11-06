import React from 'react';
import { Sparkles, Calendar, Clock, MapPin, Tag } from 'lucide-react';

interface OutfitResultHeaderProps {
  title: string;
  subtitle: string;
  occasion: string;
  destination: string;
  venueCategory: string;
  selectedDate: string;
  selectedTime: string;
  weatherCondition: string;
  weatherSummary: string;
  selectedMoods: string[];
  harmonyScore: number;
}

export const OutfitResultHeader: React.FC<OutfitResultHeaderProps> = ({
  title,
  subtitle,
  occasion,
  destination,
  venueCategory,
  selectedDate,
  selectedTime,
  weatherCondition,
  weatherSummary,
  selectedMoods,
  harmonyScore,
}) => {
  return (
    <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 sm:p-7 shadow-sm space-y-4 relative overflow-hidden">
      {/* Editorial Watermark Accent */}
      <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 rounded-full bg-[var(--gold-primary)]/5 blur-2xl pointer-events-none" />

      {/* Top Meta Ribbons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-card)]/70 pb-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase font-mono font-bold tracking-[0.2em] text-[var(--gold-primary)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)]" />
            Curated Bespoke Look
          </span>
          <span className="text-xs text-[var(--text-muted)] hidden sm:inline">•</span>
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            {occasion} Edition
          </span>
        </div>

        {/* Harmony Score Metric (Transparent & Honest) */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)] block">
              Sartorial Harmony Index
            </span>
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="text-base sm:text-lg font-serif-luxury font-bold text-emerald-600 dark:text-emerald-400">
                {harmonyScore}% Calibrated
              </span>
              <span className="text-[9px] font-mono text-[var(--text-muted)]">
                (Wardrobe DNA)
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[var(--pill-bg)] border border-[var(--border-gold)] flex items-center justify-center text-[var(--gold-primary)] shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <div className="space-y-1.5">
        <h2 className="font-playfair text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--text-heading)] leading-tight tracking-tight">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed max-w-3xl">
          {subtitle}
        </p>
      </div>

      {/* Contextual Pills Row */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
        {/* Occasion Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black text-white dark:bg-white dark:text-black font-semibold shadow-xs">
          <Tag className="w-3 h-3 text-[var(--gold-primary)]" />
          <span>{occasion}</span>
        </div>

        {/* Venue & Setting Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--pill-bg)] border border-[var(--border-card)] text-[var(--text-body)]">
          <MapPin className="w-3 h-3 text-[var(--gold-primary)]" />
          <span className="font-medium truncate max-w-[200px]">{destination || venueCategory}</span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">({venueCategory})</span>
        </div>

        {/* Timing Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--pill-bg)] border border-[var(--border-card)] text-[var(--text-muted)]">
          <Calendar className="w-3 h-3 text-[var(--gold-primary)]" />
          <span>{selectedDate}</span>
          <Clock className="w-3 h-3 text-[var(--gold-primary)] ml-1" />
          <span>{selectedTime}</span>
        </div>

        {/* Style Vibes Pills */}
        {selectedMoods.map((vibe) => (
          <span
            key={vibe}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--pill-bg)] border border-[var(--border-gold)] text-[var(--gold-primary)] font-medium text-[11px]"
          >
            ✦ {vibe}
          </span>
        ))}

        {/* Weather Context Pill */}
        {weatherCondition && weatherCondition !== 'Climate-Agnostic' && (
          <span
            title={weatherSummary}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--pill-bg)] border border-[var(--border-card)] text-[var(--text-muted)] text-[11px]"
          >
            ☁ {weatherCondition} {weatherSummary ? `(${weatherSummary.split('•')[0].trim()})` : ''}
          </span>
        )}
      </div>
    </div>
  );
};
