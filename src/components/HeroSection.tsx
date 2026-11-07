import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Wifi
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const HeroSection: React.FC = () => {
  const { settings, setCurrentView } = useStore();

  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:py-20 bg-radial-pulsar">
      {/* Dynamic Background Energy Rings */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[600px] sm:h-[900px] bg-gradient-to-b from-[#FF5500]/15 via-[#FFAA00]/5 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 items-center">
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
            {/* Super Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-[#FF5500]/40 backdrop-blur-md shadow-lg shadow-[#FF5500]/10">
              <span className="flex h-2 w-2 rounded-full bg-[#FF5500] animate-pulse" />
              <span className="text-xs font-black tracking-widest text-[#FFAA00] uppercase">
                {settings.heroBadge}
              </span>
            </div>

            {/* Main Headline with balanced wrap */}
            <h1 className="text-3xl sm:text-5xl lg:text-[clamp(2.1rem,3.5vw,3.7rem)] font-black text-white tracking-tight leading-[1.18] max-w-2xl mx-auto lg:mx-0">
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
            <div className="flex flex-col xl:flex-row gap-3.5 justify-center lg:justify-start pt-2">
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

          {/* Original horizontal product photo supplied by the shop owner.
              Show it in full, without cropping or overlaid duplicate badges. */}
          <div className="lg:col-span-7 relative min-w-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#FF5500]/20 via-[#FFAA00]/10 to-transparent rounded-[32px] blur-3xl pointer-events-none" />
            <div className="relative w-full max-w-[900px] mx-auto">
              <img
                src="https://d2ol7oe51mr4n9.cloudfront.net/user_3JDiTMIpNF3Cbb1ebZrnrdDTwQ3/0a10751f-8275-4c01-81e6-7668ee439787.png"
                alt="Placa Smart de Avaliações Google com NFC e QR Code, benefícios e botão Quero a minha Placa Smart"
                width={1672}
                height={941}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                referrerPolicy="no-referrer"
                className="block w-full h-auto object-contain rounded-2xl sm:rounded-[28px] shadow-2xl shadow-[#FF5500]/20"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
