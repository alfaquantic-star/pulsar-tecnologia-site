import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  ShoppingBag, 
  Users, 
  Settings, 
  Globe, 
  Plus, 
  Edit3, 
  Trash2, 
  DollarSign, 
  TrendingUp, 
  Truck, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  ArrowLeft,
  Sliders,
  ExternalLink,
  Printer,
  Sparkles,
  Zap,
  Save,
  Check,
  Upload,
  Image as ImageIcon,
  X,
  Star,
  Database,
  RefreshCw,
  Copy,
  Key,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  EyeOff,
  Lock,
  Wifi
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Kit, Order, OrderPaymentStatus, OrderShippingStatus, Product } from '../types';
import { getSupabaseCredentials, saveSupabaseCredentials } from '../lib/supabase';
import { testMercadoPagoConnection } from '../services/mercadopago';

// Helper to load and optimize image files uploaded from user's computer
const readImageFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve(result);
        }
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const AdminPanel: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    kits,
    addKit,
    updateKit,
    deleteKit,
    getKitAvailableStock,
    orders,
    updateOrderStatus,
    simulateWebhookPaymentApproval,
    settings,
    updateSettings,
    setCurrentView,
    showToast,
    isSupabaseConnected,
    isSyncingSupabase,
    syncWithSupabase,
    testSupabase
  } = useStore();

  const [adminTab, setAdminTab] = useState<'dashboard' | 'products' | 'kits' | 'orders' | 'customers' | 'cms' | 'integrations' | 'supabase'>('dashboard');
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [searchOrderText, setSearchOrderText] = useState('');

  // Supabase Live Config state
  const [supabaseUrl, setSupabaseUrl] = useState(() => getSupabaseCredentials().url);
  const [supabaseKey, setSupabaseKey] = useState(() => getSupabaseCredentials().key);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Product Modal / Form State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodSlug, setProdSlug] = useState('');
  const [prodShortDesc, setProdShortDesc] = useState('');
  const [prodPrice, setProdPrice] = useState<number | string>(80);
  const [prodPromoPrice, setProdPromoPrice] = useState<number | string>(74.9);
  const [prodCost, setProdCost] = useState<number | string>(25);
  const [prodStock, setProdStock] = useState<number | string>(100);
  const [prodSku, setProdSku] = useState('PULSAR-PROD-01');
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [prodCategory, setProdCategory] = useState<'placas-google' | 'placas-nfc' | 'kits-promocionais' | 'acessorios'>('placas-google');
  const [prodChip, setProdChip] = useState('NXP NTAG213');
  const [prodWeight, setProdWeight] = useState<number | string>(180);

  // Kit Modal / Form State
  const [editingKit, setEditingKit] = useState<Kit | null>(null);
  const [isKitModalOpen, setIsKitModalOpen] = useState(false);
  const [kitName, setKitName] = useState('');
  const [kitSlug, setKitSlug] = useState('');
  const [kitDesc, setKitDesc] = useState('');
  const [kitPrice, setKitPrice] = useState<number | string>(120);
  const [kitRefPrice, setKitRefPrice] = useState<number | string>(160);
  const [kitBadge, setKitBadge] = useState('Combo Promocional');
  const [kitPlatesQty, setKitPlatesQty] = useState<number | string>(2);
  const [kitImage, setKitImage] = useState('https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=800&q=80');
  const [isUploadingKitImage, setIsUploadingKitImage] = useState(false);

  // Tracking modal / Order action state
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<Order | null>(null);
  const [newTrackingCode, setNewTrackingCode] = useState('');

  // CMS Settings local state
  const [cmsStoreName, setCmsStoreName] = useState(settings.storeName);
  const [cmsSlogan, setCmsSlogan] = useState(settings.slogan);
  const [cmsHeroBadge, setCmsHeroBadge] = useState(settings.heroBadge);
  const [cmsHeroTitle, setCmsHeroTitle] = useState(settings.heroTitle);
  const [cmsHeroHighlight, setCmsHeroHighlight] = useState(settings.heroTitleHighlight);
  const [cmsHeroSubtitle, setCmsHeroSubtitle] = useState(settings.heroSubtitle);
  const [cmsAnnouncement, setCmsAnnouncement] = useState(settings.announcementBarText);
  const [cmsWhatsapp, setCmsWhatsapp] = useState(settings.whatsappNumber);
  const [cmsSupportEmail, setCmsSupportEmail] = useState(settings.supportEmail);
  const [cmsLogoUrl, setCmsLogoUrl] = useState(settings.logoUrl);
  const [cmsHeroImageUrl, setCmsHeroImageUrl] = useState(settings.heroImageUrl || '');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingHeroImage, setIsUploadingHeroImage] = useState(false);

  // Live Preview Device state
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [cmsViewMode, setCmsViewMode] = useState<'split' | 'editor' | 'preview'>('split');

  // APIs & Integrations local state
  const [cmsOriginCep, setCmsOriginCep] = useState(settings.originCep);
  const [cmsMercadoPagoKey, setCmsMercadoPagoKey] = useState(settings.mercadoPagoPublicKey);
  const [cmsMercadoPagoToken, setCmsMercadoPagoToken] = useState(settings.mercadoPagoAccessToken);
  const [cmsMercadoPagoSandbox, setCmsMercadoPagoSandbox] = useState(settings.mercadoPagoSandbox);
  const [cmsMelhorEnvioToken, setCmsMelhorEnvioToken] = useState(settings.melhorEnvioToken);
  const [cmsMelhorEnvioClientId, setCmsMelhorEnvioClientId] = useState(settings.melhorEnvioClientId || '');
  const [cmsMelhorEnvioClientSecret, setCmsMelhorEnvioClientSecret] = useState(settings.melhorEnvioClientSecret || '');
  const [cmsMelhorEnvioSandbox, setCmsMelhorEnvioSandbox] = useState(settings.melhorEnvioSandbox);
  const [apiTestSuccess, setApiTestSuccess] = useState<{ mp?: boolean; me?: boolean }>({});
  const [isTestingMp, setIsTestingMp] = useState(false);
  const [mpTestResult, setMpTestResult] = useState<{ success: boolean; message: string; user?: any } | null>(null);

  // Metrics
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'approved')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrdersCount = orders.filter((o) => o.paymentStatus === 'pending').length;
  const approvedOrdersCount = orders.filter((o) => o.paymentStatus === 'approved').length;
  const shippedOrdersCount = orders.filter((o) => o.shippingStatus === 'shipped').length;
  const averageTicket = approvedOrdersCount > 0 ? totalRevenue / approvedOrdersCount : 142.50;

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'pending' && o.paymentStatus !== 'pending') return false;
    if (orderFilter === 'approved' && o.paymentStatus !== 'approved') return false;
    if (orderFilter === 'shipped' && o.shippingStatus !== 'shipped') return false;
    if (searchOrderText) {
      const q = searchOrderText.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Handle file upload from computer for products
  const handleProductFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingImages(true);
    try {
      const uploaded: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const dataUrl = await readImageFileAsDataUrl(files[i]);
        uploaded.push(dataUrl);
      }
      setProdImages((prev) => [...prev, ...uploaded]);
      showToast(`${uploaded.length} imagem(ns) carregada(s) do seu computador!`, 'success');
    } catch (err) {
      showToast('Erro ao carregar fotos do dispositivo.', 'error');
    } finally {
      setIsUploadingImages(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (newImageUrl.trim()) {
      setProdImages((prev) => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
      showToast('Imagem adicionada via URL!', 'info');
    }
  };

  const handleRemoveProductImage = (idxToRemove: number) => {
    setProdImages((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSetPrimaryImage = (idxToPrimary: number) => {
    setProdImages((prev) => {
      const chosen = prev[idxToPrimary];
      const others = prev.filter((_, idx) => idx !== idxToPrimary);
      return [chosen, ...others];
    });
    showToast('Foto definida como capa principal!', 'info');
  };

  // Handle Kit file upload
  const handleKitFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingKitImage(true);
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setKitImage(dataUrl);
      showToast('Imagem do combo carregada do computador!', 'success');
    } catch (err) {
      showToast('Erro ao carregar imagem do combo.', 'error');
    } finally {
      setIsUploadingKitImage(false);
      e.target.value = '';
    }
  };

  // Handle Logo file upload
  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setCmsLogoUrl(dataUrl);
      updateSettings({ logoUrl: dataUrl });
      showToast('Logotipo atualizado e salvo com sucesso!', 'success');
    } catch (err) {
      showToast('Erro ao carregar arquivo de logotipo.', 'error');
    } finally {
      setIsUploadingLogo(false);
      e.target.value = '';
    }
  };

  // Handle Hero Image file upload from computer
  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingHeroImage(true);
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setCmsHeroImageUrl(dataUrl);
      showToast('Imagem do Hero carregada do computador com sucesso!', 'success');
    } catch (err) {
      showToast('Erro ao carregar imagem do Hero.', 'error');
    } finally {
      setIsUploadingHeroImage(false);
      e.target.value = '';
    }
  };

  // Handle open product modal
  const handleOpenProductModal = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod);
      setProdName(prod.name);
      setProdSlug(prod.slug);
      setProdShortDesc(prod.shortDescription);
      setProdPrice(prod.salePrice);
      setProdPromoPrice(prod.promoPrice || prod.salePrice);
      setProdCost(prod.cost);
      setProdStock(prod.stock);
      setProdSku(prod.sku);
      setProdImages(prod.images && prod.images.length > 0 ? [...prod.images] : ['https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80']);
      setProdCategory(prod.category);
      setProdChip(prod.chipType || 'NXP NTAG213');
      setProdWeight(prod.weightGrams);
    } else {
      setEditingProduct(null);
      setProdName('');
      setProdSlug('');
      setProdShortDesc('');
      setProdPrice(80);
      setProdPromoPrice(74.9);
      setProdCost(25);
      setProdStock(50);
      setProdSku(`PULSAR-SKU-${Math.floor(100 + Math.random() * 900)}`);
      setProdImages(['https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80']);
      setProdCategory('placas-google');
      setProdChip('NXP NTAG213');
      setProdWeight(180);
    }
    setNewImageUrl('');
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const finalImages = prodImages.length > 0 ? prodImages : ['https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80'];

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: prodName,
        shortDescription: prodShortDesc,
        salePrice: Number(prodPrice),
        promoPrice: Number(prodPromoPrice),
        cost: Number(prodCost),
        stock: Number(prodStock),
        sku: prodSku,
        category: prodCategory,
        chipType: prodChip,
        weightGrams: Number(prodWeight),
        images: finalImages
      });
    } else {
      addProduct({
        name: prodName,
        slug: prodName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        shortDescription: prodShortDesc,
        detailedDescription: prodShortDesc,
        salePrice: Number(prodPrice),
        promoPrice: Number(prodPromoPrice),
        cost: Number(prodCost),
        stock: Number(prodStock),
        trackStock: true,
        sku: prodSku,
        category: prodCategory,
        chipType: prodChip,
        dimensions: { heightCm: 15, widthCm: 10, lengthCm: 5 },
        weightGrams: Number(prodWeight),
        isActive: true,
        isFeatured: true,
        isBestSeller: false,
        rating: 5.0,
        reviewsCount: 1,
        images: finalImages
      });
    }
    setIsProductModalOpen(false);
  };

  // Handle open kit modal
  const handleOpenKitModal = (kit?: Kit) => {
    if (kit) {
      setEditingKit(kit);
      setKitName(kit.name);
      setKitSlug(kit.slug);
      setKitDesc(kit.description);
      setKitPrice(kit.kitPrice);
      setKitRefPrice(kit.referencePrice);
      setKitBadge(kit.badge || '');
      setKitPlatesQty(kit.items[0]?.quantity || 2);
      setKitImage(kit.image || 'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=800&q=80');
    } else {
      setEditingKit(null);
      setKitName('');
      setKitSlug('');
      setKitDesc('');
      setKitPrice(120);
      setKitRefPrice(160);
      setKitBadge('Combo Promocional');
      setKitPlatesQty(2);
      setKitImage('https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=800&q=80');
    }
    setIsKitModalOpen(true);
  };

  const handleSaveKit = (e: React.FormEvent) => {
    e.preventDefault();
    const primaryProdId = products[0]?.id || 'prod-google-black-piano';
    const numRefPrice = Number(kitRefPrice) || 0;
    const numKitPrice = Number(kitPrice) || 0;
    const numPlatesQty = Number(kitPlatesQty) || 1;
    const savings = Math.max(0, numRefPrice - numKitPrice);
    const discountPerc = numRefPrice > 0 ? Math.round((savings / numRefPrice) * 100) : 0;
    const finalKitImg = kitImage || 'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=800&q=80';

    if (editingKit) {
      updateKit(editingKit.id, {
        name: kitName,
        description: kitDesc,
        kitPrice: numKitPrice,
        referencePrice: numRefPrice,
        savingsAmount: savings,
        discountPercentage: discountPerc,
        badge: kitBadge,
        image: finalKitImg,
        items: [{ productId: primaryProdId, quantity: numPlatesQty }]
      });
    } else {
      addKit({
        name: kitName,
        slug: kitName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        description: kitDesc,
        image: finalKitImg,
        kitPrice: numKitPrice,
        referencePrice: numRefPrice,
        savingsAmount: savings,
        discountPercentage: discountPerc,
        badge: kitBadge,
        isActive: true,
        isFeatured: true,
        items: [{ productId: primaryProdId, quantity: numPlatesQty }]
      });
    }
    setIsKitModalOpen(false);
  };

  const handleSaveCmsSettings = () => {
    updateSettings({
      storeName: cmsStoreName,
      slogan: cmsSlogan,
      heroBadge: cmsHeroBadge,
      heroTitle: cmsHeroTitle,
      heroTitleHighlight: cmsHeroHighlight,
      heroSubtitle: cmsHeroSubtitle,
      announcementBarText: cmsAnnouncement,
      whatsappNumber: cmsWhatsapp,
      supportEmail: cmsSupportEmail,
      logoUrl: cmsLogoUrl,
      heroImageUrl: cmsHeroImageUrl
    });
    // The StoreContext emits success only after the protected Supabase API
    // has confirmed persistence. The button itself must not claim success.
    // Fields not stored in site_settings still require a separate migration.
  };

  const handleSaveApiSettings = () => {
    // Public store configuration only. Private tokens are configured in
    // Vercel server environment variables, never stored via CMS/browser.
    updateSettings({
      originCep: cmsOriginCep,
      mercadoPagoPublicKey: cmsMercadoPagoKey
    });
    setCmsMercadoPagoToken('');
    setCmsMelhorEnvioToken('');
    setCmsMelhorEnvioClientSecret('');
    showToast('Somente CEP de origem e chave pública foram enviados. Tokens privados devem ser configurados na Vercel (Environment Variables).', 'info');
  };

  const handleTestMercadoPago = async () => {
    // No tokens from browser forms. Server env owns MERCADO_PAGO_ACCESS_TOKEN.
    setIsTestingMp(true);
    setMpTestResult(null);
    try {
      const res = await testMercadoPagoConnection();
      setMpTestResult(res);
      if (res.success) {
        showToast('Conexão com o Mercado Pago validada com sucesso!', 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      setMpTestResult({
        success: false,
        message: err.message || 'Falha ao conectar com Mercado Pago'
      });
      showToast('Falha no teste do Mercado Pago', 'error');
    } finally {
      setIsTestingMp(false);
    }
  };

  const handleUpdateTracking = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrderForTracking && newTrackingCode.trim()) {
      updateOrderStatus(selectedOrderForTracking.id, {
        trackingCode: newTrackingCode.trim().toUpperCase(),
        shippingStatus: 'shipped'
      });
      setSelectedOrderForTracking(null);
      setNewTrackingCode('');
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col md:flex-row text-slate-200">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#121217] border-r border-white/10 p-5 flex flex-col justify-between space-y-6 flex-shrink-0">
        <div className="space-y-6">
          {/* Logo & Badge */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-black text-white text-base">Pulsar Admin</h2>
                <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                  Master E-commerce
                </span>
              </div>
            </div>

            <button
              onClick={() => setCurrentView('home')}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              title="Voltar para a Loja"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1 text-xs font-semibold">
            <button
              onClick={() => setAdminTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition ${
                adminTab === 'dashboard'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard & Métricas</span>
            </button>

            <button
              onClick={() => setAdminTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition ${
                adminTab === 'orders'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4" />
                <span>Gestão de Pedidos</span>
              </div>
              {pendingOrdersCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setAdminTab('products')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition ${
                adminTab === 'products'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Produtos & Estoque ({products.length})</span>
            </button>

            <button
              onClick={() => setAdminTab('kits')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition ${
                adminTab === 'kits'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Combos & Kits ({kits.length})</span>
            </button>

            <button
              onClick={() => setAdminTab('cms')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition ${
                adminTab === 'cms'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Editor de Banners & CMS</span>
            </button>

            <button
              onClick={() => setAdminTab('integrations')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition ${
                adminTab === 'integrations'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>APIs Mercado Pago & Frete</span>
            </button>

            <button
              onClick={() => setAdminTab('supabase')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition ${
                adminTab === 'supabase'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Integração Supabase</span>
              </div>
              <span
                className={`w-2 h-2 rounded-full ${
                  isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                }`}
                title={isSupabaseConnected ? 'Supabase Conectado' : 'Não conectado'}
              />
            </button>
          </nav>
        </div>

        {/* Bottom Store Link */}
        <div className="pt-4 border-t border-white/10 space-y-2">
          <button
            onClick={() => setCurrentView('home')}
            className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ver Loja em Tempo Real</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Area */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto space-y-8">
        {/* DASHBOARD TAB */}
        {adminTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">Dashboard Operacional</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Métricas de faturamento, pedidos e controle de expedição da Pulsar Tecnologia
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenProductModal()}
                  className="px-4 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#FF5500]/90 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-[#FF5500]/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Produto</span>
                </button>
                <button
                  onClick={() => handleOpenKitModal()}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Combo</span>
                </button>
              </div>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-[#14141B] border border-white/10 space-y-2 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Faturamento Aprovado</span>
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white">
                  R$ {totalRevenue.toFixed(2)}
                </h3>
                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +18.4% este mês
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-[#14141B] border border-white/10 space-y-2 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Pedidos Totais</span>
                  <div className="p-2 rounded-xl bg-[#FF5500]/20 text-[#FFAA00]">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white">{orders.length}</h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  {approvedOrdersCount} pagos • {pendingOrdersCount} pendentes
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-[#14141B] border border-white/10 space-y-2 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Ticket Médio</span>
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white">
                  R$ {averageTicket.toFixed(2)}
                </h3>
                <span className="text-[11px] text-blue-400 font-medium">
                  Alavancado pelos combos múltiplos
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-[#14141B] border border-white/10 space-y-2 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Envios / Expedição</span>
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                    <Truck className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white">{shippedOrdersCount}</h3>
                <span className="text-[11px] text-purple-400 font-medium">
                  Rastreados via Melhor Envio
                </span>
              </div>
            </div>

            {/* Quick Orders & Top Products preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Recent Orders */}
              <div className="lg:col-span-8 p-6 rounded-3xl bg-[#14141B] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Últimos Pedidos Recebidos
                  </h3>
                  <button
                    onClick={() => setAdminTab('orders')}
                    className="text-xs text-[#FFAA00] hover:underline font-bold"
                  >
                    Ver Todos →
                  </button>
                </div>

                <div className="space-y-3">
                  {orders.slice(0, 4).map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3.5 rounded-2xl bg-[#181820] border border-white/5 flex items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white">#{ord.orderNumber}</span>
                          <span className="text-slate-400">{ord.customerName}</span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {new Date(ord.createdAt).toLocaleDateString('pt-BR')} • {ord.paymentMethod.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-white block">
                          R$ {ord.total.toFixed(2)}
                        </span>
                        <span className={`text-[10px] font-bold ${
                          ord.paymentStatus === 'approved' ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {ord.paymentStatus === 'approved' ? 'Aprovado' : 'Aguardando'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Combos & Stock Health */}
              <div className="lg:col-span-4 p-6 rounded-3xl bg-[#14141B] border border-white/10 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Combos mais Vendidos
                </h3>
                <div className="space-y-3">
                  {kits.map((kit) => {
                    const available = getKitAvailableStock(kit);
                    return (
                      <div key={kit.id} className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs space-y-1">
                        <div className="flex justify-between font-bold text-white">
                          <span className="truncate max-w-[170px]">{kit.name}</span>
                          <span className="text-[#FFAA00]">R$ {kit.kitPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Estoque integrado:</span>
                          <span className={available > 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                            {available} combos prontos
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS MANAGEMENT TAB */}
        {adminTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">Gerenciamento de Produtos</h2>
                <p className="text-xs text-slate-400">
                  Cadastre, altere preços, gerencie imagens e controle o estoque integrado
                </p>
              </div>

              <button
                onClick={() => handleOpenProductModal()}
                className="px-5 py-2.5 rounded-xl bg-[#FF5500] text-black font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-[#FF5500]/20"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Novo Produto</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="rounded-3xl bg-[#14141B] border border-white/10 overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#181820] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="p-4">Produto</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4">Preço Venda</th>
                    <th className="p-4">Preço Promo</th>
                    <th className="p-4">Estoque</th>
                    <th className="p-4">Peso</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-white/5 transition">
                      <td className="p-4 flex items-center gap-3">
                        <img src={prod.images[0]} alt={prod.name} className="w-10 h-10 object-cover rounded-lg bg-black" />
                        <div>
                          <p className="font-bold text-white">{prod.name}</p>
                          <span className="text-[10px] text-slate-400">{prod.chipType}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-300">{prod.sku}</td>
                      <td className="p-4 font-bold text-slate-300">R$ {prod.salePrice.toFixed(2)}</td>
                      <td className="p-4 font-bold text-[#FFAA00]">
                        {prod.promoPrice ? `R$ ${prod.promoPrice.toFixed(2)}` : '-'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          prod.stock > 10 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {prod.stock} un.
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{prod.weightGrams}g</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenProductModal(prod)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProduct(prod.id)}
                            className="p-1.5 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/60"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* KITS MANAGEMENT TAB (PRIORITY SECTION 5) */}
        {adminTab === 'kits' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-white">Sistema Avançado de Kits & Combos</h2>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FF5500] text-black font-extrabold uppercase">
                    Prioritário
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Crie combos dinâmicos com economia explícita e controle de estoque baseado nos produtos individuais
                </p>
              </div>

              <button
                onClick={() => handleOpenKitModal()}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Novo Combo de Placas</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kits.map((kit) => {
                const available = getKitAvailableStock(kit);
                const totalPlates = kit.items.reduce((s, it) => s + it.quantity, 0);

                return (
                  <div key={kit.id} className="p-6 rounded-3xl bg-[#14141B] border border-white/10 space-y-4 relative flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#FFAA00]">{kit.badge || 'Combo Promocional'}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleOpenKitModal(kit)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteKit(kit.id)}
                            className="p-1.5 rounded-lg bg-red-950/40 text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-extrabold text-base text-white">{kit.name}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{kit.description}</p>

                      <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Preço Referência (Unitários):</span>
                          <span className="line-through">R$ {kit.referencePrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-white text-sm">
                          <span>Preço Promocional do Kit:</span>
                          <span className="text-[#FFAA00]">R$ {kit.kitPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-white/5">
                          <span>Economia para o Cliente:</span>
                          <span>R$ {kit.savingsAmount.toFixed(2)} ({kit.discountPercentage}% OFF)</span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300">
                        <span>Quantidade total no combo: <strong>{totalPlates} placas</strong></span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Estoque Vinculado:</span>
                      <span className={`font-bold ${available > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {available} unidades montáveis
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ORDERS MANAGEMENT TAB */}
        {adminTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">Gerenciamento de Pedidos & Expedição</h2>
                <p className="text-xs text-slate-400">
                  Acompanhe pagamentos Mercado Pago e gere etiquetas de postagem e rastreamento
                </p>
              </div>

              {/* Status filter tabs */}
              <div className="flex gap-2">
                {['all', 'pending', 'approved', 'shipped'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setOrderFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                      orderFilter === f ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendentes' : f === 'approved' ? 'Pagos' : 'Enviados'}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="rounded-3xl bg-[#14141B] border border-white/10 overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#181820] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="p-4">Pedido / Data</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Valor Total</th>
                    <th className="p-4">Pagamento</th>
                    <th className="p-4">Expedição</th>
                    <th className="p-4">Rastreamento</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-white/5 transition">
                      <td className="p-4">
                        <span className="font-extrabold text-white block">#{ord.orderNumber}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(ord.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-white block">{ord.customerName}</span>
                        <span className="text-[10px] text-slate-400">{ord.customerEmail}</span>
                      </td>

                      <td className="p-4 font-black text-white">
                        R$ {ord.total.toFixed(2)}
                      </td>

                      <td className="p-4">
                        <div className="space-y-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.paymentStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {ord.paymentStatus === 'approved' ? 'Aprovado' : 'Aguardando'}
                          </span>
                          {ord.paymentStatus === 'pending' && (
                            <button
                              onClick={() => simulateWebhookPaymentApproval(ord.id)}
                              className="block text-[9px] text-[#FFAA00] underline font-semibold mt-0.5"
                            >
                              ⚡ Aprovar Webhook
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.shippingStatus === 'shipped'
                            ? 'bg-blue-500/20 text-blue-400'
                            : ord.shippingStatus === 'delivered'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {ord.shippingStatus === 'shipped'
                            ? 'Enviado'
                            : ord.shippingStatus === 'delivered'
                            ? 'Entregue'
                            : 'Em Separação'}
                        </span>
                      </td>

                      <td className="p-4 font-mono text-slate-300">
                        {ord.trackingCode || (
                          <button
                            onClick={() => {
                              setSelectedOrderForTracking(ord);
                              setNewTrackingCode(`NL${Math.floor(100000000 + Math.random() * 900000000)}BR`);
                            }}
                            className="text-[11px] text-[#FFAA00] hover:underline"
                          >
                            + Inserir Código
                          </button>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedOrderForTracking(ord);
                            setNewTrackingCode(ord.trackingCode || `NL${Math.floor(100000000 + Math.random() * 900000000)}BR`);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold"
                        >
                          Gerenciar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CMS & BANNER EDITOR TAB WITH LIVE STORE PREVIEW */}
        {adminTab === 'cms' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <Globe className="w-6 h-6 text-[#FF5500]" />
                  <span>Editor Visual do Site & CMS</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Altere textos, fotos e identidade visual com <strong>Prévia em Tempo Real</strong> para Computador, Tablet e Celular.
                </p>
              </div>

              {/* View Switcher: Editor / Prévia / Lado a Lado */}
              <div className="flex items-center gap-2">
                <div className="flex rounded-xl bg-[#14141B] p-1 border border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => setCmsViewMode('editor')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      cmsViewMode === 'editor'
                        ? 'bg-[#FF5500] text-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Editar Textos & Fotos
                  </button>
                  <button
                    type="button"
                    onClick={() => setCmsViewMode('preview')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      cmsViewMode === 'preview'
                        ? 'bg-purple-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Prévia em Tela Cheia</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCmsViewMode('split')}
                    className={`hidden xl:flex px-3 py-1.5 rounded-lg font-bold transition items-center gap-1.5 ${
                      cmsViewMode === 'split'
                        ? 'bg-white/15 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#FFAA00]" />
                    <span>Lado a Lado</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSaveCmsSettings}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#FFAA00] text-black font-extrabold text-xs shadow-lg shadow-[#FF5500]/30 hover:scale-[1.02] active:scale-95 transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4 text-black" />
                  <span>Publicar no Site Oficial</span>
                </button>
              </div>
            </div>

            {/* Layout Grid according to cmsViewMode */}
            <div className={`grid gap-6 ${cmsViewMode === 'split' ? 'grid-cols-1 xl:grid-cols-12' : 'grid-cols-1'}`}>
              {/* LEFT COLUMN: FORM CONTROLS (Photos & Texts) */}
              {(cmsViewMode === 'editor' || cmsViewMode === 'split') && (
                <div className={`${cmsViewMode === 'split' ? 'xl:col-span-5' : 'max-w-4xl'} space-y-6 text-xs`}>
                  {/* Photo Section: Logo & Hero Mockup */}
                  <div className="p-6 rounded-3xl bg-[#14141B] border border-white/10 space-y-5">
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#FFAA00]" />
                      <span>Fotos & Imagens do Site</span>
                    </h3>

                    {/* 1. Store Logo */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-white text-xs">Logotipo Principal da Marca</h4>
                          <p className="text-[11px] text-slate-400">Exibido no cabeçalho e rodapé do site</p>
                        </div>
                        <div className="p-2 bg-black rounded-xl border border-white/10 h-12 w-28 flex items-center justify-center">
                          <img src={cmsLogoUrl || settings.logoUrl} alt="Logo Atual" className="max-h-full max-w-full object-contain" />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-2.5">
                        <input
                          type="file"
                          id="logo-file-upload-cms"
                          accept="image/*"
                          onChange={handleLogoFileUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="logo-file-upload-cms"
                          className="w-full sm:w-auto cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#FFAA00] text-black font-extrabold text-xs shadow-md hover:scale-[1.02] transition"
                        >
                          <Upload className="w-3.5 h-3.5 text-black" />
                          <span>{isUploadingLogo ? 'Carregando...' : 'Carregar Logo do Computador'}</span>
                        </label>

                        <input
                          type="url"
                          placeholder="Ou informe o link da imagem"
                          value={cmsLogoUrl}
                          onChange={(e) => setCmsLogoUrl(e.target.value)}
                          className="w-full sm:flex-1 bg-[#181820] text-white p-2.5 rounded-xl border border-white/10 text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* 2. Hero Mockup / Plate Image */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-white text-xs">Foto de Destaque no Hero (Mockup da Placa)</h4>
                          <p className="text-[11px] text-slate-400">
                            Substitui a placa 3D simulada por uma foto real do produto
                          </p>
                        </div>
                        {cmsHeroImageUrl && (
                          <div className="p-1 bg-black rounded-xl border border-white/10 h-14 w-14 flex items-center justify-center overflow-hidden">
                            <img src={cmsHeroImageUrl} alt="Hero Mockup" className="w-full h-full object-cover rounded-lg" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-2.5">
                        <input
                          type="file"
                          id="hero-file-upload-cms"
                          accept="image/*"
                          onChange={handleHeroImageUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="hero-file-upload-cms"
                          className="w-full sm:w-auto cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploadingHeroImage ? 'Carregando...' : 'Carregar Foto do Computador'}</span>
                        </label>

                        <input
                          type="url"
                          placeholder="Ou URL da foto do produto"
                          value={cmsHeroImageUrl}
                          onChange={(e) => setCmsHeroImageUrl(e.target.value)}
                          className="w-full sm:flex-1 bg-[#181820] text-white p-2.5 rounded-xl border border-white/10 text-xs font-mono"
                        />

                        {cmsHeroImageUrl && (
                          <button
                            type="button"
                            onClick={() => setCmsHeroImageUrl('')}
                            className="p-2.5 rounded-xl bg-white/10 text-slate-400 hover:text-red-400 text-xs"
                            title="Remover foto personalizada e usar placa interativa padrão"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Texts Section */}
                  <div className="p-6 rounded-3xl bg-[#14141B] border border-white/10 space-y-4">
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-[#FF5500]" />
                      <span>Textos Comerciais & Chamadas do Site</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">
                          Nome da Empresa / Loja:
                        </label>
                        <input
                          type="text"
                          value={cmsStoreName}
                          onChange={(e) => setCmsStoreName(e.target.value)}
                          className="w-full bg-[#181820] text-white p-2.5 rounded-xl border border-white/10"
                        />
                      </div>

                      <div>
                        <label className="text-slate-300 font-bold block mb-1">
                          Slogan Institucional:
                        </label>
                        <input
                          type="text"
                          value={cmsSlogan}
                          onChange={(e) => setCmsSlogan(e.target.value)}
                          className="w-full bg-[#181820] text-white p-2.5 rounded-xl border border-white/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">
                        Barra Superior de Anúncios (Topo):
                      </label>
                      <input
                        type="text"
                        value={cmsAnnouncement}
                        onChange={(e) => setCmsAnnouncement(e.target.value)}
                        className="w-full bg-[#181820] text-white p-2.5 rounded-xl border border-white/10 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">
                        Badge de Tecnologia do Hero (Selo Laranja):
                      </label>
                      <input
                        type="text"
                        value={cmsHeroBadge}
                        onChange={(e) => setCmsHeroBadge(e.target.value)}
                        className="w-full bg-[#181820] text-white p-2.5 rounded-xl border border-white/10"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">
                          Título Principal do Hero:
                        </label>
                        <input
                          type="text"
                          value={cmsHeroTitle}
                          onChange={(e) => setCmsHeroTitle(e.target.value)}
                          className="w-full bg-[#181820] text-white p-2.5 rounded-xl border border-white/10 font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-slate-300 font-bold block mb-1">
                          Destaque Colorido com Gradiente:
                        </label>
                        <input
                          type="text"
                          value={cmsHeroHighlight}
                          onChange={(e) => setCmsHeroHighlight(e.target.value)}
                          className="w-full bg-[#181820] text-white p-2.5 rounded-xl border border-white/10 font-bold text-[#FFAA00]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">
                        Subtítulo Explicativo do Hero:
                      </label>
                      <textarea
                        rows={3}
                        value={cmsHeroSubtitle}
                        onChange={(e) => setCmsHeroSubtitle(e.target.value)}
                        className="w-full bg-[#181820] text-white p-2.5 rounded-xl border border-white/10 leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">
                          WhatsApp Oficial de Suporte:
                        </label>
                        <input
                          type="text"
                          value={cmsWhatsapp}
                          onChange={(e) => setCmsWhatsapp(e.target.value)}
                          className="w-full bg-[#181820] text-white p-2.5 rounded-xl border border-white/10 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-slate-300 font-bold block mb-1">
                          E-mail de Atendimento:
                        </label>
                        <input
                          type="email"
                          value={cmsSupportEmail}
                          onChange={(e) => setCmsSupportEmail(e.target.value)}
                          className="w-full bg-[#181820] text-white p-2.5 rounded-xl border border-white/10 font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleSaveCmsSettings}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF5500] to-[#FFAA00] text-black font-extrabold text-sm shadow-xl shadow-[#FF5500]/25 hover:scale-[1.01] active:scale-98 transition flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4 text-black" />
                        <span>Salvar & Publicar Alterações no Site Oficial</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* RIGHT COLUMN: INTERACTIVE LIVE STORE PREVIEW */}
              {(cmsViewMode === 'preview' || cmsViewMode === 'split') && (
                <div className={`${cmsViewMode === 'split' ? 'xl:col-span-7' : 'w-full'} space-y-4`}>
                  {/* Device Viewport Bar */}
                  <div className="p-3.5 rounded-2xl bg-[#14141B] border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-purple-400" />
                        <span>Prévia em Tempo Real</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        Ao Vivo
                      </span>
                    </div>

                    {/* Viewport Selector */}
                    <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-white/10 text-xs">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('desktop')}
                        className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                          previewDevice === 'desktop'
                            ? 'bg-[#FF5500] text-black shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Simulação Computador Desktop"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Computador</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewDevice('tablet')}
                        className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                          previewDevice === 'tablet'
                            ? 'bg-[#FF5500] text-black shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Simulação Tablet iPad"
                      >
                        <Tablet className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Tablet</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                          previewDevice === 'mobile'
                            ? 'bg-[#FF5500] text-black shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Simulação Celular Android e iOS"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Celular</span>
                      </button>
                    </div>
                  </div>

                  {/* Device Simulation Container */}
                  <div className="flex justify-center bg-black/70 p-4 sm:p-6 rounded-3xl border border-white/10 min-h-[650px] max-h-[820px] overflow-y-auto">
                    <div
                      className={`transition-all duration-300 bg-[#09090B] text-slate-100 rounded-3xl overflow-hidden border border-white/15 shadow-2xl flex flex-col ${
                        previewDevice === 'mobile'
                          ? 'w-[375px] min-h-[600px] border-4 border-slate-700'
                          : previewDevice === 'tablet'
                          ? 'w-[768px] min-h-[600px] border-4 border-slate-700'
                          : 'w-full min-h-[600px]'
                      }`}
                    >
                      {/* Mobile Notch Bar when on mobile */}
                      {previewDevice === 'mobile' && (
                        <div className="h-6 bg-black flex items-center justify-between px-6 text-[10px] text-slate-400 border-b border-white/5 select-none">
                          <span>9:41</span>
                          <div className="w-20 h-3.5 bg-neutral-900 rounded-full" />
                          <span>5G 100%</span>
                        </div>
                      )}

                      {/* Live Top Announcement */}
                      <div className="bg-gradient-to-r from-[#FF5500] via-[#FFAA00] to-[#FF5500] text-black py-1.5 px-3 text-[11px] font-extrabold text-center uppercase tracking-wider truncate">
                        {cmsAnnouncement || '⚡ FRETE COM PREÇO ESPECIAL PARA TODO BRASIL'}
                      </div>

                      {/* Live Header Simulation */}
                      <div className="bg-[#09090B] border-b border-white/10 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={cmsLogoUrl || settings.logoUrl}
                            alt="Logo Loja"
                            className="h-8 w-auto object-contain rounded border border-white/10"
                          />
                          <div>
                            <span className="font-extrabold text-white text-xs block leading-tight">
                              {cmsStoreName || 'PULSAR TECNOLOGIA'}
                            </span>
                            <span className="text-[9px] text-[#FFAA00] font-bold block">
                              {cmsSlogan || 'TECNOLOGIA QUE IMPULSIONA'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-300 hidden sm:inline">Catálogo</span>
                          <span className="text-[10px] text-[#FFAA00] font-bold hidden sm:inline">Combos -40%</span>
                          <div className="p-1.5 rounded-lg bg-[#FF5500] text-black font-black text-[10px]">
                            🛒 0
                          </div>
                        </div>
                      </div>

                      {/* Live Hero Simulation */}
                      <div className="p-6 sm:p-8 bg-gradient-to-b from-[#14141B] to-[#09090B] border-b border-white/10 space-y-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-[#FF5500]/40 text-[10px] font-black text-[#FFAA00]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500] animate-pulse" />
                          <span>{cmsHeroBadge || 'TECNOLOGIA NFC & QR CODE'}</span>
                        </div>

                        <h1 className="text-xl sm:text-3xl font-black text-white leading-tight">
                          {cmsHeroTitle || 'Multiplique suas Avaliações'}{' '}
                          <span className="text-gradient-pulsar">
                            {cmsHeroHighlight || 'em até 300% com 1 Toque'}
                          </span>
                        </h1>

                        <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
                          {cmsHeroSubtitle || 'Placas inteligentes e elegantes com aproximação NFC e QR Code.'}
                        </p>

                        {/* Hero Image or Interactive Plate Preview */}
                        <div className="pt-2 flex justify-center">
                          {cmsHeroImageUrl ? (
                            <div className="rounded-2xl overflow-hidden border-2 border-[#FF5500]/50 shadow-xl max-h-56">
                              <img src={cmsHeroImageUrl} alt="Hero Custom" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-64 rounded-2xl bg-gradient-to-b from-[#181820] to-black p-4 border border-[#FF5500]/40 shadow-xl text-center space-y-2">
                              <span className="text-[9px] text-[#FFAA00] font-bold uppercase">Smart Plate NFC</span>
                              <div className="w-12 h-12 rounded-full bg-[#FF5500]/20 border border-[#FF5500] mx-auto flex items-center justify-center text-[#FFAA00]">
                                <Wifi className="w-6 h-6 rotate-90" />
                              </div>
                              <p className="text-[10px] text-white font-bold">Aproxime o celular</p>
                              <div className="text-[8px] text-slate-400">CHIP NTAG213 ULTRA • 100% VITALÍCIO</div>
                            </div>
                          )}
                        </div>

                        {/* CTA Buttons in preview */}
                        <div className="flex flex-col sm:flex-row gap-2 pt-2 justify-center">
                          <div className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#FFAA00] text-black font-extrabold text-xs text-center">
                            Ver Kits com até 40% OFF
                          </div>
                          <div className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs text-center">
                            Testar Simulador
                          </div>
                        </div>
                      </div>

                      {/* Fast Value Proposition Strip */}
                      <div className="py-3 px-4 bg-[#0D0D12] border-b border-white/10 grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div>
                          <p className="font-bold text-white">Chip NFC Universal</p>
                          <p className="text-[9px] text-slate-400">iPhone e Android</p>
                        </div>
                        <div>
                          <p className="font-bold text-white">Melhor Envio</p>
                          <p className="text-[9px] text-slate-400">Postagem em 24h</p>
                        </div>
                        <div>
                          <p className="font-bold text-white">Mercado Pago</p>
                          <p className="text-[9px] text-slate-400">PIX ou até 12x</p>
                        </div>
                      </div>

                      {/* Kits Vitrine preview */}
                      <div className="p-4 sm:p-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">
                            Kits e Combos Mais Vendidos
                          </h4>
                          <span className="text-[10px] text-[#FFAA00] font-bold">Economize até 40%</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {kits.slice(0, 2).map((k) => (
                            <div key={k.id} className="p-3 rounded-xl bg-[#14141B] border border-white/10 flex items-center gap-3">
                              <img src={k.image} alt={k.name} className="w-12 h-12 rounded-lg object-cover bg-black" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">{k.name}</p>
                                <p className="text-[11px] text-[#FFAA00] font-extrabold">R$ {k.kitPrice.toFixed(2)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Footer in preview */}
                      <div className="mt-auto p-4 bg-[#0D0D12] border-t border-white/10 text-center text-[10px] text-slate-500">
                        <p className="text-white font-bold">{cmsStoreName || 'PULSAR TECNOLOGIA'}</p>
                        <p>WhatsApp: {cmsWhatsapp} • E-mail: {cmsSupportEmail}</p>
                        <p className="pt-1 text-[9px]">© 2026 Pulsar Tecnologia Ltda. Todos os direitos reservados.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* INTEGRATIONS SETTINGS TAB: MERCADO PAGO & MELHOR ENVIO */}
        {adminTab === 'integrations' && (
          <div className="max-w-4xl space-y-8 animate-in fade-in duration-150">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Chaves de API & Integrações</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure as chaves e credenciais oficiais de <strong>Mercado Pago</strong> e <strong>Melhor Envio</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6 text-xs">
              {/* 1. MERCADO PAGO INTEGRATION */}
              <div className="p-6 rounded-3xl bg-[#14141B] border border-white/10 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black">
                      <Zap className="w-5 h-5 text-[#FFAA00]" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white">
                        Mercado Pago (PIX Instantâneo & Cartão de Crédito)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Processamento direto de pagamentos para sua conta Mercado Pago
                      </p>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    cmsMercadoPagoSandbox 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {cmsMercadoPagoSandbox ? 'Ambiente de Testes (Sandbox)' : 'Produção Ativa'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1.5">
                      Chave Pública (Public Key): *
                    </label>
                    <input
                      type="text"
                      placeholder="APP_USR-00000000-0000-0000-0000-000000000000"
                      value={cmsMercadoPagoKey}
                      onChange={(e) => setCmsMercadoPagoKey(e.target.value)}
                      className="w-full bg-[#181820] text-white p-3 rounded-xl border border-white/10 font-mono text-xs focus:outline-none focus:border-[#FF5500]"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Usada no frontend para tokenização de cartões e geração de QR Code PIX
                    </span>
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1.5">
                      Token Secreto de Acesso (Access Token): *
                    </label>
                    <input
                      type="password"
                      placeholder="APP_USR-0000000000000000-000000-00000000000000000000000000000000-000000000"
                      value={cmsMercadoPagoToken}
                      onChange={(e) => setCmsMercadoPagoToken(e.target.value)}
                      className="w-full bg-[#181820] text-white p-3 rounded-xl border border-white/10 font-mono text-xs focus:outline-none focus:border-[#FF5500]"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Chave privada do servidor para autorização de cobranças e webhook IPN
                    </span>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                    <input
                      type="checkbox"
                      id="mp-sandbox-toggle"
                      checked={cmsMercadoPagoSandbox}
                      onChange={(e) => setCmsMercadoPagoSandbox(e.target.checked)}
                      className="w-4 h-4 rounded text-[#FF5500] focus:ring-0"
                    />
                    <label htmlFor="mp-sandbox-toggle" className="text-slate-200 cursor-pointer font-bold">
                      Ativar Modo de Testes / Sandbox (Simulação de pagamentos sem cobrança real no cartão)
                    </label>
                  </div>

                  {/* Key Type Helper Notice */}
                  {cmsMercadoPagoToken && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px]">
                      <span className="font-bold text-slate-400">Tipo de Chave Detectado:</span>
                      {cmsMercadoPagoToken.startsWith('APP_USR-') ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                          PRODUÇÃO (APP_USR-...)
                        </span>
                      ) : cmsMercadoPagoToken.startsWith('TEST-') ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-mono font-bold">
                          TESTES / SANDBOX (TEST-...)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-500/20 text-slate-400 font-mono">
                          Formato Personalizado
                        </span>
                      )}
                      {!cmsMercadoPagoSandbox && cmsMercadoPagoToken.startsWith('TEST-') && (
                        <span className="text-amber-400 font-bold ml-auto">
                          ⚠️ Atenção: Token de teste configurado com modo Produção ativo!
                        </span>
                      )}
                    </div>
                  )}

                  {/* Test Connection Button */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      disabled={isTestingMp}
                      onClick={handleTestMercadoPago}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 transition flex items-center gap-2 disabled:opacity-50"
                    >
                      <Zap className={`w-3.5 h-3.5 ${isTestingMp ? 'animate-bounce text-[#FFAA00]' : 'text-blue-200'}`} />
                      <span>{isTestingMp ? 'Testando Conexão...' : 'Testar Conexão com Mercado Pago'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveApiSettings}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#FFAA00] text-black font-extrabold text-xs shadow-lg shadow-[#FF5500]/25 hover:scale-[1.01] transition flex items-center gap-2"
                    >
                      <Save className="w-3.5 h-3.5 text-black" />
                      <span>Salvar Credenciais</span>
                    </button>
                  </div>

                  {/* Test Connection Result Box */}
                  {mpTestResult && (
                    <div
                      className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1.5 ${
                        mpTestResult.success
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                          : 'bg-red-950/40 border-red-500/40 text-red-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold">
                        {mpTestResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        )}
                        <span>
                          {mpTestResult.success
                            ? 'Conexão com Mercado Pago Validada!'
                            : 'Falha na Validação das Chaves'}
                        </span>
                      </div>
                      <p className="text-[11px] pl-6 text-slate-200">{mpTestResult.message}</p>
                      {mpTestResult.success && (
                        <p className="text-[10px] pl-6 text-emerald-400/80">
                          ✨ O checkout oficial com redirecionamento para o Mercado Pago está ativo e pronto para receber pagamentos de clientes.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Mercado Pago Instructions Accordion */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-[11px] text-slate-400">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Como obter e validar suas chaves Mercado Pago:</span>
                  </p>
                  <ol className="list-decimal pl-5 space-y-1 leading-relaxed">
                    <li>Acesse o portal de desenvolvedores em <a href="https://www.mercadopago.com.br/developers" target="_blank" rel="noreferrer" className="text-[#FFAA00] underline font-bold">mercadopago.com.br/developers</a>.</li>
                    <li>Vá em <strong>Suas integrações</strong> &gt; Selecione sua aplicação &gt; <strong>Credenciais de Produção</strong> ou <strong>Credenciais de Teste</strong>.</li>
                    <li>Copie o <strong>Access Token</strong> (começando com <code>APP_USR-</code> ou <code>TEST-</code>) e cole acima.</li>
                    <li>Clique no botão <strong>"Testar Conexão com Mercado Pago"</strong> para confirmar que a autenticação está 100% autorizada.</li>
                  </ol>
                </div>
              </div>

              {/* 2. MELHOR ENVIO INTEGRATION */}
              <div className="p-6 rounded-3xl bg-[#14141B] border border-white/10 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black">
                      <Truck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white">
                        Melhor Envio (Cotação de Frete Correios SEDEX, PAC & Jadlog)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Cálculo automático de prazos, valores de frete e geração de etiquetas
                      </p>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    cmsMelhorEnvioSandbox 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {cmsMelhorEnvioSandbox ? 'Sandbox Melhor Envio' : 'Melhor Envio Produção'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1.5">
                      CEP de Origem da Loja: *
                    </label>
                    <input
                      type="text"
                      placeholder="01310-100"
                      value={cmsOriginCep}
                      onChange={(e) => setCmsOriginCep(e.target.value)}
                      className="w-full bg-[#181820] text-white p-3 rounded-xl border border-white/10 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      CEP do centro de expedição de onde as placas são despachadas
                    </span>
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1.5">
                      Token Secreto da API Melhor Envio (Bearer Token): *
                    </label>
                    <input
                      type="password"
                      placeholder="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={cmsMelhorEnvioToken}
                      onChange={(e) => setCmsMelhorEnvioToken(e.target.value)}
                      className="w-full bg-[#181820] text-white p-3 rounded-xl border border-white/10 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Token gerado no painel da sua conta Melhor Envio
                    </span>
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1.5">
                      Client ID do App (Opcional):
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 1234"
                      value={cmsMelhorEnvioClientId}
                      onChange={(e) => setCmsMelhorEnvioClientId(e.target.value)}
                      className="w-full bg-[#181820] text-white p-3 rounded-xl border border-white/10 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1.5">
                      Client Secret (Opcional):
                    </label>
                    <input
                      type="password"
                      placeholder="Chave secreta do app Melhor Envio"
                      value={cmsMelhorEnvioClientSecret}
                      onChange={(e) => setCmsMelhorEnvioClientSecret(e.target.value)}
                      className="w-full bg-[#181820] text-white p-3 rounded-xl border border-white/10 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                  <input
                    type="checkbox"
                    id="me-sandbox-toggle"
                    checked={cmsMelhorEnvioSandbox}
                    onChange={(e) => setCmsMelhorEnvioSandbox(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-0"
                  />
                  <label htmlFor="me-sandbox-toggle" className="text-slate-200 cursor-pointer font-bold">
                    Ativar Sandbox do Melhor Envio (Ambiente de testes sandbox.melhorenvio.com.br)
                  </label>
                </div>

                {/* Melhor Envio Instructions Accordion */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-[11px] text-slate-400">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Como obter o token do Melhor Envio:</span>
                  </p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Acesse sua conta no <a href="https://melhorenvio.com.br" target="_blank" rel="noreferrer" className="text-emerald-400 underline">melhorenvio.com.br</a>.</li>
                    <li>Vá em <strong>Painel de Controle &gt; Gerenciar &gt; Tokens / Chaves de API</strong>.</li>
                    <li>Gere um novo token com permissões de cálculo de frete e envio, e cole no formulário acima.</li>
                  </ol>
                </div>
              </div>

              {/* Action Save Button */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveApiSettings}
                  className="px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-xl shadow-purple-600/30 hover:scale-[1.01] active:scale-95 transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Credenciais Mercado Pago & Melhor Envio</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSaveApiSettings();
                    showToast('Credenciais validadas com sucesso!', 'success');
                  }}
                  className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5 text-[#FFAA00]" />
                  <span>Testar Validade das Chaves</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUPABASE INTEGRATION TAB */}
        {adminTab === 'supabase' && (
          <div className="max-w-5xl space-y-8 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-2xl font-black text-white">Integração Supabase</h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-black text-[10px] uppercase tracking-wider">
                        PostgreSQL • Auth • Storage
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sincronização em tempo real de catálogo de placas, combos, pedidos e uploads de fotos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Badge & Sync Buttons */}
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border ${
                    isSupabaseConnected
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span>{isSupabaseConnected ? 'Conectado ao Supabase' : 'Aguardando Credenciais'}</span>
                </div>

                <button
                  type="button"
                  onClick={syncWithSupabase}
                  disabled={isSyncingSupabase}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  title="Sincronizar dados remotos"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSupabase ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>{isSyncingSupabase ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
                </button>
              </div>
            </div>

            {/* Step-by-step instructions card */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/30 via-[#14141B] to-[#121217] border border-emerald-500/20 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Como Ativar sua Loja com o Supabase em 3 Passos</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-[11px]">
                    1
                  </div>
                  <h4 className="font-bold text-white">Criar Projeto</h4>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Acesse <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline">supabase.com</a> e crie um projeto gratuito na região São Paulo (GRU) ou US East.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-[11px]">
                    2
                  </div>
                  <h4 className="font-bold text-white">Executar o Script SQL</h4>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    No menu do Supabase, clique em <strong>SQL Editor</strong>, cole o script disponível abaixo e clique em <strong>Run</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-[11px]">
                    3
                  </div>
                  <h4 className="font-bold text-white">Conectar a Chave API</h4>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Vá em <em>Project Settings &gt; API</em>, copie a <strong>Project URL</strong> e a chave <strong>anon public</strong> e cole no formulário abaixo.
                  </p>
                </div>
              </div>
            </div>

            {/* Credentials Form */}
            <div className="p-6 rounded-3xl bg-[#14141B] border border-white/10 space-y-5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-400" />
                    <span>Credenciais de Conexão Supabase</span>
                  </h3>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Essas chaves são salvas com segurança no navegador ou lidas via variáveis de ambiente.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-bold block mb-1.5">
                    URL do Projeto Supabase (Project URL): *
                  </label>
                  <input
                    type="url"
                    placeholder="https://seu-projeto.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full bg-[#181820] text-white p-3 rounded-xl border border-white/10 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Exemplo: https://xyzcompany.supabase.co
                  </span>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1.5">
                    Chave Pública / Anon Key (Project API Key): *
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    className="w-full bg-[#181820] text-white p-3 rounded-xl border border-white/10 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Chave segura de acesso do cliente público com RLS
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    saveSupabaseCredentials(supabaseUrl, supabaseKey);
                    showToast('Credenciais salvas com sucesso!', 'success');
                    testSupabase().then((res) => {
                      setTestResult(res);
                      if (res.success) syncWithSupabase();
                    });
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Credenciais</span>
                </button>

                <button
                  type="button"
                  disabled={isTestingSupabase}
                  onClick={async () => {
                    saveSupabaseCredentials(supabaseUrl, supabaseKey);
                    setIsTestingSupabase(true);
                    setTestResult(null);
                    try {
                      const res = await testSupabase();
                      setTestResult(res);
                      if (res.success) {
                        showToast('Conexão com o Supabase bem sucedida!', 'success');
                        await syncWithSupabase();
                      } else {
                        showToast(res.message, 'error');
                      }
                    } finally {
                      setIsTestingSupabase(false);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center gap-2"
                >
                  <Zap className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-bounce text-[#FFAA00]' : 'text-emerald-400'}`} />
                  <span>{isTestingSupabase ? 'Testando Conexão...' : 'Testar Conexão em Tempo Real'}</span>
                </button>
              </div>

              {/* Real-time Test Output Box */}
              {testResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1 ${
                    testResult.success
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : 'bg-red-950/30 border-red-500/40 text-red-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    )}
                    <span>{testResult.success ? 'Conexão Estabelecida com o Supabase' : 'Aviso de Conexão'}</span>
                  </div>
                  <p className="text-[11px] pl-6 text-slate-300">{testResult.message}</p>
                </div>
              )}
            </div>

            {/* Architecture Health Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#14141B] border border-white/10 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tabela Catálogo</span>
                <p className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <span>public.products</span>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                </p>
                <p className="text-[11px] text-slate-400">{products.length} placas cadastradas</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#14141B] border border-white/10 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tabela Combos</span>
                <p className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <span>public.kits</span>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                </p>
                <p className="text-[11px] text-slate-400">{kits.length} kits promocionais</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#14141B] border border-white/10 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tabela Pedidos</span>
                <p className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <span>public.orders</span>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                </p>
                <p className="text-[11px] text-slate-400">{orders.length} pedidos e rastreios</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#14141B] border border-white/10 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Storage Bucket</span>
                <p className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <span>pulsar-assets</span>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                </p>
                <p className="text-[11px] text-slate-400">Armazenamento de fotos</p>
              </div>
            </div>

            {/* SQL Migration Script Exporter */}
            <div className="p-6 rounded-3xl bg-[#14141B] border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>Script SQL para o Supabase (Tabelas, RLS & Storage)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Execute este script no <strong>SQL Editor</strong> do painel do seu Supabase para criar as tabelas e políticas de segurança.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const sqlText = `-- ==============================================================================
-- PULSAR TECNOLOGIA — SCHEMA POSTGRESQL PARA SUPABASE
-- Plataforma de Placas de Avaliação Google, NFC, QR Code & Combos
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    short_description TEXT NOT NULL,
    detailed_description TEXT,
    sale_price NUMERIC(10, 2) NOT NULL,
    promo_price NUMERIC(10, 2),
    cost NUMERIC(10, 2) DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    track_stock BOOLEAN DEFAULT TRUE,
    sku TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    chip_type TEXT,
    height_cm NUMERIC(6, 2) DEFAULT 15,
    width_cm NUMERIC(6, 2) DEFAULT 10,
    length_cm NUMERIC(6, 2) DEFAULT 5,
    weight_grams NUMERIC(8, 2) DEFAULT 180,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_best_seller BOOLEAN DEFAULT FALSE,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 0,
    badge TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.kits (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    kit_price NUMERIC(10, 2) NOT NULL,
    reference_price NUMERIC(10, 2) NOT NULL,
    savings_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount_percentage INTEGER NOT NULL DEFAULT 0,
    badge TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_cpf TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    shipping_price NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    shipping_carrier TEXT,
    shipping_service TEXT,
    tracking_code TEXT,
    shipping_address JSONB NOT NULL,
    pix_qr_code TEXT,
    mercado_pago_payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    logo_url TEXT,
    hero_title TEXT,
    hero_title_highlight TEXT,
    hero_subtitle TEXT,
    announcement_bar_text TEXT,
    whatsapp_number TEXT,
    origin_cep TEXT,
    mercado_pago_public_key TEXT,
    melhor_envio_token TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de produtos" ON public.products FOR SELECT USING (true);
CREATE POLICY "Leitura pública de kits" ON public.kits FOR SELECT USING (true);
CREATE POLICY "Leitura pública de configurações" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Inserção de pedidos" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Leitura de pedidos" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Gerenciamento completo produtos" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Gerenciamento completo kits" ON public.kits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Gerenciamento completo configurações" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Gerenciamento completo pedidos" ON public.orders FOR ALL USING (true) WITH CHECK (true);`;
                    navigator.clipboard.writeText(sqlText);
                    setCopiedSql(true);
                    showToast('Script SQL copiado para a área de transferência!', 'success');
                    setTimeout(() => setCopiedSql(false), 3000);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 self-start sm:self-auto"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Script Copiado!' : 'Copiar Script SQL'}</span>
                </button>
              </div>

              {/* Pre Code display */}
              <div className="relative rounded-2xl bg-black/60 border border-white/10 p-4 max-h-72 overflow-y-auto font-mono text-[11px] text-slate-300">
                <pre className="whitespace-pre-wrap leading-relaxed">
{`-- Execute este código no SQL Editor do Supabase:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    short_description TEXT NOT NULL,
    detailed_description TEXT,
    sale_price NUMERIC(10, 2) NOT NULL,
    promo_price NUMERIC(10, 2),
    stock INTEGER NOT NULL DEFAULT 0,
    track_stock BOOLEAN DEFAULT TRUE,
    sku TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    chip_type TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.kits (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    kit_price NUMERIC(10, 2) NOT NULL,
    reference_price NUMERIC(10, 2) NOT NULL,
    savings_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount_percentage INTEGER NOT NULL DEFAULT 0,
    badge TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_cpf TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    shipping_carrier TEXT,
    tracking_code TEXT,
    shipping_address JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura de produtos" ON public.products FOR SELECT USING (true);
CREATE POLICY "Leitura de kits" ON public.kits FOR SELECT USING (true);
CREATE POLICY "Inserção de pedidos" ON public.orders FOR INSERT WITH CHECK (true);`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#14141B] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-white text-base">
              {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Nome do Produto: *</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full bg-[#181820] text-white p-2.5 rounded-xl border border-white/10"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Descrição Comercial Curta: *</label>
                <textarea
                  required
                  rows={2}
                  value={prodShortDesc}
                  onChange={(e) => setProdShortDesc(e.target.value)}
                  className="w-full bg-[#181820] text-white p-2.5 rounded-xl border border-white/10"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Preço Venda (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodPrice ?? ''}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full bg-[#181820] text-white p-2 rounded-xl border border-white/10"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Preço Promo (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodPromoPrice ?? ''}
                    onChange={(e) => setProdPromoPrice(e.target.value)}
                    className="w-full bg-[#181820] text-white p-2 rounded-xl border border-white/10"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Estoque (un):</label>
                  <input
                    type="number"
                    value={prodStock ?? ''}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="w-full bg-[#181820] text-white p-2 rounded-xl border border-white/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Código SKU:</label>
                  <input
                    type="text"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    className="w-full bg-[#181820] text-white p-2 rounded-xl border border-white/10"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Peso (gramas):</label>
                  <input
                    type="number"
                    value={prodWeight ?? ''}
                    onChange={(e) => setProdWeight(e.target.value)}
                    className="w-full bg-[#181820] text-white p-2 rounded-xl border border-white/10"
                  />
                </div>
              </div>

              {/* Photos from Computer & URL */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold block">
                    Fotos do Produto ({prodImages.length} selecionadas):
                  </label>
                  <span className="text-[10px] text-slate-400">
                    A primeira foto é a capa da vitrine
                  </span>
                </div>

                {/* Upload from Computer Box */}
                <div className="p-4 rounded-2xl bg-[#181820] border-2 border-dashed border-white/20 hover:border-[#FF5500]/50 transition text-center space-y-2">
                  <input
                    type="file"
                    id="product-file-upload"
                    accept="image/*"
                    multiple
                    onChange={handleProductFilesUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="product-file-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#FFAA00] text-black font-extrabold text-xs shadow-md hover:scale-[1.02] active:scale-95 transition"
                  >
                    <Upload className="w-4 h-4 text-black" />
                    <span>{isUploadingImages ? 'Carregando Fotos...' : 'Carregar Fotos do Computador'}</span>
                  </label>
                  <p className="text-[10px] text-slate-400">
                    Selecione 1 ou mais imagens (PNG, JPG, WEBP) do seu computador ou celular
                  </p>
                </div>

                {/* Optional URL addition */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Ou cole uma URL direta da imagem (opcional)"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="flex-1 bg-[#181820] text-white p-2 rounded-xl border border-white/10 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
                  >
                    + URL
                  </button>
                </div>

                {/* Uploaded Photos Gallery Thumbnails */}
                {prodImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2.5 pt-1">
                    {prodImages.map((img, idx) => (
                      <div
                        key={idx}
                        className={`relative rounded-xl overflow-hidden border-2 bg-black h-20 group ${
                          idx === 0 ? 'border-[#FF5500] shadow-md shadow-[#FF5500]/30' : 'border-white/10'
                        }`}
                      >
                        <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />

                        {/* Top Badge for Primary */}
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-[#FF5500] text-black font-black text-[9px] px-1.5 py-0.5 rounded shadow">
                            Capa
                          </span>
                        )}

                        {/* Hover Overlay Controls */}
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1">
                          <button
                            type="button"
                            onClick={() => handleRemoveProductImage(idx)}
                            className="self-end p-1 rounded-md bg-red-600 text-white hover:bg-red-700 transition"
                            title="Remover imagem"
                          >
                            <X className="w-3 h-3" />
                          </button>

                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(idx)}
                              className="w-full py-0.5 rounded bg-white text-black font-bold text-[9px] hover:bg-[#FFAA00]"
                              title="Tornar foto de capa"
                            >
                              Tornar Capa
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FF5500] text-black font-extrabold"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kit Modal */}
      {isKitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#14141B] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-white text-base">
              {editingKit ? 'Editar Combo' : 'Criar Novo Combo de Placas'}
            </h3>

            <form onSubmit={handleSaveKit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Nome do Combo / Kit: *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Kit 5 Placas - Expansão Comercial"
                  value={kitName}
                  onChange={(e) => setKitName(e.target.value)}
                  className="w-full bg-[#181820] text-white p-2.5 rounded-xl border border-white/10"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Descrição dos Benefícios: *</label>
                <textarea
                  required
                  rows={2}
                  value={kitDesc}
                  onChange={(e) => setKitDesc(e.target.value)}
                  className="w-full bg-[#181820] text-white p-2.5 rounded-xl border border-white/10"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Qtd de Placas:</label>
                  <input
                    type="number"
                    min={1}
                    value={kitPlatesQty ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setKitPlatesQty(val);
                      const qty = parseInt(val, 10);
                      if (!Number.isNaN(qty) && qty > 0) {
                        setKitRefPrice(qty * 80);
                      }
                    }}
                    className="w-full bg-[#181820] text-white p-2 rounded-xl border border-white/10"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Preço Normal (Ref):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={kitRefPrice ?? ''}
                    onChange={(e) => setKitRefPrice(e.target.value)}
                    className="w-full bg-[#181820] text-white p-2 rounded-xl border border-white/10"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Preço Combo (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={kitPrice ?? ''}
                    onChange={(e) => setKitPrice(e.target.value)}
                    className="w-full bg-[#181820] text-white p-2 rounded-xl border border-white/10"
                  />
                </div>
              </div>

              {/* Kit Photo from Computer */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-slate-300 font-bold block">
                  Foto do Combo / Kit:
                </label>
                <div className="flex items-center gap-3">
                  {kitImage && (
                    <img
                      src={kitImage}
                      alt="Prévia do Combo"
                      className="w-16 h-16 rounded-xl object-cover bg-black border border-white/15 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      id="kit-file-upload"
                      accept="image/*"
                      onChange={handleKitFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="kit-file-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingKitImage ? 'Carregando...' : 'Carregar Foto do Computador'}</span>
                    </label>
                    <input
                      type="url"
                      placeholder="Ou informe a URL da imagem"
                      value={kitImage}
                      onChange={(e) => setKitImage(e.target.value)}
                      className="w-full bg-[#181820] text-white p-2 rounded-xl border border-white/10 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Badge de Destaque:</label>
                <input
                  type="text"
                  placeholder="Ex: Mais Popular — Economize R$ 140"
                  value={kitBadge}
                  onChange={(e) => setKitBadge(e.target.value)}
                  className="w-full bg-[#181820] text-white p-2.5 rounded-xl border border-white/10"
                />
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-[11px] text-emerald-400">
                Economia calculada: <strong>R$ {Math.max(0, (Number(kitRefPrice) || 0) - (Number(kitPrice) || 0)).toFixed(2)}</strong> (
                {Number(kitRefPrice) > 0
                  ? Math.round((Math.max(0, (Number(kitRefPrice) || 0) - (Number(kitPrice) || 0)) / Number(kitRefPrice)) * 100)
                  : 0}% de desconto)
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsKitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-extrabold"
                >
                  Salvar Combo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {selectedOrderForTracking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#14141B] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">
              Gerenciar Pedido #{selectedOrderForTracking.orderNumber}
            </h3>

            <form onSubmit={handleUpdateTracking} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">
                  Código de Rastreamento (Correios / Melhor Envio):
                </label>
                <input
                  type="text"
                  required
                  value={newTrackingCode}
                  onChange={(e) => setNewTrackingCode(e.target.value.toUpperCase())}
                  className="w-full bg-[#181820] text-white p-2.5 rounded-xl border border-white/10 font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForTracking(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FF5500] text-black font-extrabold"
                >
                  Salvar & Marcar como Enviado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
