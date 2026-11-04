-- ==============================================================================
-- PULSAR TECNOLOGIA — SCHEMA POSTGRESQL PARA SUPABASE
-- Plataforma de Placas de Avaliação Google, NFC, QR Code & Combos
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE PRODUTOS
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

-- 3. TABELA DE COMBOS / KITS PROMOCIONAIS
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

-- 4. TABELA DE PEDIDOS (ORDERS)
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
    payment_method TEXT NOT NULL, -- 'pix' | 'credit_card'
    payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'in_process' | 'rejected' | 'refunded'
    shipping_carrier TEXT,
    shipping_service TEXT,
    tracking_code TEXT,
    shipping_address JSONB NOT NULL,
    pix_qr_code TEXT,
    mercado_pago_payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABELA DE CONFIGURAÇÕES DO SITE (CMS & INTEGRAÇÕES)
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

-- 6. TABELA DE CLIENTES (CUSTOMERS)
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    cpf TEXT,
    role TEXT DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABELA DE ENDEREÇOS DOS CLIENTES
CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    recipient_name TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    street TEXT NOT NULL,
    number TEXT NOT NULL,
    complement TEXT,
    neighborhood TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Somente catálogo público. Todas as outras tabelas permanecem fechadas por RLS.
CREATE POLICY "Produtos ativos públicos" ON public.products FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Kits ativos públicos" ON public.kits FOR SELECT TO anon, authenticated USING (is_active = true);
-- Não criar SELECT/INSERT/UPDATE públicos para pedidos, clientes, endereços e configurações.
-- Operações administrativas e checkout devem passar por rotas backend com autorização.
-- NÃO adicionar políticas FOR ALL USING (true).

-- 9. CONFIGURAÇÃO DE STORAGE (BUCKET PARA FOTOS DOS PRODUTOS E LOGO)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pulsar-assets', 'pulsar-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Acesso público aos assets da Pulsar"
ON storage.objects FOR SELECT
USING (bucket_id = 'pulsar-assets');

-- Upload restrito: configure autorização server-side antes de permitir uploads.

-- 10. DADOS INICIAIS (SEED)
INSERT INTO public.site_settings (
    id,
    logo_url,
    hero_title,
    hero_title_highlight,
    hero_subtitle,
    announcement_bar_text,
    whatsapp_number,
    origin_cep,
    mercado_pago_public_key,
    melhor_envio_token
) VALUES (
    'default',
    '/assets/aistudio/WhatsApp_Image_2026-10-28_at_17.34.06_837cfca8.jpeg',
    'Multiplique suas Avaliações no Google em',
    '300% com 1 Toque',
    'Placas inteligentes e elegantes com aproximação NFC e QR Code para balcões e recepções. Transforme clientes satisfeitos em autoridade máxima no Google Meu Negócio.',
    '⚡ FRETE GRÁTIS EM COMPRAS ACIMA DE R$ 150 | DESPACHO EXPRESSO EM 24H',
    '5511999998888',
    '01001-000',
    'APP_USR-test-public-key',
    NULL
) ON CONFLICT (id) DO NOTHING;
