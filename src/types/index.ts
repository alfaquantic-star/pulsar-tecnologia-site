export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  detailedDescription: string;
  images: string[];
  category: 'placas-google' | 'placas-nfc' | 'kits-promocionais' | 'acessorios';
  sku: string;
  salePrice: number;
  promoPrice?: number;
  cost: number;
  stock: number;
  trackStock: boolean;
  dimensions: {
    heightCm: number;
    widthCm: number;
    lengthCm: number;
  };
  weightGrams: number;
  isActive: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  chipType?: string; // NTAG213, NTAG215, NTAG216
  material?: string; // Acrílico Cast Black Piano, Inox Escovado, etc.
  rating: number;
  reviewsCount: number;
  badge?: string;
}

export interface KitItemReference {
  productId: string;
  quantity: number;
}

export interface Kit {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  items: KitItemReference[];
  referencePrice: number; // Sum of individual prices
  kitPrice: number; // Actual promo price
  savingsAmount: number; // R$ saved
  discountPercentage: number; // % discount
  isActive: boolean;
  isFeatured: boolean;
  badge?: string;
  targetAudience?: string; // ex: Ideal para comércios locais, redes com múltiplas filiais
}

export interface CartItem {
  cartItemId: string;
  isKit: boolean;
  productId?: string;
  kitId?: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  sku: string;
  customization?: {
    businessName?: string;
    googleMapsUrl?: string;
    whatsappNumber?: string;
    observations?: string;
  };
}

export interface ShippingOption {
  id: string;
  carrier: string;
  service: string;
  price: number;
  estimatedDays: number;
  companyLogo?: string;
}

export interface Address {
  id: string;
  recipientName: string;
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  isDefault: boolean;
}

export interface CustomerProfile {
  id: string;
  fullName: string;
  email: string;
  cpf: string;
  whatsapp: string;
  addresses: Address[];
  role: 'customer' | 'admin';
  createdAt: string;
  isBlocked?: boolean;
}

export type OrderPaymentStatus = 'pending' | 'approved' | 'rejected' | 'refunded' | 'cancelled';
export type OrderShippingStatus = 'pending' | 'processing' | 'shipped' | 'delivered';

export interface OrderItem {
  id: string;
  isKit: boolean;
  productId?: string;
  kitId?: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  sku: string;
  customization?: {
    businessName?: string;
    googleMapsUrl?: string;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerWhatsapp: string;
  customerCpf: string;
  shippingAddress: Address;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  shipping: ShippingOption;
  total: number;
  paymentMethod: 'pix' | 'credit_card' | 'mercadopago';
  paymentStatus: OrderPaymentStatus;
  shippingStatus: OrderShippingStatus;
  pixQrCodeUrl?: string;
  pixCopiaECola?: string;
  trackingCode?: string;
  mercadoPagoPreferenceId?: string;
  mercadoPagoInitPoint?: string;
  mercadoPagoPaymentId?: string;
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export interface SiteSettings {
  storeName: string;
  slogan: string;
  logoUrl: string;
  brandPdfUrl: string;
  primaryColor: string;
  accentColor: string;
  whatsappNumber: string;
  supportEmail: string;
  originCep: string;
  announcementBarText: string;
  heroBadge: string;
  heroTitle: string;
  heroTitleHighlight: string;
  heroSubtitle: string;
  freeShippingMinimum: number;
  mercadoPagoPublicKey: string;
  mercadoPagoAccessToken: string;
  mercadoPagoSandbox: boolean;
  melhorEnvioToken: string;
  melhorEnvioSandbox: boolean;
  faqList: { question: string; answer: string }[];
  heroImageUrl?: string;
  melhorEnvioClientId?: string;
  melhorEnvioClientSecret?: string;
  testimonials: {
    id: string;
    clientName: string;
    companyName: string;
    companyCity: string;
    quote: string;
    rating: number;
    avatar: string;
    reviewsIncreased: string;
  }[];
}
