import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, ArrowRight, Send, Bookmark, RefreshCw, Sun } from 'lucide-react';
import { useCloset } from '../context/ClosetContext';
import { useAuth } from '../hooks/useAuth';
import { resolveWorkspaceScope } from '../utils/authStorage';
import {
  buildSavedLookFromEnsemble,
  findDuplicateSavedLook,
  loadStoredSavedLooks,
  persistSavedLooks,
} from '../utils/savedLooksStorage';
import type { OutfitSlotItem } from './ui/AvatarOutfitCanvas';
import {
  GuestRegistrationPromptModal,
  type GuestRestrictedAction,
} from './auth/GuestRegistrationPromptModal';

interface HeroProps {
  onOpenProfile: () => void;
  onOpenOnboarding: () => void;
  onExploreDemo?: () => void;
}

const DEFAULT_HERO_PROMPT = 'Rooftop restaurant tonight for a date';

interface EditorialProcessStep {
  readonly step: string;
  readonly tag: string;
  readonly title: string;
  readonly description: string;
  readonly imageUrl: string;
  readonly imageAlt: string;
  readonly isFinal?: boolean;
}

const HOW_IT_WORKS_STEPS: readonly EditorialProcessStep[] = [
  {
    step: '01',
    tag: 'Digitize',
    title: 'Upload Your Closet',
    description:
      'Capture or import pieces you already own in seconds to build a searchable digital wardrobe.',
    imageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=500&q=80',
    imageAlt: 'Upload Closet',
  },
  {
    step: '02',
    tag: 'Context',
    title: "Tell OTD Where You're Going",
    description:
      'Dial in your venue, dress code, mood, and live climate so every ensemble fits the moment.',
    imageUrl: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=500&q=80',
    imageAlt: 'Where are you going',
  },
  {
    step: '03',
    tag: 'Curate',
    title: 'Get Personalized Outfits',
    description:
      'Receive five-slot looks styled directly around your silhouette, palette, and real garments.',
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=500&q=80',
    imageAlt: 'Personalized Outfits',
  },
  {
    step: '04',
    tag: 'Step Out',
    title: 'Feel Confident Everywhere',
    description:
      'Swap any layer on cue, save favorite pairings, and walk into every room composed.',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80',
    imageAlt: 'Feel Confident',
    isFinal: true,
  },
];

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function inferPromptOverrides(text: string): { venue?: string; occasion?: string } {
  const lower = text.trim().toLowerCase();
  if (!lower || lower === DEFAULT_HERO_PROMPT.toLowerCase()) {
    return {};
  }
  if (lower.includes('boardroom') || lower.includes('office') || lower.includes('pitch') || lower.includes('work') || lower.includes('meeting')) {
    return { venue: 'Executive Boardroom', occasion: 'Office / Work' };
  }
  if (lower.includes('party') || lower.includes('cocktail') || lower.includes('celebration') || lower.includes('club')) {
    return { venue: 'Cocktails & Social', occasion: 'Party / Celebration' };
  }
  if (lower.includes('travel') || lower.includes('airport') || lower.includes('flight') || lower.includes('weekend')) {
    return { venue: 'Casual Cafe & Walk', occasion: 'Travel / Weekend' };
  }
  if (lower.includes('gallery') || lower.includes('museum') || lower.includes('exhibition')) {
    return { venue: 'Art Gallery Vernissage', occasion: 'Casual Day' };
  }
  if (lower.includes('brunch') || lower.includes('coffee') || lower.includes('casual')) {
    return { venue: 'Casual Cafe & Walk', occasion: 'Casual Day' };
  }
  if (lower.includes('fine dining') || lower.includes('bistro') || lower.includes('dinner')) {
    return { venue: 'Fine Dining Bistro', occasion: 'Date Night' };
  }
  if (lower.includes('date') || lower.includes('rooftop')) {
    return { venue: 'Rooftop Cafe, Hyderabad', occasion: 'Date Night' };
  }
  return { venue: text.trim().slice(0, 60) };
}

export const Hero: React.FC<HeroProps> = ({ onOpenProfile, onOpenOnboarding, onExploreDemo }) => {
  const { isAuthenticated, user, status } = useAuth();
  const { currentOutfit, closet, generateOutfit, modifyOutfit, isGenerating, profile } = useCloset();
  const workspaceScope = useMemo(
    () => resolveWorkspaceScope(status, user?.id),
    [status, user?.id],
  );
  
  // Context Form State
  const [promptText, setPromptText] = useState(DEFAULT_HERO_PROMPT);
  const [venue, setVenue] = useState('Rooftop Cafe, Hyderabad');
  const [occasion, setOccasion] = useState('Date Night');
  const [vibe, setVibe] = useState('Elegant + Attractive');
  const [weather, setWeather] = useState('Tonight · 21°C Mild Autumn');
  
  // Chat Modification Input
  const [chatInput, setChatInput] = useState('');
  const [savedOutfitIds, setSavedOutfitIds] = useState<Record<string, boolean>>({});
  const [guestPromptState, setGuestPromptState] = useState<{
    action: GuestRestrictedAction;
    actionTitle?: string;
  } | null>(null);
  const [stepsRevealed, setStepsRevealed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return !('IntersectionObserver' in window) || prefersReducedMotion();
  });
  const scrollTimerRef = useRef<number | null>(null);
  const stepsSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (scrollTimerRef.current !== null) {
        window.clearTimeout(scrollTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (stepsRevealed) return;
    const node = stepsSectionRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const revealIfInView = (): boolean => {
      const rect = node.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.96) {
        setStepsRevealed(true);
        return true;
      }
      return false;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting || entry.boundingClientRect.top <= window.innerHeight)) {
          setStepsRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -20px 0px' },
    );
    observer.observe(node);

    const rafId = window.requestAnimationFrame(() => {
      if (revealIfInView()) {
        observer.disconnect();
      }
    });

    const onViewportChange = () => {
      if (revealIfInView()) {
        observer.disconnect();
        window.removeEventListener('scroll', onViewportChange);
        window.removeEventListener('resize', onViewportChange);
      }
    };

    window.addEventListener('scroll', onViewportChange, { passive: true });
    window.addEventListener('resize', onViewportChange, { passive: true });

    return () => {
      window.cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('scroll', onViewportChange);
      window.removeEventListener('resize', onViewportChange);
    };
  }, [stepsRevealed]);

  const currentOutfitSlots = useMemo<OutfitSlotItem[]>(() => {
    if (!currentOutfit) return [];
    const categoryToSlot = (cat: string): OutfitSlotItem['slot'] => {
      if (cat === 'tops') return 'top';
      if (cat === 'outerwear') return 'outerwear';
      if (cat === 'bottoms') return 'bottom';
      if (cat === 'footwear') return 'footwear';
      return 'accessory';
    };
    const slotLabelMap: Record<OutfitSlotItem['slot'], string> = {
      top: 'Base Top',
      outerwear: 'Outerwear / Layer',
      bottom: 'Bottoms',
      footwear: 'Footwear',
      accessory: 'Accessories',
    };
    return currentOutfit.pieces.map((piece) => {
      const slot = categoryToSlot(piece.category);
      return {
        slot,
        slotLabel: slotLabelMap[slot],
        closetItemId: piece.id,
        name: piece.name,
        category: piece.subType || piece.category,
        brand: piece.brand,
        color: piece.color,
        fit: piece.fit,
        formality: piece.formality,
        imageUrl: piece.imageUrl,
        icon: piece.icon,
        status: 'owned',
      };
    });
  }, [currentOutfit]);

  const savedLook = useMemo(() => {
    if (!currentOutfit) return false;
    if (savedOutfitIds[currentOutfit.id]) return true;
    const storedLooks = loadStoredSavedLooks(workspaceScope);
    return Boolean(
      findDuplicateSavedLook(
        {
          occasion: currentOutfit.occasion,
          title: currentOutfit.title,
          slots: currentOutfitSlots,
          garments: currentOutfit.pieces.map((p) => p.name),
          garmentIds: currentOutfit.pieces.map((p) => p.id),
        },
        storedLooks,
      ),
    );
  }, [currentOutfit, currentOutfitSlots, savedOutfitIds, workspaceScope]);

  const requireRegisteredHeroAction = (
    action: GuestRestrictedAction,
    actionTitle?: string,
  ): boolean => {
    if (isAuthenticated) {
      return true;
    }
    setGuestPromptState({ action, actionTitle });
    return false;
  };

  const handleCurate = (
    e?: React.FormEvent,
    overrides?: { venue?: string; occasion?: string; vibe?: string; prompt?: string },
  ) => {
    if (e) e.preventDefault();
    if (!requireRegisteredHeroAction('personalized-styling', 'Curate a Personalized Outfit')) {
      return;
    }
    const inferred = e ? inferPromptOverrides(promptText) : {};
    const nextVenue = overrides?.venue ?? inferred.venue ?? venue;
    const nextOccasion = overrides?.occasion ?? inferred.occasion ?? occasion;
    const nextVibe = overrides?.vibe ?? vibe;
    if (overrides?.prompt !== undefined) {
      setPromptText(overrides.prompt);
    }
    if (nextVenue !== venue && ['Rooftop Cafe, Hyderabad', 'Fine Dining Bistro', 'Executive Boardroom', 'Casual Cafe & Walk', 'Art Gallery Vernissage', 'Cocktails & Social'].includes(nextVenue)) {
      setVenue(nextVenue);
    }
    if (nextOccasion !== occasion) {
      setOccasion(nextOccasion);
    }

    generateOutfit({
      venue: nextVenue,
      occasion: nextOccasion,
      vibe: nextVibe,
      weather,
    });

    // Smooth scroll down to result card
    if (scrollTimerRef.current !== null) {
      window.clearTimeout(scrollTimerRef.current);
    }
    scrollTimerRef.current = window.setTimeout(() => {
      scrollTimerRef.current = null;
      const el = document.getElementById('curated-result-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 400);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    if (!requireRegisteredHeroAction('personalized-styling', 'Refine This Outfit with AI Stylist')) {
      return;
    }
    modifyOutfit(chatInput);
    setChatInput('');
  };

  const handleChipTweak = (instruction: string) => {
    if (!requireRegisteredHeroAction('personalized-styling', `Refine Outfit: "${instruction}"`)) {
      return;
    }
    modifyOutfit(instruction);
  };

  return (
    <div className="relative overflow-hidden transition-colors duration-300">
      
      {/* 🌟 HERO SECTION (EXACT MATCH TO SCREENSHOT 1) */}
      <section className="pt-8 pb-16 md:pt-12 md:pb-20 border-b border-[var(--border-card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* LEFT COLUMN: Headlines, Slogan, Feature Pills & CTAs (Image 1) */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Top micro-tag with rule line */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono tracking-[0.22em] uppercase font-bold text-[#A67C1E] dark:text-[#F2D98D]">
                  AI-POWERED PERSONAL FASHION COMPANION
                </span>
                <span className="h-[1px] w-12 bg-[#A67C1E]/40" />
              </div>

              {/* Huge Serif Headline: Your Wardrobe. Your World. Your Look. */}
              <h1 className="font-playfair text-[2.45rem] min-[360px]:text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight text-[var(--text-heading)] leading-[1.05]">
                Your Wardrobe.<br />
                Your World.<br />
                Your Look.
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-[var(--text-body)] font-normal leading-relaxed max-w-xl">
                An AI-powered personal fashion companion that helps you create the perfect outfit for every place, every mood, every you.
              </p>

              {/* 4 Feature Badges with Icons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs text-[var(--text-heading)]">
                  <span className="w-7 h-7 rounded-lg bg-[var(--pill-bg)] border border-[var(--border-gold)] flex items-center justify-center text-sm shrink-0">🚪</span>
                  <span className="font-semibold text-[11px] leading-tight">Your Closet Smarter</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-heading)]">
                  <span className="w-7 h-7 rounded-lg bg-[var(--pill-bg)] border border-[var(--border-gold)] flex items-center justify-center text-sm text-[var(--gold-primary)] shrink-0">✦</span>
                  <span className="font-semibold text-[11px] leading-tight">AI Personalized</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-heading)]">
                  <span className="w-7 h-7 rounded-lg bg-[var(--pill-bg)] border border-[var(--border-gold)] flex items-center justify-center text-sm shrink-0">📍</span>
                  <span className="font-semibold text-[11px] leading-tight">Destination Aware</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-heading)]">
                  <span className="w-7 h-7 rounded-lg bg-[var(--pill-bg)] border border-[var(--border-gold)] flex items-center justify-center text-sm shrink-0">👗</span>
                  <span className="font-semibold text-[11px] leading-tight">Looks For Every Occasion</span>
                </div>
              </div>

              {/* CTAs: Get Started -> & Watch Video */}
              <div className="flex flex-wrap items-center gap-4 pt-3">
                <button
                  type="button"
                  onClick={onOpenOnboarding}
                  className="px-8 py-4 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs sm:text-sm font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 flex items-center gap-2.5 cursor-pointer shadow-xl hover:scale-105 transition-all"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>

                <button
                  type="button"
                  onClick={onExploreDemo}
                  className="px-6 py-4 rounded-full border border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[var(--gold-primary)] text-[var(--text-heading)] text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                  <span>Explore AI Stylist</span>
                </button>
              </div>

              {/* Social Proof Stats Row */}
              <div className="pt-6 border-t border-[var(--border-card)] flex flex-wrap items-center gap-6 text-xs text-[var(--text-body)]">
                <div>
                  <strong className="text-base font-bold text-[var(--text-heading)] block">10K+</strong>
                  <span className="text-[11px] text-[var(--text-muted)]">Happy Users</span>
                </div>
                <div className="h-7 w-[1px] bg-[var(--border-card)]" />
                <div>
                  <strong className="text-base font-bold text-[var(--text-heading)] flex items-center gap-1">
                    4.8 <span className="text-amber-500">★</span>
                  </strong>
                  <span className="text-[11px] text-[var(--text-muted)]">App Rating</span>
                </div>
                <div className="h-7 w-[1px] bg-[var(--border-card)]" />
                <div>
                  <strong className="text-base font-bold text-[var(--text-heading)] block">Smarter Outfits</strong>
                  <span className="text-[11px] text-[var(--text-muted)]">Everyday</span>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Haute Editorial Model Photo + Floating "Tonight's Look" Card (Image 1) */}
            <div className="lg:col-span-6 relative">
              
              {/* Main Editorial Image Container */}
              <div
                data-testid="hero-editorial-media"
                className="relative rounded-3xl overflow-hidden shadow-2xl border border-[var(--border-card)] bg-neutral-900 aspect-[4/5] max-h-[580px] w-full"
              >
                <img
                  src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80"
                  alt="OTD Haute Editorial Pair"
                  className="w-full h-full object-cover object-top"
                />

                {/* Dark Gradient Scrims for script legibility over lower-left negative space */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(13,12,11,0.62)_0%,rgba(13,12,11,0.18)_46%,transparent_72%)] pointer-events-none" />

                {/* Handwritten Cursive Script Overlay — anchored to lower-left negative space clear of face & preview card */}
                <div
                  data-testid="hero-script-headline"
                  className="absolute bottom-4 left-3.5 min-[360px]:bottom-5 min-[360px]:left-4 sm:bottom-8 sm:left-7 lg:bottom-9 lg:left-7 z-10 pointer-events-none max-w-[54%] min-[360px]:max-w-[58%] sm:max-w-[50%]"
                >
                  <span className="font-script otd-hero-script text-white -rotate-3 origin-bottom-left block">
                    Your style.{' '}
                    <br />
                    Every place.
                  </span>
                </div>
              </div>

              {/* Floating Card: Tonight's Look (Matches Image 1 directly) */}
              <div
                data-testid="hero-tonights-look-card"
                className="absolute top-3 min-[360px]:top-4 sm:top-8 right-2 min-[360px]:right-3 sm:-right-4 w-44 min-[360px]:w-[13rem] sm:w-64 glass-card rounded-2xl p-2.5 min-[360px]:p-3 sm:p-4 border border-white/40 dark:border-white/10 shadow-2xl bg-white/95 dark:bg-[#141418]/95 backdrop-blur-xl animate-in fade-in duration-700"
              >
                <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[var(--text-heading)]">
                    Tonight's Look
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-500">
                    <Sun className="w-3 h-3" />
                    <span>21°C</span>
                  </span>
                </div>

                {/* Garments Mini Flat Lay */}
                <div className="grid grid-cols-3 gap-2 my-3 text-center">
                  <div className="bg-[#F7EFE0] dark:bg-[#1F1F26] p-1.5 rounded-lg border border-black/5 dark:border-white/5 flex flex-col items-center justify-center">
                    <span className="text-xl">👔</span>
                    <span className="text-[8px] font-bold truncate w-full text-[var(--text-heading)]">Black Shirt</span>
                  </div>
                  <div className="bg-[#F7EFE0] dark:bg-[#1F1F26] p-1.5 rounded-lg border border-black/5 dark:border-white/5 flex flex-col items-center justify-center">
                    <span className="text-xl">👕</span>
                    <span className="text-[8px] font-bold truncate w-full text-[var(--text-heading)]">White Top</span>
                  </div>
                  <div className="bg-[#F7EFE0] dark:bg-[#1F1F26] p-1.5 rounded-lg border border-black/5 dark:border-white/5 flex flex-col items-center justify-center">
                    <span className="text-xl">👖</span>
                    <span className="text-[8px] font-bold truncate w-full text-[var(--text-heading)]">Beige Pants</span>
                  </div>
                  <div className="bg-[#F7EFE0] dark:bg-[#1F1F26] p-1.5 rounded-lg border border-black/5 dark:border-white/5 flex flex-col items-center justify-center">
                    <span className="text-xl">⌚</span>
                    <span className="text-[8px] font-bold truncate w-full text-[var(--text-heading)]">Gold Watch</span>
                  </div>
                  <div className="bg-[#F7EFE0] dark:bg-[#1F1F26] p-1.5 rounded-lg border border-black/5 dark:border-white/5 flex flex-col items-center justify-center">
                    <span className="text-xl">👟</span>
                    <span className="text-[8px] font-bold truncate w-full text-[var(--text-heading)]">Sneakers</span>
                  </div>
                  <div className="bg-[#F7EFE0] dark:bg-[#1F1F26] p-1.5 rounded-lg border border-black/5 dark:border-white/5 flex flex-col items-center justify-center">
                    <span className="text-xl">🕶️</span>
                    <span className="text-[8px] font-bold truncate w-full text-[var(--text-heading)]">Glasses</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      if (onExploreDemo) {
                        onExploreDemo();
                      } else {
                        document.getElementById('atelier')?.scrollIntoView({ behavior: 'smooth' });
                      }
                      return;
                    }
                    handleCurate();
                  }}
                  className="w-full py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                >
                  <span>View Look</span>
                  <ArrowRight className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>

              {/* Floating Mini Destination Cards (Bottom Row of Image 1) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
                {[
                  { name: 'Date Night', venue: 'Fine Dining Bistro', occasion: 'Date Night', prompt: 'Romantic dinner date tonight', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80' },
                  { name: 'Office', venue: 'Executive Boardroom', occasion: 'Office / Work', prompt: 'Executive boardroom presentation today', img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&q=80' },
                  { name: 'Travel', venue: 'Casual Cafe & Walk', occasion: 'Travel / Weekend', prompt: 'Comfortable weekend travel look', img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=300&q=80' },
                  { name: 'Party', venue: 'Cocktails & Social', occasion: 'Party / Celebration', prompt: 'Evening cocktail party tonight', img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=300&q=80' },
                ].map(dest => (
                  <button
                    type="button"
                    key={dest.name}
                    onClick={() => {
                      if (!requireRegisteredHeroAction('personalized-styling', `Curate ${dest.name} Look`)) {
                        return;
                      }
                      setVenue(dest.venue);
                      setOccasion(dest.occasion);
                      handleCurate(undefined, {
                        venue: dest.venue,
                        occasion: dest.occasion,
                        prompt: dest.prompt,
                      });
                    }}
                    aria-label={`Curate outfit for ${dest.name}`}
                    className="group relative rounded-xl overflow-hidden aspect-[4/3] border border-[var(--border-card)] shadow-md cursor-pointer text-left p-0"
                  >
                    <img src={dest.img} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-end p-2">
                      <span className="text-[10px] font-bold text-white drop-shadow-sm">
                        {dest.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

            </div>

          </div>

          {/* 4-STEP EDITORIAL EXPERIENCE SHOWCASE (01 to 04) */}
          <div
            ref={stepsSectionRef}
            id="how-otd-works"
            data-testid="hero-four-step-section"
            className="mt-16 pt-12 border-t border-[var(--border-card)] space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono tracking-[0.22em] uppercase font-bold text-[var(--gold-primary)]">
                    How OTD Works
                  </span>
                  <span className="h-[1px] w-10 bg-[var(--border-gold)]" />
                </div>
                <h3 className="font-playfair text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-heading)]">
                  Four Moments From Closet to Confidence
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-body)] max-w-md leading-relaxed">
                Every look is curated from garments you already own — tuned to destination, climate, and your natural poise.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
              {HOW_IT_WORKS_STEPS.map((item, idx) => (
                <div
                  key={item.step}
                  data-revealed={stepsRevealed ? 'true' : 'false'}
                  style={{ transitionDelay: stepsRevealed ? `${idx * 90}ms` : '0ms' }}
                  className="otd-step-reveal h-full"
                >
                  <article
                    data-testid={`hero-step-card-${item.step}`}
                    className="otd-step-card group h-full rounded-2xl overflow-hidden flex flex-col"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-neutral-900">
                      <img
                        src={item.imageUrl}
                        alt={item.imageAlt}
                        className="otd-step-image w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-300 pointer-events-none" />

                      <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 group-hover:border-[#D4AF37]/70 transition-colors duration-300">
                        <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-[#F7E7A9]">
                          {item.step}
                        </span>
                        <span className="h-2.5 w-[1px] bg-white/25" aria-hidden="true" />
                        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/90">
                          {item.tag}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono uppercase tracking-[0.18em] font-semibold text-[var(--gold-primary)]">
                            Step {item.step}
                          </span>
                          <span className="h-[1px] flex-1 bg-[var(--border-card)] group-hover:bg-[var(--border-gold)] transition-colors duration-300" />
                          {item.isFinal ? (
                            <Sparkles
                              aria-hidden="true"
                              className="w-3.5 h-3.5 text-[var(--gold-primary)] transition-transform duration-300 group-hover:scale-110 shrink-0"
                            />
                          ) : (
                            <ArrowRight
                              aria-hidden="true"
                              className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--gold-primary)] transition-all duration-300 group-hover:translate-x-1 shrink-0"
                            />
                          )}
                        </div>

                        <h4 className="font-playfair text-lg font-bold text-[var(--text-heading)] leading-snug group-hover:text-[var(--gold-primary)] transition-colors duration-300">
                          {item.title}
                        </h4>

                        <p className="text-xs text-[var(--text-body)] leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div
                        aria-hidden="true"
                        className="h-[1.5px] w-8 bg-[var(--border-gold)] group-hover:w-14 group-hover:bg-[var(--gold-primary)] transition-all duration-300 rounded-full"
                      />
                    </div>
                  </article>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 🌟 CONTEXT ENGINE & OUTFIT STUDIO (MATCHING SCREENSHOT 2: SCREENS 6, 7, 8, 9, 10) */}
      <section id="context-studio" className="py-16 md:py-24 bg-[var(--bg-canvas-subtle)] border-b border-[var(--border-card)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header (Screen 6: "Good evening, Mustafa 👋") */}
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--border-gold)] bg-[var(--pill-bg)]">
              <span className="w-2 h-2 rounded-full bg-[var(--gold-primary)] animate-pulse" />
              <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--gold-primary)] font-mono">
                OTD CONTEXT ENGINE · HYDERABAD
              </span>
            </div>

            <h2 className="font-playfair text-3xl sm:text-5xl font-bold text-[var(--text-heading)]">
              Good evening, {isAuthenticated ? (profile.name || 'Curator') : 'Curator'} 👋
            </h2>

            <p className="text-sm sm:text-base text-[var(--text-body)]">
              What are you dressing for today?
            </p>

            <button
              type="button"
              onClick={onOpenProfile}
              className="text-xs uppercase tracking-wider text-[var(--gold-primary)] hover:underline inline-flex items-center gap-1 font-semibold"
            >
              <span>
                {profile.stylePersonas.length > 0
                  ? `Style DNA: ${profile.stylePersonas[0]} (${profile.preferredFit || 'Tailored'})`
                  : 'Style DNA: Calibrate Your Profile'}
              </span>
              <span className="text-[10px] bg-[var(--pill-bg)] px-2 py-0.5 rounded-full border border-[var(--border-gold)]">Calibrate</span>
            </button>
          </div>

          {/* Omnibar & Selectors (Screens 7, 8) */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[var(--border-card)] shadow-xl relative mb-12">
            <form onSubmit={handleCurate} className="space-y-6">
              
              <div>
                <label
                  htmlFor="hero-prompt-input"
                  className="block text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-2 font-mono"
                >
                  Tell OTD Your Destination & Event:
                </label>
                <div className="relative">
                  <input
                    id="hero-prompt-input"
                    type="text"
                    maxLength={200}
                    value={promptText}
                    onChange={e => setPromptText(e.target.value)}
                    placeholder="e.g. Rooftop cafe tonight for a date, or boardroom pitch..."
                    className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-card)] rounded-2xl px-5 py-4 text-sm sm:text-base text-[var(--text-heading)] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] focus:border-[var(--gold-primary)] shadow-inner pr-14"
                  />
                  <button
                    type="submit"
                    aria-label="Curate outfit from prompt"
                    disabled={isGenerating}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center cursor-pointer hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                  >
                    {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4 stroke-[2.5]" />}
                  </button>
                </div>
              </div>

              {/* Guided Micro-Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label
                    htmlFor="hero-venue-select"
                    className="block text-[10px] uppercase font-mono font-semibold text-[var(--text-muted)] mb-1.5"
                  >
                    Destination / Venue
                  </label>
                  <select
                    id="hero-venue-select"
                    value={venue}
                    onChange={e => setVenue(e.target.value)}
                    className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-card)] rounded-xl px-3 py-2.5 text-[var(--text-heading)] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] focus:border-[var(--gold-primary)] cursor-pointer"
                  >
                    <option value="Rooftop Cafe, Hyderabad">Rooftop Cafe, Hyderabad</option>
                    <option value="Fine Dining Bistro">Fine Dining Bistro</option>
                    <option value="Executive Boardroom">Executive Boardroom</option>
                    <option value="Casual Cafe & Walk">Casual Cafe & Walk</option>
                    <option value="Art Gallery Vernissage">Art Gallery Vernissage</option>
                    <option value="Cocktails & Social">Cocktails & Social</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="hero-occasion-select"
                    className="block text-[10px] uppercase font-mono font-semibold text-[var(--text-muted)] mb-1.5"
                  >
                    Occasion
                  </label>
                  <select
                    id="hero-occasion-select"
                    value={occasion}
                    onChange={e => setOccasion(e.target.value)}
                    className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-card)] rounded-xl px-3 py-2.5 text-[var(--text-heading)] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] focus:border-[var(--gold-primary)] cursor-pointer"
                  >
                    <option value="Date Night">Date Night</option>
                    <option value="Casual Day">Casual Day</option>
                    <option value="Office / Work">Office / Work</option>
                    <option value="Party / Celebration">Party / Celebration</option>
                    <option value="Travel / Weekend">Travel / Weekend</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="hero-vibe-select"
                    className="block text-[10px] uppercase font-mono font-semibold text-[var(--text-muted)] mb-1.5"
                  >
                    Desired Vibe
                  </label>
                  <select
                    id="hero-vibe-select"
                    value={vibe}
                    onChange={e => setVibe(e.target.value)}
                    className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-card)] rounded-xl px-3 py-2.5 text-[var(--text-heading)] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] focus:border-[var(--gold-primary)] cursor-pointer"
                  >
                    <option value="Elegant + Attractive">Elegant + Attractive</option>
                    <option value="The Parisian Minimalist">The Parisian Minimalist</option>
                    <option value="Sharp & Commanding">Sharp & Commanding</option>
                    <option value="Relaxed & Comfortable">Relaxed & Comfortable</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="hero-weather-select"
                    className="block text-[10px] uppercase font-mono font-semibold text-[var(--text-muted)] mb-1.5"
                  >
                    Weather (Auto-Detected)
                  </label>
                  <select
                    id="hero-weather-select"
                    value={weather}
                    onChange={e => setWeather(e.target.value)}
                    className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-card)] rounded-xl px-3 py-2.5 text-[var(--text-heading)] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] focus:border-[var(--gold-primary)] cursor-pointer"
                  >
                    <option value="Tonight · 21°C Mild Autumn">Tonight · 21°C Mild Autumn</option>
                    <option value="Evening · 16°C Cool">Evening · 16°C Cool</option>
                    <option value="Afternoon · 28°C Sunny">Afternoon · 28°C Sunny</option>
                    <option value="Morning · 19°C Overcast">Morning · 19°C Overcast</option>
                  </select>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-[var(--text-muted)]">
                  Matches your owned clothes in your Digital Closet.
                </span>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-105 transition-all"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Look...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#F2D98D]" />
                      <span>Curate My Outfit Of The Day</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* 🌟 RESULT SCREEN: Curated Outfit (Matches Screens 9, 10) */}
          {currentOutfit && (
            <div id="curated-result-section" className="space-y-8 animate-in fade-in duration-500">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-card)]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono tracking-wider uppercase bg-black text-white dark:bg-white dark:text-black px-2.5 py-0.5 rounded-full font-bold">
                      {currentOutfit.harmonyScore}% AI MATCH
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">·</span>
                    <span className="text-xs text-[var(--text-muted)] font-medium">📍 {currentOutfit.venue}</span>
                  </div>
                  <h3 className="font-playfair text-3xl sm:text-4xl font-bold text-[var(--text-heading)]">
                    {currentOutfit.title}
                  </h3>
                  <p className="text-xs text-[var(--text-body)] mt-1">
                    Understated elegance balancing structured tailoring with soft fluid silk. Perfect for your {currentOutfit.venue}.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!requireRegisteredHeroAction('save-outfit', 'Save This Curated Look')) {
                        return;
                      }
                      const existing = loadStoredSavedLooks(workspaceScope);
                      const duplicate = findDuplicateSavedLook(
                        {
                          occasion: currentOutfit.occasion,
                          title: currentOutfit.title,
                          slots: currentOutfitSlots,
                          garments: currentOutfit.pieces.map((p) => p.name),
                          garmentIds: currentOutfit.pieces.map((p) => p.id),
                        },
                        existing,
                      );
                      if (duplicate) {
                        const updated = existing.map((look) =>
                          look.id === duplicate.id ? { ...look, isFavorite: true } : look,
                        );
                        persistSavedLooks(updated, workspaceScope);
                      } else {
                        const newLook = buildSavedLookFromEnsemble({
                          title: currentOutfit.title,
                          subtitle: currentOutfit.rationale.venueAlignment,
                          occasion: currentOutfit.occasion,
                          venue: currentOutfit.venue,
                          weatherTag: currentOutfit.weather,
                          vibe: currentOutfit.vibe,
                          slots: currentOutfitSlots,
                          closet,
                        });
                        persistSavedLooks([newLook, ...existing], workspaceScope);
                      }
                      setSavedOutfitIds((prev) => ({ ...prev, [currentOutfit.id]: true }));
                    }}
                    className={`px-4 py-2.5 rounded-full border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      savedLook
                        ? 'bg-[#10B981] text-white border-[#10B981]'
                        : 'border-[var(--border-card)] text-[var(--text-heading)] hover:border-[var(--gold-primary)]'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{savedLook ? 'Saved to Worn History' : 'Save Look'}</span>
                  </button>
                </div>
              </div>

              {/* Garments Visual Composition */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {currentOutfit.pieces.map((piece, idx) => (
                  <div
                    key={piece.id}
                    className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border-card)] shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] uppercase font-mono font-bold text-[var(--gold-primary)]">
                          Layer 0{idx + 1}
                        </span>
                        <span className="text-2xl">{piece.icon}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">
                        {piece.brand || 'Personal Piece'}
                      </span>
                      <h4 className="text-xs font-bold text-[var(--text-heading)] line-clamp-2 mt-0.5">
                        {piece.name}
                      </h4>
                    </div>

                    <div className="pt-2 mt-2 border-t border-[var(--border-card)] flex justify-between text-[10px] text-[var(--text-muted)]">
                      <span>{piece.color}</span>
                      <strong className="text-[var(--text-heading)]">{piece.fit}</strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* "Why This Outfit Works For You" (Matches Screen 10) */}
              <div className="glass-card rounded-2xl p-6 border border-[var(--border-card)] space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs uppercase font-mono font-bold tracking-wider text-[var(--text-heading)]">
                    OTD AI Stylist · Why this outfit works for you:
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-[var(--text-body)] list-disc pl-5 leading-relaxed">
                  <li>{currentOutfit.rationale.venueAlignment}</li>
                  <li>{currentOutfit.rationale.weatherComfort}</li>
                  <li>{currentOutfit.rationale.paletteHarmony}</li>
                  <li>The minimalist footwear and accessories elevate the silhouette without overdoing it.</li>
                </ul>
              </div>

              {/* 💬 Conversational Modifier Bar (Screen 10) */}
              <div className="glass-card rounded-2xl p-5 border border-black/20 dark:border-white/20 space-y-4 shadow-lg bg-[var(--bg-card-elevated)]">
                <div>
                  <span className="text-[11px] uppercase font-mono tracking-wider font-bold text-[var(--text-heading)] block mb-2">
                    Want to tweak this look? Click a chip or type instructions:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Make it more casual',
                      'Change the shoes',
                      "Don't use jeans",
                      'Make it more attractive',
                      'Add a lighter layer'
                    ].map(chip => (
                      <button
                        key={chip}
                        type="button"
                        disabled={isGenerating}
                        onClick={() => handleChipTweak(chip)}
                        className="px-3.5 py-1.5 rounded-full border border-[var(--border-card)] bg-[var(--bg-card-inner)] hover:border-[var(--gold-primary)] text-xs text-[var(--text-heading)] font-semibold transition-all cursor-pointer hover:scale-105 active:scale-95"
                      >
                        "{chip}"
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input
                    type="text"
                    aria-label="Modify curated outfit instruction"
                    maxLength={200}
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="e.g. 'Make it more casual' or 'Change the shoes'..."
                    className="flex-1 bg-[var(--bg-card-inner)] border border-[var(--border-card)] rounded-xl px-4 py-3 text-xs sm:text-sm text-[var(--text-heading)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] focus:border-[var(--gold-primary)] font-semibold"
                  />
                  <button
                    type="submit"
                    disabled={isGenerating || !chatInput.trim()}
                    className="px-5 py-3 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Modify</span>
                  </button>
                </form>
              </div>

            </div>
          )}

        </div>
      </section>

      <GuestRegistrationPromptModal
        isOpen={!isAuthenticated && guestPromptState !== null}
        action={guestPromptState?.action || 'personalized-styling'}
        actionTitle={guestPromptState?.actionTitle}
        redirectTo="/stylist"
        onClose={() => setGuestPromptState(null)}
      />

    </div>
  );
};
