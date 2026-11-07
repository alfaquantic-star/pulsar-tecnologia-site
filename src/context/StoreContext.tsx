import React, { createContext, useContext, useEffect, useState } from 'react';
import { INITIAL_CUSTOMERS, INITIAL_KITS, INITIAL_ORDERS, INITIAL_PRODUCTS, INITIAL_SETTINGS } from '../data/initialData';
import { Address, CartItem, CustomerProfile, Kit, Order, OrderPaymentStatus, OrderShippingStatus, Product, ShippingOption, SiteSettings } from '../types';
import {
  isSupabaseConfigured,
  testSupabaseConnection,
  fetchProductsFromSupabase,
  upsertProductInSupabase,
  patchProductInSupabase,
  deleteProductInSupabase,
  fetchKitsFromSupabase,
  upsertKitInSupabase,
  deleteKitInSupabase,
  fetchOrdersFromSupabase,
  createOrderInSupabase,
  updateOrderStatusInSupabase,
  fetchSettingsFromSupabase,
  updateSettingsInSupabase,
  getSupabaseClient,
  getAdminApiLastError
} from '../lib/supabase';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface StoreContextType {
  // Catalog & Inventory
  products: Product[];
  kits: Kit[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addKit: (kit: Omit<Kit, 'id'>) => void;
  updateKit: (id: string, kit: Partial<Kit>) => void;
  deleteKit: (id: string) => void;
  getKitAvailableStock: (kit: Kit) => number;

  // Supabase Live Synchronization
  isSupabaseConnected: boolean;
  isSyncingSupabase: boolean;
  syncWithSupabase: () => Promise<void>;
  testSupabase: () => Promise<{ success: boolean; message: string }>;

  // Cart
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'cartItemId'>) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  appliedCoupon: string | null;
  discountAmount: number;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;

  // Shipping (Melhor Envio)
  selectedShipping: ShippingOption | null;
  setSelectedShipping: (option: ShippingOption | null) => void;
  shippingOptions: ShippingOption[];
  calculateShipping: (cep: string) => Promise<ShippingOption[]>;
  isCalculatingShipping: boolean;
  destinationCep: string;
  setDestinationCep: (cep: string) => void;

  // Orders
  orders: Order[];
  createOrder: (orderData: {
    customer: { fullName: string; email: string; cpf: string; whatsapp: string };
    shippingAddress: Address;
    paymentMethod: 'pix' | 'credit_card' | 'mercadopago';
    cardData?: { number: string; name: string; expiry: string; cvv: string; installments: number };
    mercadoPagoPreferenceId?: string;
    mercadoPagoInitPoint?: string;
    mercadoPagoPaymentId?: string;
  }) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: { paymentStatus?: OrderPaymentStatus; shippingStatus?: OrderShippingStatus; trackingCode?: string }) => void;
  simulateWebhookPaymentApproval: (orderId: string) => void;

  // Auth & Roles
  currentUser: CustomerProfile | null;
  setCurrentUser: (user: CustomerProfile | null) => void;
  login: (email: string, role?: 'customer' | 'admin') => boolean;
  loginAsAdmin: (email: string, pass: string) => Promise<boolean>;
  requestCustomerOtp: (email: string) => Promise<boolean>;
  verifyCustomerOtp: (email: string, token: string) => Promise<boolean>;
  logout: () => void;
  switchUserRole: () => void;
  updateUserProfile: (data: Partial<CustomerProfile>) => void;
  addCustomerAddress: (address: Omit<Address, 'id'>) => void;

  // Auth Modal
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalTab: 'customer' | 'admin';
  setAuthModalTab: (tab: 'customer' | 'admin') => void;
  openAuthModal: (tab?: 'customer' | 'admin') => void;
  closeAuthModal: () => void;

  // Settings & CMS
  settings: SiteSettings;
  updateSettings: (newSettings: Partial<SiteSettings>) => void;

  // UI Modals & Navigation
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  isCheckoutModalOpen: boolean;
  setIsCheckoutModalOpen: (open: boolean) => void;
  activeNavCategory: string;
  setActiveNavCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentView: 'home' | 'products' | 'combos' | 'product-detail' | 'cart' | 'customer-account' | 'admin' | 'institucional';
  setCurrentView: (view: 'home' | 'products' | 'combos' | 'product-detail' | 'cart' | 'customer-account' | 'admin' | 'institucional') => void;
  selectedProductSlug: string | null;
  setSelectedProductSlug: (slug: string | null) => void;
  selectedInstitutionalTopic: string;
  setSelectedInstitutionalTopic: (topic: string) => void;

  // Feedback Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Persistent Products
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('pulsar_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  // 2. Persistent Kits
  const [kits, setKits] = useState<Kit[]>(() => {
    const saved = localStorage.getItem('pulsar_kits');
    return saved ? JSON.parse(saved) : INITIAL_KITS;
  });

  // 3. Persistent Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('pulsar_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // 4. Persistent Orders
  // Orders may contain personal information: never restore cached orders from localStorage.
  const [orders, setOrders] = useState<Order[]>([]);

  // 5. Persistent Settings (ensuring clean headline)
  const [settings, setSettings] = useState<SiteSettings>(() => {
    const saved = localStorage.getItem('pulsar_settings');
    // Legacy builds cached payment and shipping secrets in localStorage.
    // Only allow cosmetic/public settings into application state.
    const defaults = {
      ...INITIAL_SETTINGS,
      mercadoPagoAccessToken: '',
      melhorEnvioToken: '',
      melhorEnvioClientSecret: ''
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const { mercadoPagoAccessToken: _mpSecret,
          melhorEnvioToken: _meSecret,
          melhorEnvioClientSecret: _meClientSecret,
          ...publicSettings } = parsed;
        return { ...defaults, ...publicSettings };
      } catch { return defaults; }
    }
    return defaults;
  });

  // 6. User Auth State
  // Browser-controlled localStorage cannot grant administrator privileges.
  const [currentUser, setCurrentUser] = useState<CustomerProfile | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'customer' | 'admin'>('customer');

  const openAuthModal = (tab: 'customer' | 'admin' = 'customer') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Navigation & Modals
  const [currentView, setCurrentView] = useState<'home' | 'products' | 'combos' | 'product-detail' | 'cart' | 'customer-account' | 'admin' | 'institucional'>('home');
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);
  const [selectedInstitutionalTopic, setSelectedInstitutionalTopic] = useState<string>('sobre');
  const [activeNavCategory, setActiveNavCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);

  // Coupons & Shipping
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>('PULSAR10');
  const [destinationCep, setDestinationCep] = useState<string>('04571-010');
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState<boolean>(false);

  // Supabase Live Synchronization State
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState<boolean>(false);

  const syncWithSupabase = async () => {
    if (!isSupabaseConfigured()) return;
    setIsSyncingSupabase(true);
    try {
      const [remoteProds, remoteKits, remoteOrders, remoteSettings] = await Promise.all([
        fetchProductsFromSupabase(),
        fetchKitsFromSupabase(),
        fetchOrdersFromSupabase(),
        fetchSettingsFromSupabase(),
      ]);

      // A successful empty result is authoritative: never keep stale,
      // locally cached inactive products/kits visible to visitors.
      if (remoteProds !== null) {
        setProducts(remoteProds);
      }
      if (remoteKits !== null) {
        setKits(remoteKits);
      }
      if (remoteOrders !== null) {
        setOrders(remoteOrders);
      }
      if (remoteSettings) {
        setSettings((prev) => ({ ...prev, ...remoteSettings }));
      }
      const catalogLoaded = remoteProds !== null && remoteKits !== null;
      setIsSupabaseConnected(catalogLoaded);
      if (catalogLoaded) showToast('Catálogo sincronizado com o Supabase.', 'success');
      else showToast('Falha ao carregar parte do catálogo. Atualize a página antes de comprar.', 'error');
    } catch (err) {
      console.warn('Erro ao sincronizar com Supabase:', err);
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  const testSupabase = async () => {
    const res = await testSupabaseConnection();
    setIsSupabaseConnected(res.success);
    return res;
  };

  useEffect(() => {
    if (isSupabaseConfigured()) {
      testSupabaseConnection().then((res) => {
        setIsSupabaseConnected(res.success);
        if (res.success) {
          syncWithSupabase();
        }
      });
    }
  }, []);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('pulsar_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pulsar_kits', JSON.stringify(kits));
  }, [kits]);

  useEffect(() => {
    localStorage.setItem('pulsar_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    // Remove legacy order cache immediately; order/customer PII belongs server-side.
    localStorage.removeItem('pulsar_orders');
  }, []);

  useEffect(() => {
    // Never cache payment/shipping access tokens on a customer device.
    // Overwrites any legacy localStorage record that contained secrets.
    const { mercadoPagoAccessToken: _mpSecret,
      melhorEnvioToken: _meSecret,
      melhorEnvioClientSecret: _meClientSecret,
      ...safeSettings } = settings;
    localStorage.setItem('pulsar_settings', JSON.stringify(safeSettings));
  }, [settings]);

  useEffect(() => {
    localStorage.removeItem('pulsar_user');
    const client = getSupabaseClient();
    if (!client) return;
    let cancelled = false;
    const restoreVerifiedCustomer = async () => {
      // Fetch the user from Supabase Auth, never infer ownership from query params
      // or a typed email. The SDK handles the redirect session fragment.
      const { data, error } = await client.auth.getUser();
      if (cancelled || error || !data.user?.email || data.user.app_metadata?.role === 'admin') return;
      setCurrentUser({
        id: data.user.id, email: data.user.email.toLowerCase(),
        fullName: data.user.email.split('@')[0],
        cpf: '', whatsapp: '', role: 'customer',
        createdAt: data.user.created_at, addresses: []
      });
      setOrders([]);
      setIsAuthModalOpen(false);
    };
    // Auth can finish processing the link after React mounts.
    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.access_token) {
        // Defer Auth calls out of the synchronous auth-change handler.
        setTimeout(() => { if (!cancelled) void restoreVerifiedCustomer(); }, 0);
      }
      if (event === 'SIGNED_OUT' && !cancelled) {
        setCurrentUser(null);
        setOrders([]);
      }
    });
    void restoreVerifiedCustomer();
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Stock calculation for Kit based on constituent products
  const getKitAvailableStock = (kit: Kit): number => {
    if (!kit.items || kit.items.length === 0) return 0;
    let maxKits = Infinity;
    for (const item of kit.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) return 0;
      if (!prod.trackStock) continue;
      const possibleWithThisProduct = Math.floor(prod.stock / item.quantity);
      if (possibleWithThisProduct < maxKits) {
        maxKits = possibleWithThisProduct;
      }
    }
    return maxKits === Infinity ? 99 : Math.max(0, maxKits);
  };

  // Cart Subtotal Calculation
  const cartSubtotal = cart.reduce(
    (sum, item) => sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0),
    0
  );

  // Discount Calculation
  let discountAmount = 0;
  if (appliedCoupon === 'PULSAR10') {
    discountAmount = cartSubtotal * 0.10;
  } else if (appliedCoupon === 'CLIENTE5') {
    discountAmount = cartSubtotal * 0.05;
  } else if (appliedCoupon === 'FRETEGRATIS' && selectedShipping) {
    discountAmount = Number(selectedShipping.price) || 0;
  }

  // Cart operations
  const addToCart = (itemData: Omit<CartItem, 'cartItemId'>) => {
    // Check inventory availability first
    if (itemData.isKit && itemData.kitId) {
      const kit = kits.find((k) => k.id === itemData.kitId);
      if (kit) {
        const available = getKitAvailableStock(kit);
        const inCartQty = cart.find((i) => i.kitId === itemData.kitId)?.quantity || 0;
        if (inCartQty + itemData.quantity > available) {
          showToast(`Estoque insuficiente para este combo. Disponível: ${available} un.`, 'error');
          return;
        }
      }
    } else if (itemData.productId) {
      const prod = products.find((p) => p.id === itemData.productId);
      if (prod && prod.trackStock) {
        const inCartQty = cart.find((i) => i.productId === itemData.productId)?.quantity || 0;
        if (inCartQty + itemData.quantity > prod.stock) {
          showToast(`Estoque insuficiente. Restam apenas ${prod.stock} unidades.`, 'error');
          return;
        }
      }
    }

    setCart((prev) => {
      // Find if identical product with same customization exists
      const existingIndex = prev.findIndex(
        (i) =>
          ((itemData.productId && i.productId === itemData.productId) ||
            (itemData.kitId && i.kitId === itemData.kitId)) &&
          i.customization?.businessName === itemData.customization?.businessName
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += itemData.quantity;
        return updated;
      }

      const cartItemId = 'citem-' + Math.random().toString(36).substring(2, 9);
      return [...prev, { ...itemData, cartItemId }];
    });

    showToast(`"${itemData.name}" adicionado ao carrinho!`, 'success');
    setIsCartDrawerOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
    showToast('Item removido do carrinho.', 'info');
  };

  const updateCartQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.cartItemId === cartItemId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const applyCoupon = (code: string): boolean => {
    const formatted = code.trim().toUpperCase();
    if (formatted === 'PULSAR10') {
      setAppliedCoupon('PULSAR10');
      showToast('Cupom PULSAR10 aplicado: 10% de desconto!', 'success');
      return true;
    }
    if (formatted === 'CLIENTE5') {
      setAppliedCoupon('CLIENTE5');
      showToast('Cupom CLIENTE5 aplicado: 5% de desconto!', 'success');
      return true;
    }
    if (formatted === 'FRETEGRATIS') {
      setAppliedCoupon('FRETEGRATIS');
      showToast('Cupom FRETEGRATIS aplicado!', 'success');
      return true;
    }
    showToast('Cupom inválido ou expirado.', 'error');
    return false;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Cupom removido.', 'info');
  };

  // Melhor Envio Real API Simulator with Brazilian Logistics
  const calculateShipping = async (rawCep: string): Promise<ShippingOption[]> => {
    // A previous quote belongs to the previous cart, not the next checkout.
    setShippingOptions([]);
    setSelectedShipping(null);
    const cleanCep = rawCep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      showToast('Por favor digite um CEP válido com 8 dígitos.', 'error');
      return [];
    }

    setIsCalculatingShipping(true);
    setDestinationCep(rawCep);

    try {
      const response = await fetch('/api/shipping/quote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cep: cleanCep,
          items: cart.map(item => ({
            ...(item.isKit ? { kitId: item.kitId } : { productId: item.productId }),
            quantity: item.quantity
          }))
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Não foi possível cotar o frete');
      const options: ShippingOption[] = payload.options;
      setShippingOptions(options);
      setSelectedShipping(options[0] || null);
      return options;
    } catch (error) {
      setShippingOptions([]);
      setSelectedShipping(null);
      showToast(error instanceof Error ? error.message : 'Erro ao calcular frete', 'error');
      return [];
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  // A shipping quote is valid only for the exact cart used to request it.
  useEffect(() => {
    setShippingOptions([]);
    setSelectedShipping(null);
  }, [cart]);

  // Product CRUD
  const addProduct = (prodData: Omit<Product, 'id'>) => {
    const id = 'prod-' + Math.random().toString(36).substring(2, 9);
    const newProduct: Product = { ...prodData, id };
    setProducts((prev) => [newProduct, ...prev]);
    showToast(`Produto "${newProduct.name}" cadastrado com sucesso!`, 'success');
    if (isSupabaseConfigured()) {
      upsertProductInSupabase(newProduct).catch((err) => console.warn('Supabase product sync error:', err));
    }
  };

  const updateProduct = (id: string, partial: Partial<Product>) => {
    const previous = products.find((p) => p.id === id);
    if (!previous) {
      showToast('Produto não encontrado.', 'error');
      return;
    }
    const updatedProd: Product = { ...previous, ...partial };
    // React state updates are asynchronous: never rely on a mutable variable
    // assigned inside setProducts to construct the database request.
    setProducts((prev) => prev.map((p) => p.id === id ? updatedProd : p));
    if (!isSupabaseConfigured()) {
      showToast('Supabase indisponível. Alteração apenas local; não foi salva.', 'error');
      return;
    }
    const changed = Object.fromEntries(
      (Object.keys(updatedProd) as Array<keyof Product>)
        .filter((key) => JSON.stringify(previous[key]) !== JSON.stringify(updatedProd[key]))
        .map((key) => [key, updatedProd[key]])
    ) as Partial<Product>;
    void patchProductInSupabase(id, changed).then((saved) => {
      if (saved) {
        showToast('Produto atualizado e confirmado no Supabase.', 'success');
      } else {
        setProducts((prev) => prev.map((p) => p.id === id ? previous : p));
        showToast('Falha ao salvar no Supabase: ' + (getAdminApiLastError() || 'sem resposta do servidor') + '. Alteração revertida.', 'error');
      }
    }).catch(() => {
      setProducts((prev) => prev.map((p) => p.id === id ? previous : p));
      showToast('Falha de conexão. Alteração revertida.', 'error');
    });
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('Produto excluído com sucesso.', 'info');
    if (isSupabaseConfigured()) {
      deleteProductInSupabase(id).catch((err) => console.warn('Supabase product delete error:', err));
    }
  };

  // Kit CRUD
  const addKit = (kitData: Omit<Kit, 'id'>) => {
    const id = 'kit-' + Math.random().toString(36).substring(2, 9);
    const newKit: Kit = { ...kitData, id };
    if (!isSupabaseConfigured()) {
      showToast('Supabase indisponível. Kit não foi criado.', 'error');
      return;
    }
    void upsertKitInSupabase(newKit).then((saved) => {
      if (saved) {
        setKits((prev) => [newKit, ...prev]);
        showToast('Kit cadastrado e confirmado no Supabase.', 'success');
      } else showToast('Falha ao criar kit: ' + (getAdminApiLastError() || 'sem resposta da API'), 'error');
    }).catch(() => showToast('Falha de conexão ao cadastrar kit.', 'error'));
  };

  const updateKit = (id: string, partial: Partial<Kit>) => {
    const previous = kits.find((k) => k.id === id);
    if (!previous) {
      showToast('Kit não encontrado.', 'error');
      return;
    }
    const updatedKit: Kit = { ...previous, ...partial };
    setKits((prev) => prev.map((k) => k.id === id ? updatedKit : k));
    if (!isSupabaseConfigured()) {
      showToast('Supabase indisponível. Alteração apenas local; não foi salva.', 'error');
      return;
    }
    void upsertKitInSupabase(updatedKit).then((saved) => {
      if (saved) showToast('Kit atualizado e confirmado no Supabase.', 'success');
      else {
        setKits((prev) => prev.map((k) => k.id === id ? previous : k));
        showToast('Falha ao salvar kit no Supabase: ' + (getAdminApiLastError() || 'sem resposta do servidor') + '. Alteração revertida.', 'error');
      }
    }).catch(() => {
      setKits((prev) => prev.map((k) => k.id === id ? previous : k));
      showToast('Falha de conexão. Alteração revertida.', 'error');
    });
  };

  const deleteKit = (id: string) => {
    if (!isSupabaseConfigured()) {
      showToast('Supabase indisponível. Kit não foi removido.', 'error');
      return;
    }
    void deleteKitInSupabase(id).then((saved) => {
      if (saved) {
        setKits((prev) => prev.filter((k) => k.id !== id));
        showToast('Kit removido do Supabase.', 'success');
      } else showToast('Falha ao remover kit: ' + (getAdminApiLastError() || 'sem resposta da API'), 'error');
    }).catch(() => showToast('Falha de conexão ao remover kit.', 'error'));
  };

  // Settings
  const updateSettings = (newSettings: Partial<SiteSettings>) => {
    const previous = settings;
    // Secret tokens must only come from server environment variables,
    // never from untrusted or persisted browser settings.
    const { mercadoPagoAccessToken: _mpSecret,
      melhorEnvioToken: _meSecret,
      melhorEnvioClientSecret: _meClientSecret,
      ...safeChanges } = newSettings;
    const merged = { ...previous, ...safeChanges };
    setSettings(merged);
    if (!isSupabaseConfigured()) {
      setSettings(previous);
      showToast('Não foi possível salvar as configurações: Supabase indisponível.', 'error');
      return;
    }
    const supportedFields = new Set([
      'logoUrl', 'heroTitle', 'heroTitleHighlight', 'heroSubtitle',
      'announcementBarText', 'whatsappNumber', 'originCep', 'mercadoPagoPublicKey'
    ]);
    const hasUnsupportedChanges = Object.entries(newSettings)
      .some(([key, value]) => !supportedFields.has(key) &&
        JSON.stringify(value) !== JSON.stringify((previous as unknown as Record<string, unknown>)[key]));
    void updateSettingsInSupabase(newSettings).then((saved) => {
      if (saved) {
        if (hasUnsupportedChanges) {
          showToast('Campos compatíveis salvos no Supabase. Nome da loja e outros campos ainda são apenas prévia e não foram publicados.', 'info');
        } else {
          showToast('Configurações confirmadas no Supabase.', 'success');
        }
      } else {
        setSettings(previous);
        showToast('Falha ao gravar configurações. Alteração revertida.', 'error');
      }
    }).catch(() => {
      setSettings(previous);
      showToast('Falha de conexão ao gravar configurações. Alteração revertida.', 'error');
    });
  };

  // Auth Operations
  const loginAsAdmin = async (email: string, pass: string): Promise<boolean> => {
    const client = getSupabaseClient();
    if (!client) {
      showToast('Configure o Supabase antes de acessar o painel.', 'error');
      return false;
    }
    try {
      const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password: pass });
      if (error || !data.session?.access_token || !data.user) {
        showToast(error?.message === 'Invalid login credentials'
          ? 'Senha ou e-mail inválidos. Confira os dados cadastrados no Supabase Auth.'
          : 'Não foi possível entrar no Supabase Auth. Verifique sua senha e conexão.', 'error');
        return false;
      }
      // The API verifies the JWT and server-managed app_metadata.role.
      // Merely logging into Supabase Auth is NOT sufficient for admin access.
      const response = await fetch('/api/admin/me', {
        headers: { Authorization: 'Bearer ' + data.session.access_token },
        cache: 'no-store'
      });
      if (!response.ok) {
        const diagnostic = await response.json().catch(() => ({}));
        await client.auth.signOut();
        const code = typeof diagnostic?.code === 'string' ? diagnostic.code : '';
        const problems: Record<string, string> = {
          missing_server_env: 'Faltam variáveis no Preview: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY.',
          wrong_supabase_project: 'SUPABASE_URL na Vercel aponta para outro projeto. Use o projeto pulsartecnologia.',
          invalid_or_expired_session: 'Sessão expirada ou inválida. Entre novamente.',
          missing_session: 'O navegador não enviou a sessão ao servidor.',
          not_authorized_admin: 'Conta autenticada, mas sem a permissão administrativa ou ID não corresponde ao configurado.',
          server_auth_provider_error: 'Supabase recusou a validação no servidor. Confira a chave secreta e os logs da função.',
          server_auth_runtime_failure: 'Falha ao iniciar autenticação na Vercel. Consulte Runtime Logs da função /api/admin/me.'
        };
        showToast(problems[code] || (response.status === 404
          ? 'A rota /api/admin/me não existe nesta implantação. Abra o Preview mais recente.'
          : 'Falha no login admin (HTTP ' + response.status + '). Consulte /api/admin/me nos Runtime Logs.'), 'error');
        return false;
      }
      const privileges = await response.json().catch(() => ({}));
      const admin: CustomerProfile = {
        id: data.user.id,
        email: data.user.email || email.trim(),
        fullName: data.user.email?.split('@')[0] || 'Administrador',
        cpf: '',
        whatsapp: '',
        role: 'admin',
        createdAt: data.user.created_at,
        addresses: []
      };
      setCurrentUser(admin);
      setIsAuthModalOpen(false);
      // Load complete admin catalog (including inactive products) only now that
      // the Supabase session has passed server-side admin authorization.
      void syncWithSupabase();
      if (privileges.adminApiReady === false) {
        const detail = privileges.adminApiDiagnostic === 'not_configured'
          ? 'SUPABASE_SERVICE_ROLE_KEY ausente no Preview.'
          : privileges.adminApiDiagnostic === 'database_access_rejected'
          ? 'SUPABASE_SERVICE_ROLE_KEY rejeitada pelo banco. Confira se a chave é secreta e pertence ao projeto pulsartecnologia.'
          : 'Credencial administrativa inválida na Vercel Preview.';
        showToast('Login autorizado, mas alterações no painel estão indisponíveis: ' + detail, 'error');
      } else {
        showToast('Autenticação administrativa verificada.', 'success');
      }
      return true;
    } catch {
      await client.auth.signOut().catch(() => {});
      showToast('Não foi possível validar a sessão administrativa.', 'error');
      return false;
    }
  };

  // Customer identity requires verified email OTP, never a typed email.
  const requestCustomerOtp = async (email: string): Promise<boolean> => {
    const clean = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) return false;
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const { error } = await client.auth.signInWithOtp({
        email: clean,
        options: {
          shouldCreateUser: true,
          // Preview-only, fixed destination: never fall back to the shared project's localhost Site URL.
          emailRedirectTo: 'https://pulsar-tecnologia-site-git-security-server-api-phase1-qr-flow.vercel.app/'
        }
      });
      return !error;
    } catch { return false; }
  };

  const verifyCustomerOtp = async (email: string, token: string): Promise<boolean> => {
    const clean = email.trim().toLowerCase();
    const client = getSupabaseClient();
    if (!client || !/^\d{6,8}$/.test(token.trim())) return false;
    try {
      const verified = await client.auth.verifyOtp({ email: clean, token: token.trim(), type: 'email' });
      if (verified.error || !verified.data.session?.access_token) return false;
      const { data: identity, error } = await client.auth.getUser();
      if (error || !identity.user || identity.user.email?.toLowerCase() !== clean ||
          identity.user.app_metadata?.role === 'admin') {
        await client.auth.signOut();
        return false;
      }
      setCurrentUser({
        id: identity.user.id, email: clean, fullName: clean.split('@')[0],
        cpf: '', whatsapp: '', role: 'customer',
        createdAt: identity.user.created_at, addresses: []
      });
      setOrders([]); // Order ownership mapping is not yet enabled.
      setIsAuthModalOpen(false);
      showToast('E-mail confirmado. Conta autenticada.', 'success');
      return true;
    } catch { return false; }
  };

  const login = (_email: string, _role: 'customer' | 'admin' = 'customer'): boolean => {
    openAuthModal('customer');
    return false;
  };

  const logout = () => {
    void getSupabaseClient()?.auth.signOut();
    setCurrentUser(null);
    setOrders([]);
    if (currentView === 'admin') {
      setCurrentView('home');
    }
    showToast('Sessão encerrada com sucesso.', 'info');
  };

  const switchUserRole = () => {
    // Never promote, demote, or persist an admin role from browser UI.
    if (currentUser?.role !== 'admin') openAuthModal('admin');
    else setCurrentView('home');
  };

  const updateUserProfile = (data: Partial<CustomerProfile>) => {
    if (!currentUser) return;
    setCurrentUser((prev) => (prev ? { ...prev, ...data } : null));
    showToast('Perfil atualizado com sucesso.', 'success');
  };

  const addCustomerAddress = (addr: Omit<Address, 'id'>) => {
    if (!currentUser) return;
    const newAddr: Address = { ...addr, id: 'addr-' + Math.random().toString(36).substring(2, 7) };
    const updatedAddresses = [...currentUser.addresses, newAddr];
    setCurrentUser({ ...currentUser, addresses: updatedAddresses });
    showToast('Novo endereço cadastrado!', 'success');
  };

  // Create Order with Mercado Pago support
  const createOrder = async (orderData: {
    customer: { fullName: string; email: string; cpf: string; whatsapp: string };
    shippingAddress: Address;
    paymentMethod: 'pix' | 'credit_card' | 'mercadopago';
    cardData?: { number: string; name: string; expiry: string; cvv: string; installments: number };
    mercadoPagoPreferenceId?: string;
    mercadoPagoInitPoint?: string;
    mercadoPagoPaymentId?: string;
  }): Promise<Order> => {
    // Payment processing is not enabled until the server verifies stock, prices,
    // shipping, discount and Mercado Pago confirmation. Do not create a paid
    // order or collect payment-card details in the browser.
    throw new Error('Checkout temporariamente indisponível. Pagamentos ainda estão em configuração.');
    const shipping = selectedShipping || {
      id: 'sedex-default',
      carrier: 'Melhor Envio / Correios',
      service: 'SEDEX Expresso',
      price: 18.50,
      estimatedDays: 2
    };

    const orderNumber = 'PLS-' + Math.floor(1000 + Math.random() * 9000);
    const finalTotal = Math.max(0, cartSubtotal - discountAmount + shipping.price);

    // Generate dynamic PIX payload
    const pixCopiaECola = ''; // Pix só deve ser emitido pelo provedor após pagamento criado no backend.

    const newOrder: Order = {
      id: 'ord-' + Math.random().toString(36).substring(2, 9),
      orderNumber,
      customerId: currentUser ? currentUser.id : 'guest-' + Math.random().toString(36).substring(2, 8),
      customerName: orderData.customer.fullName,
      customerEmail: orderData.customer.email,
      customerWhatsapp: orderData.customer.whatsapp,
      customerCpf: orderData.customer.cpf,
      shippingAddress: orderData.shippingAddress,
      items: cart.map((item) => ({
        id: item.cartItemId,
        isKit: item.isKit,
        productId: item.productId,
        kitId: item.kitId,
        name: item.name,
        image: item.image,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        totalPrice: item.unitPrice * item.quantity,
        sku: item.sku,
        customization: item.customization
      })),
      subtotal: cartSubtotal,
      discount: discountAmount,
      couponCode: appliedCoupon || undefined,
      shipping,
      total: finalTotal,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: orderData.paymentMethod === 'credit_card' ? 'approved' : 'pending',
      shippingStatus: 'pending',
      pixCopiaECola,
      pixQrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixCopiaECola)}`,
      mercadoPagoPreferenceId: orderData.mercadoPagoPreferenceId,
      mercadoPagoInitPoint: orderData.mercadoPagoInitPoint,
      mercadoPagoPaymentId: orderData.mercadoPagoPaymentId,
      createdAt: new Date().toISOString(),
      paidAt: orderData.paymentMethod === 'credit_card' ? new Date().toISOString() : undefined
    };

    // Deduct stock from constituent products
    setProducts((prev) => {
      const updated = [...prev];
      for (const item of cart) {
        if (item.isKit && item.kitId) {
          const kit = kits.find((k) => k.id === item.kitId);
          if (kit) {
            for (const kitSubItem of kit.items) {
              const pIndex = updated.findIndex((p) => p.id === kitSubItem.productId);
              if (pIndex > -1 && updated[pIndex].trackStock) {
                updated[pIndex] = {
                  ...updated[pIndex],
                  stock: Math.max(0, updated[pIndex].stock - kitSubItem.quantity * item.quantity)
                };
              }
            }
          }
        } else if (item.productId) {
          const pIndex = updated.findIndex((p) => p.id === item.productId);
          if (pIndex > -1 && updated[pIndex].trackStock) {
            updated[pIndex] = {
              ...updated[pIndex],
              stock: Math.max(0, updated[pIndex].stock - item.quantity)
            };
          }
        }
      }
      return updated;
    });

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();

    if (isSupabaseConfigured()) {
      createOrderInSupabase(newOrder).catch((err) => console.warn('Supabase order creation error:', err));
    }

    return newOrder;
  };

  const updateOrderStatus = (
    orderId: string,
    status: { paymentStatus?: OrderPaymentStatus; shippingStatus?: OrderShippingStatus; trackingCode?: string }
  ) => {
    // Never allow local UI to assert that a payment was approved.
    if (status.paymentStatus !== undefined) {
      showToast('O pagamento só pode ser confirmado pelo webhook verificado.', 'error');
      return;
    }
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          paymentStatus: status.paymentStatus ?? ord.paymentStatus,
          shippingStatus: status.shippingStatus ?? ord.shippingStatus,
          trackingCode: status.trackingCode ?? ord.trackingCode,
          paidAt: status.paymentStatus === 'approved' && !ord.paidAt ? new Date().toISOString() : ord.paidAt,
          shippedAt: status.shippingStatus === 'shipped' && !ord.shippedAt ? new Date().toISOString() : ord.shippedAt,
          deliveredAt: status.shippingStatus === 'delivered' && !ord.deliveredAt ? new Date().toISOString() : ord.deliveredAt
        };
      })
    );
    showToast('Status do pedido atualizado!', 'success');

    if (isSupabaseConfigured()) {
      updateOrderStatusInSupabase(orderId, status.paymentStatus, status.trackingCode).catch((err) =>
        console.warn('Supabase order status update error:', err)
      );
    }
  };

  // Simulate Mercado Pago Webhook approval in test environment
  const simulateWebhookPaymentApproval = (_orderId: string) => {
    showToast('Simulação de aprovação desativada: use somente notificações verificadas do Mercado Pago.', 'error');
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        kits,
        addProduct,
        updateProduct,
        deleteProduct,
        addKit,
        updateKit,
        deleteKit,
        getKitAvailableStock,
        isSupabaseConnected,
        isSyncingSupabase,
        syncWithSupabase,
        testSupabase,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartSubtotal,
        appliedCoupon,
        discountAmount,
        applyCoupon,
        removeCoupon,
        selectedShipping,
        setSelectedShipping,
        shippingOptions,
        calculateShipping,
        isCalculatingShipping,
        destinationCep,
        setDestinationCep,
        orders,
        createOrder,
        updateOrderStatus,
        simulateWebhookPaymentApproval,
        currentUser,
        setCurrentUser,
        login,
        loginAsAdmin,
        requestCustomerOtp,
        verifyCustomerOtp,
        logout,
        switchUserRole,
        updateUserProfile,
        addCustomerAddress,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        openAuthModal,
        closeAuthModal,
        settings,
        updateSettings,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        isCheckoutModalOpen,
        setIsCheckoutModalOpen,
        activeNavCategory,
        setActiveNavCategory,
        searchQuery,
        setSearchQuery,
        currentView,
        setCurrentView,
        selectedProductSlug,
        setSelectedProductSlug,
        selectedInstitutionalTopic,
        setSelectedInstitutionalTopic,
        toasts,
        showToast
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
