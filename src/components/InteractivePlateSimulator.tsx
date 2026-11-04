import React, { useState } from 'react';
import { 
  Smartphone, 
  QrCode, 
  Star, 
  Wifi, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  RotateCcw
} from 'lucide-react';

export const InteractivePlateSimulator: React.FC = () => {
  const [businessName, setBusinessName] = useState('Pulsar Café & Bistrô');
  const [activeMode, setActiveMode] = useState<'idle' | 'nfc-approaching' | 'scanned'>('idle');
  const [ratingSelected, setRatingSelected] = useState(5);

  const triggerNfcTap = () => {
    setActiveMode('nfc-approaching');
    setTimeout(() => {
      setActiveMode('scanned');
    }, 900);
  };

  const triggerQrScan = () => {
    setActiveMode('nfc-approaching');
    setTimeout(() => {
      setActiveMode('scanned');
    }, 800);
  };

  const resetSimulator = () => {
    setActiveMode('idle');
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#14141B] via-[#0D0D12] to-[#09090B] border border-[#FF5500]/30 p-6 sm:p-10 shadow-2xl">
      {/* Background glow circle */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#FF5500]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#FFAA00]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Controls & Explanation */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5500]/20 border border-[#FF5500]/40 text-[#FFAA00] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulador Interativo em Tempo Real</span>
          </div>

          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Veja como seu cliente avalia em <span className="text-gradient-pulsar">menos de 2 segundos</span>
            </h3>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Digite o nome do seu estabelecimento abaixo e faça o teste interativo de aproximação NFC ou leitura de QR Code.
            </p>
          </div>

          {/* Business Name Input */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Nome da sua Empresa no Balcão:
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ex: Minha Clínica, Restaurante..."
              className="w-full bg-[#181820] text-white font-semibold text-sm px-4 py-2.5 rounded-xl border border-white/15 focus:outline-none focus:border-[#FF5500] transition"
              maxLength={35}
            />
          </div>

          {/* Interaction Trigger Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={triggerNfcTap}
              disabled={activeMode !== 'idle'}
              className="flex-1 min-w-[200px] px-5 py-3.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#FFAA00] text-black font-extrabold text-sm shadow-lg shadow-[#FF5500]/30 hover:shadow-[#FF5500]/50 hover:scale-[1.02] active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Wifi className="w-4 h-4 rotate-90" />
              <span>Aproximar Celular (NFC)</span>
            </button>

            <button
              onClick={triggerQrScan}
              disabled={activeMode !== 'idle'}
              className="flex-1 min-w-[180px] px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/15 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <QrCode className="w-4 h-4 text-[#FFAA00]" />
              <span>Apontar Câmera (QR Code)</span>
            </button>

            {activeMode !== 'idle' && (
              <button
                onClick={resetSimulator}
                className="p-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
                title="Reiniciar Simulação"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Benefits bullets */}
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Sem aplicativo necessário</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Compatível com iPhone & Android</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Abre tela oficial do Google</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Sem pilhas ou fios no balcão</span>
            </div>
          </div>
        </div>

        {/* Right Side: Visual Plate & Smartphone Demonstration */}
        <div className="lg:col-span-6 flex flex-col sm:flex-row items-center justify-center gap-6">
          {/* Physical Plate Mockup */}
          <div className="relative w-56 h-72 rounded-2xl bg-gradient-to-b from-[#181820] via-[#0F0F14] to-[#09090B] p-4 border-2 border-white/15 shadow-2xl flex flex-col justify-between items-center text-center transform hover:rotate-1 transition duration-300">
            {/* Top Google & Brand Header */}
            <div className="w-full flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-[11px] text-white">Google</span>
                <span className="text-[9px] text-[#FFAA00] font-bold">Reviews</span>
              </div>
              <div className="h-1.5 w-1.5 rounded-full bg-[#FF5500]" />
            </div>

            {/* Business Name on plate */}
            <div className="my-2">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Avalie-nos no Google</p>
              <h4 className="text-sm font-extrabold text-white mt-0.5 line-clamp-2 px-1 text-gradient-silver">
                {businessName || 'Seu Estabelecimento'}
              </h4>
              <div className="flex justify-center gap-1 mt-1 text-[#FFAA00]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-current" />
                ))}
              </div>
            </div>

            {/* NFC Wave Radar Target */}
            <div className="relative my-2 flex items-center justify-center">
              {activeMode === 'nfc-approaching' && (
                <div className="absolute inset-0 -m-4 rounded-full border-2 border-[#FF5500] animate-nfc-pulse pointer-events-none" />
              )}
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#FF5500]/30 to-[#FFAA00]/20 border border-[#FF5500] flex flex-col items-center justify-center text-[#FFAA00] shadow-lg shadow-[#FF5500]/20">
                <Wifi className="w-6 h-6 rotate-90" />
                <span className="text-[7px] font-black tracking-widest text-white mt-0.5">NFC TAP</span>
              </div>
            </div>

            {/* QR Code fallback */}
            <div className="w-full pt-2 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="p-1 bg-white rounded">
                  <QrCode className="w-6 h-6 text-black" />
                </div>
                <div className="text-left">
                  <p className="text-[8px] font-bold text-white leading-none">Aponte a</p>
                  <p className="text-[8px] text-[#FFAA00] font-bold leading-none mt-0.5">Câmera</p>
                </div>
              </div>
              <span className="text-[8px] font-bold text-slate-400 tracking-wider">PULSAR</span>
            </div>
          </div>

          {/* Smartphone Response Mockup */}
          <div className="relative w-64 h-[340px] rounded-[36px] bg-black p-3 border-4 border-slate-700 shadow-2xl flex flex-col overflow-hidden">
            {/* Dynamic island notch */}
            <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-2 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
            </div>

            {/* Phone Screen */}
            <div className="flex-1 rounded-[26px] bg-[#121217] p-3 flex flex-col justify-between overflow-hidden">
              {activeMode === 'idle' && (
                <div className="h-full flex flex-col items-center justify-center text-center p-3 text-slate-400">
                  <Smartphone className="w-8 h-8 text-slate-500 mb-2 animate-bounce" />
                  <p className="text-xs font-semibold text-slate-300">Aguardando aproximação...</p>
                  <p className="text-[10px] mt-1 text-slate-500">
                    Toque no botão ao lado para testar a experiência do seu cliente
                  </p>
                </div>
              )}

              {activeMode === 'nfc-approaching' && (
                <div className="h-full flex flex-col items-center justify-center text-center p-3">
                  <div className="w-12 h-12 rounded-full bg-[#FF5500]/20 border border-[#FF5500] flex items-center justify-center text-[#FFAA00] animate-spin mb-3">
                    <Wifi className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-white">Chip NFC Detectado!</p>
                  <p className="text-[10px] text-slate-400 mt-1">Carregando perfil Google...</p>
                </div>
              )}

              {activeMode === 'scanned' && (
                <div className="h-full flex flex-col justify-between animate-in zoom-in-95 duration-200">
                  {/* Google review modal mockup */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-white/10">
                      <div className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] font-black">
                        G
                      </div>
                      <span className="text-[11px] font-bold text-white">Google Avaliações</span>
                    </div>

                    <div>
                      <h5 className="text-xs font-black text-white truncate">{businessName}</h5>
                      <p className="text-[9px] text-slate-400">Compartilhe sua experiência no local</p>
                    </div>

                    {/* Interactive 5-star selector */}
                    <div className="bg-white/5 p-2 rounded-xl text-center">
                      <p className="text-[9px] font-bold text-[#FFAA00] mb-1">Dê sua nota de 1 a 5:</p>
                      <div className="flex justify-center gap-1 text-[#FFAA00]">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRatingSelected(star)}
                            className="p-0.5 hover:scale-125 transition"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                star <= ratingSelected ? 'fill-[#FFAA00] text-[#FFAA00]' : 'text-slate-600'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-black/40 border border-white/5 text-[9px] text-slate-300">
                      "Excelente atendimento! Super recomendo."
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      alert('Em um smartphone real, a avaliação é salva no Google Meu Negócio do seu estabelecimento!');
                    }}
                    className="w-full py-1.5 rounded-lg bg-emerald-500 text-white font-bold text-[10px] shadow"
                  >
                    Publicar Avaliação Google
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
