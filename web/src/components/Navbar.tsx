import { useEffect, useState } from 'react';
import { Download, Menu, X, Sun, Moon, User, Plus, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';

interface NavbarProps {
  onOpenDownload: () => void;
  onExploreDemo: () => void;
  onOpenProfile?: () => void;
  onOpenAddPiece?: () => void;
  onOpenOnboarding?: () => void;
  onOpenAuth?: () => void;
  onLaunchStudio?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenDownload,
  onExploreDemo,
  onOpenProfile,
  onOpenAddPiece,
  onOpenOnboarding,
  onOpenAuth,
  onLaunchStudio,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, isGuest, user, logout } = useAuth();

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await logout();
    } finally {
      setIsSigningOut(false);
    }
  };

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--bg-header)] border-b border-[var(--border-card)] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 xl:px-8">
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 lg:gap-4 h-20">
          
          {/* Logo with the Official OTD Artwork */}
          <a href="#" className="flex items-center gap-2 sm:gap-2.5 xl:gap-3 shrink-0 group">
            <div className="h-10 w-8 min-[360px]:h-11 min-[360px]:w-9 xl:h-13 xl:w-11 rounded-lg overflow-hidden border border-[var(--border-gold)] shadow-sm bg-[#F7EFE0] flex items-center justify-center p-0.5 group-hover:scale-105 transition-all duration-300">
              <img
                src="/otd_logo.png"
                alt="OTD - Outfit of the Day Haute Couture Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col whitespace-nowrap">
              <div className="flex items-center gap-1 xl:gap-1.5">
                <span className="font-cinzel text-sm min-[360px]:text-base sm:text-lg xl:text-xl tracking-[0.14em] min-[360px]:tracking-[0.18em] xl:tracking-[0.22em] font-bold text-[var(--text-heading)]">
                  OTD
                </span>
                <span className="text-[var(--gold-primary)] text-xs">✦</span>
              </div>
              <span className="text-[8px] min-[360px]:text-[9px] xl:text-[10px] tracking-[0.08em] min-[360px]:tracking-[0.15em] xl:tracking-[0.22em] uppercase text-[var(--gold-primary)] font-mono font-semibold">
                Outfit Of The Day
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links (Matching Screenshot 1) */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center space-x-3.5 xl:space-x-8 text-[11px] xl:text-[12px] font-semibold text-[var(--text-body)]"
          >
            <a
              href="#"
              className="whitespace-nowrap hover:text-black dark:hover:text-white transition-colors py-1 relative font-bold text-[var(--text-heading)]"
            >
              <span>Home</span>
              <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-black dark:bg-white" />
            </a>
            <a
              href="#pillars"
              className="whitespace-nowrap hover:text-black dark:hover:text-white transition-colors py-1 relative group"
            >
              <span>Features</span>
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-black dark:bg-white group-hover:w-full transition-all duration-300" />
            </a>
            <button
              onClick={onExploreDemo}
              className="whitespace-nowrap hover:text-black dark:hover:text-white transition-colors py-1 relative group text-left cursor-pointer"
            >
              <span>How it Works</span>
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-black dark:bg-white group-hover:w-full transition-all duration-300" />
            </button>
            <a
              href="#lookbook"
              className="whitespace-nowrap hover:text-black dark:hover:text-white transition-colors py-1 relative group"
            >
              <span>Community</span>
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-black dark:bg-white group-hover:w-full transition-all duration-300" />
            </a>
            <a
              href="#wardrobe"
              className="whitespace-nowrap hover:text-black dark:hover:text-white transition-colors py-1 relative group"
            >
              <span>About</span>
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-black dark:bg-white group-hover:w-full transition-all duration-300" />
            </a>
          </nav>

          {/* Right Action Buttons + Theme Toggle (Desktop lg+) */}
          <div className="hidden lg:flex items-center gap-1.5 xl:gap-3 shrink-0">
            
            {/* Elegant Light / Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Ivory Light Mode' : 'Switch to Obsidian Dark Mode'}
              aria-label="Toggle theme mode"
              className="p-2 xl:p-2.5 rounded-full border border-[var(--border-gold)] bg-[var(--bg-card)] hover:border-[var(--gold-primary)] text-[var(--gold-primary)] transition-all duration-300 cursor-pointer shadow-sm hover:scale-105"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 transition-transform rotate-0 hover:rotate-90 duration-300 text-[#F7E7A9]" />
              ) : (
                <Moon className="w-4 h-4 transition-transform -rotate-12 hover:rotate-0 duration-300 text-[#A67C1E]" />
              )}
            </button>

            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="whitespace-nowrap text-[10px] xl:text-[11px] uppercase tracking-[0.06em] xl:tracking-[0.16em] text-[var(--gold-primary)] hover:text-[var(--text-heading)] px-2.5 py-1.5 xl:px-3.5 xl:py-2 rounded-full border border-[var(--border-gold)] hover:bg-[var(--pill-bg)] transition-all duration-200 cursor-pointer flex items-center gap-1 xl:gap-1.5"
                title="Calibrate My Style Profile"
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span>My Style</span>
              </button>
            )}

            {onOpenAddPiece && (
              <button
                onClick={onOpenAddPiece}
                className="whitespace-nowrap text-[10px] xl:text-[11px] uppercase tracking-[0.06em] xl:tracking-[0.16em] text-[var(--gold-primary)] hover:text-[var(--text-heading)] px-2.5 py-1.5 xl:px-3.5 xl:py-2 rounded-full border border-[var(--border-gold)] hover:bg-[var(--pill-bg)] transition-all duration-200 cursor-pointer flex items-center gap-1 xl:gap-1.5"
                title="Upload Garment to Digital Closet"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>+ Piece</span>
              </button>
            )}

            {onLaunchStudio && (
              <button
                onClick={onLaunchStudio}
                className="whitespace-nowrap text-[10px] xl:text-[11px] uppercase tracking-[0.06em] xl:tracking-[0.16em] text-[var(--gold-primary)] hover:text-[var(--text-heading)] px-2.5 py-1.5 xl:px-3.5 xl:py-2 rounded-full border border-[var(--border-gold)] hover:bg-[var(--pill-bg)] transition-all duration-200 cursor-pointer flex items-center gap-1 xl:gap-1.5 shadow-sm"
                title={
                  isAuthenticated && user
                    ? `Open Web Studio (${user.name})`
                    : isGuest
                      ? 'Open Web Studio (Guest Demo Active)'
                      : 'Open Web Studio & AI Stylist'
                }
              >
                <span>✦ Web Studio</span>
              </button>
            )}

            {/* Auth Action: Sign In or Signed-In Sign Out */}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="whitespace-nowrap px-3 py-1.5 xl:px-4 xl:py-2.5 rounded-full border border-[var(--border-gold)] bg-[var(--bg-card)] hover:border-rose-400 hover:text-rose-600 text-[var(--text-heading)] text-[11px] xl:text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                title={user ? `Signed in as ${user.email}` : 'Sign out'}
                aria-label="Sign out of OTD"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span>
              </button>
            ) : (
              (onOpenAuth || onOpenOnboarding) && (
                <button
                  onClick={onOpenAuth || onOpenOnboarding}
                  className="whitespace-nowrap px-3.5 py-1.5 xl:px-5 xl:py-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-[11px] xl:text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 flex items-center gap-1 xl:gap-1.5 cursor-pointer shadow-md hover:scale-105 transition-all"
                >
                  <span>Sign In</span>
                  <span className="text-sm">→</span>
                </button>
              )
            )}

            <button
              type="button"
              onClick={onOpenDownload}
              aria-label="Open Android Companion App info"
              className="gold-btn whitespace-nowrap px-3 py-1.5 xl:px-4 xl:py-2.5 rounded-full text-[10px] xl:text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>App Beta</span>
            </button>
          </div>

          {/* Mobile & Tablet (<1024px) hamburger & Theme button */}
          <div className="lg:hidden flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-full border border-[var(--border-gold)] text-[var(--gold-primary)] bg-[var(--bg-card)] cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[#F7E7A9]" /> : <Moon className="w-4 h-4 text-[#A67C1E]" />}
            </button>
            <button
              type="button"
              onClick={onOpenDownload}
              aria-label="Open Android Companion App info"
              className="gold-btn px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] font-semibold flex items-center gap-1 sm:gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3 h-3 shrink-0" />
              <span>App Beta</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[var(--gold-primary)] hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile & Tablet Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          className="lg:hidden bg-[var(--bg-card-elevated)] border-b border-[var(--border-gold)] px-6 py-6 space-y-4 backdrop-blur-2xl animate-in slide-in-from-top-2 duration-200"
        >
          <a
            href="#atelier"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs tracking-[0.18em] uppercase text-[var(--text-body)] hover:text-[var(--gold-primary)] py-1 font-medium"
          >
            Atelier Simulation
          </a>
          <a
            href="#pillars"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs tracking-[0.18em] uppercase text-[var(--text-body)] hover:text-[var(--gold-primary)] py-1 font-medium"
          >
            Core Intelligence
          </a>
          <a
            href="#wardrobe"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs tracking-[0.18em] uppercase text-[var(--text-body)] hover:text-[var(--gold-primary)] py-1 font-medium"
          >
            Smart Closet Matrix
          </a>
          <a
            href="#gap-analysis"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs tracking-[0.18em] uppercase text-[var(--text-body)] hover:text-[var(--gold-primary)] py-1 font-medium"
          >
            Wardrobe Gaps
          </a>
          <a
            href="#lookbook"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs tracking-[0.18em] uppercase text-[var(--text-body)] hover:text-[var(--gold-primary)] py-1 font-medium"
          >
            Haute Lookbook
          </a>

          {onOpenProfile && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenProfile();
              }}
              className="w-full text-left flex items-center gap-2 text-xs tracking-[0.18em] uppercase text-[var(--gold-primary)] py-1 font-semibold"
            >
              <User className="w-4 h-4" />
              <span>Calibrate Style DNA Profile</span>
            </button>
          )}

          {onOpenAddPiece && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAddPiece();
              }}
              className="w-full text-left flex items-center gap-2 text-xs tracking-[0.18em] uppercase text-[var(--gold-primary)] py-1 font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Garment (+ Piece)</span>
            </button>
          )}
          <div className="pt-3 border-t border-[var(--border-card)] space-y-2.5">
            {isAuthenticated && user && (
              <div className="px-3.5 py-2 rounded-xl bg-[var(--pill-bg)] border border-[var(--border-gold)] text-xs flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--text-heading)] truncate">{user.name}</p>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">{user.email}</p>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold shrink-0 ml-2">
                  Signed In
                </span>
              </div>
            )}

            {onLaunchStudio && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLaunchStudio();
                }}
                className="w-full py-2.5 rounded-full border border-[var(--border-gold)] bg-[var(--bg-card)] text-[var(--gold-primary)] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>✦ {isAuthenticated ? 'Open Web Studio' : 'Web Studio'}</span>
              </button>
            )}

            {isAuthenticated ? (
              <button
                type="button"
                disabled={isSigningOut}
                onClick={async () => {
                  setMobileMenuOpen(false);
                  await handleSignOut();
                }}
                className="w-full py-3 rounded-full border border-rose-300 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span>
              </button>
            ) : (
              (onOpenAuth || onOpenOnboarding) && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onOpenAuth) onOpenAuth();
                    else if (onOpenOnboarding) onOpenOnboarding();
                  }}
                  className="w-full py-3 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <span>Sign In to OTD</span>
                  <span className="text-sm">→</span>
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDownload();
              }}
              className="gold-btn w-full py-3 rounded-full text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Android App (Coming Soon)</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
