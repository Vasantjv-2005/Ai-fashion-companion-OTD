import React from 'react';
import { ArrowUp } from 'lucide-react';

export interface FooterProps {
  onPrivacyClick?: () => void;
  onTermsClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onPrivacyClick,
  onTermsClick,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      className="bg-[var(--bg-canvas)] border-t border-[var(--border-hairline)] pt-16 pb-12 text-[var(--text-body)] transition-colors duration-300"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 3-Column Architectural Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14 pb-14 border-b border-[var(--border-hairline)]">
          
          {/* Column 1 — Brand Identity (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                scrollToTop();
              }}
              className="inline-flex items-center gap-3 group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)]"
              aria-label="OTD - Outfit Of The Day Home"
            >
              <div className="h-10 w-9 rounded-lg overflow-hidden border border-[var(--border-gold)] bg-[#FAF5EC] p-0.5 shadow-2xs group-hover:scale-105 transition-transform duration-300">
                <img
                  src="/otd_logo.png"
                  alt="OTD Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-cinzel text-base tracking-[0.24em] text-[var(--text-heading)] font-bold">
                  OTD
                </span>
                <span className="text-[9px] tracking-[0.22em] uppercase text-[var(--gold-primary)] font-mono font-semibold">
                  OUTFIT OF THE DAY
                </span>
              </div>
            </a>

            <p className="text-xs text-[var(--text-muted)] max-w-sm leading-relaxed font-light">
              Your personal AI fashion companion. Digitizing what you own, understanding where you go, and curating your wardrobe for every moment.
            </p>

            <div className="pt-2 text-[10px] font-mono tracking-widest uppercase text-[var(--gold-primary)]">
              YOUR STYLE. EVERY PLACE.
            </div>
          </div>

          {/* Column 2 — Explore OTD Navigation (3 cols) */}
          <div className="md:col-span-3 space-y-4">
            <h3 className="text-xs uppercase font-mono tracking-[0.2em] font-semibold text-[var(--text-heading)]">
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
                    className="hover:text-[var(--gold-primary)] transition-colors duration-200"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="#atelier"
                    className="hover:text-[var(--gold-primary)] transition-colors duration-200"
                  >
                    AI Atelier Simulator
                  </a>
                </li>
                <li>
                  <a
                    href="#pillars"
                    className="hover:text-[var(--gold-primary)] transition-colors duration-200"
                  >
                    Four Core Pillars
                  </a>
                </li>
                <li>
                  <a
                    href="#wardrobe"
                    className="hover:text-[var(--gold-primary)] transition-colors duration-200"
                  >
                    Digital Closet Matrix
                  </a>
                </li>
                <li>
                  <a
                    href="#lookbook"
                    className="hover:text-[var(--gold-primary)] transition-colors duration-200"
                  >
                    Curated Lookbook
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          {/* Column 3 — Help & Information (4 cols) */}
          <div className="md:col-span-4 space-y-4">
            <h3 className="text-xs uppercase font-mono tracking-[0.2em] font-semibold text-[var(--text-heading)]">
              Information & Protocol
            </h3>
            <nav aria-label="Help and information navigation">
              <ul className="space-y-2.5 text-xs">
                <li>
                  <a
                    href="#pillars"
                    className="hover:text-[var(--gold-primary)] transition-colors duration-200"
                  >
                    About The System
                  </a>
                </li>
                <li>
                  <a
                    href="#download"
                    className="hover:text-[var(--gold-primary)] transition-colors duration-200"
                  >
                    Mobile Companion
                  </a>
                </li>
                <li>
                  <a
                    href="#privacy"
                    onClick={onPrivacyClick ? (e) => { e.preventDefault(); onPrivacyClick(); } : undefined}
                    className="hover:text-[var(--gold-primary)] transition-colors duration-200"
                  >
                    Privacy Architecture
                  </a>
                </li>
                <li>
                  <a
                    href="#terms"
                    onClick={onTermsClick ? (e) => { e.preventDefault(); onTermsClick(); } : undefined}
                    className="hover:text-[var(--gold-primary)] transition-colors duration-200"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </nav>
          </div>

        </div>

        {/* Bottom Metadata Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <p className="text-xs text-[var(--text-muted)] text-center sm:text-left font-light">
            © 2026 OTD (Outfit Of The Day). Engineered for Sartorial Distinction.
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            className="group inline-flex items-center gap-1.5 text-xs text-[var(--text-body)] hover:text-[var(--gold-primary)] transition-colors duration-200 cursor-pointer rounded-lg px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)]"
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
