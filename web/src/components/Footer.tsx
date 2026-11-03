import React from 'react';
import { ArrowUp } from 'lucide-react';

export interface FooterProps {
  onAboutClick?: () => void;
  onContactClick?: () => void;
  onPrivacyClick?: () => void;
  onTermsClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onAboutClick,
  onContactClick,
  onPrivacyClick,
  onTermsClick,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      className="bg-[var(--bg-canvas-subtle)] border-t border-[var(--border-card)] pt-16 pb-12 text-[var(--text-body)] transition-colors duration-300"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 3-Column Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-[var(--border-card)]">
          {/* Column 1 — OTD Brand (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                scrollToTop();
              }}
              className="inline-flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--gold-primary)] rounded-md"
              aria-label="OTD - Outfit Of The Day Home"
            >
              <div className="h-10 w-9 rounded-md overflow-hidden border border-[var(--border-gold)] bg-[#F7EFE0] p-0.5 shadow-sm group-hover:scale-105 transition-transform duration-300">
                <img
                  src="/otd_logo.png"
                  alt="OTD Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-cinzel text-base tracking-[0.22em] text-[var(--text-heading)] font-bold">
                  OTD
                </span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--gold-primary)] font-mono font-semibold">
                  OUTFIT OF THE DAY
                </span>
              </div>
            </a>

            <p className="text-xs text-[var(--text-muted)] max-w-sm leading-relaxed">
              Your personal AI fashion companion. Discover your style, explore outfit ideas, and make every day a little more fashionable.
            </p>
          </div>

          {/* Column 2 — Explore OTD (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-[var(--text-heading)]">
              Explore OTD
            </h3>
            <nav aria-label="Explore OTD navigation">
              <ul className="space-y-2.5 text-xs">
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToTop();
                    }}
                    className="hover:text-[var(--gold-primary)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--gold-primary)] rounded-sm"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="#atelier"
                    className="hover:text-[var(--gold-primary)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--gold-primary)] rounded-sm"
                  >
                    AI Outfit Recommendations
                  </a>
                </li>
                <li>
                  <a
                    href="#wardrobe"
                    className="hover:text-[var(--gold-primary)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--gold-primary)] rounded-sm"
                  >
                    My Wardrobe
                  </a>
                </li>
                <li>
                  <a
                    href="#lookbook"
                    className="hover:text-[var(--gold-primary)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--gold-primary)] rounded-sm"
                  >
                    Style Discovery
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          {/* Column 3 — Help & Information (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-[var(--text-heading)]">
              Help & Information
            </h3>
            <nav aria-label="Help and information navigation">
              <ul className="space-y-2.5 text-xs">
                <li>
                  <a
                    href="#pillars"
                    onClick={onAboutClick ? (e) => { e.preventDefault(); onAboutClick(); } : undefined}
                    className="hover:text-[var(--gold-primary)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--gold-primary)] rounded-sm"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    onClick={onContactClick ? (e) => { e.preventDefault(); onContactClick(); } : undefined}
                    className="hover:text-[var(--gold-primary)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--gold-primary)] rounded-sm"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="#privacy"
                    onClick={onPrivacyClick ? (e) => { e.preventDefault(); onPrivacyClick(); } : undefined}
                    className="hover:text-[var(--gold-primary)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--gold-primary)] rounded-sm"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#terms"
                    onClick={onTermsClick ? (e) => { e.preventDefault(); onTermsClick(); } : undefined}
                    className="hover:text-[var(--gold-primary)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--gold-primary)] rounded-sm"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <p className="text-xs text-[var(--text-muted)] text-center sm:text-left">
            © 2026 OTD (Outfit Of The Day). All rights reserved.
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            className="group inline-flex items-center gap-1.5 text-xs text-[var(--text-body)] hover:text-[var(--gold-primary)] transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--gold-primary)] rounded px-2 py-1"
            aria-label="Back to top of page"
          >
            <span>Back to Top</span>
            <ArrowUp className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-y-0.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
};
