import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Star, 
  Wifi, 
  Truck, 
  ShieldCheck, 
  ShoppingBag, 
  Sparkles, 
  CheckCircle2, 
  Box, 
  Layers, 
  Maximize2,
  Clock,
  QrCode
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const ProductDetailPage: React.FC = () => {
  const { 
    products, 
    selectedProductSlug, 
    setCurrentView, 
    addToCart, 
    calculateShipping, 
    shippingOptions, 
    isCalculatingShipping 
  } = useStore();

  const product = products.find((p) => p.slug === selectedProductSlug) || products[0];

  const [selectedImage, setSelectedImage] = useState<string>(product?.images[0] || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [cepInput, setCepInput] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState<string>('');

  if (!product) {
    return (
      <div className="py-20 text-center text-white">
        <p>Produto não encontrado.</p>
        <button
          onClick={() => setCurrentView('products')}
          className="mt-4 px-4 py-2 bg-[#FF5500] text-black font-bold rounded-xl"
        >
          Voltar ao Catálogo
        </button>
      </div>
    );
  }

  const currentPrice = product.promoPrice || product.salePrice;
  const hasDiscount = product.promoPrice && product.promoPrice < product.salePrice;

  const handleAddToCart = () => {
    addToCart({
      isKit: false,
      productId: product.id,
      name: product.name,
      image: selectedImage || product.images[0],
      unitPrice: currentPrice,
      quantity,
      sku: product.sku,
      customization: businessName || googleMapsUrl ? {
        businessName,
        googleMapsUrl
      } : undefined
    });
  };

  const handleCalculateShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cepInput.trim()) {
      await calculateShipping(cepInput);
    }
  };

  return (
    <div className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb & Back */}
      <button
        onClick={() => setCurrentView('products')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 group transition"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Voltar para todos os produtos</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative rounded-3xl bg-[#14141B] border border-white/10 overflow-hidden h-[400px] sm:h-[480px] flex items-center justify-center p-4">
            <img
              src={selectedImage || product.images[0]}
              alt={product.name}
              className="w-full h-full object-contain rounded-2xl"
            />
            {product.badge && (
              <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FF5500] to-[#FFAA00] text-black text-xs font-black uppercase tracking-wider shadow-lg">
                {product.badge}
              </span>
            )}
            {product.chipType && (
              <span className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur border border-white/10 text-[#FFAA00] text-xs font-bold">
                <Wifi className="w-3.5 h-3.5 rotate-90 text-[#FF5500]" />
                <span>NFC Programado</span>
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition ${
                    (selectedImage || product.images[0]) === img
                      ? 'border-[#FF5500] scale-95 shadow-md shadow-[#FF5500]/30'
                      : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Miniatura" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Live Preview of Customized Plate */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#181822] to-[#121217] border border-[#FF5500]/30 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#FFAA00]">
              <Sparkles className="w-4 h-4 text-[#FF5500]" />
              <span>Prévia em Tempo Real da sua Placa Gravada</span>
            </div>
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Gravação Frontal</span>
                <p className="text-base font-extrabold text-white text-gradient-silver">
                  {businessName.trim() || 'O Nome do seu Estabelecimento'}
                </p>
                <div className="flex text-[#FFAA00] mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center">
                <QrCode className="w-full h-full text-black" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Buying Box & Specifications */}
        <div className="lg:col-span-6 space-y-6">
          {/* Header & Rating */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex text-[#FFAA00]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-300">{product.rating}</span>
              <span className="text-xs text-slate-500">({product.reviewsCount} avaliações de clientes verificados)</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {product.name}
            </h1>

            <p className="text-xs font-mono text-slate-400">SKU: {product.sku}</p>
          </div>

          {/* Pricing Box */}
          <div className="p-6 rounded-3xl bg-[#14141B] border border-white/10 space-y-3">
            <div className="flex items-baseline gap-2">
              {hasDiscount && (
                <span className="text-sm text-slate-500 line-through">
                  R$ {product.salePrice.toFixed(2)}
                </span>
              )}
              <span className="text-sm font-semibold text-slate-400">R$</span>
              <span className="text-4xl font-black text-white">
                {currentPrice.toFixed(2).split('.')[0]}
              </span>
              <span className="text-lg font-bold text-slate-300">
                ,{currentPrice.toFixed(2).split('.')[1]}
              </span>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-500/20">
                5% de desconto no PIX
              </span>
            </div>

            <p className="text-xs text-slate-300 font-medium">
              ou em até <span className="text-white font-bold">12x de R$ {(currentPrice / 12 * 1.05).toFixed(2)}</span> no cartão de crédito
            </p>

            <div className="flex items-center gap-2 text-xs pt-2 border-t border-white/5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Em estoque ({product.stock} unidades disponíveis para despacho em 24h)</span>
            </div>
          </div>

          {/* Customization Inputs */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <span>Personalização da sua Placa</span>
              <span className="text-[10px] text-[#FFAA00] lowercase font-normal">(opcional)</span>
            </h4>

            <div>
              <label className="text-xs text-slate-300 block mb-1">
                Nome do Estabelecimento / Empresa:
              </label>
              <input
                type="text"
                placeholder="Ex: Barbearia VIP Centro"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-[#181820] text-sm text-white px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#FF5500] transition"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">
                Link do Google Meu Negócio (se já possuir):
              </label>
              <input
                type="url"
                placeholder="Ex: https://g.page/r/sua-empresa/review"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                className="w-full bg-[#181820] text-sm text-white px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#FF5500] transition"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Caso não saiba seu link, entraremos em contato via WhatsApp após a compra para auxiliá-lo!
              </span>
            </div>
          </div>

          {/* Quantity and Add to Cart Button */}
          <div className="flex gap-4 items-center">
            <div className="flex items-center bg-[#181820] border border-white/15 rounded-2xl p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white rounded-xl hover:bg-white/10 text-lg font-bold"
              >
                -
              </button>
              <span className="w-10 text-center font-bold text-white text-sm">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white rounded-xl hover:bg-white/10 text-lg font-bold"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF5500] to-[#FFAA00] text-black font-extrabold text-sm sm:text-base shadow-xl shadow-[#FF5500]/30 hover:shadow-[#FF5500]/50 hover:scale-[1.01] active:scale-95 transition flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5 text-black" />
              <span>Adicionar ao Carrinho</span>
            </button>
          </div>

          {/* Melhor Envio Shipping Simulator */}
          <div className="p-5 rounded-2xl bg-[#14141B] border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Truck className="w-4 h-4 text-[#FF5500]" />
              <span>Calcular Frete & Prazo (Melhor Envio / Correios / Jadlog)</span>
            </div>

            <form onSubmit={handleCalculateShipping} className="flex gap-2">
              <input
                type="text"
                placeholder="Informe seu CEP (ex: 01310-100)"
                value={cepInput}
                onChange={(e) => setCepInput(e.target.value)}
                maxLength={9}
                className="flex-1 bg-[#181820] text-sm text-white px-3.5 py-2.5 rounded-xl border border-white/15 focus:outline-none focus:border-[#FF5500]"
              />
              <button
                type="submit"
                disabled={isCalculatingShipping}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-[#FF5500] hover:text-black text-white text-xs font-bold transition disabled:opacity-50"
              >
                {isCalculatingShipping ? 'Calculando...' : 'Calcular'}
              </button>
            </form>

            {shippingOptions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/5 animate-in fade-in">
                {shippingOptions.map((opt) => (
                  <div
                    key={opt.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">{opt.service}</span>
                      <span className="text-[11px] text-slate-400">
                        {opt.carrier} • Chega em até {opt.estimatedDays} dias úteis
                      </span>
                    </div>
                    <span className="font-bold text-[#FFAA00] text-sm">
                      R$ {opt.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Technical Specifications Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Especificações Técnicas
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-[#14141B] border border-white/5">
                <span className="text-slate-400 block text-[10px] uppercase">Material</span>
                <span className="text-white font-medium">{product.material || 'Acrílico Premium'}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#14141B] border border-white/5">
                <span className="text-slate-400 block text-[10px] uppercase">Chip Integrado</span>
                <span className="text-[#FFAA00] font-medium">{product.chipType || 'NFC NTAG213'}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#14141B] border border-white/5">
                <span className="text-slate-400 block text-[10px] uppercase">Dimensões (A x L x C)</span>
                <span className="text-white font-medium">
                  {product.dimensions.heightCm} x {product.dimensions.widthCm} x {product.dimensions.lengthCm} cm
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#14141B] border border-white/5">
                <span className="text-slate-400 block text-[10px] uppercase">Peso para Frete</span>
                <span className="text-white font-medium">{product.weightGrams}g</span>
              </div>
            </div>
          </div>

          {/* Detailed Description */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Sobre este Produto
            </h3>
            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {product.detailedDescription}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
