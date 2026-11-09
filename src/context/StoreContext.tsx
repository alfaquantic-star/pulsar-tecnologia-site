import React, { createContext, useContext, useEffect, useState } from 'react';
import { INITIAL_CUSTOMERS, INITIAL_KITS, INITIAL_ORDERS, INITIAL_PRODUCTS, INITIAL_SETTINGS } from '../data/initialData';
import { Address, CartItem, CustomerProfile, Kit, Order, OrderPaymentStatus, OrderShippingStatus, Product, ShippingOption, SiteSettings } from '../types';
import {
  isSupabaseConfigured,
  testSupabaseConnection,
  fetchProductsFromSupabase,
  upsertProductInSupabase,
  deleteProductInSupabase,
  fetchKitsFromSupabase,
  upsertKitInSupabase,
  deleteKitInSupabase,
  fetchOrdersFromSupabase,
  createOrderInSupabase,
  updateOrderStatusInSupabase,
  fetchSettingsFromSupabase,
  updateSettingsInSupabase
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
  loginAsAdmin: (email: string, pass: string) => boolean;
  loginAsCustomer: (data: { email: string; fullName?: string; whatsapp?: string; cpf?: string }) => boolean;
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
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('pulsar_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  // 5. Persistent Settings (ensuring clean headline)
  const [settings, setSettings] = useState<SiteSettings>(() => {
    const saved = localStorage.getItem('pulsar_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { 
        ...INITIAL_SETTINGS, 
        ...parsed, 
        heroTitle: 'Multiplique suas Avaliações no Google',
        heroTitleHighlight: 'em até 300% com 1 Toque'
      };
    }
    return INITIAL_SETTINGS;
  });

  // 6. User Auth State
  const [currentUser, setCurrentUser] = useState<CustomerProfile | null>(() => {
    const saved = localStorage.getItem('pulsar_user');
    return saved ? JSON.parse(saved) : null;
  });

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

      if (remoteProds && remoteProds.length > 0) {
        setProducts(remoteProds);
      }
      if (remoteKits && remoteKits.length > 0) {
        setKits(remoteKits);
      }
      if (remoteOrders && remoteOrders.length > 0) {
        setOrders(remoteOrders);
      }
      if (remoteSettings) {
        setSettings((prev) => ({ ...prev, ...remoteSettings }));
      }
      setIsSupabaseConnected(true);
      showToast('Dados sincronizados com o Supabase com sucesso!', 'success');
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
    localStorage.setItem('pulsar_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('pulsar_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('pulsar_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('pulsar_user');
    }
  }, [currentUser]);

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

  // Discounts are never calculated from customer-controlled browser state.
  // Admin-controlled coupons will only be honored when authorized and
  // recalculated by the server after the secure coupon manager is released.
  const discountAmount = 0;

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

  const applyCoupon = (_code: string): boolean => {
    // Safe compatibility method: no client, including users who manipulate
    // React state, is able to grant a financial discount in the browser.
    setAppliedCoupon(null);
    showToast('Cupons só podem ser gerenciados pelo administrador. Nenhum desconto foi aplicado.', 'info');
    return false;
  };

  const removeCoupon = () => {
    // Historical browser coupons are invalid. Customer cannot change
    // server-authorized discounts; reset legacy local display if present.
    setAppliedCoupon(null);
  };

  // Melhor Envio Real API Simulator with Brazilian Logistics
  const calculateShipping = async (rawCep: string): Promise<ShippingOption[]> => {
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
        body: JSON.stringify({ cep: cleanCep, quantity: cart.reduce((sum, item) => sum + item.quantity, 0) })
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
    let updatedProd: Product | undefined;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          updatedProd = { ...p, ...partial };
          return updatedProd;
        }
        return p;
      })
    );
    showToast('Produto atualizado com sucesso.', 'success');
    if (updatedProd && isSupabaseConfigured()) {
      upsertProductInSupabase(updatedProd).catch((err) => console.warn('Supabase product sync error:', err));
    }
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
    setKits((prev) => [newKit, ...prev]);
    showToast(`Kit promocional "${newKit.name}" criado!`, 'success');
    if (isSupabaseConfigured()) {
      upsertKitInSupabase(newKit).catch((err) => console.warn('Supabase kit sync error:', err));
    }
  };

  const updateKit = (id: string, partial: Partial<Kit>) => {
    let updatedKit: Kit | undefined;
    setKits((prev) =>
      prev.map((k) => {
        if (k.id === id) {
          updatedKit = { ...k, ...partial };
          return updatedKit;
        }
        return k;
      })
    );
    showToast('Kit atualizado com sucesso.', 'success');
    if (updatedKit && isSupabaseConfigured()) {
      upsertKitInSupabase(updatedKit).catch((err) => console.warn('Supabase kit sync error:', err));
    }
  };

  const deleteKit = (id: string) => {
    setKits((prev) => prev.filter((k) => k.id !== id));
    showToast('Kit removido com sucesso.', 'info');
    if (isSupabaseConfigured()) {
      deleteKitInSupabase(id).catch((err) => console.warn('Supabase kit delete error:', err));
    }
  };

  // Settings
  const updateSettings = (newSettings: Partial<SiteSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...newSettings };
      if (isSupabaseConfigured()) {
        updateSettingsInSupabase(merged).catch((err) => console.warn('Supabase settings sync error:', err));
      }
      return merged;
    });
    showToast('Configurações da loja salvas com sucesso!', 'success');
  };

  // Auth Operations
  const loginAsAdmin = (_email: string, _pass: string): boolean => {
    showToast('Acesso administrativo desativado temporariamente. Configure autenticação Supabase e autorização por servidor antes de habilitar.', 'error');
    return false;
  };

  const loginAsCustomer = (data: { email: string; fullName?: string; whatsapp?: string; cpf?: string }): boolean => {
    const emailClean = data.email.trim().toLowerCase();
    if (!emailClean) {
      showToast('Por favor, informe seu e-mail de cliente.', 'error');
      return false;
    }
    const existing = INITIAL_CUSTOMERS.find((c) => c.email.toLowerCase() === emailClean && c.role === 'customer');
    if (existing) {
      setCurrentUser(existing);
      setIsAuthModalOpen(false);
      showToast(`Bem-vindo de volta, ${existing.fullName}!`, 'success');
      return true;
    }
    const newUser: CustomerProfile = {
      id: 'cust-' + Math.random().toString(36).substring(2, 8),
      fullName: data.fullName?.trim() || emailClean.split('@')[0],
      email: emailClean,
      cpf: data.cpf || '000.000.000-00',
      whatsapp: data.whatsapp || '(11) 90000-0000',
      role: 'customer',
      createdAt: new Date().toISOString(),
      addresses: []
    };
    setCurrentUser(newUser);
    setIsAuthModalOpen(false);
    showToast(`Conta de cliente criada com sucesso para ${newUser.fullName}!`, 'success');
    return true;
  };

  const login = (email: string, role: 'customer' | 'admin' = 'customer'): boolean => {
    const cleanEmail = email.trim().toLowerCase();
    if (role === 'admin') {
      showToast('Painel admin indisponível até a configuração segura de permissões.', 'error');
      return false;
    }
    return loginAsCustomer({ email: cleanEmail });
  };

  const logout = () => {
    setCurrentUser(null);
    if (currentView === 'admin') {
      setCurrentView('home');
    }
    showToast('Sessão encerrada com sucesso.', 'info');
  };

  const switchUserRole = () => {
    if (!currentUser || currentUser.role !== 'admin') {
      openAuthModal('admin');
      return;
    }
    // Admin toggling to customer view to test shopping experience
    const newRole = currentUser.role === 'admin' ? 'customer' : 'admin';
    const updated = { ...currentUser, role: newRole as 'customer' | 'admin' };
    setCurrentUser(updated);
    showToast(`Modo de visualização: ${newRole === 'admin' ? 'Painel Administrador' : 'Visão Loja / Cliente'}.`, 'info');
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
  const simulateWebhookPaymentApproval = (orderId: string) => {
    updateOrderStatus(orderId, {
      paymentStatus: 'approved',
      shippingStatus: 'processing'
    });
    showToast('⚡ Webhook Mercado Pago: Pagamento PIX aprovado com sucesso!', 'success');
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
        loginAsCustomer,
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
