import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Wifi, 
  CheckCircle2
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const HeroSection: React.FC = () => {
  const { settings, setCurrentView } = useStore();

  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:py-20 bg-radial-pulsar">
      {/* Dynamic Background Energy Rings */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[600px] sm:h-[900px] bg-gradient-to-b from-[#FF5500]/15 via-[#FFAA00]/5 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Super Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-[#FF5500]/40 backdrop-blur-md shadow-lg shadow-[#FF5500]/10">
              <span className="flex h-2 w-2 rounded-full bg-[#FF5500] animate-pulse" />
              <span className="text-xs font-black tracking-widest text-[#FFAA00] uppercase">
                {settings.heroBadge}
              </span>
            </div>

            {/* Main Headline with balanced wrap */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.18] max-w-2xl mx-auto lg:mx-0">
              {settings.heroTitle}{' '}
              <span className="text-gradient-pulsar drop-shadow-[0_0_25px_rgba(255,85,0,0.4)] block sm:inline-block">
                {settings.heroTitleHighlight}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              {settings.heroSubtitle}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start pt-2">
              <button
                onClick={() => {
                  const combosEl = document.getElementById('combos');
                  if (combosEl) {
                    combosEl.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    setCurrentView('combos');
                  }
                }}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#FF5500] to-[#FFAA00] text-black font-black text-sm sm:text-base shadow-xl shadow-[#FF5500]/30 hover:shadow-[#FF5500]/50 hover:scale-[1.02] active:scale-95 transition flex items-center justify-center gap-2.5"
              >
                <span>Ver Kits com até 40% OFF</span>
                <ArrowRight className="w-5 h-5 text-black" />
              </button>

              <button
                onClick={() => {
                  const simEl = document.getElementById('simulator');
                  if (simEl) {
                    simEl.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    setCurrentView('products');
                  }
                }}
                className="px-6 py-4 rounded-2xl bg-[#14141B] hover:bg-[#1A1A24] text-white font-bold text-sm sm:text-base border border-white/15 transition flex items-center justify-center gap-2"
              >
                <Wifi className="w-4 h-4 text-[#FFAA00] rotate-90" />
                <span>Testar Simulador de Aproximação</span>
              </button>
            </div>

            {/* Trust points */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-3 text-left">
              <div>
                <p className="text-xl sm:text-2xl font-black text-white">+300%</p>
                <p className="text-[11px] text-slate-400">Avaliações em 30 dias</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-white">15.000+</p>
                <p className="text-[11px] text-slate-400">Placas entregues no BR</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-white">99.8%</p>
                <p className="text-[11px] text-slate-400">Taxa de aprovação 5★</p>
              </div>
            </div>
          </div>

          {/* Right Column: new Google NFC / QR review plaque replacing old mockup */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#FF5500]/20 via-[#FFAA00]/10 to-transparent rounded-full blur-2xl pointer-events-none" />
            <div className="relative w-full max-w-[440px] mx-auto px-2 py-5 sm:py-0">
              <div className="absolute top-1 right-0 z-20 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500 text-black font-extrabold text-[10px] sm:text-xs shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>1 Toque = 5 Estrelas</span>
              </div>
              <img
                src="/assets/placa-smart-google-nfc.svg"
                alt="Placa Smart de Avaliações Google em PVC, com tecnologia NFC e QR Code"
                width={520}
                height={690}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="relative block w-full h-auto max-h-[560px] object-contain rounded-[28px] drop-shadow-[0_18px_35px_rgba(255,100,0,0.25)] transition-transform duration-500 hover:scale-[1.025]"
              />
              <div className="mt-3 flex flex-wrap justify-center gap-2 text-[10px] sm:text-xs text-slate-300">
                <span className="rounded-full border border-[#FF5500]/40 bg-[#16151C] px-3 py-1">Tecnologia NFC</span>
                <span className="rounded-full border border-[#FF5500]/40 bg-[#16151C] px-3 py-1">QR Code</span>
                <span className="rounded-full border border-[#FF5500]/40 bg-[#16151C] px-3 py-1">PVC resistente</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
