import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  User, 
  ShieldCheck, 
  Menu, 
  X, 
  Sparkles, 
  Layers,
  PhoneCall,
  ChevronDown,
  LogOut,
  Sliders
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const Header: React.FC = () => {
  const {
    settings,
    cart,
    setIsCartDrawerOpen,
    currentView,
    setCurrentView,
    currentUser,
    logout,
    openAuthModal,
    searchQuery,
    setSearchQuery,
    setActiveNavCategory
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleNav = (view: any, category: string = 'todos') => {
    setActiveNavCategory(category);
    setCurrentView(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#09090B]/90 backdrop-blur-xl border-b border-white/10 transition-all">
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-[#181820] via-[#FF5500]/20 to-[#181820] border-b border-[#FF5500]/30 py-2 px-4 text-center text-xs text-slate-300 font-medium tracking-wide flex items-center justify-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-[#FF5500] animate-ping" />
        <span>{settings.announcementBarText}</span>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => handleNav('home')} 
          className="flex items-center gap-3 cursor-pointer group select-none flex-shrink-0"
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#FF5500] to-[#FFAA00] rounded-lg blur opacity-40 group-hover:opacity-80 transition duration-300" />
            <img 
              src={settings.logoUrl} 
              alt="Pulsar Tecnologia Logo" 
              className="relative h-12 w-auto object-contain rounded-md border border-white/10 shadow-lg transform group-hover:scale-105 transition-transform duration-300" 
            />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-wider text-white group-hover:text-[#FFAA00] transition-colors">
                PULSAR
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/40">
                PRO
              </span>
            </div>
            <p className="text-[9px] tracking-widest text-slate-400 font-medium uppercase">
              {settings.slogan}
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          <button
            onClick={() => handleNav('home')}
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
              currentView === 'home'
                ? 'text-[#FFAA00] bg-white/5 border border-[#FF5500]/40'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Início
          </button>

          <button
            onClick={() => handleNav('products', 'todos')}
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
              currentView === 'products'
                ? 'text-[#FFAA00] bg-white/5 border border-[#FF5500]/40'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Placas & Catálogo
          </button>

          <button
            onClick={() => handleNav('combos')}
            className={`relative px-3.5 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1.5 ${
              currentView === 'combos'
                ? 'text-white bg-gradient-to-r from-[#FF5500] to-[#FFAA00] shadow-md shadow-[#FF5500]/30'
                : 'text-[#FFAA00] bg-[#FF5500]/10 hover:bg-[#FF5500]/20 border border-[#FF5500]/30'
            }`}
          >
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span>Kits Promocionais</span>
            <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.2 rounded-full font-extrabold">
              -40%
            </span>
          </button>

          <button
            onClick={() => handleNav('institucional', 'como-funciona')}
            className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition"
          >
            Como Funciona NFC
          </button>
        </nav>

        {/* Search Bar */}
        <div className="hidden md:flex items-center relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Buscar placas, kits, NFC..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (currentView !== 'products') setCurrentView('products');
            }}
            className="w-full bg-[#121217] text-sm text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 border border-white/10 focus:outline-none focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              ×
            </button>
          )}
        </div>

        {/* Actions (Cart & User) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Account Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-1.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition"
              aria-label="Menu do Usuário"
            >
              <User className="w-4 h-4 text-[#FFAA00]" />
              <span className="hidden xl:inline text-xs font-semibold max-w-[120px] truncate">
                {currentUser ? currentUser.fullName.split(' ')[0] : 'Entrar'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {userMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#121217] border border-white/15 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2"
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                {currentUser ? (
                  <>
                    <div className="px-3 py-2 border-b border-white/10 mb-1">
                      <p className="text-xs text-slate-400">Conectado como</p>
                      <p className="text-sm font-bold text-white truncate">
                        {currentUser.fullName}
                      </p>
                      <p className="text-[11px] text-[#FFAA00]">
                        {currentUser.role === 'admin' ? 'Administrador Autorizado' : 'Cliente Pulsar'}
                      </p>
                    </div>

                    {/* Only show Admin Panel button if authenticated admin */}
                    {currentUser.role === 'admin' && currentUser.email.toLowerCase() === 'contatoviniciuscastro@gmail.com' && (
                      <button
                        onClick={() => {
                          handleNav('admin');
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold bg-purple-900/40 text-purple-200 border border-purple-500/30 hover:bg-purple-900/70 flex items-center gap-2 mb-1 transition"
                      >
                        <ShieldCheck className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <span>Painel Administrativo</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        handleNav('customer-account');
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-[#FF5500]" />
                      <span>Minha Conta & Pedidos</span>
                    </button>

                    <div className="border-t border-white/10 my-1" />

                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sair da conta</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="px-3 py-2 border-b border-white/10 mb-1">
                      <p className="text-sm font-bold text-white">Sua Conta</p>
                      <p className="text-[11px] text-slate-400">
                        Entre para acompanhar pedidos e entregas
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        openAuthModal('customer');
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-extrabold bg-[#FF5500] text-black hover:bg-[#FFAA00] flex items-center gap-2 mb-1 transition shadow-md shadow-[#FF5500]/20"
                    >
                      <User className="w-3.5 h-3.5 text-black" />
                      <span>Entrar / Cadastrar Cliente</span>
                    </button>

                    <div className="border-t border-white/10 my-1.5" />

                    <button
                      onClick={() => {
                        openAuthModal('admin');
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] text-slate-500 hover:text-purple-300 hover:bg-purple-950/20 flex items-center gap-1.5 transition"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                      <span>Acesso Lojista (Admin)</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Cart Button with Glow & Badge */}
          <button
            onClick={() => setIsCartDrawerOpen(true)}
            className="relative p-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#FFAA00] text-black font-bold hover:shadow-lg hover:shadow-[#FF5500]/40 transition transform active:scale-95 flex items-center justify-center"
            aria-label="Abrir carrinho"
          >
            <ShoppingBag className="w-5 h-5 text-black" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-white text-black text-[11px] font-extrabold h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center shadow-md animate-bounce">
                {cartItemCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-white/5 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0D0D12] border-b border-white/10 px-4 pt-3 pb-6 space-y-3">
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Buscar placas ou kits..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentView('products');
              }}
              className="w-full bg-[#181820] text-sm text-slate-100 rounded-xl pl-9 pr-3 py-2.5 border border-white/10"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleNav('home')}
              className="p-2.5 rounded-xl bg-white/5 text-slate-200 text-left font-medium text-sm"
            >
              Início
            </button>
            <button
              onClick={() => handleNav('products', 'todos')}
              className="p-2.5 rounded-xl bg-white/5 text-slate-200 text-left font-medium text-sm"
            >
              Todos os Produtos
            </button>
            <button
              onClick={() => handleNav('combos')}
              className="p-2.5 rounded-xl bg-[#FF5500]/20 text-[#FFAA00] border border-[#FF5500]/40 text-left font-bold text-sm"
            >
              Kits Promocionais (-40%)
            </button>
            <button
              onClick={() => {
                if (currentUser) {
                  handleNav('customer-account');
                } else {
                  openAuthModal('customer');
                  setMobileMenuOpen(false);
                }
              }}
              className="p-2.5 rounded-xl bg-white/5 text-slate-200 text-left font-medium text-sm flex items-center gap-2"
            >
              <User className="w-4 h-4 text-[#FFAA00]" />
              <span>{currentUser ? 'Minha Conta' : 'Entrar / Cadastrar'}</span>
            </button>
            <button
              onClick={() => handleNav('institucional', 'como-funciona')}
              className="p-2.5 rounded-xl bg-white/5 text-slate-200 text-left font-medium text-sm"
            >
              Como Funciona
            </button>
            {currentUser?.role === 'admin' && currentUser?.email.toLowerCase() === 'contatoviniciuscastro@gmail.com' && (
              <button
                onClick={() => handleNav('admin')}
                className="p-2.5 rounded-xl bg-purple-900/40 text-purple-200 border border-purple-500/40 text-left font-bold text-sm flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Painel Admin</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
