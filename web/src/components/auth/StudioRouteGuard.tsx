import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, RefreshCw, ShieldCheck, Sparkles, UserPlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface StudioRouteGuardProps {
  children?: React.ReactNode;
}

export const StudioRouteGuard: React.FC<StudioRouteGuardProps> = ({ children }) => {
  const { status, canAccessStudio, enterGuestMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (status === 'initializing') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-body)] flex flex-col items-center justify-center p-6 transition-colors duration-300"
      >
        <div className="w-full max-w-md rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-xl p-8 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#FAF5ED] border border-[var(--border-gold)] p-2 flex items-center justify-center shadow-sm">
            <img
              src="/otd_logo.png"
              alt="OTD"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-[var(--gold-primary)] font-bold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Verifying Atelier Session</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Checking your active credentials before opening the studio.
          </p>
        </div>
      </div>
    );
  }

  if (canAccessStudio) {
    return <>{children}</>;
  }

  const requestedDestination = `${location.pathname}${location.search}${location.hash}`;
  const backgroundForAuth =
    location.pathname === '/profile'
      ? { pathname: '/', search: '', hash: '', state: null, key: 'profile-auth-bg' }
      : location;

  const handleOpenAuth = (path: '/login' | '/register') => {
    navigate(path, {
      state: {
        backgroundLocation: backgroundForAuth,
        redirectTo: requestedDestination,
      },
    });
  };

  return (
    <main className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-body)] flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-300">
      <section
        aria-labelledby="studio-access-gate-title"
        className="w-full max-w-lg rounded-[32px] bg-[var(--bg-card)] border border-[var(--border-gold)] shadow-2xl p-6 sm:p-9 space-y-6 relative overflow-hidden"
      >
        {/* Top Brand Row */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF5ED] border border-[var(--border-gold)] p-2 flex items-center justify-center shadow-sm">
            <img
              src="/otd_logo.png"
              alt="OTD - Outfit of the Day"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--pill-bg)] border border-[var(--border-gold)] text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-[var(--gold-primary)]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Protected Studio Workspace</span>
          </div>

          <h1
            id="studio-access-gate-title"
            className="font-playfair text-2xl sm:text-3xl font-bold text-[var(--text-heading)] leading-tight"
          >
            Sign In to Your OTD Atelier
          </h1>

          <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md leading-relaxed">
            Sign in or create an account to access your personalized wardrobe workspace, or enter{' '}
            <strong className="text-[var(--text-heading)]">Guest Demo Mode</strong> to explore locally using curated sample garments.
          </p>
        </div>

        {/* Auth Actions */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleOpenAuth('/login')}
            className="w-full min-h-[46px] py-3 px-5 rounded-2xl bg-black text-white dark:bg-white dark:text-black text-xs sm:text-sm font-bold hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
          >
            <span>Sign In with Email</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenAuth('/register')}
            className="w-full min-h-[44px] py-2.5 px-5 rounded-2xl border border-[var(--border-gold)] bg-[var(--pill-bg)] hover:bg-[var(--bg-card-inner)] text-[var(--text-heading)] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <UserPlus className="w-4 h-4 text-[var(--gold-primary)]" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center py-1">
          <div className="border-t border-[var(--border-card)] w-full" />
          <span className="bg-[var(--bg-card)] px-3 text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
            or preview locally
          </span>
        </div>

        {/* Explicit Guest Demo Entry */}
        <div className="rounded-2xl bg-[var(--bg-card-inner)] border border-[var(--border-card)] p-4 space-y-3">
          <div className="space-y-1">
            <h2 className="text-xs font-bold text-[var(--text-heading)] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
              <span>Guest Demo Mode</span>
            </h2>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Explore the Digital Closet, AI Stylist simulator, and saved looks locally in your browser. Protected backend API requests remain disabled while in guest mode.
            </p>
          </div>

          <button
            type="button"
            onClick={enterGuestMode}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-[var(--border-gold)] bg-[var(--bg-card)] hover:border-[var(--gold-primary)] text-[var(--gold-primary)] hover:text-[var(--text-heading)] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span>Explore Web Studio (Continue as Guest)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Back to Landing */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors cursor-pointer py-1 px-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Landing Page</span>
          </button>
        </div>
      </section>
    </main>
  );
};
