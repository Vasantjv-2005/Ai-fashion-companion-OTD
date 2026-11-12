import React from 'react';
import { useLocation, useNavigate, type Location } from 'react-router-dom';
import {
  Bookmark,
  Camera,
  Lock,
  LogIn,
  Shirt,
  ShoppingBag,
  Sparkles,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import { useFocusTrap } from '../../utils/focusTrap';

export type GuestRestrictedAction =
  | 'upload'
  | 'manage-closet'
  | 'save-outfit'
  | 'personalized-styling'
  | 'wishlist'
  | 'profile';

interface ActionCopyConfig {
  badge: string;
  title: string;
  description: string;
  benefit: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ACTION_COPY: Record<GuestRestrictedAction, ActionCopyConfig> = {
  upload: {
    badge: 'Personal Wardrobe',
    title: 'Create a Free Account to Upload Items',
    description:
      'Guest mode lets you browse sample pieces and looks. Register for free to upload photos and build your own private digital closet.',
    benefit: 'Your personal garments and photos stay private to your account.',
    icon: Camera,
  },
  'manage-closet': {
    badge: 'Closet Management',
    title: 'Sign Up to Edit Your Personal Closet',
    description:
      'Sample wardrobe items are read-only in guest mode. Create a free account to add, edit, archive, or remove your own pieces.',
    benefit: 'Keep your sample preview untouched while managing your real closet.',
    icon: Shirt,
  },
  'save-outfit': {
    badge: 'Saved Looks',
    title: 'Save Outfits to Your Personal Account',
    description:
      'Guest mode includes curated sample looks to explore. Sign up for free to save, favorite, and manage your personal outfits.',
    benefit: 'Access your saved outfits anytime across your sessions.',
    icon: Bookmark,
  },
  'personalized-styling': {
    badge: 'Personalized AI Stylist',
    title: 'Register for Personalized Outfit Curation',
    description:
      'Explore our sample looks anytime in guest mode. Create a free account to generate, swap, and refine outfits tailored to your wardrobe and style profile.',
    benefit: 'Unlock AI styling built around your own pieces and preferences.',
    icon: Sparkles,
  },
  wishlist: {
    badge: 'Personal Wishlist',
    title: 'Sign Up to Save Wishlist Items',
    description:
      'Create a free account to save wardrobe gaps, set planned budgets, and move acquired items directly into your digital closet.',
    benefit: 'Track what is missing versus what you already own.',
    icon: ShoppingBag,
  },
  profile: {
    badge: 'Style DNA Profile',
    title: 'Save Your Personal Style Profile',
    description:
      'You are currently exploring OTD in guest mode. Register or sign in to save your measurements, fit preferences, and styling rules.',
    benefit: 'Your Style DNA calibrates every personalized recommendation.',
    icon: User,
  },
};

export interface GuestRegistrationPromptModalProps {
  isOpen: boolean;
  action: GuestRestrictedAction;
  onClose: () => void;
  redirectTo?: string;
  actionTitle?: string;
}

function resolveSafeRedirect(
  requestedRedirect: string | undefined,
  currentPathname: string,
): string {
  const candidate = requestedRedirect || currentPathname;
  if (
    !candidate.startsWith('/') ||
    candidate === '/login' ||
    candidate === '/register' ||
    candidate === '/onboarding'
  ) {
    return '/home';
  }
  return candidate;
}

function buildSafeBackgroundLocation(location: Location): Location {
  if (location.pathname === '/profile') {
    return {
      ...location,
      pathname: '/home',
      search: '',
      hash: '',
    };
  }
  if (
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/onboarding'
  ) {
    return {
      ...location,
      pathname: '/',
      search: '',
      hash: '',
    };
  }
  return location;
}

export const GuestRegistrationPromptModal: React.FC<
  GuestRegistrationPromptModalProps
> = ({ isOpen, action, onClose, redirectTo, actionTitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const modalRef = useFocusTrap<HTMLDivElement>({ isOpen, onClose });

  if (!isOpen) return null;

  const copy = ACTION_COPY[action];
  const Icon = copy.icon;
  const safeRedirectTo = resolveSafeRedirect(redirectTo, location.pathname);
  const safeBackground = buildSafeBackgroundLocation(location);

  const handleNavigateAuth = (targetPath: '/register' | '/login') => {
    onClose();
    navigate(targetPath, {
      state: {
        backgroundLocation: safeBackground,
        redirectTo: safeRedirectTo,
      },
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-prompt-title"
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md rounded-3xl bg-[var(--bg-card-elevated)] border border-[var(--border-gold)] shadow-2xl p-6 sm:p-7 text-[var(--text-body)] space-y-5 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
          aria-label="Close registration prompt"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-3 pr-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--pill-bg)] border border-[var(--border-gold)] text-[10px] font-mono uppercase tracking-wider font-bold text-[var(--gold-primary)]">
            <Lock className="w-3 h-3" />
            <span>{copy.badge}</span>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-gold)] flex items-center justify-center text-[var(--gold-primary)] shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="guest-prompt-title"
                className="font-playfair text-xl font-bold text-[var(--text-heading)] leading-snug"
              >
                {actionTitle || copy.title}
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-[13px] text-[var(--text-body)] leading-relaxed">
            {copy.description}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-card)] text-xs text-[var(--text-muted)] leading-relaxed">
          <strong className="text-[var(--text-heading)] block mb-0.5">
            Included free with your OTD account
          </strong>
          <span>{copy.benefit}</span>
        </div>

        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={() => handleNavigateAuth('/register')}
            className="w-full py-3 rounded-2xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <UserPlus className="w-4 h-4 text-[var(--gold-primary)]" />
            <span>Create Free Account</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigateAuth('/login')}
            className="w-full py-2.5 rounded-2xl border border-[var(--border-gold)] bg-[var(--pill-bg)] text-[var(--text-heading)] hover:border-[var(--gold-primary)] text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl border border-transparent text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
          >
            Continue Exploring Demo
          </button>
        </div>
      </div>
    </div>
  );
};

