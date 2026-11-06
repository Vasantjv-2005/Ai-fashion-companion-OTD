import React from 'react';
import { Home, Shirt, Sparkles, Bookmark, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onSelectTab: (tab: any) => void;
  onOpenMenu: () => void;
  isMenuOpen?: boolean;
  closetCount?: number;
  savedCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenMenu,
  isMenuOpen = false,
  closetCount,
  savedCount,
}) => {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-header)]/95 backdrop-blur-xl border-t border-[var(--border-card)] px-2 py-1.5 flex items-center justify-around shadow-lg transition-colors duration-300"
    >
      <button
        type="button"
        onClick={() => onSelectTab('home')}
        aria-current={activeTab === 'home' ? 'page' : undefined}
        aria-label="Home Studio Dashboard"
        className={`flex flex-col items-center justify-center min-h-[44px] min-w-[52px] gap-1 py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
          activeTab === 'home'
            ? 'text-[var(--text-heading)] font-bold'
            : 'text-[var(--text-muted)]'
        }`}
      >
        <Home className="w-4 h-4" />
        <span className="text-[10px]">Home</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('closet')}
        aria-current={activeTab === 'closet' ? 'page' : undefined}
        aria-label={`Digital Closet (${closetCount || 0} items)`}
        className={`flex flex-col items-center justify-center min-h-[44px] min-w-[52px] gap-1 py-1.5 px-2 rounded-xl transition-all relative cursor-pointer ${
          activeTab === 'closet'
            ? 'text-[var(--text-heading)] font-bold'
            : 'text-[var(--text-muted)]'
        }`}
      >
        <Shirt className="w-4 h-4" />
        <span className="text-[10px]">Closet</span>
        {closetCount !== undefined && closetCount > 0 && (
          <span className="absolute top-0.5 right-1.5 w-3.5 h-3.5 rounded-full bg-[var(--gold-primary)] text-black text-[9px] font-bold flex items-center justify-center">
            {closetCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('stylist')}
        aria-current={activeTab === 'stylist' ? 'page' : undefined}
        aria-label="AI Stylist Wizard"
        className={`flex flex-col items-center justify-center min-h-[44px] min-w-[52px] gap-1 py-1 px-2 rounded-xl transition-all cursor-pointer ${
          activeTab === 'stylist'
            ? 'text-[var(--gold-primary)] font-bold'
            : 'text-[var(--gold-primary)]/80'
        }`}
      >
        <div className="w-7 h-7 rounded-full bg-[var(--pill-bg)] border border-[var(--border-gold)] flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
        </div>
        <span className="text-[10px] font-semibold text-[var(--gold-primary)]">Stylist</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('saved')}
        aria-current={activeTab === 'saved' ? 'page' : undefined}
        aria-label={`Saved Looks (${savedCount || 0} looks)`}
        className={`flex flex-col items-center justify-center min-h-[44px] min-w-[52px] gap-1 py-1.5 px-2 rounded-xl transition-all relative cursor-pointer ${
          activeTab === 'saved'
            ? 'text-[var(--text-heading)] font-bold'
            : 'text-[var(--text-muted)]'
        }`}
      >
        <Bookmark className="w-4 h-4" />
        <span className="text-[10px]">Saved</span>
        {savedCount !== undefined && savedCount > 0 && (
          <span className="absolute top-0.5 right-1.5 w-3.5 h-3.5 rounded-full bg-[var(--gold-primary)] text-black text-[9px] font-bold flex items-center justify-center">
            {savedCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={onOpenMenu}
        aria-expanded={isMenuOpen}
        aria-label="Toggle more navigation options"
        className="flex flex-col items-center justify-center min-h-[44px] min-w-[52px] gap-1 py-1.5 px-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-all cursor-pointer"
      >
        <Menu className="w-4 h-4" />
        <span className="text-[10px]">Menu</span>
      </button>
    </nav>
  );
};
