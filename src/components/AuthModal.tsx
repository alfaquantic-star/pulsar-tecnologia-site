import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  User, 
  Mail, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ShoppingBag, 
  ArrowRight,
  Phone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    setAuthModalTab,
    loginAsAdmin,
    loginAsCustomer,
    currentUser,
    logout
  } = useStore();

  // Customer form fields
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  // Admin form fields
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminBusy, setAdminBusy] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail) return;
    loginAsCustomer({
      email: customerEmail,
      fullName: customerName,
      whatsapp: customerWhatsapp,
      cpf: ''
    });
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminBusy) return;
    setAdminBusy(true);
    setAdminError('');
    try {
      const success = await loginAsAdmin(adminEmail, adminPassword);
      setAdminPassword('');
      if (!success) setAdminError('Login inválido ou conta não autorizada pelo Supabase.');
    } catch {
      setAdminError('Não foi possível verificar suas permissões.');
    } finally {
      setAdminBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#121217] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Switcher: Cliente vs Admin */}
        <div className="flex rounded-2xl bg-black/60 p-1.5 border border-white/10">
          <button
            type="button"
            onClick={() => {
              setAuthModalTab('customer');
              setAdminError('');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              authModalTab === 'customer'
                ? 'bg-[#FF5500] text-black shadow-lg shadow-[#FF5500]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Área do Cliente</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthModalTab('admin');
              setAdminError('');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              authModalTab === 'admin'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Acesso Lojista (Admin)</span>
          </button>
        </div>

        {/* TAB 1: CUSTOMER LOGIN / REGISTER */}
        {authModalTab === 'customer' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#FF5500]/15 border border-[#FF5500]/30 flex items-center justify-center text-[#FFAA00] mb-3">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white">
                {isNewCustomer ? 'Criar Cadastro de Cliente' : 'Acesse sua Conta de Cliente'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isNewCustomer 
                  ? 'Cadastro local de demonstração, sem verificação de e-mail e sem acesso aos pedidos do servidor.'
                  : 'Cadastro local de demonstração. O acesso aos pedidos exige autenticação de identidade.'}
              </p>
            </div>

            <div role="status" className="rounded-xl bg-amber-500/10 border border-amber-400/30 px-3 py-2 text-xs text-amber-200">A identidade de clientes ainda não é verificada. Não use este cadastro para consultar pedidos ou informar dados pessoais sensíveis.</div>

             <form onSubmit={handleCustomerSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  E-mail: *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="seuemail@exemplo.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-[#181820] text-white pl-10 pr-3 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-[#FF5500] text-sm"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              {isNewCustomer && (
                <>
                  <div>
                    <label className="text-slate-300 font-bold block mb-1.5">
                      Nome Completo: *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Ex: Carlos Silva"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-[#181820] text-white pl-10 pr-3 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-[#FF5500] text-sm"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-bold block mb-1.5">
                        WhatsApp:
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          placeholder="(11) 98765-4321"
                          value={customerWhatsapp}
                          onChange={(e) => setCustomerWhatsapp(e.target.value)}
                          className="w-full bg-[#181820] text-white pl-10 pr-3 py-2.5 rounded-xl border border-white/10 text-xs"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      </div>
                    </div>


                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF5500] to-[#FFAA00] text-black font-extrabold text-sm shadow-xl shadow-[#FF5500]/25 hover:scale-[1.01] active:scale-98 transition flex items-center justify-center gap-2 mt-2"
              >
                <span>{isNewCustomer ? 'Salvar cadastro local' : 'Continuar em demonstração'}</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setIsNewCustomer(!isNewCustomer)}
                  className="text-xs text-[#FFAA00] hover:underline font-semibold"
                >
                  {isNewCustomer
                    ? 'Já possui uma conta? Clique para fazer login'
                    : 'Primeira vez aqui? Clique para criar uma conta de cliente'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: ADMIN / LOJISTA LOGIN */}
        {authModalTab === 'admin' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 mb-3 shadow-lg shadow-purple-500/10">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white">Portal do Lojista Pulsar</h3>
              <p className="text-xs text-slate-400 mt-1">
                Acesso administrativo restrito para gestão de pedidos, estoque, Mercado Pago, Melhor Envio e CMS.
              </p>
            </div>

            {adminError && (
              <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/50 text-red-200 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  E-mail do Administrador: *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="email@seudominio.com"
                    className="w-full bg-[#181820] text-white pl-10 pr-3 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-purple-500 text-sm font-mono"
                  />
                  <Mail className="w-4 h-4 text-purple-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  Senha Administrativa: *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Digite sua senha administrativa"
                    className="w-full bg-[#181820] text-white pl-10 pr-10 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-purple-500 text-sm font-mono"
                  />
                  <KeyRound className="w-4 h-4 text-purple-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-xl text-[11px] text-slate-300 space-y-1">
                <p className="font-semibold text-purple-300">🔐 Área de Segurança</p>
                <p>
                  Esta área permite configurar chaves da API Mercado Pago, Melhor Envio, gerenciar produtos, kits e editar todo o visual do site com prévia em tempo real.
                </p>
              </div>

              <button
                type="submit"
                disabled={adminBusy}
                className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 hover:scale-[1.01] active:scale-98 transition flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Entrar no Painel Administrativo</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
