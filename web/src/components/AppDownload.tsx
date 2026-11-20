import { useEffect, useRef, useState } from 'react';
import { Smartphone, Copy, Check, ArrowRight } from 'lucide-react';

interface AppDownloadProps {
  onOpenModal: () => void;
}

export const AppDownload: React.FC<AppDownloadProps> = ({ onOpenModal }) => {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleCopyLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    setCopied(true);
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => {
      copyTimerRef.current = null;
      setCopied(false);
    }, 2000);
  };

  return (
    <section id="download" className="py-24 relative bg-[var(--bg-canvas)] border-t border-[var(--border-card)] overflow-hidden transition-colors duration-300">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[var(--gold-primary)]/8 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="glass-card rounded-3xl p-8 sm:p-14 border border-[var(--border-card)] shadow-xl relative overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[var(--border-gold)] bg-[var(--pill-bg)]">
                <Smartphone className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                <span className="text-[11px] tracking-[0.2em] uppercase font-semibold text-[var(--gold-primary)] font-mono">
                  MOBILE COMPANION · EARLY BETA
                </span>
              </div>

              <h2 className="font-serif-luxury text-3xl sm:text-5xl font-normal text-[var(--text-heading)] leading-tight">
                Your Outfit Of The Day <br />
                <span className="italic font-light gold-gradient-text">Wherever You Travel</span>
              </h2>


              <p className="text-sm sm:text-base text-[var(--text-body)] font-light leading-relaxed">
                Our native Android companion is currently in private pre-release preparation. 
                Today, you can use the full responsive OTD Web Atelier from any desktop or mobile browser 
                while the native Android package completes release verification.
              </p>

              {/* Specs & Release Status Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-[var(--bg-card-inner)] border border-[var(--border-card)]">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block font-medium">Platform</span>
                  <span className="text-xs font-semibold text-[var(--text-heading)]">Android Native</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-card-inner)] border border-[var(--border-card)]">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block font-medium">Release Status</span>
                  <span className="text-xs font-mono text-[var(--gold-primary)] font-bold">Coming Soon (Beta)</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-card-inner)] border border-[var(--border-card)] col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block font-medium">Web Access</span>
                  <span className="text-xs font-semibold text-[#10B981]">Available Now</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={onOpenModal}
                  className="gold-btn w-full sm:w-auto px-8 py-4 rounded-full text-xs flex items-center justify-center gap-3 cursor-pointer shadow-md"
                >
                  <span>Android Beta Release Info</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="gold-btn-outline w-full sm:w-auto px-6 py-4 rounded-full text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Web Studio URL Copied!' : 'Copy Web Studio Link'}</span>
                </button>
              </div>

              {/* 3 Step Mobile Access Guide */}
              <div className="pt-6 border-t border-[var(--border-card)]">
                <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-3">
                  Use OTD On Any Phone Today:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[var(--text-body)]">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--pill-bg)] text-[var(--gold-primary)] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 border border-[var(--border-gold)]">
                      1
                    </span>
                    <span>Open the responsive OTD Web Studio in your mobile browser</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--pill-bg)] text-[var(--gold-primary)] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 border border-[var(--border-gold)]">
                      2
                    </span>
                    <span>Capture and upload closet garments straight from camera or gallery</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--pill-bg)] text-[var(--gold-primary)] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 border border-[var(--border-gold)]">
                      3
                    </span>
                    <span>Watch this space for signed Android APK beta availability</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Phone Mockup & QR Column */}
            <div className="lg:col-span-5 flex flex-col items-center">
              
              {/* Luxury Device Silhouette */}
              <div className="relative w-64 sm:w-72 rounded-[40px] p-3 bg-gradient-to-b from-[var(--border-gold)] via-[var(--bg-card)] to-[var(--bg-card-inner)] border border-[var(--border-gold)] shadow-xl">
                {/* Inner Screen */}
                <div className="rounded-[32px] overflow-hidden bg-[var(--bg-canvas)] border border-[var(--border-card)] p-4 text-[var(--text-body)] space-y-4">
                  
                  {/* Phone Status Bar */}
                  <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] px-2 font-mono">
                    <span>09:41</span>
                    <div className="w-16 h-3.5 bg-black/40 dark:bg-black rounded-full mx-auto" />
                    <span>5G · 100%</span>
                  </div>

                  {/* App Header with Logo */}
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-2">
                      <img src="/otd_logo.png" alt="OTD" className="w-6 h-7 object-contain" />
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-[var(--gold-primary)] block font-mono font-semibold">OTD</span>
                        <span className="text-xs font-serif-luxury font-bold text-[var(--text-heading)]">Outfit Of The Day</span>
                      </div>
                    </div>

                    <div className="w-7 h-7 rounded-full bg-[var(--pill-bg)] border border-[var(--border-gold)] flex items-center justify-center text-xs">
                      ✨
                    </div>
                  </div>

                  {/* Today Card in Mockup */}
                  <div className="p-3 rounded-2xl bg-[var(--bg-card-elevated)] border border-[var(--border-card)] space-y-2 shadow-sm">
                    <div className="flex justify-between text-[9px] text-[var(--text-muted)]">
                      <span>Today's Outfit</span>
                      <span className="text-[var(--gold-primary)] font-medium">Milan · 14°C</span>
                    </div>
                    <div className="text-sm font-serif-luxury font-medium text-[var(--text-heading)]">
                      The Sovereign Double-Breasted
                    </div>
                    <div className="grid grid-cols-3 gap-1 pt-1">
                      <div className="h-14 bg-[var(--bg-card-inner)] rounded-lg border border-[var(--border-card)] flex items-center justify-center text-lg">
                        🧥
                      </div>
                      <div className="h-14 bg-[var(--bg-card-inner)] rounded-lg border border-[var(--border-card)] flex items-center justify-center text-lg">
                        👔
                      </div>
                      <div className="h-14 bg-[var(--bg-card-inner)] rounded-lg border border-[var(--border-card)] flex items-center justify-center text-lg">
                        👞
                      </div>
                    </div>
                  </div>

                  {/* Bottom Navigation Mock */}
                  <div className="flex justify-around text-base pt-2 text-[var(--text-muted)] border-t border-[var(--border-card)]">
                    <span className="text-[var(--gold-primary)]">✦</span>
                    <span>🧥</span>
                    <span>📷</span>
                    <span>🔍</span>
                    <span>👤</span>
                  </div>

                </div>
              </div>

              {/* Direct Web Access Hint */}
              <div className="mt-6 flex items-center gap-3 bg-[var(--bg-card-inner)] px-4 py-2.5 rounded-full border border-[var(--border-card)] text-xs text-[var(--text-body)] shadow-sm">
                <Smartphone className="w-4 h-4 text-[var(--gold-primary)]" />
                <span>Responsive Web Atelier live now · Android APK coming soon</span>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
