import React, { useState } from 'react';
import { 
  Package, 
  MapPin, 
  User, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  Truck, 
  AlertCircle, 
  Plus, 
  PhoneCall,
  ShieldCheck,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Address } from '../types';

export const CustomerArea: React.FC = () => {
  const { 
    currentUser, 
    orders, 
    setCurrentView, 
    logout, 
    updateUserProfile, 
    addCustomerAddress, 
    openAuthModal,
    showToast 
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'profile'>('orders');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showNewAddressModal, setShowNewAddressModal] = useState(false);

  // New address form
  const [newRecipient, setNewRecipient] = useState('');
  const [newZipCode, setNewZipCode] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newComplement, setNewComplement] = useState('');
  const [newNeighborhood, setNewNeighborhood] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('SP');

  if (!currentUser) {
    return (
      <div className="py-20 max-w-md mx-auto px-4 text-center space-y-5 animate-in fade-in">
        <div className="w-16 h-16 rounded-3xl bg-[#FF5500]/15 border border-[#FF5500]/30 flex items-center justify-center mx-auto text-[#FFAA00]">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Acesse sua Conta de Cliente</h2>
        <p className="text-xs text-slate-400">
          Você precisa estar conectado para acompanhar seus pedidos, códigos de rastreio dos Correios e gerenciar seus endereços de entrega.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => openAuthModal('customer')}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF5500] to-[#FFAA00] text-black font-extrabold text-sm shadow-xl shadow-[#FF5500]/25 hover:scale-[1.02] active:scale-95 transition"
          >
            Fazer Login ou Criar Conta
          </button>
          <button
            onClick={() => setCurrentView('home')}
            className="px-5 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-white/10 transition"
          >
            Voltar para a Loja
          </button>
        </div>
      </div>
    );
  }

  // This local profile is NOT authenticated. Do not fetch orders using its email.\n  // Server-side identity verification is required before enabling customer order history.\n  // Filter only already-local ephemeral orders shown to this browser.
  const myOrders = orders.filter(
    (o) => o.customerId === currentUser.id || o.customerEmail.toLowerCase() === currentUser.email.toLowerCase()
  );

  const selectedOrder = selectedOrderId ? myOrders.find((o) => o.id === selectedOrderId) : myOrders[0];

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipient || !newZipCode || !newStreet || !newNumber) {
      showToast('Preencha os campos obrigatórios do endereço.', 'error');
      return;
    }
    addCustomerAddress({
      recipientName: newRecipient,
      zipCode: newZipCode,
      street: newStreet,
      number: newNumber,
      complement: newComplement,
      neighborhood: newNeighborhood,
      city: newCity,
      state: newState,
      isDefault: false
    });
    setShowNewAddressModal(false);
    setNewRecipient('');
    setNewZipCode('');
    setNewStreet('');
    setNewNumber('');
  };

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner with Client Greeting */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#181822] via-[#14141B] to-[#121217] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF5500] to-[#FFAA00] text-black font-black text-xl flex items-center justify-center shadow-lg shadow-[#FF5500]/30">
            {currentUser.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">{currentUser.fullName}</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                Cadastro local — não verificado
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{currentUser.email} • {currentUser.whatsapp}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('products')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition"
          >
            Fazer Novo Pedido
          </button>
          <button
            onClick={logout}
            className="p-2.5 rounded-xl bg-red-950/40 text-red-400 hover:bg-red-900/60 border border-red-500/30 text-xs font-bold transition flex items-center gap-1.5"
            title="Sair da Conta"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
            activeTab === 'orders'
              ? 'bg-[#181820] text-[#FFAA00] border-t-2 border-[#FF5500]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Meus Pedidos ({myOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
            activeTab === 'addresses'
              ? 'bg-[#181820] text-[#FFAA00] border-t-2 border-[#FF5500]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Endereços de Entrega</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
            activeTab === 'profile'
              ? 'bg-[#181820] text-[#FFAA00] border-t-2 border-[#FF5500]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Dados Cadastrais</span>
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {myOrders.length === 0 ? (
            <div className="p-12 rounded-3xl bg-[#14141B] border border-white/5 text-center space-y-3">
              <Package className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">Você ainda não possui pedidos</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Adquira sua placa inteligente com NFC e comece a impulsionar suas avaliações no Google hoje mesmo.
              </p>
              <button
                onClick={() => setCurrentView('combos')}
                className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#FFAA00] text-black font-extrabold text-xs shadow-lg"
              >
                Ver Kits Promocionais
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Orders List */}
              <div className="lg:col-span-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Histórico de Compras</h3>
                {myOrders.map((ord) => {
                  const isSelected = selectedOrder?.id === ord.id;
                  const isPaid = ord.paymentStatus === 'approved';
                  return (
                    <div
                      key={ord.id}
                      onClick={() => setSelectedOrderId(ord.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#181820] border-[#FF5500] shadow-lg shadow-[#FF5500]/10'
                          : 'bg-[#121217] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-white">Pedido #{ord.orderNumber}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isPaid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {isPaid ? 'Pagamento Aprovado' : 'Aguardando Pagamento'}
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-slate-400">
                        <span>{ord.items.length} {ord.items.length === 1 ? 'item' : 'itens'}</span>
                        <span className="mx-1.5">•</span>
                        <span>{new Date(ord.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                        <span className="text-xs font-black text-white">
                          R$ {ord.total.toFixed(2)}
                        </span>
                        <span className="text-xs text-[#FFAA00] flex items-center gap-1 font-semibold">
                          Detalhes <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Selected Order Details & Tracking Timeline */}
              {selectedOrder && (
                <div className="lg:col-span-7 space-y-6 p-6 rounded-3xl bg-[#14141B] border border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-2">
                    <div>
                      <h3 className="text-lg font-black text-white">
                        Detalhes do Pedido #{selectedOrder.orderNumber}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Realizado em {new Date(selectedOrder.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>

                    <a
                      href={`https://wa.me/5511999998888?text=Olá!%20Gostaria%20de%20tirar%20dúvidas%20sobre%20meu%20pedido%20%23${selectedOrder.orderNumber}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition self-start"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Ajuda com este Pedido</span>
                    </a>
                  </div>

                  {/* Tracking Timeline */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#FFAA00] flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#FF5500]" />
                      <span>Rastreamento em Tempo Real ({selectedOrder.shipping.carrier})</span>
                    </h4>

                    {/* Timeline steps */}
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                      <div className="space-y-1">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-black font-bold flex items-center justify-center mx-auto">
                          ✓
                        </div>
                        <span className="font-bold text-white block">Recebido</span>
                        <span className="text-slate-500 text-[9px]">Confirmado</span>
                      </div>

                      <div className="space-y-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto font-bold ${
                          selectedOrder.paymentStatus === 'approved' ? 'bg-emerald-500 text-black' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {selectedOrder.paymentStatus === 'approved' ? '✓' : '2'}
                        </div>
                        <span className="font-bold text-white block">Pagamento</span>
                        <span className="text-slate-500 text-[9px]">
                          {selectedOrder.paymentStatus === 'approved' ? 'Aprovado' : 'Pendente'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto font-bold ${
                          selectedOrder.shippingStatus === 'shipped' || selectedOrder.shippingStatus === 'delivered'
                            ? 'bg-emerald-500 text-black'
                            : selectedOrder.shippingStatus === 'processing'
                            ? 'bg-[#FF5500] text-white animate-pulse'
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          {selectedOrder.shippingStatus === 'shipped' || selectedOrder.shippingStatus === 'delivered' ? '✓' : '3'}
                        </div>
                        <span className="font-bold text-white block">Gravação & Envio</span>
                        <span className="text-slate-500 text-[9px]">
                          {selectedOrder.shippingStatus === 'shipped' ? 'Despachado' : 'Em Separação'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto font-bold ${
                          selectedOrder.shippingStatus === 'delivered' ? 'bg-emerald-500 text-black' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {selectedOrder.shippingStatus === 'delivered' ? '✓' : '4'}
                        </div>
                        <span className="font-bold text-white block">Entrega</span>
                        <span className="text-slate-500 text-[9px]">Destino</span>
                      </div>
                    </div>

                    {/* Tracking Code Badge */}
                    {selectedOrder.trackingCode ? (
                      <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 bg-[#181820] p-3 rounded-xl">
                        <div className="text-xs">
                          <span className="text-slate-400 block text-[10px]">Código de Rastreamento Oficial:</span>
                          <span className="font-mono font-bold text-[#FFAA00] text-sm">
                            {selectedOrder.trackingCode}
                          </span>
                        </div>
                        <a
                          href={`https://rastreamento.correios.com.br/app/index.php?codigo=${selectedOrder.trackingCode}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1"
                        >
                          Rastrear nos Correios <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 text-center pt-2 border-t border-white/5">
                        O código de rastreamento será disponibilizado logo após o despacho pela transportadora.
                      </div>
                    )}
                  </div>

                  {/* Purchased Items List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Itens do Pedido</h4>
                    <div className="space-y-2">
                      {selectedOrder.items.map((it) => (
                        <div
                          key={it.id}
                          className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <img src={it.image} alt={it.name} className="w-12 h-12 object-cover rounded-lg bg-black" />
                            <div>
                              <p className="font-bold text-white">{it.name}</p>
                              {it.customization?.businessName && (
                                <p className="text-[10px] text-[#FFAA00]">
                                  Gravação: "{it.customization.businessName}"
                                </p>
                              )}
                              <span className="text-slate-400 text-[11px]">Qtd: {it.quantity} un.</span>
                            </div>
                          </div>
                          <span className="font-bold text-white whitespace-nowrap">
                            R$ {it.totalPrice.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Address Details */}
                  <div className="p-4 rounded-xl bg-white/5 text-xs text-slate-300 space-y-1">
                    <span className="font-bold text-white block">Endereço de Entrega Cadastrado:</span>
                    <p>{selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.number} {selectedOrder.shippingAddress.complement}</p>
                    <p>{selectedOrder.shippingAddress.neighborhood} - {selectedOrder.shippingAddress.city}/{selectedOrder.shippingAddress.state} - CEP {selectedOrder.shippingAddress.zipCode}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Addresses Tab */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-white">Meus Endereços Salvos</h3>
            <button
              onClick={() => setShowNewAddressModal(true)}
              className="px-4 py-2 rounded-xl bg-[#FF5500] text-black font-extrabold text-xs flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Endereço</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentUser.addresses.map((addr) => (
              <div key={addr.id} className="p-5 rounded-2xl bg-[#14141B] border border-white/10 space-y-2 relative">
                {addr.isDefault && (
                  <span className="absolute top-4 right-4 text-[10px] bg-[#FF5500]/20 text-[#FFAA00] px-2 py-0.5 rounded-full font-bold">
                    Padrão
                  </span>
                )}
                <h4 className="font-bold text-white text-sm">{addr.recipientName}</h4>
                <p className="text-xs text-slate-300">
                  {addr.street}, {addr.number} {addr.complement && `• ${addr.complement}`}
                </p>
                <p className="text-xs text-slate-400">
                  {addr.neighborhood} - {addr.city}/{addr.state}
                </p>
                <p className="text-xs font-mono text-[#FFAA00]">CEP: {addr.zipCode}</p>
              </div>
            ))}
          </div>

          {/* New address simple form */}
          {showNewAddressModal && (
            <div className="p-6 rounded-3xl bg-[#181820] border border-[#FF5500]/40 space-y-4 animate-in fade-in">
              <h4 className="text-sm font-bold text-white">Adicionar Novo Endereço</h4>
              <form onSubmit={handleSaveAddress} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Destinatário: *</label>
                  <input
                    type="text"
                    required
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    className="w-full bg-[#121217] text-white p-2.5 rounded-xl border border-white/10"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">CEP: *</label>
                  <input
                    type="text"
                    required
                    value={newZipCode}
                    onChange={(e) => setNewZipCode(e.target.value)}
                    className="w-full bg-[#121217] text-white p-2.5 rounded-xl border border-white/10"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Rua: *</label>
                  <input
                    type="text"
                    required
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    className="w-full bg-[#121217] text-white p-2.5 rounded-xl border border-white/10"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Número: *</label>
                  <input
                    type="text"
                    required
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    className="w-full bg-[#121217] text-white p-2.5 rounded-xl border border-white/10"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Cidade: *</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full bg-[#121217] text-white p-2.5 rounded-xl border border-white/10"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Estado (UF):</label>
                  <input
                    type="text"
                    value={newState}
                    maxLength={2}
                    onChange={(e) => setNewState(e.target.value.toUpperCase())}
                    className="w-full bg-[#121217] text-white p-2.5 rounded-xl border border-white/10"
                  />
                </div>
                <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewAddressModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#FF5500] text-black font-bold"
                  >
                    Salvar Endereço
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="max-w-xl p-6 rounded-3xl bg-[#14141B] border border-white/10 space-y-4">
          <h3 className="text-base font-bold text-white">Dados da Minha Conta</h3>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Nome Completo:</span>
              <input
                type="text"
                value={currentUser.fullName}
                onChange={(e) => updateUserProfile({ fullName: e.target.value })}
                className="w-full bg-[#181820] text-white p-2.5 rounded-xl border border-white/10"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">E-mail Cadastrado:</span>
              <input
                type="email"
                disabled
                value={currentUser.email}
                className="w-full bg-[#181820] text-slate-400 p-2.5 rounded-xl border border-white/10 cursor-not-allowed"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">WhatsApp de Contato:</span>
              <input
                type="text"
                value={currentUser.whatsapp}
                onChange={(e) => updateUserProfile({ whatsapp: e.target.value })}
                className="w-full bg-[#181820] text-white p-2.5 rounded-xl border border-white/10"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">CPF Registrado:</span>
              <input
                type="text"
                disabled
                value={currentUser.cpf}
                className="w-full bg-[#181820] text-slate-400 p-2.5 rounded-xl border border-white/10 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
