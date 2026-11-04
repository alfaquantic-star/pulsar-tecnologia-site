import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  CreditCard, 
  Copy, 
  Check, 
  Truck, 
  Lock, 
  Zap, 
  ExternalLink,
  AlertCircle,
  Loader2,
  ChevronRight,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Address, Order, ShippingOption } from '../types';
import { createMercadoPagoPreference } from '../services/mercadopago';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutModalOpen,
    setIsCheckoutModalOpen,
    cart,
    cartSubtotal,
    discountAmount,
    appliedCoupon,
    shippingOptions,
    selectedShipping,
    setSelectedShipping,
    calculateShipping,
    isCalculatingShipping,
    destinationCep,
    currentUser,
    createOrder,
    simulateWebhookPaymentApproval,
    showToast,
    setCurrentView,
    settings,
    openAuthModal
  } = useStore();

  const [step, setStep] = useState<'checkout' | 'redirecting' | 'success' | 'error'>('checkout');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'pix' | 'credit_card'>('mercadopago');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(3);

  // Customer Form
  const [fullName, setFullName] = useState(currentUser?.fullName || 'Vinicius Castro');
  const [email, setEmail] = useState(currentUser?.email || 'contatoviniciuscastro@gmail.com');
  const [cpf, setCpf] = useState(currentUser?.cpf || '123.456.789-00');
  const [whatsapp, setWhatsapp] = useState(currentUser?.whatsapp || '(11) 98765-4321');

  // Address Form
  const defaultAddr = currentUser?.addresses[0];
  const [zipCode, setZipCode] = useState(defaultAddr?.zipCode || destinationCep || '');
  // Never prefill a real delivery form with an unrelated demonstration address.
  const [street, setStreet] = useState(defaultAddr?.street || '');
  const [number, setNumber] = useState(defaultAddr?.number || '');
  const [complement, setComplement] = useState(defaultAddr?.complement || '');
  const [neighborhood, setNeighborhood] = useState(defaultAddr?.neighborhood || '');
  const [city, setCity] = useState(defaultAddr?.city || '');
  const [state, setState] = useState(defaultAddr?.state || '');
  const [validatedCep, setValidatedCep] = useState('');
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);
  const [cepLookupError, setCepLookupError] = useState('');

  // Credit Card Form
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892');
  const [cardHolder, setCardHolder] = useState('VINICIUS CASTRO');
  const [cardExpiry, setCardExpiry] = useState('11/29');
  const [cardCvv, setCardCvv] = useState('892');
  const [installments, setInstallments] = useState(1);

  // Countdown timer for automatic Mercado Pago redirection
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'redirecting' && redirectUrl && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (step === 'redirecting' && redirectUrl && countdown === 0) {
      // Execute the redirection
      try {
        if (window.top && window.top !== window) {
          window.top.location.href = redirectUrl;
        } else {
          window.location.href = redirectUrl;
        }
      } catch (err) {
        window.location.href = redirectUrl;
      }
    }
    return () => clearTimeout(timer);
  }, [step, redirectUrl, countdown]);

  if (!isCheckoutModalOpen) return null;

  const finalShippingPrice = selectedShipping ? selectedShipping.price : (shippingOptions[0]?.price || 0);
  const orderTotal = Math.max(0, cartSubtotal - discountAmount + finalShippingPrice);

  const handleCepSearch = async () => {
    const cleanCep = zipCode.replace(/\D/g, '');
    setValidatedCep('');
    setCepLookupError('');
    if (cleanCep.length !== 8) {
      setCepLookupError('Informe um CEP válido com 8 dígitos.');
      return;
    }
    setIsLookingUpCep(true);
    try {
      const response = await fetch('/api/address/lookup?cep=' + cleanCep, { cache: 'no-store' });
      const address = await response.json();
      if (!response.ok) throw new Error(address.error || 'CEP não encontrado.');
      // Clear previously entered street data if ViaCEP only resolves city/UF.
      setStreet(address.street || '');
      setNeighborhood(address.neighborhood || '');
      setCity(address.city || '');
      setState(address.state || '');
      setNumber('');
      setComplement('');
      setValidatedCep(cleanCep);
      if (!address.street) {
        showToast('CEP localizado. Preencha a rua, bairro e número se necessário.', 'info');
      }
      await calculateShipping(cleanCep);
    } catch (err) {
      setValidatedCep('');
      const msg = err instanceof Error ? err.message : 'Falha ao consultar CEP.';
      setCepLookupError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLookingUpCep(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validatedCep !== zipCode.replace(/\D/g, '') || !street.trim() || !neighborhood.trim() || !city.trim() || !state.trim()) {
      showToast('Consulte o CEP e confirme rua, bairro, cidade, UF e número antes de continuar.', 'error');
      return;
    }
    if (!fullName || !email || !cpf || !whatsapp || !street || !number) {
      showToast('Por favor preencha todos os campos obrigatórios.', 'error');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const shippingAddress: Address = {
        id: 'addr-' + Math.random().toString(36).substring(2, 7),
        recipientName: fullName,
        zipCode,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        isDefault: true
      };

      // 1. MERCADO PAGO CHECKOUT PRO (OFFICIAL REDIRECT)
      if (paymentMethod === 'mercadopago') {
        if (!selectedShipping) throw new Error('Calcule e selecione um frete válido antes de pagar.');
        const orderNum = 'PLS-' + Math.floor(1000 + Math.random() * 9000);

        // Check if access token is configured
        const token = '';


        // Create official Mercado Pago Preference via API
        const pref = await createMercadoPagoPreference({
          accessToken: token,
          sandbox: settings.mercadoPagoSandbox,
          orderNumber: orderNum,
          items: cart.map((item) => ({
            id: item.productId || item.kitId || item.sku,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            image: item.image
          })),
          customer: {
            fullName,
            email,
            cpf,
            whatsapp
          },
          shippingAddress: {
            zipCode,
            street,
            number
          },
          shippingPrice: finalShippingPrice,
          discountAmount
        });

        const targetUrl = (settings.mercadoPagoSandbox && pref.sandbox_init_point) 
          ? pref.sandbox_init_point 
          : pref.init_point;

        if (!targetUrl) {
          throw new Error('O Mercado Pago não retornou a URL de pagamento. Verifique se o token é válido e possui permissão de Checkout.');
        }

        const order = await createOrder({
          customer: { fullName, email, cpf, whatsapp },
          shippingAddress,
          paymentMethod: 'mercadopago',
          mercadoPagoPreferenceId: pref.id,
          mercadoPagoInitPoint: targetUrl
        });

        setCreatedOrder(order);
        setRedirectUrl(targetUrl);
        setCountdown(3);
        setStep('redirecting');
        showToast('Conectado ao Mercado Pago! Redirecionando...', 'success');
        return;
      }

      // 2. DIRECT PIX OR CREDIT CARD
      const order = await createOrder({
        customer: { fullName, email, cpf, whatsapp },
        shippingAddress,
        paymentMethod,
        cardData: paymentMethod === 'credit_card' ? {
          number: cardNumber,
          name: cardHolder,
          expiry: cardExpiry,
          cvv: cardCvv,
          installments
        } : undefined
      });

      setCreatedOrder(order);
      setStep('success');

      // Trigger Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // Safe fallback
      }

      showToast('Pedido gerado com sucesso!', 'success');
    } catch (err: any) {
      console.error('Checkout error:', err);
      const msg = err.message || 'Erro ao processar pedido. Tente novamente.';
      setErrorMessage(msg);
      setStep('error');
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPixPayload = () => {
    if (createdOrder?.pixCopiaECola) {
      navigator.clipboard.writeText(createdOrder.pixCopiaECola);
      setCopiedPix(true);
      showToast('Código PIX Copia e Cola copiado!', 'info');
      setTimeout(() => setCopiedPix(false), 3000);
    }
  };

  const copyRedirectUrl = () => {
    if (redirectUrl) {
      navigator.clipboard.writeText(redirectUrl);
      setCopiedLink(true);
      showToast('Link do Mercado Pago copiado!', 'info');
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleFinishAndTrack = () => {
    setIsCheckoutModalOpen(false);
    setCurrentView('customer-account');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] bg-[#121217] border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#181820] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#FFAA00] text-black">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">
                {step === 'checkout' && 'Finalização de Pedido Seguro'}
                {step === 'redirecting' && 'Redirecionando para Mercado Pago'}
                {step === 'success' && 'Pedido Confirmado!'}
                {step === 'error' && 'Erro no Processamento'}
              </h3>
              <p className="text-xs text-slate-400">
                Pulsar Tecnologia • Ambiente Criptografado 256 bits
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCheckoutModalOpen(false)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: CHECKOUT FORM */}
          {step === 'checkout' && (
            <form onSubmit={handlePlaceOrder} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Customer & Shipping Details */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Step 1: Customer Data */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#FFAA00] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#FF5500] text-black flex items-center justify-center text-[10px] font-black">
                        1
                      </span>
                      <span>Dados do Comprador / Nota Fiscal</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                          Nome Completo: *
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-[#181820] text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#FF5500]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                          E-mail para Confirmação: *
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-[#181820] text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#FF5500]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                          CPF / CNPJ: *
                        </label>
                        <input
                          type="text"
                          required
                          value={cpf}
                          onChange={(e) => setCpf(e.target.value)}
                          className="w-full bg-[#181820] text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#FF5500]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                          WhatsApp / Telefone para Rastreamento: *
                        </label>
                        <input
                          type="text"
                          required
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          className="w-full bg-[#181820] text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#FF5500]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Shipping Address */}
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#FFAA00] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#FF5500] text-black flex items-center justify-center text-[10px] font-black">
                        2
                      </span>
                      <span>Endereço de Entrega (Melhor Envio)</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                      <div className="sm:col-span-3">
                        <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                          CEP: *
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            maxLength={9}
                            value={zipCode}
                            onChange={(e) => {
                              setZipCode(e.target.value);
                              setValidatedCep('');
                              setCepLookupError('');
                              setStreet('');
                              setNumber('');
                              setComplement('');
                              setNeighborhood('');
                              setCity('');
                              setState('');
                              setSelectedShipping(null);
                            }}
                            className="w-full bg-[#181820] text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#FF5500]"
                          />
                          <button
                            type="button"
                            onClick={handleCepSearch}
                            disabled={isLookingUpCep || isCalculatingShipping}
                            className="px-3 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>{isCalculatingShipping || isLookingUpCep ? '...' : 'Calcular'}</span>
                          </button>
                        </div>
                        {cepLookupError && <p className="mt-1 text-[11px] text-red-400">{cepLookupError}</p>}
                        {validatedCep && !cepLookupError &&
                          <p className="mt-1 text-[11px] text-emerald-400">
                            CEP localizado: {city} - {state}. Confirme rua, bairro e número.
                          </p>}
                      </div>

                      <div className="sm:col-span-6">
                        <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                          Rua / Avenida: *
                        </label>
                        <input
                          type="text"
                          required
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          className="w-full bg-[#181820] text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#FF5500]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                          Número: *
                        </label>
                        <input
                          type="text"
                          required
                          value={number}
                          onChange={(e) => setNumber(e.target.value)}
                          className="w-full bg-[#181820] text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#FF5500]"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                          Complemento:
                        </label>
                        <input
                          type="text"
                          value={complement}
                          onChange={(e) => setComplement(e.target.value)}
                          className="w-full bg-[#181820] text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#FF5500]"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                          Bairro: *
                        </label>
                        <input
                          type="text"
                          required
                          value={neighborhood}
                          onChange={(e) => setNeighborhood(e.target.value)}
                          className="w-full bg-[#181820] text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#FF5500]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                          Cidade: *
                        </label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-[#181820] text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#FF5500]"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                          UF: *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={2}
                          value={state}
                          onChange={(e) => setState(e.target.value.toUpperCase())}
                          className="w-full bg-[#181820] text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#FF5500]"
                        />
                      </div>
                    </div>

                    {/* Freight Option Selector (Melhor Envio) */}
                    <div className="pt-2 space-y-2">
                      <label className="text-[11px] font-bold text-slate-300 block">
                        Selecione a Transportadora (Melhor Envio):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {shippingOptions.map((opt: ShippingOption) => (
                          <div
                            key={opt.id}
                            onClick={() => setSelectedShipping(opt)}
                            className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between text-xs ${
                              selectedShipping?.id === opt.id
                                ? 'bg-[#FF5500]/15 border-[#FF5500] text-white shadow-md'
                                : 'bg-[#181820] border-white/10 text-slate-400 hover:text-white'
                            }`}
                          >
                            <span className="font-bold text-white text-[11px]">{opt.service}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {opt.carrier} • {opt.estimatedDays} dias
                            </span>
                            <span className="text-xs font-black text-[#FFAA00] mt-2">
                              R$ {opt.price.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Order Summary & Payment */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Order Summary Card */}
                  <div className="p-5 rounded-2xl bg-[#181820] border border-white/10 space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Resumo da Compra ({cart.length} itens)
                    </h4>

                    <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                      {cart.map((item) => (
                        <div key={item.cartItemId} className="flex justify-between text-xs">
                          <span className="text-slate-300 truncate max-w-[190px]">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-bold text-white whitespace-nowrap">
                            R$ {(item.unitPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="text-white">R$ {cartSubtotal.toFixed(2)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-400">
                          <span>Desconto ({appliedCoupon}):</span>
                          <span>- R$ {discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Frete:</span>
                        <span className="text-[#FFAA00]">
                          R$ {finalShippingPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-black text-white">
                        <span>Total:</span>
                        <span className="text-xl text-gradient-pulsar">
                          R$ {orderTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Payment Method */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#FFAA00] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#FF5500] text-black flex items-center justify-center text-[10px] font-black">
                          3
                        </span>
                        <span>Forma de Pagamento</span>
                      </div>

                      {settings.mercadoPagoSandbox && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono">
                          Modo Testes (Sandbox)
                        </span>
                      )}
                    </h4>

                    {/* Method Tabs */}
                    <div className="space-y-2">
                      {/* 1. Mercado Pago Checkout Pro (Primary) */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('mercadopago')}
                        className={`w-full p-3.5 rounded-2xl border font-bold text-xs flex items-center justify-between transition ${
                          paymentMethod === 'mercadopago'
                            ? 'bg-blue-950/60 border-blue-500 text-white shadow-lg shadow-blue-950/50 ring-1 ring-blue-500'
                            : 'bg-[#181820] border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 text-left">
                          <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                            <Zap className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-white text-xs sm:text-sm">
                                Mercado Pago Checkout Pro
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-blue-500 text-black text-[9px] font-black uppercase">
                                Recomendado
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              PIX, Cartão até 12x, Boleto e Saldo Mercado Pago
                            </span>
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === 'mercadopago' ? 'border-blue-500 bg-blue-500' : 'border-slate-500'
                        }`}>
                          {paymentMethod === 'mercadopago' && <Check className="w-3 h-3 text-black font-black" />}
                        </div>
                      </button>

                      {/* 2. Direct PIX Instantâneo */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('pix')}
                        className={`w-full p-3.5 rounded-2xl border font-bold text-xs flex items-center justify-between transition ${
                          paymentMethod === 'pix'
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500'
                            : 'bg-[#181820] border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 text-left">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                            <Zap className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <span className="font-extrabold text-white text-xs sm:text-sm">
                              PIX Direto na Tela
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              QR Code instantâneo com Copia e Cola
                            </span>
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === 'pix' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-500'
                        }`}>
                          {paymentMethod === 'pix' && <Check className="w-3 h-3 text-black font-black" />}
                        </div>
                      </button>

                      {/* 3. Cartão de Crédito Transparente */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('credit_card')}
                        className={`w-full p-3.5 rounded-2xl border font-bold text-xs flex items-center justify-between transition ${
                          paymentMethod === 'credit_card'
                            ? 'bg-[#FF5500]/20 border-[#FF5500] text-[#FFAA00] shadow-md shadow-[#FF5500]/20 ring-1 ring-[#FF5500]'
                            : 'bg-[#181820] border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 text-left">
                          <div className="w-9 h-9 rounded-xl bg-[#FF5500]/20 text-[#FFAA00] border border-[#FF5500]/30 flex items-center justify-center flex-shrink-0">
                            <CreditCard className="w-5 h-5 text-[#FFAA00]" />
                          </div>
                          <div>
                            <span className="font-extrabold text-white text-xs sm:text-sm">
                              Cartão de Crédito Transparente
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Parcelamento em até 12x
                            </span>
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === 'credit_card' ? 'border-[#FF5500] bg-[#FF5500]' : 'border-slate-500'
                        }`}>
                          {paymentMethod === 'credit_card' && <Check className="w-3 h-3 text-black font-black" />}
                        </div>
                      </button>
                    </div>

                    {/* Mercado Pago Notice */}
                    {paymentMethod === 'mercadopago' && (
                      <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 text-xs text-slate-300 space-y-1.5">
                        <div className="flex items-center gap-2 text-blue-400 font-bold">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Redirecionamento Seguro Mercado Pago</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Ao clicar no botão abaixo, geramos a transação criptografada com suas credenciais oficiais e você será <strong>redirecionado automaticamente para a página de pagamento do Mercado Pago</strong>.
                        </p>
                      </div>
                    )}

                    {/* Credit Card Inputs */}
                    {paymentMethod === 'credit_card' && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 text-xs">
                        <div>
                          <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                            Número do Cartão:
                          </label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full bg-[#181820] text-xs text-white px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-[#FF5500]"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                            Nome Impresso no Cartão:
                          </label>
                          <input
                            type="text"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                            className="w-full bg-[#181820] text-xs text-white px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-[#FF5500]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                              Validade (MM/AA):
                            </label>
                            <input
                              type="text"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              className="w-full bg-[#181820] text-xs text-white px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-[#FF5500]"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                              CVV:
                            </label>
                            <input
                              type="text"
                              value={cardCvv}
                              maxLength={4}
                              onChange={(e) => setCardCvv(e.target.value)}
                              className="w-full bg-[#181820] text-xs text-white px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-[#FF5500]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                            Número de Parcelas:
                          </label>
                          <select
                            value={installments || 1}
                            onChange={(e) => setInstallments(parseInt(e.target.value, 10) || 1)}
                            className="w-full bg-[#181820] text-xs text-white px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-[#FF5500]"
                          >
                            <option value={1}>1x de R$ {orderTotal.toFixed(2)} (sem juros)</option>
                            <option value={2}>2x de R$ {(orderTotal / 2).toFixed(2)} (sem juros)</option>
                            <option value={3}>3x de R$ {(orderTotal / 3).toFixed(2)} (sem juros)</option>
                            <option value={6}>6x de R$ {(orderTotal / 6 * 1.03).toFixed(2)}</option>
                            <option value={12}>12x de R$ {(orderTotal / 12 * 1.06).toFixed(2)}</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF5500] to-[#FFAA00] text-black font-black text-sm shadow-xl shadow-[#FF5500]/30 hover:shadow-[#FF5500]/50 hover:scale-[1.01] active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-black" />
                          <span>Conectando ao Mercado Pago...</span>
                        </>
                      ) : paymentMethod === 'mercadopago' ? (
                        <>
                          <ExternalLink className="w-4 h-4 text-black" />
                          <span>Pagar com Mercado Pago (R$ {orderTotal.toFixed(2)})</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-black" />
                          <span>Confirmar Pedido de R$ {orderTotal.toFixed(2)}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* STEP 2: REDIRECTING TO MERCADO PAGO */}
          {step === 'redirecting' && (
            <div className="max-w-xl mx-auto py-8 text-center space-y-6">
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-blue-600/30 border-2 border-blue-400 text-blue-400 flex items-center justify-center shadow-xl shadow-blue-500/30">
                  <ExternalLink className="w-10 h-10 animate-pulse text-blue-300" />
                </div>
              </div>

              <div>
                <span className="text-xs font-mono text-[#FFAA00] tracking-widest uppercase">
                  Pedido #{createdOrder?.orderNumber} Gerado
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  Redirecionando para o Mercado Pago
                </h3>
                <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
                  Você será transferido para o checkout oficial protegido do Mercado Pago para concluir o pagamento com PIX, Cartão ou Boleto.
                </p>
              </div>

              {/* Countdown & Action Card */}
              <div className="p-6 rounded-3xl bg-[#181820] border border-blue-500/30 space-y-4 text-center">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-blue-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    Redirecionando automaticamente em <strong className="text-white text-base font-black">{countdown}</strong> segundos...
                  </span>
                </div>

                <div className="pt-2">
                  <a
                    href={redirectUrl}
                    target="_top"
                    rel="noopener noreferrer"
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-sm sm:text-base shadow-xl shadow-blue-600/40 hover:scale-[1.02] active:scale-98 transition flex items-center justify-center gap-3"
                  >
                    <span>Ir para o Pagamento no Mercado Pago Agora</span>
                    <ExternalLink className="w-5 h-5 text-white" />
                  </a>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={copyRedirectUrl}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center gap-1.5"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link de Pagamento'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('success')}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition"
                  >
                    Ver Detalhes do Pedido
                  </button>
                </div>
              </div>

              {/* Security Badges */}
              <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Pagamento 100% Protegido
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-blue-400" />
                  SSL Criptografia 256 bits
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: DIRECT SUCCESS VIEW (PIX OR CREDIT CARD) */}
          {step === 'success' && (
            <div className="max-w-2xl mx-auto py-4 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-mono text-[#FFAA00] tracking-widest uppercase">
                  Pedido #{createdOrder?.orderNumber}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  Parabéns! Seu pedido foi registrado com sucesso.
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Enviamos os dados de rastreamento para <strong className="text-white">{createdOrder?.customerEmail}</strong>.
                </p>
              </div>

              {/* If Mercado Pago Order was created */}
              {createdOrder?.mercadoPagoInitPoint && (
                <div className="p-5 rounded-3xl bg-blue-950/30 border border-blue-500/40 text-left space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-300 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-400" />
                      Link do Checkout Mercado Pago
                    </span>
                    <span className="text-xs text-white font-extrabold">
                      R$ {createdOrder.total.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Caso sua janela de pagamento não tenha aberto, clique abaixo para acessar sua fatura no Mercado Pago:
                  </p>
                  <a
                    href={createdOrder.mercadoPagoInitPoint}
                    target="_top"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition"
                  >
                    <span>Abrir Pagamento Mercado Pago</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* PIX Payment Card */}
              {createdOrder?.paymentMethod === 'pix' && (
                <div className="p-6 rounded-3xl bg-[#181820] border border-[#FF5500]/40 space-y-4 text-left">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-emerald-400" />
                      <h4 className="text-sm font-bold text-white">Efetue o pagamento com PIX</h4>
                    </div>
                    <span className="text-xs text-[#FFAA00] font-bold">
                      R$ {createdOrder.total.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* QR Code image */}
                    <div className="p-3 bg-white rounded-2xl shadow-lg flex-shrink-0">
                      <img
                        src={createdOrder.pixQrCodeUrl}
                        alt="QR Code PIX Mercado Pago"
                        className="w-36 h-36 object-contain"
                      />
                    </div>

                    <div className="space-y-3 flex-1">
                      <p className="text-xs text-slate-300">
                        1. Abra o app do seu banco e escolha a opção <strong>PIX Copia e Cola</strong> ou <strong>Ler QR Code</strong>.
                      </p>
                      <p className="text-xs text-slate-300">
                        2. Aponte a câmera ou cole o código abaixo. A aprovação é <strong>automática em segundos</strong>.
                      </p>

                      <button
                        onClick={copyPixPayload}
                        className="w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-[#FF5500] hover:text-black text-white text-xs font-bold transition flex items-center justify-center gap-2"
                      >
                        {copiedPix ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedPix ? 'Código PIX Copiado!' : 'Copiar Código PIX (Copia e Cola)'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Webhook Sandbox simulation tool */}
                  <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-amber-300 block">Ambiente de Testes Mercado Pago</span>
                      <span className="text-[11px] text-slate-400">
                        Clique ao lado para testar a notificação de Webhook e aprovar o pagamento agora.
                      </span>
                    </div>
                    <button
                      onClick={() => simulateWebhookPaymentApproval(createdOrder.id)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs whitespace-nowrap shadow"
                    >
                      ⚡ Simular Webhook Aprovado
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleFinishAndTrack}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#FFAA00] text-black font-extrabold text-sm shadow-lg shadow-[#FF5500]/30 hover:scale-[1.02] transition"
                >
                  Acompanhar Entrega em Meus Pedidos
                </button>
                <button
                  onClick={() => {
                    setIsCheckoutModalOpen(false);
                    setCurrentView('home');
                  }}
                  className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition"
                >
                  Voltar à Página Inicial
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: ERROR VIEW */}
          {step === 'error' && (
            <div className="max-w-xl mx-auto py-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 text-red-400 flex items-center justify-center mx-auto shadow-xl shadow-red-500/20">
                <AlertCircle className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">
                  Não foi possível iniciar o checkout
                </h3>
                <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto">
                  Houve uma falha na comunicação com o Mercado Pago.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-xs text-red-200 text-left leading-relaxed">
                <p className="font-bold mb-1 flex items-center gap-1.5 text-red-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Mensagem de Diagnóstico:</span>
                </p>
                <p className="font-mono text-[11px] bg-black/40 p-2.5 rounded-xl border border-white/5 break-words">
                  {errorMessage || 'Erro inesperado ao criar preferência de pagamento no Mercado Pago.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Tentar Novamente</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('pix');
                    setStep('checkout');
                  }}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow transition flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Pagar com PIX Direto</span>
                </button>

                {currentUser?.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCheckoutModalOpen(false);
                      setCurrentView('admin');
                    }}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#FF5500] hover:bg-[#FFAA00] text-black font-extrabold text-xs shadow transition flex items-center justify-center gap-2"
                  >
                    <span>Abrir Configurações de API</span>
                    <ChevronRight className="w-4 h-4 text-black" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
