import React, { useEffect, useRef, useState } from 'react';
import { Bookmark, RotateCcw, MessageSquare, Share2, Edit3, ArrowLeft, Check } from 'lucide-react';

interface OutfitActionToolbarProps {
  isSaved: boolean;
  isGuestPreview?: boolean;
  onSave: () => void;
  onRegenerate: () => void;
  onRefineWithChat: () => void;
  onAdjustPlan: () => void;
  onNewPlan: () => void;
  isRegenerating?: boolean;
  outfitTitle: string;
  occasion: string;
}

export const OutfitActionToolbar: React.FC<OutfitActionToolbarProps> = ({
  isSaved,
  isGuestPreview = false,
  onSave,
  onRegenerate,
  onRefineWithChat,
  onAdjustPlan,
  onNewPlan,
  isRegenerating = false,
  outfitTitle,
  occasion,
}) => {
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const showSavedState = isSaved && !isGuestPreview;

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const showTimedFeedback = (msg: string) => {
    setShareFeedback(msg);
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(() => {
      feedbackTimerRef.current = null;
      setShareFeedback(null);
    }, 3000);
  };

  const handleShare = async () => {
    const shareText = `Check out my curated OTD outfit "${outfitTitle}" for ${occasion}! Powered by OTD Fashion Companion.`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `OTD Look: ${outfitTitle}`,
          text: shareText,
          url: shareUrl,
        });
        showTimedFeedback('Shared successfully');
        return;
      } catch {
        // User cancelled share or share failed; fall back to clipboard
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      showTimedFeedback('Ensemble summary copied to clipboard!');
    } catch {
      showTimedFeedback('Could not copy link to clipboard');
    }
  };

  return (
    <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 sm:p-5 shadow-sm space-y-3">
      {/* Toast Feedback Notification */}
      {shareFeedback && (
        <div className="p-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-semibold text-center flex items-center justify-center gap-1.5 shadow-md animate-fadeIn">
          <Check className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
          <span>{shareFeedback}</span>
        </div>
      )}

      {/* Button Grid / Hierarchy */}
      <div className="space-y-2.5">
        
        {/* ROW 1: PRIMARY ACTIONS (Save Look & Try Another Variation) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Primary Action 1: Save Look */}
          <button
            type="button"
            onClick={onSave}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
              showSavedState
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 ring-2 ring-emerald-500/30'
                : 'bg-black text-white dark:bg-white dark:text-black hover:scale-101 hover:shadow-md'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${showSavedState ? 'fill-current text-white' : 'text-[var(--gold-primary)]'}`} />
            <span>
              {isGuestPreview
                ? 'Sign Up to Save Look'
                : showSavedState
                  ? 'Saved to Favorites'
                  : 'Save This Look'}
            </span>
          </button>

          {/* Primary Action 2: Try Another Variation (Regenerate) */}
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="w-full py-2.5 px-4 rounded-xl border border-[var(--border-gold)] bg-[var(--pill-bg)] text-xs font-bold text-[var(--text-heading)] hover:bg-[var(--gold-primary)]/15 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-[var(--gold-primary)] ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>{isRegenerating ? 'Synthesizing...' : 'Try Another Variation'}</span>
          </button>
        </div>

        {/* ROW 2: SECONDARY ACTIONS (Refine With Stylist, Adjust Plan, Share) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--border-hairline)]">
          <div className="flex flex-wrap items-center gap-2">
            {/* Refine With Stylist */}
            <button
              type="button"
              onClick={onRefineWithChat}
              className="py-1.5 px-3 rounded-lg border border-[var(--border-card)] bg-[var(--bg-card)] text-xs font-medium text-[var(--text-heading)] hover:border-[var(--gold-primary)] hover:bg-[var(--pill-bg)] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
              <span>Refine Look</span>
            </button>

            {/* Adjust Plan */}
            <button
              type="button"
              onClick={onAdjustPlan}
              className="py-1.5 px-3 rounded-lg border border-[var(--border-card)] bg-[var(--bg-card)] text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--pill-bg)] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
              <span>Adjust Plan</span>
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              className="py-1.5 px-3 rounded-lg border border-[var(--border-card)] bg-[var(--bg-card)] text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--pill-bg)] transition-colors cursor-pointer flex items-center gap-1.5"
              title="Share look"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>

          {/* New Plan (Reset) */}
          <button
            type="button"
            onClick={onNewPlan}
            className="py-1 px-2.5 rounded-lg text-[11px] font-medium text-[var(--text-muted)] hover:text-rose-500 transition-colors cursor-pointer flex items-center gap-1 ml-auto"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>New Plan</span>
          </button>
        </div>

      </div>
    </div>
  );
};
