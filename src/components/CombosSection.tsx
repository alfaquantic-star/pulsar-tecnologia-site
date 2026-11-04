import React, { useState } from 'react';
import { 
  Sparkles, 
  ShoppingBag, 
  Check, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  TrendingUp,
  Percent,
  Layers
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Kit } from '../types';

export const CombosSection: React.FC = () => {
  const { kits, addToCart, getKitAvailableStock, setIsCartDrawerOpen } = useStore();
  const [customNames, setCustomNames] = useState<Record<string, string>>({});

  const handleAddKit = (kit: Kit) => {
    const stockAvailable = getKitAvailableStock(kit);
    if (stockAvailable <= 0) return;

    const bName = customNames[kit.id] || '';

    addToCart({
      isKit: true,
      kitId: kit.id,
      name: kit.name,
      image: kit.image,
      unitPrice: kit.kitPrice,
      quantity: 1,
      sku: `KIT-${kit.slug.toUpperCase().substring(0, 8)}`,
      customization: bName ? { businessName: bName } : undefined
    });
  };

  return (
    <section id="combos" className="py-16 sm:py-24 relative overflow-hidden">
      {/* Background radial effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#FF5500]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF5500]/20 to-[#FFAA00]/20 border border-[#FF5500]/40 text-[#FFAA00] text-xs font-black uppercase tracking-widest shadow-sm">
            <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
            <span>Kits & Combos Promocionais</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Mais Placas, <span className="text-gradient-pulsar">Maior Desconto</span>
          </h2>

          <p className="text-base text-slate-300 leading-relaxed">
            Economize até <span className="text-white font-bold">40% de desconto</span> adquirindo os combos oficiais Pulsar. Estoque sincronizado diretamente em tempo real.
          </p>
        </div>

        {/* Combos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kits.filter((k) => k.isActive).map((kit) => {
            const stockAvailable = getKitAvailableStock(kit);
            const totalPlates = kit.items.reduce((s, it) => s + it.quantity, 0);
            const pricePerPlate = totalPlates > 0 ? (kit.kitPrice / totalPlates).toFixed(2) : kit.kitPrice;
            const isFeatured = kit.isFeatured || kit.savingsAmount >= 140;

            return (
              <div
                key={kit.id}
                className={`relative rounded-3xl transition-all duration-300 flex flex-col justify-between overflow-hidden group ${
                  isFeatured
                    ? 'bg-gradient-to-b from-[#1E1A22] to-[#121217] border-2 border-[#FF5500] shadow-2xl shadow-[#FF5500]/20 scale-[1.02] lg:-translate-y-2'
                    : 'bg-[#121217] border border-white/10 hover:border-white/20'
                }`}
              >
                {/* Promo Badge */}
                {kit.badge && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-[#FF5500] to-[#FFAA00] text-black text-[11px] font-black px-3.5 py-1 rounded-bl-2xl shadow-md uppercase tracking-wider">
                    {kit.badge}
                  </div>
                )}

                <div className="p-6 space-y-4">
                  {/* Photo with Overlay */}
                  <div className="relative h-44 rounded-2xl overflow-hidden bg-black/40 border border-white/10 group-hover:border-[#FF5500]/50 transition">
                    <img
                      src={kit.image}
                      alt={kit.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-transparent to-transparent opacity-80" />

                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur text-white text-xs font-bold border border-white/10">
                        {totalPlates} {totalPlates === 1 ? 'Placa' : 'Placas'}
                      </span>
                      {kit.savingsAmount > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-[#FF5500] text-white text-xs font-black shadow-md">
                          -{kit.discountPercentage}% OFF
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Audience */}
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-[#FFAA00] transition line-clamp-2">
                      {kit.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {kit.description}
                    </p>
                  </div>

                  {/* Price & Savings Box */}
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    {kit.savingsAmount > 0 ? (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 line-through">
                          De R$ {kit.referencePrice.toFixed(2)}
                        </span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Economize R$ {kit.savingsAmount.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400">Preço unitário padrão</div>
                    )}

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-semibold text-slate-400">R$</span>
                      <span className="text-3xl font-black text-white">
                        {kit.kitPrice.toFixed(2).split('.')[0]}
                      </span>
                      <span className="text-sm font-bold text-slate-300">
                        ,{kit.kitPrice.toFixed(2).split('.')[1]}
                      </span>
                      <span className="text-xs text-[#FFAA00] font-medium ml-1">à vista</span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-medium">
                      ou até 12x de R$ {(kit.kitPrice / 12 * 1.05).toFixed(2)} no cartão
                    </div>

                    {totalPlates > 1 && (
                      <div className="pt-1.5 border-t border-white/10 text-[11px] font-bold text-[#FFAA00]">
                        ⚡ Sai por apenas R$ {pricePerPlate} cada placa
                      </div>
                    )}
                  </div>

                  {/* Customization input for Kit */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Nome do seu Negócio (Opcional):
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Minha Empresa..."
                      value={customNames[kit.id] || ''}
                      onChange={(e) =>
                        setCustomNames({ ...customNames, [kit.id]: e.target.value })
                      }
                      className="w-full bg-[#181820] text-xs text-white px-3 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#FF5500]"
                    />
                  </div>

                  {/* Stock availability indicator */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Estoque Integrado:</span>
                    {stockAvailable > 0 ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        {stockAvailable} combos prontos para envio
                      </span>
                    ) : (
                      <span className="text-red-400 font-bold">Esgotado temporariamente</span>
                    )}
                  </div>
                </div>

                {/* Card CTA Footer */}
                <div className="p-6 pt-0">
                  <button
                    onClick={() => handleAddKit(kit)}
                    disabled={stockAvailable <= 0}
                    className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition duration-200 shadow-lg ${
                      stockAvailable > 0
                        ? isFeatured
                          ? 'bg-gradient-to-r from-[#FF5500] to-[#FFAA00] text-black shadow-[#FF5500]/30 hover:shadow-[#FF5500]/50 hover:scale-[1.02] active:scale-95'
                          : 'bg-white/10 hover:bg-[#FF5500] hover:text-black text-white border border-white/15'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{stockAvailable > 0 ? 'Adicionar Combo ao Carrinho' : 'Indisponível'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Corporate / Enterprise banner */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#181822] via-[#14141B] to-[#181822] border border-[#FF5500]/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-[#FF5500]/20 border border-[#FF5500]/40 text-[#FFAA00]">
              <Layers className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Precisa de 20, 50 ou mais placas para sua rede?</h4>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Fale com nossos consultores corporativos e receba condições exclusivas com faturamento CNPJ.
              </p>
            </div>
          </div>

          <a
            href="https://wa.me/5511999998888?text=Olá!%20Gostaria%20de%20um%20orçamento%20para%20mais%20de%2020%20placas%20Pulsar"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 whitespace-nowrap"
          >
            <span>Falar no WhatsApp Comercial</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
};
