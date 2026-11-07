import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  User, 
  Mail, 
  ShieldCheck, 
  ShoppingBag, 
  ArrowRight,
  Phone,
  CreditCard,
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
    loginAsCustomer,
    currentUser,
    logout
  } = useStore();

  // Customer form fields
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail) return;
    loginAsCustomer({
      email: customerEmail,
      fullName: customerName,
      whatsapp: customerWhatsapp,
      cpf: customerCpf
    });
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
                  ? 'Cadastre-se para comprar placas personalizadas e acompanhar entregas'
                  : 'Acompanhe seus pedidos, códigos de rastreio e dados de entrega'}
              </p>
            </div>

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

                    <div>
                      <label className="text-slate-300 font-bold block mb-1.5">
                        CPF (Nota Fiscal):
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="000.000.000-00"
                          value={customerCpf}
                          onChange={(e) => setCustomerCpf(e.target.value)}
                          className="w-full bg-[#181820] text-white pl-10 pr-3 py-2.5 rounded-xl border border-white/10 text-xs"
                        />
                        <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF5500] to-[#FFAA00] text-black font-extrabold text-sm shadow-xl shadow-[#FF5500]/25 hover:scale-[1.01] active:scale-98 transition flex items-center justify-center gap-2 mt-2"
              >
                <span>{isNewCustomer ? 'Concluir Cadastro & Entrar' : 'Entrar na Minha Conta'}</span>
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

        {/* Secure admin login is hosted in Preview until the coordinated main
            branch + shared Supabase RLS cutover is completed. Do not restore
            the legacy local admin password flow or public table writes here. */}
        {authModalTab === 'admin' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-lg shadow-purple-500/10">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white">Acesso Lojista Seguro</h3>
            <p className="text-sm leading-relaxed text-slate-300">
              Para proteger seus pedidos e configurações, o painel administrativo
              usa autenticação Supabase com verificação de permissões no servidor.
            </p>
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-100">
              A entrada administrativa desta versão da loja está temporariamente
              direcionada ao ambiente protegido de gerenciamento, enquanto
              finalizamos a migração da plataforma principal.
            </div>
            <a
              href="https://pulsar-tecnologia-site-git-security-server-api-phase1-qr-flow.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Abrir painel administrativo seguro</span>
            </a>
            <p className="text-[11px] leading-relaxed text-slate-400">
              A Vercel pode solicitar o acesso aprovado ao Preview. Em seguida,
              selecione Acesso Lojista (Admin) e entre com seu e-mail e senha
              cadastrados no Supabase.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
