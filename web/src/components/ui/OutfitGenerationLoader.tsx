import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Check, Compass, Layers, ShieldCheck } from 'lucide-react';

interface OutfitGenerationLoaderProps {
  occasion: string;
  venueName: string;
  onComplete?: () => void;
  durationMs?: number;
}

export const OutfitGenerationLoader: React.FC<OutfitGenerationLoaderProps> = ({
  occasion,
  venueName,
  onComplete,
  durationMs = 1400,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const onCompleteRef = useRef(onComplete);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const steps = useMemo(
    () => [
      {
        title: 'Formality & Venue Code Analysis',
        desc: `Evaluating dress expectations for ${occasion} at ${venueName || 'your venue'}...`,
        icon: Compass,
      },
      {
        title: 'Digital Wardrobe Scan',
        desc: 'Retrieving verified garments from your active closet...',
        icon: Layers,
      },
      {
        title: 'Sartorial Silhouette Balancing',
        desc: 'Pairing base layers, tailoring, and footwear for high-contrast harmony...',
        icon: Sparkles,
      },
      {
        title: 'Finalizing Bespoke Recommendation',
        desc: 'Synthesizing editorial rationale and calibration score...',
        icon: ShieldCheck,
      },
    ],
    [occasion, venueName],
  );

  useEffect(() => {
    hasCompletedRef.current = false;
    const stepInterval = durationMs / steps.length;
    const interval = window.setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        window.clearInterval(interval);
        return prev;
      });
    }, stepInterval);

    const timer = window.setTimeout(() => {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onCompleteRef.current?.();
      }
    }, durationMs);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timer);
    };
  }, [durationMs, steps.length]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-8 sm:p-12 shadow-xl max-w-xl mx-auto my-12 text-center space-y-6 relative overflow-hidden animate-fadeIn"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-radial from-[var(--gold-primary)]/10 via-transparent to-transparent pointer-events-none" />

      {/* Stylist Atelier Brand Badge */}
      <div className="w-16 h-16 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-gold)] mx-auto flex items-center justify-center text-[var(--gold-primary)] shadow-sm relative">
        <Sparkles className="w-7 h-7 animate-pulse text-[var(--gold-primary)]" />
        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-black" />
      </div>

      <div className="space-y-1.5">
        <span className="text-[10px] uppercase font-mono font-bold tracking-[0.2em] text-[var(--gold-primary)]">
          OTD Bespoke Atelier
        </span>
        <h3 className="font-playfair text-2xl sm:text-3xl font-bold text-[var(--text-heading)]">
          Synthesizing Your Ensemble
        </h3>
        <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
          Calibrating verified pieces from your wardrobe for {occasion}
        </p>
      </div>

      {/* Progressive Steps Checklist */}
      <div className="space-y-2.5 text-left max-w-md mx-auto pt-2">
        {steps.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const Icon = step.icon;

          return (
            <div
              key={step.title}
              className={`p-3 rounded-2xl border transition-all duration-300 flex items-center gap-3 ${
                isCurrent
                  ? 'border-[var(--gold-primary)] bg-[var(--pill-bg)] ring-1 ring-[var(--gold-primary)]/40 shadow-xs'
                  : isDone
                  ? 'border-emerald-500/30 bg-emerald-500/5 opacity-80'
                  : 'border-[var(--border-card)]/40 bg-transparent opacity-40'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                  isDone
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-black text-white dark:bg-white dark:text-black font-bold'
                    : 'bg-[var(--pill-bg)] text-[var(--text-muted)]'
                }`}
              >
                {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-xs text-[var(--text-heading)] truncate">
                  {step.title}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] truncate">
                  {step.desc}
                </p>
              </div>

              {isCurrent && (
                <div className="w-4 h-4 border-2 border-[var(--gold-primary)] border-t-transparent rounded-full animate-spin shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-2 text-[10px] font-mono text-[var(--text-muted)]">
        Deterministic synthesis from active digital wardrobe • Zero hallucinated items
      </div>
    </div>
  );
};
