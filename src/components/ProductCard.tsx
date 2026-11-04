import React from 'react';
import { 
  Star, 
  Wifi, 
  ShoppingBag, 
  Sparkles, 
  ArrowRight,
  Eye
} from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, setSelectedProductSlug, setCurrentView } = useStore();

  const handleOpenDetail = () => {
    setSelectedProductSlug(product.slug);
    setCurrentView('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      isKit: false,
      productId: product.id,
      name: product.name,
      image: product.images[0],
      unitPrice: product.promoPrice || product.salePrice,
      quantity: 1,
      sku: product.sku
    });
  };

  const currentPrice = product.promoPrice || product.salePrice;
  const hasDiscount = product.promoPrice && product.promoPrice < product.salePrice;

  return (
    <div
      onClick={handleOpenDetail}
      className="group relative rounded-3xl bg-[#121217] border border-white/10 hover:border-[#FF5500]/50 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-[#FF5500]/10 hover:-translate-y-1"
    >
      {/* Top Badges */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 items-start">
        {product.badge && (
          <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-[#FF5500] to-[#FFAA00] text-black text-[10px] font-black tracking-wider uppercase shadow-md">
            {product.badge}
          </span>
        )}
        {hasDiscount && (
          <span className="px-2 py-0.5 rounded-md bg-red-600/90 text-white text-[10px] font-extrabold shadow">
            OFERTA
          </span>
        )}
      </div>

      {/* Chip Indicator */}
      {product.chipType && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-[#FFAA00] text-[10px] font-bold">
          <Wifi className="w-3 h-3 rotate-90 text-[#FF5500]" />
          <span>NFC Ativo</span>
        </div>
      )}

      {/* Product Image */}
      <div className="relative h-56 sm:h-64 w-full bg-[#181820] overflow-hidden flex items-center justify-center p-2">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121217] via-transparent to-transparent opacity-60" />

        {/* Quick View Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-xs">
          <span className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs flex items-center gap-1.5 shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5" />
            <span>Personalizar & Detalhes</span>
          </span>
        </div>
      </div>

      {/* Product Information */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Reviews Star Rating */}
          <div className="flex items-center gap-1.5 text-xs mb-1.5">
            <div className="flex text-[#FFAA00]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-current" />
              ))}
            </div>
            <span className="text-[11px] font-bold text-slate-300">{product.rating}</span>
            <span className="text-[10px] text-slate-500">({product.reviewsCount})</span>
          </div>

          <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-[#FFAA00] transition line-clamp-2 leading-snug">
            {product.name}
          </h3>

          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>
        </div>

        {/* Price & Action */}
        <div className="pt-3 border-t border-white/5 space-y-2">
          <div>
            {hasDiscount && (
              <span className="text-xs text-slate-500 line-through mr-2">
                R$ {product.salePrice.toFixed(2)}
              </span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-semibold text-slate-400">R$</span>
              <span className="text-2xl font-black text-white">
                {currentPrice.toFixed(2).split('.')[0]}
              </span>
              <span className="text-xs font-bold text-slate-300">
                ,{currentPrice.toFixed(2).split('.')[1]}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold ml-1.5 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-500/20">
                PIX à vista
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              ou até 12x de R$ {(currentPrice / 12 * 1.05).toFixed(2)}
            </p>
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={product.stock <= 0}
            className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
              product.stock > 0
                ? 'bg-white/10 hover:bg-[#FF5500] hover:text-black text-white border border-white/10 shadow-sm'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{product.stock > 0 ? 'Adicionar ao Carrinho' : 'Sem Estoque'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
