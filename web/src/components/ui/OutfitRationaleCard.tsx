import React from 'react';
import { Sparkles, Compass, UserCheck, Palette, CloudSun, Check, X, Shield } from 'lucide-react';
import type { UserProfile } from '../../context/ClosetContext';

interface OutfitRationaleCardProps {
  occasion: string;
  venueName: string;
  venueCategory: string;
  weatherCondition: string;
  weatherSummary: string;
  isWeatherSkipped: boolean;
  selectedPreferences: string[];
  selectedMoods: string[];
  mustInclude: string[];
  avoidItems: string[];
  profile: UserProfile;
}

export const OutfitRationaleCard: React.FC<OutfitRationaleCardProps> = ({
  occasion,
  venueName,
  venueCategory,
  weatherCondition,
  weatherSummary,
  isWeatherSkipped,
  selectedPreferences,
  selectedMoods,
  mustInclude,
  avoidItems,
  profile,
}) => {
  return (
    <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--pill-bg)] border border-[var(--border-gold)] flex items-center justify-center text-[var(--gold-primary)]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[var(--gold-primary)] block">
              Editorial Dossier
            </span>
            <h3 className="font-playfair text-lg sm:text-xl font-bold text-[var(--text-heading)]">
              Why This Look Works
            </h3>
          </div>
        </div>

        <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--pill-bg)] px-2.5 py-1 rounded-full border border-[var(--border-card)]">
          Context-Calibrated
        </span>
      </div>

      {/* Editorial Dimensions Rows (Clean magazine styling without nested cards) */}
      <div className="divide-y divide-[var(--border-hairline)] text-xs text-[var(--text-body)]">
        
        {/* 1. Occasion & Venue Alignment */}
        <div className="py-3 flex items-start gap-3">
          <div className="w-6 h-6 rounded-lg bg-[var(--pill-bg)] text-[var(--gold-primary)] flex items-center justify-center shrink-0 mt-0.5">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div className="space-y-0.5 min-w-0 flex-1">
            <p className="font-semibold text-[var(--text-heading)]">
              Venue & Dress Code Alignment
            </p>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Curated for <strong>{occasion}</strong> at {venueName || 'your destination'} ({venueCategory} ambience). Balances relaxed elegance with venue expectations.
            </p>
          </div>
        </div>

        {/* 2. Silhouette & Proportions */}
        <div className="py-3 flex items-start gap-3">
          <div className="w-6 h-6 rounded-lg bg-[var(--pill-bg)] text-[var(--gold-primary)] flex items-center justify-center shrink-0 mt-0.5">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          <div className="space-y-0.5 min-w-0 flex-1">
            <p className="font-semibold text-[var(--text-heading)]">
              Silhouette Architecture
            </p>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Cut to flatter {profile.bodyShape || 'athletic'} lines with a {profile.preferredFit || 'tailored'} silhouette, elongating the lower proportions.
            </p>
          </div>
        </div>

        {/* 3. Chromatic Harmony */}
        <div className="py-3 flex items-start gap-3">
          <div className="w-6 h-6 rounded-lg bg-[var(--pill-bg)] text-[var(--gold-primary)] flex items-center justify-center shrink-0 mt-0.5">
            <Palette className="w-3.5 h-3.5" />
          </div>
          <div className="space-y-0.5 min-w-0 flex-1">
            <p className="font-semibold text-[var(--text-heading)]">
              Chromatic Harmony
            </p>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Restrained, high-contrast neutral palette drawn from your preferred tones ({profile.palettePreferences?.slice(0, 2).join(' & ') || 'Ivory & Charcoal'}).
            </p>
          </div>
        </div>

        {/* 4. Climate Comfort */}
        <div className="py-3 flex items-start gap-3">
          <div className="w-6 h-6 rounded-lg bg-[var(--pill-bg)] text-[var(--gold-primary)] flex items-center justify-center shrink-0 mt-0.5">
            <CloudSun className="w-3.5 h-3.5" />
          </div>
          <div className="space-y-0.5 min-w-0 flex-1">
            <p className="font-semibold text-[var(--text-heading)]">
              Climate & Comfort Calibration
            </p>
            <p className="text-[var(--text-muted)] leading-relaxed">
              {isWeatherSkipped
                ? 'Styled with climate-agnostic natural fibers providing effortless breathability throughout the event.'
                : `Optimized for ${weatherCondition} conditions (${weatherSummary.split('•')[0].trim() || '24°C'}). Layer weights align with your comfort preferences (${selectedPreferences.join(', ')}).`}
            </p>
          </div>
        </div>

        {/* 5. Style Vibe Expression (if any) */}
        {selectedMoods.length > 0 && (
          <div className="py-3 flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-[var(--pill-bg)] text-[var(--gold-primary)] flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <p className="font-semibold text-[var(--text-heading)]">
                Vibe Calibration
              </p>
              <p className="text-[var(--text-muted)] leading-relaxed">
                Anchored around your <strong>{selectedMoods.join(' & ')}</strong> mood through disciplined textures and minimalist hardware.
              </p>
            </div>
          </div>
        )}

        {/* 6. Required Pieces Anchored (mustInclude) */}
        {mustInclude.length > 0 && (
          <div className="py-3 flex items-start gap-3 text-emerald-600 dark:text-emerald-400">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                Hero Inclusions Anchored
              </p>
              <p className="text-[var(--text-muted)] leading-relaxed">
                Successfully integrated your mandatory pieces: <strong>{mustInclude.join(', ')}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* 7. Prohibited Items Avoided (avoidItems) */}
        {avoidItems.length > 0 && (
          <div className="py-3 flex items-start gap-3 text-rose-600 dark:text-rose-400">
            <div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <X className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <p className="font-semibold text-rose-700 dark:text-rose-300">
                Constraint Avoidance Respected
              </p>
              <p className="text-[var(--text-muted)] leading-relaxed">
                Strictly excluded <strong>{avoidItems.join(', ')}</strong> from all recommended slots.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Footer Disclaimer */}
      <div className="pt-2 border-t border-[var(--border-card)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
          <span>Curated from your active digital closet & verified context parameters</span>
        </span>
      </div>
    </div>
  );
};
