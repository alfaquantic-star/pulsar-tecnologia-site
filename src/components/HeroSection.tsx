import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Wifi, 
  Star, 
  ShieldCheck, 
  Truck, 
  TrendingUp, 
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

          {/* Right Column: Hero Visual Product Floating with NFC Glow */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Background Halo */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#FF5500]/20 via-[#FFAA00]/10 to-transparent rounded-full blur-2xl" />

            {/* Glowing 3D Plate Card or Custom Hero Mockup */}
            {settings.heroImageUrl ? (
              <div className="relative max-w-sm rounded-3xl overflow-hidden border-2 border-[#FF5500]/50 shadow-2xl shadow-[#FF5500]/30 transform hover:scale-105 transition-all duration-500">
                <div className="absolute -top-3 -right-3 z-20 bg-emerald-500 text-black font-extrabold text-xs px-3.5 py-1.5 rounded-2xl shadow-xl flex items-center gap-1.5 animate-bounce">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>1 Toque = 5 Estrelas</span>
                </div>
                <img src={settings.heroImageUrl} alt="Placa Pulsar" className="w-full h-auto object-cover max-h-96" />
              </div>
            ) : (
              <div className="relative w-72 sm:w-80 rounded-3xl bg-gradient-to-b from-[#181820] via-[#121217] to-[#09090B] p-6 border-2 border-[#FF5500]/50 shadow-2xl shadow-[#FF5500]/25 transform hover:scale-105 hover:-rotate-1 transition-all duration-500">
                {/* Floating notification badge */}
                <div className="absolute -top-4 -right-4 bg-emerald-500 text-black font-extrabold text-xs px-3.5 py-1.5 rounded-2xl shadow-xl flex items-center gap-1.5 animate-bounce">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>1 Toque = 5 Estrelas</span>
                </div>

                {/* Plate Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-xs text-white">PULSAR</span>
                    <span className="text-[10px] text-[#FFAA00] font-bold">SMART PLATE</span>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-[#FF5500] animate-ping" />
                </div>

                {/* Plate Body */}
                <div className="my-6 text-center space-y-3">
                  <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold">
                    Avalie Nossa Empresa
                  </p>
                  <h3 className="text-lg font-black text-white text-gradient-silver">
                    Sua Empresa no Balcão
                  </h3>

                  <div className="flex justify-center gap-1 text-[#FFAA00]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current drop-shadow-[0_0_8px_rgba(255,170,0,0.8)]" />
                    ))}
                  </div>

                  {/* NFC Center Sensor */}
                  <div className="relative py-4 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-[#FF5500]/40 animate-nfc-pulse pointer-events-none" />
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#FF5500]/40 to-[#FFAA00]/20 border border-[#FF5500] flex flex-col items-center justify-center text-[#FFAA00] shadow-xl shadow-[#FF5500]/30">
                      <Wifi className="w-8 h-8 rotate-90" />
                      <span className="text-[8px] font-black tracking-widest text-white mt-1">APROXIME</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Aproxime qualquer smartphone ou aponte a câmera para o QR Code
                  </p>
                </div>

                {/* Plate Footer */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                  <span>CHIP NTAG213 ULTRA</span>
                  <span className="text-[#FFAA00] font-bold">100% VITALÍCIO</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
