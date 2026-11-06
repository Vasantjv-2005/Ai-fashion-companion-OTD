import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Shirt, Sparkles, ArrowLeft } from 'lucide-react';

export const NotFoundView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-body)] flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-300">
      <div className="w-full max-w-lg rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-2xl p-8 sm:p-10 text-center relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--gold-primary)]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Compass / Haute Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-gold)] flex items-center justify-center text-[var(--gold-primary)] mb-6 shadow-sm">
          <Compass className="w-8 h-8" />
        </div>

        {/* Heading */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)]" />
            <span className="text-[10px] uppercase font-mono font-bold tracking-[0.22em] text-[var(--gold-primary)]">
              404 — Atelier Navigation
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)]" />
          </div>
          <h1 className="font-playfair text-3xl sm:text-4xl font-bold text-[var(--text-heading)] leading-tight">
            Destination Not Found
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
            The requested styling corridor, runway piece, or route is currently uncataloged in this atelier collection.
          </p>
        </div>

        {/* Quick Nav Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full gold-btn font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-105 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Web Studio</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/closet')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[var(--border-gold)] hover:bg-[var(--pill-bg)] text-[var(--text-heading)] font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Shirt className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
            <span>Digital Closet</span>
          </button>
        </div>

        {/* Back Link */}
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/');
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--gold-primary)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to previous screen or Landing</span>
        </button>
      </div>
    </div>
  );
};
