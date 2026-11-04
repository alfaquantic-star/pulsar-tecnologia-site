import React from 'react';
import { 
  PhoneCall, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Lock, 
  CreditCard, 
  Zap, 
  Truck,
  ArrowUp
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const Footer: React.FC = () => {
  const { 
    settings, 
    setCurrentView, 
    setSelectedInstitutionalTopic,
    openAuthModal,
    currentUser
  } = useStore();

  const handleOpenPage = (topic: string) => {
    setSelectedInstitutionalTopic(topic);
    setCurrentView('institucional');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#09090B] border-t border-white/10 text-slate-400 text-xs relative">
      {/* WhatsApp Floating Contact Action */}
      <a
        href={`https://wa.me/${settings.whatsappNumber}?text=Olá!%20Estou%20no%20site%20da%20Pulsar%20Tecnologia%20e%20gostaria%20de%20tirar%20dúvidas%20sobre%20as%20placas`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black shadow-2xl shadow-emerald-500/40 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group"
        aria-label="Atendimento via WhatsApp"
      >
        <PhoneCall className="w-6 h-6 text-black" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out font-black text-xs px-0 group-hover:px-2 text-black">
          Falar no WhatsApp
        </span>
      </a>

      {/* Main Footer Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info & Identity PDF */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={settings.logoUrl}
                alt="Pulsar Tecnologia"
                className="h-10 w-auto object-contain rounded-md border border-white/10"
              />
              <div>
                <span className="font-extrabold text-white text-base tracking-wider block">
                  PULSAR TECNOLOGIA
                </span>
                <span className="text-[10px] text-[#FFAA00] font-bold tracking-widest uppercase">
                  {settings.slogan}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Plataforma líder em soluções físicas de captação de avaliações 5 estrelas no Google, tecnologia por aproximação NFC, QR Code dinâmico e autoridade digital para negócios locais.
            </p>
          </div>

          {/* Categories Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Categorias & Placas
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setCurrentView('products')}
                  className="hover:text-white transition"
                >
                  Placas Google Avaliações
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('products')}
                  className="hover:text-white transition"
                >
                  Placas Acrílico Black Piano
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('combos')}
                  className="text-[#FFAA00] font-bold hover:underline transition"
                >
                  Kits Promocionais (-40%)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('products')}
                  className="hover:text-white transition"
                >
                  Displays de Balcão e Recepção
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('products')}
                  className="hover:text-white transition"
                >
                  Cartões NFC de Bolso
                </button>
              </li>
            </ul>
          </div>

          {/* Institutional Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Institucional
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleOpenPage('sobre')}
                  className="hover:text-white transition"
                >
                  Sobre a Pulsar Tecnologia
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleOpenPage('como-funciona')}
                  className="hover:text-white transition"
                >
                  Como Funciona o Chip NFC
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleOpenPage('privacidade')}
                  className="hover:text-white transition"
                >
                  Política de Privacidade
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleOpenPage('termos')}
                  className="hover:text-white transition"
                >
                  Termos de Uso
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleOpenPage('trocas')}
                  className="hover:text-white transition"
                >
                  Trocas e Devoluções
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Atendimento & Suporte
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>WhatsApp: (11) 99999-8888</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#FFAA00] flex-shrink-0" />
                <span>{settings.supportEmail}</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#FF5500] flex-shrink-0" />
                <span>São Paulo - SP • CEP {settings.originCep}</span>
              </li>
              <li className="text-[11px] text-slate-500 pt-1">
                Segunda a Sexta: 08h às 19h
              </li>
            </ul>
          </div>
        </div>

        {/* Security & Partner Badges */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Mercado Pago Integrado
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <Truck className="w-4 h-4 text-blue-400" />
              Melhor Envio & Correios
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <Lock className="w-4 h-4 text-[#FFAA00]" />
              Conexão Segura SSL 256-Bit
            </span>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <span>Voltar ao topo</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Legal Disclaimer & Restricted Admin Access */}
        <div className="pt-4 border-t border-white/5 text-center text-[11px] text-slate-500 space-y-2">
          <p>© 2026 Pulsar Tecnologia Ltda. Todos os direitos reservados. CNPJ: 45.891.203/0001-92.</p>
          <p>
            Google, Google Reviews e Google Meu Negócio são marcas registradas da Google LLC. Este produto não possui afiliação direta, sendo uma ferramenta tecnológica facilitadora de aproximação física para links públicos.
          </p>
          <div className="pt-1">
            <button
              onClick={() => {
                if (currentUser?.role === 'admin' && currentUser?.email.toLowerCase() === 'contatoviniciuscastro@gmail.com') {
                  setCurrentView('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  openAuthModal('admin');
                }
              }}
              className="text-[10px] text-slate-600 hover:text-purple-400 transition inline-flex items-center gap-1 opacity-70 hover:opacity-100"
            >
              <span>🔒 Acesso Restrito / Lojista (Painel Administrativo)</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
