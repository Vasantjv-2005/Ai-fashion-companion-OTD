import React, { useEffect, useRef, useState } from 'react';
import { X, Copy, Check, Smartphone, Clock, Sparkles } from 'lucide-react';
import { useFocusTrap } from '../utils/focusTrap';

interface ApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkModal: React.FC<ApkModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  // Focus trap, restoration & Escape key dismiss
  const modalRef = useFocusTrap<HTMLDivElement>({ isOpen, onClose });

  if (!isOpen) return null;

  const webStudioUrl = window.location.origin;

  const handleCopy = () => {
    navigator.clipboard.writeText(webStudioUrl);
    setCopied(true);
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => {
      copyTimerRef.current = null;
      setCopied(false);
    }, 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="apk-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto glass-card rounded-3xl p-6 sm:p-8 border border-[var(--border-gold)] shadow-2xl bg-[var(--bg-card-elevated)] text-[var(--text-body)]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-10 rounded-lg overflow-hidden border border-[var(--border-gold)] bg-[#F7EFE0] p-0.5 shadow-sm shrink-0">
            <img src="/otd_logo.png" alt="OTD" className="w-full h-full object-contain" />
          </div>
          <div>
            <h3 id="apk-modal-title" className="font-serif-luxury text-2xl font-bold text-[var(--text-heading)]">
              OTD Android Companion
            </h3>
            <p className="text-xs text-[var(--gold-primary)] font-semibold font-mono">
              Early Beta · Coming Soon
            </p>
          </div>

        </div>

        {/* Honest Status Summary */}
        <div className="grid grid-cols-2 gap-3 mb-6 bg-[var(--bg-card-inner)] p-3.5 rounded-2xl border border-[var(--border-card)] text-xs">
          <div>
            <span className="text-[var(--text-muted)] block text-[10px] uppercase font-medium">Platform</span>
            <span className="text-[var(--text-heading)] font-bold flex items-center gap-1 mt-0.5">
              <Smartphone className="w-3.5 h-3.5 text-[var(--gold-primary)]" /> Android Native
            </span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] block text-[10px] uppercase font-medium">Build Status</span>
            <span className="font-mono text-[var(--gold-primary)] font-bold flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5" /> Coming Soon
            </span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] block text-[10px] uppercase font-medium">Target Support</span>
            <span className="text-[var(--text-heading)] font-semibold">Android 8.0+</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] block text-[10px] uppercase font-medium">Available Today</span>
            <span className="text-[#10B981] flex items-center gap-1 font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Web Atelier Live
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              document.getElementById('context-studio')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="gold-btn w-full py-4 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer text-center shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>Continue on Web Atelier Now</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="gold-btn-outline w-full py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Web Studio URL Copied!' : 'Copy Web Studio Link'}</span>
          </button>
        </div>

        {/* Honest Pre-Release Notice */}
        <div className="mt-5 p-3 rounded-xl bg-[var(--bg-card-inner)] border border-[var(--border-card)] text-[11px] text-[var(--text-body)] leading-relaxed">
          <strong className="text-[var(--gold-primary)]">Pre-Release Note:</strong> Signed APK builds are not yet published for direct download. You can use all wardrobe, styling, and outfit features directly in the browser while mobile packaging completes.
        </div>

      </div>
    </div>
  );
};
