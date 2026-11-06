import React from 'react';
import { X, Shield, FileText, AlertCircle, Check } from 'lucide-react';
import { useFocusTrap } from '../../utils/focusTrap';

export interface LegalModalProps {
  isOpen: boolean;
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, type, onClose }) => {
  // Focus trap, restoration & Escape key dismiss
  const modalRef = useFocusTrap<HTMLDivElement>({ isOpen: Boolean(isOpen && type), onClose });

  if (!isOpen || !type) return null;

  const isPrivacy = type === 'privacy';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[85vh] rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-2xl p-6 sm:p-8 text-[var(--text-body)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-card)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-gold)] flex items-center justify-center text-[var(--gold-primary)] shrink-0">
              {isPrivacy ? <Shield className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h3
                id="legal-modal-title"
                className="font-playfair text-xl sm:text-2xl font-bold text-[var(--text-heading)]"
              >
                {isPrivacy ? 'Privacy Architecture & Data Practices' : 'Terms of Service & Usage Framework'}
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                OTD AI Fashion Companion · Alpha Prototype
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--pill-bg)] text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Pending-Approval Disclaimer */}
        <div className="my-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs shrink-0 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <strong className="font-semibold block">Notice: Official Policy Copy Pending Legal Review</strong>
            <span>
              The following terms describe the operational privacy and technical architecture of this alpha preview application. Formal regulatory disclosures and comprehensive terms of service are currently undergoing legal review prior to commercial release.
            </span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto pr-2 space-y-4 text-xs leading-relaxed text-[var(--text-body)] flex-1">
          {isPrivacy ? (
            <>
              <section className="space-y-1.5">
                <h4 className="font-semibold text-sm text-[var(--text-heading)] flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>1. Local-First Client Architecture</span>
                </h4>
                <p>
                  Your personal wardrobe photographs, custom clothing items, measurements, biometric profiles, and shopping lists are stored within your browser&apos;s local storage mechanisms (HTML5 <code className="font-mono bg-[var(--pill-bg)] px-1 py-0.5 rounded">localStorage</code> and native <code className="font-mono bg-[var(--pill-bg)] px-1 py-0.5 rounded">IndexedDB</code>). Personal wardrobe items and uploaded photos are not synchronized to remote cloud databases in this client preview. Editorial stock images for default sample garments are retrieved over HTTPS from public content delivery networks (Unsplash).
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-semibold text-sm text-[var(--text-heading)] flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>2. Zero Cross-Site Ad Tracking & Network Boundaries</span>
                </h4>
                <p>
                  OTD is built without third-party tracking networks, advertising pixels, or analytics trackers. Wardrobe synthesis and styling recommendation algorithms run entirely client-side in your browser session. Network communication is strictly confined to fetching public editorial specimen imagery (via HTTPS) and sending authentication credentials directly to your local/configured authentication endpoint when signing in or registering.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-semibold text-sm text-[var(--text-heading)] flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>3. Complete User Erasure & Control</span>
                </h4>
                <p>
                  You retain complete sovereignty over your data. You may purge all locally stored wardrobe garments, saved looks, shopping items, drafts, and custom profile measurements at any time via Studio Settings &gt; Reset Cache. Reset Cache removes all client-side wardrobe state while preserving your selected visual theme (Light / Dark mode).
                </p>
              </section>
            </>
          ) : (
            <>
              <section className="space-y-1.5">
                <h4 className="font-semibold text-sm text-[var(--text-heading)] flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>1. Alpha Prototype Scope & Exploration</span>
                </h4>
                <p>
                  OTD (Outfit of the Day) is provided as an interactive software preview. Stylist recommendations, synergy scores, and weather adaptations are algorithmic suggestions intended to assist personal styling and wardrobe organization.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-semibold text-sm text-[var(--text-heading)] flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>2. Independent Consumer Decisions</span>
                </h4>
                <p>
                  Wardrobe-aware shopping lists and affiliate product suggestions are informational references. OTD does not directly sell third-party apparel and is not liable for merchant inventory, fulfillment, or fabric discrepancies.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-semibold text-sm text-[var(--text-heading)] flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>3. Intellectual Property</span>
                </h4>
                <p>
                  All visual branding, design systems, curated venue matrices, synthesis algorithms, and editorial iconography are proprietary assets of OTD.
                </p>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[var(--border-card)] flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-md"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
