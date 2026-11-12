import { useState } from 'react';
import { BrainCircuit, TrendingUp, Plus, Check, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCloset } from '../context/ClosetContext';
import { useAuth } from '../hooks/useAuth';
import { GuestRegistrationPromptModal } from './auth/GuestRegistrationPromptModal';

interface GapItem {
  id: string;
  category: string;
  title: string;
  rationale: string;
  synergyGain: string;
  multiplier: string;
  recommendedBrands: string[];
  icon: string;
  active: boolean;
}

export const GapIntelligence: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { addToShoppingList, isItemInShoppingList } = useCloset();
  const [guestPromptTitle, setGuestPromptTitle] = useState<string | null>(null);
  const [gaps, setGaps] = useState<GapItem[]>([
    {
      id: 'gap-1',
      category: 'Outerwear Investment',
      title: 'Double-Breasted Belted Camel Overcoat',
      rationale: 'Bridges your casual denim with your formal tailoring. Instantly anchors 18 dormant winter pieces that lack warm-toned outerwear.',
      synergyGain: '+18 Ensembles',
      multiplier: '+38% Closet Power',
      recommendedBrands: ['Loro Piana', 'Max Mara Man', 'Canali'],
      icon: '🧥',
      active: true
    },
    {
      id: 'gap-2',
      category: 'Mid-Layer Staple',
      title: 'Charcoal Extra-Fine Merino Mockneck',
      rationale: 'Eliminates the stiffness of collared dress shirts under blazers. Converts 12 boardroom blazers into smart-evening cocktails.',
      synergyGain: '+14 Ensembles',
      multiplier: '+24% Closet Power',
      recommendedBrands: ['Brunello Cucinelli', 'John Smedley', 'Falconeri'],
      icon: '👕',
      active: true
    },
    {
      id: 'gap-3',
      category: 'Footwear Transition',
      title: 'Chocolate Suede Belgian Tassel Loafers',
      rationale: 'Replaces sneakers when sneakers are too casual, and replaces Oxfords when Oxfords are too rigid. Seamlessly pairs with flannel & chinos.',
      synergyGain: '+11 Ensembles',
      multiplier: '+19% Closet Power',
      recommendedBrands: ['Baudoin & Lange', 'Edward Green', 'Crockett & Jones'],
      icon: '👞',
      active: false
    }
  ]);

  const toggleGap = (id: string) => {
    setGaps(gaps.map(g => g.id === id ? { ...g, active: !g.active } : g));
  };

  const activeCount = gaps.filter(g => g.active).length;
  const totalCombos = 32 + (activeCount * 14);

  return (
    <section id="gap-analysis" className="py-24 relative bg-[var(--bg-canvas)] border-t border-[var(--border-card)] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[var(--border-gold)] bg-[var(--pill-bg)]">
            <BrainCircuit className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
            <span className="text-[11px] tracking-[0.2em] uppercase font-semibold text-[var(--gold-primary)] font-mono">
              PREDICTIVE CLOSET GRAPH
            </span>
          </div>

          <h2 className="font-serif-luxury text-3xl sm:text-5xl font-normal text-[var(--text-heading)]">
            Closet Gap <br />
            <span className="italic font-light gold-gradient-text">Intelligence Engine</span>
          </h2>

          <p className="text-sm sm:text-base text-[var(--text-body)] font-light">
            Stop buying pieces that sit unused in tissue paper. OTD computes the graph-connectivity 
            of your wardrobe to recommend the exact capsule pieces that multiply your total outfits.
          </p>
        </div>

        {/* Live Simulation Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-10 border border-[var(--border-card)] max-w-5xl mx-auto shadow-xl">
          
          {/* Header Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 border-b border-[var(--border-card)] items-center">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] block font-medium">Sample Wardrobe (Demo)</span>
              <span className="font-serif-luxury text-3xl text-[var(--text-heading)] font-medium">32 Sample Pieces</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] block font-medium">Simulated Combinations</span>
              <div className="flex items-center gap-2">
                <span className="font-serif-luxury text-3xl text-[var(--gold-primary)] font-bold">{totalCombos} Outfits</span>
                <span className="text-xs font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/25 font-semibold">
                  +{activeCount * 14} new
                </span>
              </div>
            </div>
            <div className="text-left md:text-right">
              <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] block font-medium">Simulated Efficiency Index</span>
              <span className="text-sm font-semibold text-[#10B981] flex items-center md:justify-end gap-1">
                <TrendingUp className="w-4 h-4" /> 94.6% Projected Utility (Demo)
              </span>
            </div>
          </div>

          {/* Interactive Gaps List */}
          <div className="py-8 space-y-4">
            <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">
              Identified Strategic Missing Staples (Click to simulate impact):
            </div>

            {gaps.map((gap) => (
              <div
                key={gap.id}
                className={`p-5 sm:p-6 rounded-2xl border transition-all duration-300 space-y-3 ${
                  gap.active
                    ? 'border-[var(--gold-primary)] bg-[var(--bg-card-elevated)] shadow-lg ring-1 ring-[var(--gold-primary)]/20'
                    : 'border-[var(--border-card)] bg-[var(--bg-card)] opacity-75 hover:opacity-100'
                }`}
              >
                <button
                  type="button"
                  aria-pressed={gap.active}
                  aria-label={`Simulate impact of adding ${gap.title}. Category: ${gap.category}. Status: ${gap.active ? 'active' : 'inactive'}`}
                  onClick={() => toggleGap(gap.id)}
                  className="w-full text-left flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-card-inner)] border border-[var(--border-card)] flex items-center justify-center text-2xl shrink-0 shadow-sm">
                      {gap.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--gold-primary)] font-semibold">
                          {gap.category}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">·</span>
                        <span className="text-[10px] font-mono text-[#10B981] font-semibold">{gap.multiplier}</span>
                      </div>
                      <h4 className="text-sm sm:text-base font-semibold text-[var(--text-heading)] mb-1">
                        {gap.title}
                      </h4>
                      <p className="text-xs text-[var(--text-body)] max-w-xl leading-relaxed">
                        {gap.rationale}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:flex-col md:items-end shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--border-card)]">
                    <span className="font-serif-luxury text-xl font-bold text-[var(--gold-primary)]">
                      {gap.synergyGain}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        gap.active ? 'bg-[var(--gold-primary)] text-white dark:text-black font-bold' : 'border border-[var(--border-card)] text-[var(--text-muted)]'
                      }`}>
                        {gap.active ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3" />}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] font-medium">
                        {gap.active ? 'Active in Simulation' : 'Click to Include'}
                      </span>
                    </div>
                  </div>
                </button>

                <div className="pt-2 border-t border-[var(--border-card)]/60 flex flex-wrap items-center gap-2 text-[10px] text-[var(--text-muted)]">
                  <span>Curated by:</span>
                  {gap.recommendedBrands.map((b, bIdx) => (
                    <span key={bIdx} className="bg-[var(--bg-card-inner)] px-2 py-0.5 rounded text-[var(--text-heading)] border border-[var(--border-card)] font-medium">
                      {b}
                    </span>
                  ))}

                  {/* Shopping list synergy action */}
                  {isItemInShoppingList(gap.title) ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--gold-primary)] bg-[var(--gold-primary)]/15 px-2 py-0.5 rounded-full border border-[var(--gold-primary)]/40 ml-auto">
                      <Check className="w-3 h-3 text-[var(--gold-primary)] stroke-[3]" />
                      <span>In Shopping List</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (!isAuthenticated) {
                          setGuestPromptTitle(`Save "${gap.title}" to Wishlist`);
                          return;
                        }
                        addToShoppingList({
                          name: gap.title,
                          category: gap.category.toLowerCase().includes('outerwear')
                            ? 'outerwear'
                            : gap.category.toLowerCase().includes('footwear')
                            ? 'footwear'
                            : 'tops',
                          subType: gap.category,
                          stylingNote: gap.rationale,
                          icon: gap.icon,
                          brand: gap.recommendedBrands[0],
                          outfitContext: {
                            occasion: 'Capsule Wardrobe Expansion',
                            outfitTitle: 'OTD Strategic Wardrobe Gap',
                          },
                        });
                      }}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--gold-primary)] hover:text-black hover:bg-[var(--gold-primary)] dark:hover:text-black border border-[var(--border-gold)] px-2.5 py-0.5 rounded-full transition-all cursor-pointer shadow-2xs ml-auto"
                      title="Add this gap recommendation to your shopping ledger"
                    >
                      <ShoppingBag className="w-2.5 h-2.5" />
                      <span>Add to Shopping List</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-[var(--border-card)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[var(--text-muted)]">
              * Interactive demo projection on a sample 32-piece wardrobe — live Closet AI graph scoring connects in Cloud Phase 2.
            </div>
            <a
              href="#download"
              className="gold-btn-outline px-6 py-3 rounded-full text-xs flex items-center gap-2"
            >
              <span>Scan Your Wardrobe Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>


        </div>

      </div>

      <GuestRegistrationPromptModal
        isOpen={!isAuthenticated && guestPromptTitle !== null}
        action="wishlist"
        actionTitle={guestPromptTitle || undefined}
        redirectTo="/shopping"
        onClose={() => setGuestPromptTitle(null)}
      />
    </section>
  );
};
