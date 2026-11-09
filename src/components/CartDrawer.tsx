import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  Truck, 
  ShieldCheck,
  Check
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    discountAmount,
    setIsCheckoutModalOpen,
    settings,
    selectedShipping,
    calculateShipping,
    isCalculatingShipping,
    shippingOptions,
    destinationCep,
    setDestinationCep
  } = useStore();

  const [showShippingCalc, setShowShippingCalc] = useState(false);
  const [cepLocal, setCepLocal] = useState(destinationCep);

  if (!isCartDrawerOpen) return null;

  const totalPlates = cart.reduce((sum, item) => sum + item.quantity, 0);
  const finalTotal = Math.max(0, cartSubtotal - discountAmount + (selectedShipping ? selectedShipping.price : 0));
  const progressToFreeShipping = Math.min(100, (cartSubtotal / settings.freeShippingMinimum) * 100);
  const remainingForFreeShipping = Math.max(0, settings.freeShippingMinimum - cartSubtotal);

  const handleGoToCheckout = () => {
    setIsCartDrawerOpen(false);
    setIsCheckoutModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#121217] border-l border-white/10 h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-[#181820] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FF5500]/20 text-[#FFAA00]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Seu Carrinho</h3>
              <p className="text-xs text-slate-400">
                {totalPlates} {totalPlates === 1 ? 'item adicionado' : 'itens adicionados'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCartDrawerOpen(false)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress */}
        <div className="px-6 py-3 bg-[#14141B] border-b border-white/5 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#FF5500]" />
              {remainingForFreeShipping > 0 ? (
                <>Faltam <strong className="text-white">R$ {remainingForFreeShipping.toFixed(2)}</strong> para Frete Grátis</>
              ) : (
                <span className="text-emerald-400 font-bold">🎉 Você ganhou Frete Especial!</span>
              )}
            </span>
            <span className="text-[11px] text-[#FFAA00] font-bold">{Math.round(progressToFreeShipping)}%</span>
          </div>
          <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#FF5500] to-[#FFAA00] rounded-full transition-all duration-500" 
              style={{ width: `${progressToFreeShipping}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-500">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">Seu carrinho está vazio</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Explore nossas placas de avaliação Google e combos com até 40% de desconto.
              </p>
              <button
                onClick={() => setIsCartDrawerOpen(false)}
                className="mt-2 px-5 py-2.5 rounded-xl bg-[#FF5500] text-black font-extrabold text-xs shadow-lg shadow-[#FF5500]/30"
              >
                Ver Catálogo de Placas
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartItemId}
                className="p-4 rounded-2xl bg-[#181820] border border-white/5 flex gap-3 relative group"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-xl bg-black border border-white/10 flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-2 leading-snug">
                    {item.name}
                  </h4>

                  {item.customization?.businessName && (
                    <p className="text-[10px] text-[#FFAA00] font-medium truncate mt-0.5">
                      Gravado: "{item.customization.businessName}"
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-bold text-white">
                        R$ {(item.unitPrice * item.quantity).toFixed(2)}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-[10px] text-slate-400">
                          (R$ {item.unitPrice.toFixed(2)} un)
                        </span>
                      )}
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center bg-black/50 border border-white/10 rounded-lg">
                      <button
                        onClick={() => updateCartQuantity(item.cartItemId, item.quantity - 1)}
                        className="p-1 hover:text-[#FF5500] text-slate-400 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-bold text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.cartItemId, item.quantity + 1)}
                        className="p-1 hover:text-[#FF5500] text-slate-400 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item.cartItemId)}
                  className="text-slate-500 hover:text-red-400 p-1 self-start transition"
                  title="Remover item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer with Totals & Checkout */}
        {cart.length > 0 && (
          <div className="p-6 bg-[#181820] border-t border-white/10 space-y-4">
            {/* Coupon issuance and management are admin-only.
                Customers have no coupon input or remove/change action. */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-slate-400">
              Promoções e cupons são administrados exclusivamente pela loja.
              O total do pedido será confirmado no servidor antes do pagamento.
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Subtotal dos Produtos</span>
                <span className="font-semibold text-white">R$ {cartSubtotal.toFixed(2)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Desconto Aplicado</span>
                  <span className="font-bold">- R$ {discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Frete (Melhor Envio)</span>
                {selectedShipping ? (
                  <span className="font-semibold text-[#FFAA00]">
                    R$ {selectedShipping.price.toFixed(2)} ({selectedShipping.service})
                  </span>
                ) : (
                  <span className="text-slate-400">Calculado no checkout</span>
                )}
              </div>

              <div className="pt-2 border-t border-white/10 flex justify-between items-baseline text-sm">
                <span className="font-extrabold text-white">Total Estimado</span>
                <div className="text-right">
                  <span className="text-xl font-black text-white">
                    R$ {finalTotal.toFixed(2)}
                  </span>
                  <span className="block text-[10px] text-emerald-400 font-bold">
                    à vista no PIX ou 12x no cartão
                  </span>
                </div>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={handleGoToCheckout}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF5500] to-[#FFAA00] text-black font-extrabold text-sm shadow-xl shadow-[#FF5500]/30 hover:shadow-[#FF5500]/50 hover:scale-[1.01] active:scale-95 transition flex items-center justify-center gap-2"
            >
              <span>Finalizar Compra Segura</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Mercado Pago Seguro
              </span>
              <span>•</span>
              <span>Envio em 24h</span>
              <span>•</span>
              <span>Garantia de 1 Ano</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
