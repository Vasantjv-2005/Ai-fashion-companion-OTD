import React, { useState } from 'react';
import { User, Layers, Info, ChevronRight, ArrowLeftRight } from 'lucide-react';
import type { UserProfile } from '../../context/ClosetContext';
import { formatGarmentMetaParts } from '../../utils/garmentValidation';

export interface OutfitSlotItem {
  slot: 'top' | 'outerwear' | 'bottom' | 'footwear' | 'accessory';
  slotLabel: string;
  closetItemId?: string;
  name: string;
  category: string;
  brand?: string;
  color?: string;
  fit?: string;
  formality?: number;
  imageUrl?: string;
  icon?: string;
  status: 'owned' | 'missing' | 'unverified';
  stylingNote?: string;
  isOptional?: boolean;
}

interface AvatarOutfitCanvasProps {
  slots: OutfitSlotItem[];
  profile: UserProfile;
  occasion: string;
  outfitTitle: string;
  isLoading?: boolean;
  selectedSlotKey?: OutfitSlotItem['slot'];
  onActiveSlotChange?: (slotKey: OutfitSlotItem['slot']) => void;
  onSlotSelect?: (slot: OutfitSlotItem) => void;
  onChangeSlotItem?: (slot: OutfitSlotItem) => void;
}

// Helper to convert garment color names to hex codes for the fashion silhouette
function getGarmentHex(colorName?: string, defaultHex: string = '#27272a'): string {
  if (!colorName) return defaultHex;
  const c = colorName.toLowerCase();
  if (c.includes('sand')) return '#EFE7DA';
  if (c.includes('ivory') || c.includes('cream') || c.includes('chalk') || c.includes('white') || c.includes('ecru')) return '#FAF7F2';
  if (c.includes('burgundy') || c.includes('oxblood') || c.includes('wine') || c.includes('maroon') || c.includes('crimson')) return '#5c1d24';
  if (c.includes('terracotta') || c.includes('rust') || c.includes('cognac')) return '#8c3b20';
  if (c.includes('midnight navy') || c.includes('navy')) return '#172554';
  if (c.includes('indigo') || c.includes('denim')) return '#1e3a5f';
  if (c.includes('french blue') || c.includes('blue')) return '#2b4c7e';
  if (c.includes('olive') || c.includes('sage') || c.includes('forest') || c.includes('green')) return '#3f523a';
  if (c.includes('khaki')) return '#9c8a66';
  if (c.includes('camel') || c.includes('vicuna') || c.includes('tan') || c.includes('taupe')) return '#b0895c';
  if (c.includes('tobacco')) return '#8c522b';
  if (c.includes('caramel') || c.includes('hazelnut')) return '#7c4a26';
  if (c.includes('chocolate') || c.includes('espresso') || c.includes('brown')) return '#3b2219';
  if (c.includes('oatmeal') || c.includes('beige') || c.includes('linen')) return '#d4c5b2';
  if (c.includes('gold') || c.includes('amber')) return '#B88E2D';
  if (c.includes('charcoal') || c.includes('flint') || c.includes('slate')) return '#36363c';
  if (c.includes('black') || c.includes('noir') || c.includes('jet')) return '#18181b';
  if (c.includes('grey') || c.includes('gray') || c.includes('silver')) return '#6b7280';
  return defaultHex;
}

export const AvatarOutfitCanvas: React.FC<AvatarOutfitCanvasProps> = ({
  slots,
  profile,
  occasion,
  outfitTitle,
  isLoading = false,
  selectedSlotKey,
  onActiveSlotChange,
  onSlotSelect,
  onChangeSlotItem,
}) => {
  const initialMode = profile.avatarOption === 'skipped' ? 'flatlay' : 'avatar';
  const [viewMode, setViewMode] = useState<'avatar' | 'flatlay'>(initialMode);
  const [internalActiveSlotKey, setInternalActiveSlotKey] = useState<OutfitSlotItem['slot']>('top');
  const [failedImageUrls, setFailedImageUrls] = useState<Record<string, true>>({});

  const topPiece = slots.find((s) => s.slot === 'top');
  const outerwearPiece = slots.find((s) => s.slot === 'outerwear');
  const bottomPiece = slots.find((s) => s.slot === 'bottom');
  const footwearPiece = slots.find((s) => s.slot === 'footwear');
  const accessoryPiece = slots.find((s) => s.slot === 'accessory');

  // Currently inspected slot for the detailed callout (synced with optional parent selection)
  const requestedSlotKey = selectedSlotKey ?? internalActiveSlotKey;
  const activePiece = slots.find((s) => s.slot === requestedSlotKey) || topPiece || slots[0];
  const activeSlotKey = activePiece?.slot ?? requestedSlotKey;

  const handleActivateSlot = (slotKey: OutfitSlotItem['slot']) => {
    setInternalActiveSlotKey(slotKey);
    onActiveSlotChange?.(slotKey);
  };

  const archetype = profile.avatarArchetype || 'classic_tailored';
  const archetypeTitle =
    archetype === 'classic_tailored'
      ? 'Tailored Classic Archetype'
      : archetype === 'modern_minimal'
      ? 'Contemporary Minimal Archetype'
      : 'Fluid Editorial Archetype';

  const isAvatarSkipped = profile.avatarOption === 'skipped';

  // Extract color swatches for the visual palette
  const topHex = getGarmentHex(topPiece?.color, '#f4ece1');
  const outerHex = getGarmentHex(outerwearPiece?.color, '#0f172a');
  const bottomHex = getGarmentHex(bottomPiece?.color, '#27272a');
  const shoeHex = getGarmentHex(footwearPiece?.color, '#3b2219');
  const accHex = getGarmentHex(accessoryPiece?.color, '#B88E2D');

  return (
    <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] overflow-hidden shadow-sm flex flex-col relative transition-all duration-300">
      
      {/* 1. Canvas Top Toolbar & View Mode Toggle */}
      <div className="p-4 sm:p-5 border-b border-[var(--border-card)] flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-card)]/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[var(--gold-primary)] animate-pulse" />
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[var(--gold-primary)] block leading-none">
              Silhouette Studio
            </span>
            <span className="text-xs font-semibold text-[var(--text-heading)]">
              {viewMode === 'avatar' ? archetypeTitle : 'Editorial Flat-Lay Manifest'}
            </span>
          </div>
        </div>

        {/* View Mode Segmented Controls */}
        <div className="inline-flex items-center p-1 rounded-full bg-[var(--pill-bg)] border border-[var(--border-card)]">
          <button
            type="button"
            onClick={() => setViewMode('avatar')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'avatar'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Style Avatar</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('flatlay')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'flatlay'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Studio Flat-Lay</span>
          </button>
        </div>
      </div>

      {/* 2. Main Visual Canvas Stage */}
      <div className="relative min-h-[500px] sm:min-h-[580px] lg:min-h-[620px] bg-gradient-to-b from-[#141312] via-[#0E0D0C] to-[#070706] flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none">
        {/* Soft Ambient Spotlight */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/15 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        {/* Studio Floor Vignette and Shadow */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-80 sm:w-[420px] h-12 bg-black/80 rounded-[100%] blur-2xl pointer-events-none" />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-[var(--gold-primary)] border-t-transparent animate-spin" />
            <p className="font-playfair text-white text-base font-bold">Synthesizing Silhouette...</p>
            <p className="text-xs text-neutral-400 font-mono">Calibrating garment drape & proportions</p>
          </div>
        )}

        {/* Palette Swatch Ribbon (Top-Right) */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] text-neutral-300">
          <span className="font-mono text-[9px] uppercase tracking-wider text-amber-300 font-bold mr-1">Palette:</span>
          {outerwearPiece && (
            <span
              className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-xs"
              style={{ backgroundColor: outerHex }}
              title={`Outerwear: ${outerwearPiece.color}`}
            />
          )}
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-xs"
            style={{ backgroundColor: topHex }}
            title={`Top: ${topPiece?.color}`}
          />
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-xs"
            style={{ backgroundColor: bottomHex }}
            title={`Bottoms: ${bottomPiece?.color}`}
          />
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-xs"
            style={{ backgroundColor: shoeHex }}
            title={`Footwear: ${footwearPiece?.color}`}
          />
          {accessoryPiece && (
            <span
              className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-xs"
              style={{ backgroundColor: accHex }}
              title={`Accessory: ${accessoryPiece.color || 'Accent'}`}
            />
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* MODE 1: ATELIER FASHION MANNEQUIN SILHOUETTE (SVG-BASED) */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'avatar' && (
          <div className="relative z-10 w-full max-w-md flex flex-col items-center justify-center h-full animate-fadeIn">
            {isAvatarSkipped && (
              <div className="absolute top-0 inset-x-0 mx-auto z-20 max-w-xs p-2 rounded-xl bg-black/85 border border-amber-500/30 text-amber-200 text-[10px] text-center backdrop-blur-sm">
                Avatar skipped in profile • Showing standard {archetypeTitle}
              </div>
            )}

            {/* SVG Mannequin Articulation */}
            <div className="relative w-full max-w-[340px] sm:max-w-[380px] h-[480px] sm:h-[540px]">
              <svg
                viewBox="0 0 380 620"
                className="w-full h-full drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                role="group"
                aria-label={`Interactive silhouette preview for ${outfitTitle}: ${slots.map((s) => `${s.slotLabel} ${s.name}`).join(', ')}`}
              >
                <defs>
                  {/* Subtle Fabric Gradients */}
                  <linearGradient id="finialGold" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#D4AF37" />
                    <stop offset="50%" stopColor="#9C7728" />
                    <stop offset="100%" stopColor="#5E430B" />
                  </linearGradient>
                  <linearGradient id="bodyBase" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#252422" />
                    <stop offset="50%" stopColor="#32302C" />
                    <stop offset="100%" stopColor="#1E1C1A" />
                  </linearGradient>
                  <linearGradient id="outerGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={outerHex} stopOpacity="0.95" />
                    <stop offset="50%" stopColor={outerHex} stopOpacity="1" />
                    <stop offset="100%" stopColor={outerHex} stopOpacity="0.85" />
                  </linearGradient>
                  <linearGradient id="topGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={topHex} stopOpacity="1" />
                    <stop offset="100%" stopColor={topHex} stopOpacity="0.85" />
                  </linearGradient>
                  <linearGradient id="pantGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={bottomHex} stopOpacity="0.9" />
                    <stop offset="50%" stopColor={bottomHex} stopOpacity="1" />
                    <stop offset="100%" stopColor={bottomHex} stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="shoeGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={shoeHex} stopOpacity="1" />
                    <stop offset="100%" stopColor="#0a0a0a" stopOpacity="0.95" />
                  </linearGradient>
                </defs>

                {/* --- 1. ATELIER WOOD/BRASS STAND & BASE (Decorative) --- */}
                <g aria-hidden="true">
                  {/* Center Support Rod */}
                  <line x1="190" y1="20" x2="190" y2="595" stroke="#3F3E3B" strokeWidth="6" strokeLinecap="round" />
                  <line x1="190" y1="20" x2="190" y2="595" stroke="url(#finialGold)" strokeWidth="1.5" strokeOpacity="0.4" />
                  {/* Brass Height Collar */}
                  <rect x="184" y="385" width="12" height="10" rx="2" fill="url(#finialGold)" />
                  {/* Weighted Cast-Iron Plinth */}
                  <ellipse cx="190" cy="595" rx="70" ry="12" fill="#1C1B1A" stroke="#44423E" strokeWidth="2" />
                  <ellipse cx="190" cy="593" rx="52" ry="7" fill="#2A2825" />
                  <circle cx="190" cy="593" r="8" fill="url(#finialGold)" />

                  {/* --- 2. MANNEQUIN FINIAL & NECK --- */}
                  {/* Turned Brass Finial Top */}
                  <circle cx="190" cy="22" r="7" fill="url(#finialGold)" />
                  <path d="M185 27 C185 24 195 24 195 27 L193 38 L187 38 Z" fill="url(#finialGold)" />
                  {/* Mannequin Egg Head Form */}
                  <ellipse cx="190" cy="62" rx="22" ry="26" fill="url(#bodyBase)" stroke="#4A4742" strokeWidth="1.5" />
                  <path d="M178 70 Q190 75 202 70" stroke="#5E5A53" strokeWidth="1" fill="none" opacity="0.6" />
                  <text x="190" y="65" textAnchor="middle" fill="#84796D" fontSize="7" fontFamily="monospace" letterSpacing="2">OTD</text>
                  {/* Neck Yoke */}
                  <path d="M183 87 L197 87 L200 106 L180 106 Z" fill="url(#bodyBase)" stroke="#3E3C38" strokeWidth="1" />
                </g>

                {/* --- 3. TROUSERS / BOTTOMS (Drawn beneath jacket) --- */}
                <g
                  data-slot="bottom"
                  role="button"
                  tabIndex={0}
                  aria-label={`Inspect bottoms: ${bottomPiece?.name || 'Bottoms'}`}
                  aria-pressed={activeSlotKey === 'bottom'}
                  onClick={() => {
                    handleActivateSlot('bottom');
                    if (onSlotSelect && bottomPiece) onSlotSelect(bottomPiece);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleActivateSlot('bottom');
                      if (onSlotSelect && bottomPiece) onSlotSelect(bottomPiece);
                    }
                  }}
                  className="cursor-pointer transition-all duration-300"
                >
                  {/* Trouser Silhouette */}
                  <path
                    d="M142 270 
                       C140 330 136 410 138 520 
                       L174 520 
                       C174 460 178 375 190 320 
                       C202 375 206 460 206 520 
                       L242 520 
                       C244 410 240 330 238 270 Z"
                    fill="url(#pantGrad)"
                    stroke={activeSlotKey === 'bottom' ? '#D4AF37' : '#3A3835'}
                    strokeWidth={activeSlotKey === 'bottom' ? '2.5' : '1.5'}
                  />
                  {/* Crease Lines & Pleat Detail */}
                  <line x1="156" y1="280" x2="156" y2="515" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  <line x1="224" y1="280" x2="224" y2="515" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  {/* Subtle Trouser Hem Cuffs */}
                  <rect x="137" y="515" width="38" height="6" rx="2" fill="url(#pantGrad)" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
                  <rect x="205" y="515" width="38" height="6" rx="2" fill="url(#pantGrad)" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
                </g>

                {/* --- 4. BASE TOP (Torso & Neckline) --- */}
                <g
                  data-slot="top"
                  role="button"
                  tabIndex={0}
                  aria-label={`Inspect top: ${topPiece?.name || 'Base Top'}`}
                  aria-pressed={activeSlotKey === 'top'}
                  onClick={() => {
                    handleActivateSlot('top');
                    if (onSlotSelect && topPiece) onSlotSelect(topPiece);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleActivateSlot('top');
                      if (onSlotSelect && topPiece) onSlotSelect(topPiece);
                    }
                  }}
                  className="cursor-pointer transition-all duration-300"
                >
                  {/* Inner Chest Core */}
                  <path
                    d="M148 106 
                       C148 106 170 110 190 110 
                       C210 110 232 106 232 106 
                       L234 278 
                       L146 278 Z"
                    fill="url(#topGrad)"
                    stroke={activeSlotKey === 'top' ? '#D4AF37' : 'rgba(0,0,0,0.3)'}
                    strokeWidth={activeSlotKey === 'top' ? '2.5' : '1'}
                  />
                  {/* Collar / Rollneck Contour */}
                  {topPiece?.category?.toLowerCase().includes('rollneck') || topPiece?.name?.toLowerCase().includes('rollneck') || topPiece?.name?.toLowerCase().includes('high neck') ? (
                    <rect x="178" y="98" width="24" height="15" rx="4" fill="url(#topGrad)" stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
                  ) : (
                    <path d="M174 106 L190 128 L206 106 Z" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="2" />
                  )}
                  {/* Placket / Vertical Seam */}
                  <line x1="190" y1="120" x2="190" y2="274" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" strokeDasharray="4 2" />
                </g>

                {/* --- 5. OUTERWEAR / LAYER (When Present) --- */}
                {outerwearPiece && (
                  <g
                    data-slot="outerwear"
                    role="button"
                    tabIndex={0}
                    aria-label={`Inspect outerwear: ${outerwearPiece.name}`}
                    aria-pressed={activeSlotKey === 'outerwear'}
                    onClick={() => {
                      handleActivateSlot('outerwear');
                      if (onSlotSelect) onSlotSelect(outerwearPiece);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleActivateSlot('outerwear');
                        if (onSlotSelect) onSlotSelect(outerwearPiece);
                      }
                    }}
                    className="cursor-pointer transition-all duration-300"
                  >
                    {/* Left Jacket Body & Shoulder (tailored open V-neck reveals Base Top underneath) */}
                    <path
                      d="M174 110 
                         L140 108 
                         C128 114 116 130 114 158 
                         C112 195 116 235 120 282 
                         L176 288 
                         L188 196 
                         L188 186 Z"
                      fill="url(#outerGrad)"
                      stroke={activeSlotKey === 'outerwear' ? '#D4AF37' : '#2A2926'}
                      strokeWidth={activeSlotKey === 'outerwear' ? '2.5' : '1.5'}
                    />
                    {/* Right Jacket Body & Shoulder */}
                    <path
                      d="M206 110 
                         L240 108 
                         C252 114 264 130 266 158 
                         C268 195 264 235 260 282 
                         L204 288 
                         L192 196 
                         L192 186 Z"
                      fill="url(#outerGrad)"
                      stroke={activeSlotKey === 'outerwear' ? '#D4AF37' : '#2A2926'}
                      strokeWidth={activeSlotKey === 'outerwear' ? '2.5' : '1.5'}
                    />
                    {/* Lapels draped cleanly outside the chest V-opening */}
                    <path d="M174 110 L188 186 L160 154 L164 132 Z" fill={outerHex} stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                    <path d="M206 110 L192 186 L220 154 L216 132 Z" fill={outerHex} stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                    {/* Welt Breast Pocket & Hand Pockets */}
                    <line x1="138" y1="162" x2="154" y2="162" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
                    <line x1="128" y1="242" x2="152" y2="242" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
                    <line x1="228" y1="242" x2="252" y2="242" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
                    {/* Horn Buttons */}
                    <circle cx="190" cy="202" r="2.5" fill="#1C1814" stroke="#D4AF37" strokeWidth="0.8" />
                    <circle cx="190" cy="226" r="2.5" fill="#1C1814" stroke="#D4AF37" strokeWidth="0.8" />
                  </g>
                )}

                {/* --- 6. ACCESSORIES (Waistband & Wristwatch — only when accessory slot is populated) --- */}
                {accessoryPiece && (
                  <g
                    data-slot="accessory"
                    role="button"
                    tabIndex={0}
                    aria-label={`Inspect accessory: ${accessoryPiece.name}`}
                    aria-pressed={activeSlotKey === 'accessory'}
                    onClick={() => {
                      handleActivateSlot('accessory');
                      if (onSlotSelect) onSlotSelect(accessoryPiece);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleActivateSlot('accessory');
                        if (onSlotSelect) onSlotSelect(accessoryPiece);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    {/* Leather Belt */}
                    <rect x="146" y="272" width="88" height="8" rx="2" fill="#2A1B0E" stroke="#160D07" strokeWidth="1" />
                    <rect x="185" y="270" width="10" height="12" rx="2" fill="none" stroke="url(#finialGold)" strokeWidth="1.5" />
                    {/* Wristwatch on Left Cuff */}
                    <rect x="110" y="260" width="8" height="14" rx="2" fill="#1A1816" stroke="url(#finialGold)" strokeWidth="1" />
                    <circle cx="114" cy="267" r="3.5" fill="url(#finialGold)" />
                  </g>
                )}

                {/* --- 7. FOOTWEAR (Loafers / Shoes / Boots at Base) --- */}
                <g
                  data-slot="footwear"
                  role="button"
                  tabIndex={0}
                  aria-label={`Inspect footwear: ${footwearPiece?.name || 'Footwear'}`}
                  aria-pressed={activeSlotKey === 'footwear'}
                  onClick={() => {
                    handleActivateSlot('footwear');
                    if (onSlotSelect && footwearPiece) onSlotSelect(footwearPiece);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleActivateSlot('footwear');
                      if (onSlotSelect && footwearPiece) onSlotSelect(footwearPiece);
                    }
                  }}
                  className="cursor-pointer transition-all duration-300"
                >
                  {/* Left Shoe */}
                  <path
                    d="M136 521 
                       C134 532 130 540 126 544 
                       C122 548 132 552 150 552 
                       C168 552 174 546 174 536 
                       L174 521 Z"
                    fill="url(#shoeGrad)"
                    stroke={activeSlotKey === 'footwear' ? '#D4AF37' : '#2A221C'}
                    strokeWidth={activeSlotKey === 'footwear' ? '2.5' : '1.5'}
                  />
                  {/* Left Heel & Welt */}
                  <line x1="126" y1="548" x2="174" y2="548" stroke="#000" strokeWidth="2" />
                  <ellipse cx="146" cy="534" rx="14" ry="4" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

                  {/* Right Shoe */}
                  <path
                    d="M206 521 
                       C206 546 212 552 230 552 
                       C248 552 258 548 254 544 
                       C250 540 246 532 244 521 Z"
                    fill="url(#shoeGrad)"
                    stroke={activeSlotKey === 'footwear' ? '#D4AF37' : '#2A221C'}
                    strokeWidth={activeSlotKey === 'footwear' ? '2.5' : '1.5'}
                  />
                  {/* Right Heel & Welt */}
                  <line x1="206" y1="548" x2="254" y2="548" stroke="#000" strokeWidth="2" />
                  <ellipse cx="234" cy="534" rx="14" ry="4" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                </g>

                {/* --- 8. EDITORIAL ANATOMICAL HOTSPOT CALLOUT PINS (Visual markers only; region <g> owns the single keyboard tab stop) --- */}
                {/* Pin 01: Top */}
                <g
                  data-slot-pin="top"
                  aria-hidden="true"
                  onClick={() => handleActivateSlot('top')}
                  className="cursor-pointer"
                >
                  <circle cx="190" cy="136" r="6" fill={activeSlotKey === 'top' ? '#D4AF37' : '#1C1917'} stroke="#D4AF37" strokeWidth="1.5" />
                  <text x="190" y="139" textAnchor="middle" fill={activeSlotKey === 'top' ? '#000' : '#D4AF37'} fontSize="7" fontWeight="bold">1</text>
                </g>

                {/* Pin 02: Outerwear (If exists) */}
                {outerwearPiece && (
                  <g
                    data-slot-pin="outerwear"
                    aria-hidden="true"
                    onClick={() => handleActivateSlot('outerwear')}
                    className="cursor-pointer"
                  >
                    <circle cx="132" cy="180" r="6" fill={activeSlotKey === 'outerwear' ? '#D4AF37' : '#1C1917'} stroke="#D4AF37" strokeWidth="1.5" />
                    <text x="132" y="183" textAnchor="middle" fill={activeSlotKey === 'outerwear' ? '#000' : '#D4AF37'} fontSize="7" fontWeight="bold">2</text>
                  </g>
                )}

                {/* Pin 03: Bottoms */}
                <g
                  data-slot-pin="bottom"
                  aria-hidden="true"
                  onClick={() => handleActivateSlot('bottom')}
                  className="cursor-pointer"
                >
                  <circle cx="190" cy="380" r="6" fill={activeSlotKey === 'bottom' ? '#D4AF37' : '#1C1917'} stroke="#D4AF37" strokeWidth="1.5" />
                  <text x="190" y="383" textAnchor="middle" fill={activeSlotKey === 'bottom' ? '#000' : '#D4AF37'} fontSize="7" fontWeight="bold">3</text>
                </g>

                {/* Pin 04: Footwear */}
                <g
                  data-slot-pin="footwear"
                  aria-hidden="true"
                  onClick={() => handleActivateSlot('footwear')}
                  className="cursor-pointer"
                >
                  <circle cx="190" cy="535" r="6" fill={activeSlotKey === 'footwear' ? '#D4AF37' : '#1C1917'} stroke="#D4AF37" strokeWidth="1.5" />
                  <text x="190" y="538" textAnchor="middle" fill={activeSlotKey === 'footwear' ? '#000' : '#D4AF37'} fontSize="7" fontWeight="bold">4</text>
                </g>

                {/* Pin 05: Accessories */}
                {accessoryPiece && (
                  <g
                    data-slot-pin="accessory"
                    aria-hidden="true"
                    onClick={() => handleActivateSlot('accessory')}
                    className="cursor-pointer"
                  >
                    <circle cx="108" cy="267" r="6" fill={activeSlotKey === 'accessory' ? '#D4AF37' : '#1C1917'} stroke="#D4AF37" strokeWidth="1.5" />
                    <text x="108" y="270" textAnchor="middle" fill={activeSlotKey === 'accessory' ? '#000' : '#D4AF37'} fontSize="7" fontWeight="bold">5</text>
                  </g>
                )}
              </svg>
            </div>

            {/* Interactive Piece Inspector Banner (At bottom of canvas) */}
            {activePiece && (
              <div
                data-active-slot={activePiece.slot}
                className="w-full max-w-sm mt-1 p-3 rounded-2xl bg-black/85 border border-white/10 hover:border-[var(--gold-primary)]/60 transition-all shadow-lg backdrop-blur-md flex items-center justify-between gap-2"
              >
                <button
                  type="button"
                  onClick={() => onSlotSelect && onSlotSelect(activePiece)}
                  className="flex-1 min-w-0 flex items-center justify-between gap-2 text-left cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 overflow-hidden shrink-0 flex items-center justify-center text-xl">
                      {activePiece.imageUrl && !failedImageUrls[activePiece.imageUrl] ? (
                        <img
                          src={activePiece.imageUrl}
                          alt={activePiece.name}
                          className="w-full h-full object-cover"
                          onError={() => {
                            const failedSrc = activePiece.imageUrl;
                            if (failedSrc) {
                              setFailedImageUrls((prev) => ({ ...prev, [failedSrc]: true }));
                            }
                          }}
                        />
                      ) : (
                        <span>{activePiece.icon || '👕'}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] uppercase font-mono font-bold text-[var(--gold-primary)]">
                          {activePiece.slotLabel}
                        </span>
                        {activePiece.status === 'owned' ? (
                          <span className="text-[8px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                            Owned
                          </span>
                        ) : (
                          <span className="text-[8px] font-mono px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300 border border-amber-700/50">
                            Gap
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-white truncate">{activePiece.name}</p>
                      <p className="text-[10px] text-neutral-400 truncate">
                        {formatGarmentMetaParts([activePiece.color, activePiece.brand])}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--gold-primary)] shrink-0">
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </button>

                {onChangeSlotItem && (
                  <button
                    type="button"
                    onClick={() => onChangeSlotItem(activePiece)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-800/90 hover:bg-neutral-700 border border-neutral-600 hover:border-[var(--gold-primary)] text-[10px] font-mono text-[var(--gold-primary)] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
                    title={`Swap ${activePiece.slotLabel}`}
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    <span>Swap</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE 2: EDITORIAL STUDIO FLAT-LAY VIEW */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'flatlay' && (
          <div className="relative z-10 w-full max-w-lg animate-fadeIn py-3">
            <div className="text-center mb-3">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--gold-primary)] font-bold">
                Atelier Composition • Flat-Lay Arrangement
              </span>
              <p className="text-xs text-neutral-400 mt-0.5">
                Top-down sartorial layout styled for {occasion}
              </p>
            </div>

            {/* Flat-lay Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {slots.map((item) => (
                <div
                  key={item.slot}
                  data-flatlay-slot={item.slot}
                  className={`rounded-2xl border p-3 flex flex-col justify-between transition-all duration-300 ${
                    activeSlotKey === item.slot
                      ? 'border-[var(--gold-primary)] bg-neutral-800/95 ring-2 ring-[var(--gold-primary)]/40 shadow-xl scale-102'
                      : 'border-neutral-800 bg-neutral-900/80 hover:border-neutral-600'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      handleActivateSlot(item.slot);
                      if (onSlotSelect) onSlotSelect(item);
                    }}
                    className="w-full text-left cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)]"
                  >
                    <div className="h-28 sm:h-32 rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden mb-2 flex items-center justify-center text-3xl relative">
                      {item.imageUrl && !failedImageUrls[item.imageUrl] ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={() => {
                            const failedSrc = item.imageUrl;
                            if (failedSrc) {
                              setFailedImageUrls((prev) => ({ ...prev, [failedSrc]: true }));
                            }
                          }}
                        />
                      ) : (
                        <span>{item.icon || '👕'}</span>
                      )}
                      <span
                        className={`absolute top-1.5 right-1.5 text-[8px] font-mono px-1.5 py-0.5 rounded-full ${
                          item.status === 'owned'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                            : 'bg-amber-950 text-amber-300 border border-amber-700/60'
                        }`}
                      >
                        {item.status === 'owned' ? 'Owned' : 'Gap'}
                      </span>
                    </div>
                  </button>

                  <div className="flex items-start justify-between gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleActivateSlot(item.slot);
                        if (onSlotSelect) onSlotSelect(item);
                      }}
                      className="min-w-0 flex-1 text-left cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)]"
                    >
                      <span className="text-[9px] uppercase font-mono font-bold text-[var(--gold-primary)] block">
                        {item.slotLabel}
                      </span>
                      <h5 className="font-semibold text-xs text-white truncate">{item.name}</h5>
                      <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                        {formatGarmentMetaParts([item.color, item.brand])}
                      </p>
                    </button>

                    {onChangeSlotItem && (
                      <button
                        type="button"
                        onClick={() => onChangeSlotItem(item)}
                        className="p-1 rounded-md bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-[var(--gold-primary)] text-[var(--gold-primary)] transition-all cursor-pointer shrink-0"
                        title={`Swap ${item.slotLabel}`}
                        aria-label={`Swap ${item.slotLabel}`}
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Attribution Notice */}
        <div className="absolute bottom-2.5 left-4 right-4 flex items-center justify-between text-[10px] text-neutral-400 z-10 pointer-events-none">
          <span className="font-mono bg-black/60 px-2.5 py-1 rounded-full border border-neutral-800 backdrop-blur-xs">
            OTD Atelier • {outfitTitle}
          </span>
          <span className="hidden sm:inline-block font-mono bg-black/60 px-2.5 py-1 rounded-full border border-neutral-800 backdrop-blur-xs text-[var(--gold-primary)]">
            Phase 1 Tailored Silhouette (3D WebGL Neural Mesh in Phase 2)
          </span>
        </div>
      </div>

      {/* 3. Canvas Footer Info Bar */}
      <div className="p-3 sm:p-4 bg-[var(--bg-card)] border-t border-[var(--border-card)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-[var(--gold-primary)] shrink-0" />
          <span>
            {viewMode === 'avatar'
              ? `Mannequin calibrated to ${profile.bodyShape || 'Standard'} proportions (${profile.height || '178 cm'}). Click any hotspot to inspect.`
              : 'Flat-lay mode presents top-down garment arrangement for clean editorial inspection.'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono">
            {slots.filter((s) => s.status === 'owned').length} of {slots.length} pieces verified in closet
          </span>
        </div>
      </div>
    </div>
  );
};
