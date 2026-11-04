import React, { useState } from 'react';
import { 
  StoreProvider, 
  useStore 
} from './context/StoreContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { InteractivePlateSimulator } from './components/InteractivePlateSimulator';
import { CombosSection } from './components/CombosSection';
import { ProductCard } from './components/ProductCard';
import { ProductDetailPage } from './components/ProductDetailPage';
import { CustomerArea } from './components/CustomerArea';
import { AdminPanel } from './components/AdminPanel';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/AuthModal';
import { InstitutionalPages } from './components/InstitutionalPages';
import { 
  Star, 
  Wifi, 
  ShieldCheck, 
  Truck, 
  Sparkles, 
  CheckCircle2, 
  ChevronDown, 
  ArrowRight,
  TrendingUp,
  Clock,
  Layers,
  Search
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    currentUser,
    openAuthModal,
    products,
    settings,
    activeNavCategory,
    setActiveNavCategory,
    searchQuery,
    setSearchQuery,
    toasts
  } = useStore();

  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  // If in admin view, enforce strict authentication
  if (currentView === 'admin') {
    const isAdmin = currentUser?.role === 'admin' && currentUser?.email.toLowerCase() === 'contatoviniciuscastro@gmail.com';
    if (!isAdmin) {
      setCurrentView('home');
      openAuthModal('admin');
      return null;
    }

    return (
      <div className="min-h-screen bg-[#09090B]">
        <AdminPanel />
        <AuthModal />
        <ToastContainer toasts={toasts} />
      </div>
    );
  }

  // Filter products by category & search
  const filteredProducts = products.filter((p) => {
    if (!p.isActive) return false;
    if (activeNavCategory !== 'todos') {
      if (activeNavCategory === 'placas-google' && p.category !== 'placas-google') return false;
      if (activeNavCategory === 'placas-nfc' && p.category !== 'placas-nfc') return false;
      if (activeNavCategory === 'acessorios' && p.category !== 'acessorios') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col text-slate-100 selection:bg-[#FF5500]/30 selection:text-[#FFAA00]">
      <Header />

      <main className="flex-1">
        {/* VIEW 1: HOME PAGE */}
        {currentView === 'home' && (
          <div>
            {/* Hero Section */}
            <HeroSection />

            {/* Fast Value Proposition Strip */}
            <div className="border-y border-white/10 bg-[#0E0E14] py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
                  <div className="flex flex-col md:flex-row items-center gap-3">
                    <div className="p-3 rounded-2xl bg-[#FF5500]/20 text-[#FFAA00]">
                      <Wifi className="w-5 h-5 rotate-90" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">Tecnologia por Aproximação</h4>
                      <p className="text-[11px] text-slate-400">NFC universal sem apps</p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">Melhor Envio & Correios</h4>
                      <p className="text-[11px] text-slate-400">Despacho ágil em até 24h</p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-3">
                    <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">Mercado Pago Protegido</h4>
                      <p className="text-[11px] text-slate-400">PIX ou 12x no cartão</p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-3">
                    <div className="p-3 rounded-2xl bg-[#FFAA00]/20 text-[#FFAA00]">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">Gravação Vitalícia</h4>
                      <p className="text-[11px] text-slate-400">1 ano de garantia total</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Best Sellers Section */}
            <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#FFAA00] text-xs font-bold uppercase tracking-wider mb-2">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>Mais Vendidas</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black text-white">
                    Placas Inteligentes de Avaliação Google
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Acabamento de alto luxo em acrílico Black Piano virgem e chips NFC de alta sensibilidade
                  </p>
                </div>

                <button
                  onClick={() => {
                    setCurrentView('products');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 self-start transition"
                >
                  <span>Ver Todos os Modelos</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.slice(0, 3).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>

            {/* SECTION 5: ADVANCED COMBOS & KITS (PRIORITY) */}
            <CombosSection />

            {/* Interactive Plate Simulator Section */}
            <section id="simulator" className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <InteractivePlateSimulator />
            </section>

            {/* How It Works 3-Step Banner */}
            <section className="py-16 bg-[#0E0E14] border-y border-white/10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                <div className="text-center max-w-2xl mx-auto space-y-3">
                  <span className="text-xs font-bold text-[#FFAA00] tracking-widest uppercase">
                    Simplicidade Absoluta
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-black text-white">
                    Como a Placa Funciona no seu Balcão
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="p-8 rounded-3xl bg-[#14141B] border border-white/10 space-y-4 relative">
                    <span className="text-5xl font-black text-white/10 absolute top-4 right-6 select-none">
                      01
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-[#FF5500]/20 border border-[#FF5500]/40 text-[#FFAA00] flex items-center justify-center font-bold text-lg">
                      1
                    </div>
                    <h3 className="text-lg font-bold text-white">Posicione no Caixa</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Coloque a placa no balcão de atendimento, recepção ou mesa. O visual moderno e espelhado atrai a atenção dos clientes naturalmente.
                    </p>
                  </div>

                  <div className="p-8 rounded-3xl bg-[#14141B] border border-white/10 space-y-4 relative">
                    <span className="text-5xl font-black text-white/10 absolute top-4 right-6 select-none">
                      02
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-[#FFAA00]/20 border border-[#FFAA00]/40 text-[#FFAA00] flex items-center justify-center font-bold text-lg">
                      2
                    </div>
                    <h3 className="text-lg font-bold text-white">Aproximação em 2s</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      O cliente aproxima o smartphone (iPhone ou Android) ou aponta a câmera para o QR Code. Uma notificação segura aparece na tela dele.
                    </p>
                  </div>

                  <div className="p-8 rounded-3xl bg-[#14141B] border border-white/10 space-y-4 relative">
                    <span className="text-5xl font-black text-white/10 absolute top-4 right-6 select-none">
                      03
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-lg">
                      3
                    </div>
                    <h3 className="text-lg font-bold text-white">Nota 5 Estrelas Salva</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      A página oficial de avaliação do seu Google abre com as 5 estrelas prontas. O cliente avalia antes mesmo de sair do seu comércio!
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Testimonials from Real Stores */}
            <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Depoimentos Reais de Clientes</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white">
                  Resultados Comprovados em Todo o Brasil
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {settings.testimonials.map((test) => (
                  <div
                    key={test.id}
                    className="p-6 rounded-3xl bg-[#14141B] border border-white/10 flex flex-col justify-between space-y-4 shadow-lg hover:border-[#FF5500]/40 transition"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex text-[#FFAA00]">
                          {[...Array(test.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold">
                          {test.reviewsIncreased}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 italic leading-relaxed">
                        "{test.quote}"
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                      <img
                        src={test.avatar}
                        alt={test.clientName}
                        className="w-10 h-10 rounded-full object-cover border border-[#FF5500]/40"
                      />
                      <div>
                        <h4 className="font-bold text-white text-xs">{test.clientName}</h4>
                        <p className="text-[11px] text-slate-400">{test.companyName} • {test.companyCity}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16 bg-[#0E0E14] border-t border-white/10">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    Perguntas Frequentes (FAQ)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Tudo o que você precisa saber sobre a Placa de Avaliação Google da Pulsar
                  </p>
                </div>

                <div className="space-y-3">
                  {settings.faqList.map((faq, index) => {
                    const isOpen = expandedFaqIndex === index;
                    return (
                      <div
                        key={index}
                        className="rounded-2xl bg-[#14141B] border border-white/10 overflow-hidden transition"
                      >
                        <button
                          onClick={() => setExpandedFaqIndex(isOpen ? null : index)}
                          className="w-full p-4 sm:p-5 text-left font-bold text-xs sm:text-sm text-white flex items-center justify-between gap-4 hover:text-[#FFAA00]"
                        >
                          <span>{faq.question}</span>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform ${
                              isOpen ? 'rotate-180 text-[#FF5500]' : ''
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-white/5 pt-3 animate-in fade-in">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: PRODUCTS CATALOG */}
        {currentView === 'products' && (
          <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-4xl font-black text-white">Catálogo de Placas & Tecnologias</h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Escolha o modelo ideal para o balcão da sua empresa com envio rápido para todo o Brasil
                </p>
              </div>

              {/* Search query tag */}
              {searchQuery && (
                <div className="flex items-center gap-2 text-xs bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                  <span>Filtrando por: <strong>"{searchQuery}"</strong></span>
                  <button onClick={() => setSearchQuery('')} className="text-[#FF5500] font-bold">Limpar</button>
                </div>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/10">
              {[
                { id: 'todos', label: 'Todos os Produtos' },
                { id: 'placas-google', label: 'Placas Google Avaliações' },
                { id: 'placas-nfc', label: 'Placas NFC & Multilink' },
                { id: 'acessorios', label: 'Cartões Portáteis & Acessórios' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveNavCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition ${
                    activeNavCategory === cat.id
                      ? 'bg-[#FF5500] text-black shadow-lg shadow-[#FF5500]/20'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Search className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">Nenhum produto encontrado</h3>
                <p className="text-xs text-slate-400">Tente ajustar a busca ou categoria.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveNavCategory('todos');
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold"
                >
                  Ver Todos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: COMBOS DEDICATED */}
        {currentView === 'combos' && (
          <div>
            <CombosSection />
          </div>
        )}

        {/* VIEW 4: PRODUCT DETAIL */}
        {currentView === 'product-detail' && <ProductDetailPage />}

        {/* VIEW 5: CUSTOMER ACCOUNT */}
        {currentView === 'customer-account' && <CustomerArea />}

        {/* VIEW 6: INSTITUTIONAL */}
        {currentView === 'institucional' && <InstitutionalPages />}
      </main>

      <Footer />

      {/* Global Modals & Drawers */}
      <CartDrawer />
      <CheckoutModal />
      <AuthModal />
      <ToastContainer toasts={toasts} />
    </div>
  );
};

// Toast notification component
const ToastContainer: React.FC<{ toasts: any[] }> = ({ toasts }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-3.5 rounded-2xl shadow-2xl text-xs font-bold border pointer-events-auto flex items-center gap-2 animate-in slide-in-from-bottom-2 ${
            toast.type === 'error'
              ? 'bg-red-950/90 text-red-200 border-red-500/50'
              : toast.type === 'info'
              ? 'bg-blue-950/90 text-blue-200 border-blue-500/50'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
          }`}
        >
          {toast.type === 'error' ? (
            <span className="text-red-400">✕</span>
          ) : (
            <span className="text-emerald-400">✓</span>
          )}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainAppContent />
    </StoreProvider>
  );
}
