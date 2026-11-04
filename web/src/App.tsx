import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Outlet, type Location } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ClosetProvider } from './context/ClosetContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { InteractiveStylist } from './components/InteractiveStylist';
import { Pillars } from './components/Pillars';
import { WardrobeStudio } from './components/WardrobeStudio';
import { GapIntelligence } from './components/GapIntelligence';
import { Lookbook } from './components/Lookbook';
import { AppDownload } from './components/AppDownload';
import { Footer } from './components/Footer';
import { ApkModal } from './components/ApkModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AddPieceModal } from './components/AddPieceModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AuthModal } from './components/AuthModal';
import { AppStudio, type StudioTab } from './components/AppStudio';

interface StudioLayoutProps {
  isAddPieceModalOpen: boolean;
  setIsAddPieceModalOpen: (open: boolean) => void;
}

function StudioLayout({
  isAddPieceModalOpen,
  setIsAddPieceModalOpen,
}: StudioLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Derive active Studio tab from current route path
  const isUploadRoute = location.pathname === '/closet/add';
  const path = location.pathname.replace(/^\//, '');
  const activeTab: StudioTab =
    isUploadRoute || path === 'closet' ? 'closet' : (path === 'stylist' || path === 'saved' ? path : 'home');

  const handleTabChange = (tab: StudioTab) => {
    if (tab === 'home' || tab === 'closet' || tab === 'stylist' || tab === 'saved') {
      navigate(`/${tab}`);
    }
  };

  return (
    <>
      <AppStudio
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isUploadRoute={isUploadRoute}
        onNavigateToUpload={() => navigate('/closet/add')}
        onBackFromUpload={() => navigate('/closet')}
        onOpenAddPiece={() => navigate('/closet/add')}
        onOpenProfile={() => navigate('/profile', { state: { backgroundLocation: location } })}
        onBackToLanding={() => navigate('/')}
      />

      <Outlet />

      {/* Global Modals in Studio */}
      <AddPieceModal
        isOpen={isAddPieceModalOpen}
        onClose={() => setIsAddPieceModalOpen(false)}
      />
    </>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isAddPieceModalOpen, setIsAddPieceModalOpen] = useState(false);

  // Modal route identification
  const isLogin = location.pathname === '/login';
  const isRegister = location.pathname === '/register';
  const isOnboarding = location.pathname === '/onboarding';
  const isProfile = location.pathname === '/profile';
  const isModalRoute = isLogin || isRegister || isOnboarding || isProfile;

  // Background location calculation for modal routes:
  // If state?.backgroundLocation exists, use it.
  // Otherwise (direct URL entry, fresh tab, or refresh):
  // - /profile defaults to /home
  // - /login, /register, /onboarding default to /
  const state = location.state as { backgroundLocation?: Location } | null;
  const backgroundLocation =
    state?.backgroundLocation ||
    (isModalRoute
      ? ({
          pathname: isProfile ? '/home' : '/',
          search: '',
          hash: '',
          state: null,
          key: 'modal-default-bg',
        } as Location)
      : undefined);

  // Safe modal closing handler that respects browser history and direct navigation
  const handleCloseModal = (defaultFallback: string = '/') => {
    const hasInternalHistory =
      Boolean(state?.backgroundLocation) && location.key !== 'default';

    if (hasInternalHistory) {
      navigate(-1);
    } else {
      navigate(defaultFallback, { replace: true });
    }
  };

  const handleOpenDownload = () => {
    setIsApkModalOpen(true);
  };

  const handleCloseDownload = () => {
    setIsApkModalOpen(false);
  };

  const handleExploreDemo = () => {
    const el = document.getElementById('atelier');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const landingElement = (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-body)] flex flex-col selection:bg-[var(--gold-primary)]/30 selection:text-[var(--text-heading)] transition-colors duration-300">
      {/* Navigation Header matching Screenshot 1 */}
      <Navbar
        onOpenDownload={handleOpenDownload}
        onExploreDemo={handleExploreDemo}
        onOpenProfile={() =>
          navigate('/profile', { state: { backgroundLocation: location } })
        }
        onOpenAddPiece={() => navigate('/closet/add')}
        onOpenOnboarding={() =>
          navigate('/onboarding', { state: { backgroundLocation: location } })
        }
        onOpenAuth={() =>
          navigate('/login', { state: { backgroundLocation: location } })
        }
        onLaunchStudio={() => navigate('/home')}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero Section matching Screenshot 1 + Context Engine matching Screenshot 2 */}
        <Hero
          onOpenProfile={() =>
            navigate('/profile', { state: { backgroundLocation: location } })
          }
          onOpenOnboarding={() =>
            navigate('/onboarding', { state: { backgroundLocation: location } })
          }
          onExploreDemo={handleExploreDemo}
        />

        {/* Live Interactive Atelier Simulator */}
        <InteractiveStylist />

        {/* 4 Pillars of Wardrobe Intelligence */}
        <Pillars />

        {/* Smart Closet Digital Matrix (Screenshot 2: Screen 11) */}
        <WardrobeStudio
          onOpenAddPiece={() => navigate('/closet/add')}
        />

        {/* Closet Gap Intelligence Graph */}
        <GapIntelligence />

        {/* Haute Editorial Lookbook */}
        <Lookbook />

        {/* Mobile APK Download Section */}
        <AppDownload onOpenModal={handleOpenDownload} />
      </main>

      {/* Luxury Footer */}
      <Footer />

      {/* Direct APK Download Modal */}
      <ApkModal
        isOpen={isApkModalOpen}
        onClose={handleCloseDownload}
      />

      {/* Add Garment / Photo Upload & AI Scan Modal (Screenshot 2: Screen 12) */}
      <AddPieceModal
        isOpen={isAddPieceModalOpen}
        onClose={() => setIsAddPieceModalOpen(false)}
      />
    </div>
  );

  return (
    <>
      <Routes location={backgroundLocation || location}>
        <Route path="/" element={landingElement} />
        <Route
          element={
            <StudioLayout
              isAddPieceModalOpen={isAddPieceModalOpen}
              setIsAddPieceModalOpen={setIsAddPieceModalOpen}
            />
          }
        >
          <Route path="/home" element={null} />
          <Route path="/closet" element={null} />
          <Route path="/closet/add" element={null} />
          <Route path="/stylist" element={null} />
          <Route path="/saved" element={null} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Route-driven Modals (mounted seamlessly over background screen) */}
      {(isLogin || isRegister) && (
        <AuthModal
          isOpen={true}
          initialMode={isRegister ? 'signup' : 'signin'}
          onClose={() => handleCloseModal('/')}
          onSuccess={() => {
            navigate('/home');
          }}
          onModeChange={(newMode) => {
            if (newMode === 'signup' && isLogin) {
              navigate('/register', { replace: true, state: location.state });
            } else if (newMode === 'signin' && isRegister) {
              navigate('/login', { replace: true, state: location.state });
            }
          }}
        />
      )}

      {isOnboarding && (
        <OnboardingModal
          isOpen={true}
          onClose={() => handleCloseModal('/')}
          onComplete={(destination?: string) => {
            navigate(destination === 'home' ? '/home' : '/closet');
          }}
        />
      )}

      {isProfile && (
        <UserProfileModal
          isOpen={true}
          onClose={() =>
            handleCloseModal(
              state?.backgroundLocation?.pathname &&
                state.backgroundLocation.pathname !== '/profile'
                ? state.backgroundLocation.pathname
                : '/home'
            )
          }
        />
      )}
    </>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <ClosetProvider>
        <AppContent />
      </ClosetProvider>
    </ThemeProvider>
  );
}

export default App;
