import { CustomerProfile, Kit, Order, Product, SiteSettings } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-google-black-piano',
    name: 'Placa Google Avaliações NFC + QR Code - Black Piano',
    slug: 'placa-google-avaliacoes-nfc-qr-code-black-piano',
    shortDescription: 'Multiplique suas avaliações 5 estrelas no Google com apenas 1 toque por aproximação no celular do cliente.',
    detailedDescription: `A Placa Inteligente Pulsar Google Avaliações é fabricada em acrílico Black Piano de alta densidade (3mm) com gravação ultravioleta de altíssima definição e chip NFC NTAG213 ultrarrápido integrado.
    
Basta o cliente aproximar qualquer smartphone com NFC ou apontar a câmera para o QR Code dinâmico, e a tela oficial de avaliação 5 estrelas do seu perfil Google Meu Negócio se abre instantaneamente em menos de 2 segundos.

• Acabamento espelhado Black Piano com detalhes em Prata Tecnológico e Laranja Pulsar.
• Resistente à água, raios UV e de fácil higienização no balcão.
• Não necessita de bateria, cabos ou recarga (tecnologia passiva vitalícia).
• Já enviamos 100% configurada com o link direto do seu Google Meu Negócio.`,
    images: [
      'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'placas-google',
    sku: 'PULSAR-GOOG-BP01',
    salePrice: 80.00,
    promoPrice: 74.90,
    cost: 22.50,
    stock: 140,
    trackStock: true,
    dimensions: {
      heightCm: 15,
      widthCm: 10,
      lengthCm: 5
    },
    weightGrams: 180,
    isActive: true,
    isFeatured: true,
    isBestSeller: true,
    chipType: 'NXP NTAG213 (Universal iOS & Android)',
    material: 'Acrílico Cast 100% Virgem 3mm Black Piano',
    rating: 4.9,
    reviewsCount: 342,
    badge: 'Mais Vendida'
  },
  {
    id: 'prod-google-display-cristal',
    name: 'Display Google Avaliações Cristal Inclinado com NFC + QR Code',
    slug: 'display-google-avaliacoes-cristal-inclinado-nfc-qr',
    shortDescription: 'Design inclinado ergonômico em acrílico cristal premium, ideal para balcões de recepção e caixas.',
    detailedDescription: `Projetada para ficar no ângulo de visão perfeito de 70 graus, o Display Cristal Inclinado da Pulsar une sofisticação visual e eficiência máxima na captação de reviews.
    
Com chip NFC encapsulado na face frontal e QR Code protegido contra abrasão, garante leitura rápida mesmo em ambientes com iluminação intensa.

• Base sólida antiderrapante com silicone de amortecimento.
• Chip NFC blindado contra interferência eletromagnética.
• Ideal para clínicas médicas, consultórios, restaurantes finos e hotéis.`,
    images: [
      'https://images.unsplash.com/photo-1556742111-a301076d9d18?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'placas-google',
    sku: 'PULSAR-GOOG-CR02',
    salePrice: 95.00,
    promoPrice: 89.90,
    cost: 28.00,
    stock: 85,
    trackStock: true,
    dimensions: {
      heightCm: 16,
      widthCm: 12,
      lengthCm: 8
    },
    weightGrams: 220,
    isActive: true,
    isFeatured: true,
    isBestSeller: false,
    chipType: 'NXP NTAG215 de Alta Frequência',
    material: 'Acrílico Cristal 4mm com Polimento Diamantado',
    rating: 4.8,
    reviewsCount: 158,
    badge: 'Design Ergonômico'
  },
  {
    id: 'prod-google-aco-escovado',
    name: 'Placa Google Luxo Aço Escovado / Prata Tecnológica NFC',
    slug: 'placa-google-luxo-aco-escovado-prata-tecnologica-nfc',
    shortDescription: 'Linha executiva com lâmina metálica escovada, bordas chanfradas e acabamento premium incomparável.',
    detailedDescription: `A expressão máxima da identidade visual Pulsar: Prata Tecnológico com cortes angulares futuristas e gravação a laser.
    
Ideal para marcas que prezam por autoridade, luxo e presença imponente em balcões corporativos e recepções de alto padrão.

• Lâmina de alumínio escovado com verniz protetor anti-digitais.
• Chip NFC de alcance estendido de até 4cm de distância.
• QR Code vetorial cortado a laser de máxima durabilidade.`,
    images: [
      'https://images.unsplash.com/photo-1556740714-a8395b3bf30f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'placas-nfc',
    sku: 'PULSAR-GOOG-SLV03',
    salePrice: 139.90,
    promoPrice: 119.90,
    cost: 41.00,
    stock: 50,
    trackStock: true,
    dimensions: {
      heightCm: 18,
      widthCm: 12,
      lengthCm: 6
    },
    weightGrams: 290,
    isActive: true,
    isFeatured: true,
    isBestSeller: false,
    chipType: 'NXP NTAG216 (888 bytes programáveis)',
    material: 'Alumínio Escovado Prata + Base Acrílica 5mm',
    rating: 5.0,
    reviewsCount: 94,
    badge: 'Edição Premium'
  },
  {
    id: 'prod-social-multilink-nfc',
    name: 'Placa Social Multilink 4 em 1 (Google + Insta + Pix + Whats)',
    slug: 'placa-social-multilink-4-em-1-google-insta-pix-whats',
    shortDescription: 'Conecte todas as redes e métodos do seu comércio: Instagram, WhatsApp, Chave PIX e Google Reviews.',
    detailedDescription: `A solução completa para o balcão da sua loja física. Concentre todos os seus pontos de contato em uma única peça elegante:
    
1. QR Code & NFC para Avaliação Google
2. QR Code para seguir no Instagram
3. QR Code para chamar no WhatsApp
4. QR Code para pagamento instantâneo via PIX

Personalizada com sua logotipo, cores institucionais e links diretos.`,
    images: [
      'https://images.unsplash.com/photo-1556740772-1a741367b93e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'placas-nfc',
    sku: 'PULSAR-SOC-MULTI04',
    salePrice: 119.90,
    promoPrice: 99.90,
    cost: 32.00,
    stock: 75,
    trackStock: true,
    dimensions: {
      heightCm: 20,
      widthCm: 15,
      lengthCm: 7
    },
    weightGrams: 260,
    isActive: true,
    isFeatured: true,
    isBestSeller: true,
    chipType: 'Dual Chip NFC NTAG213',
    material: 'Acrílico Black Piano + Dourado / Laranja Espelhado',
    rating: 4.9,
    reviewsCount: 218,
    badge: 'Multi-Redes'
  },
  {
    id: 'prod-cartao-portatil-nfc',
    name: 'Cartão Inteligente NFC Portátil de Bolso - Avaliações Google',
    slug: 'cartao-inteligente-nfc-portatil-bolso-avaliacoes-google',
    shortDescription: 'Para garçons, atendentes, técnicos e vendedores levarem no bolso e pedirem avaliações na mesa.',
    detailedDescription: `Multiplique o engajamento direto da sua equipe! O cartão NFC portátil tem o tamanho exato de um cartão de crédito bancário.
    
Ao fechar uma conta em restaurante, entregar um veículo em oficina ou concluir um atendimento a domicílio, o colaborador aproxima o cartão no celular do cliente e recolhe a avaliação na hora.`,
    images: [
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'acessorios',
    sku: 'PULSAR-CARD-PORT05',
    salePrice: 49.90,
    promoPrice: 39.90,
    cost: 11.00,
    stock: 300,
    trackStock: true,
    dimensions: {
      heightCm: 8.5,
      widthCm: 5.4,
      lengthCm: 0.1
    },
    weightGrams: 15,
    isActive: true,
    isFeatured: false,
    isBestSeller: true,
    chipType: 'NXP NTAG213 PVC Card',
    material: 'PVC Rígido Laminado Fosco de Alta Resistência',
    rating: 4.9,
    reviewsCount: 187,
    badge: 'Para Equipes'
  },
  {
    id: 'prod-totem-balcao-led',
    name: 'Totem de Balcão Google Avaliações com Iluminação LED Halo',
    slug: 'totem-balcao-google-avaliacoes-led-halo',
    shortDescription: 'Placa com base iluminada por LED Laranja Pulsar que atrai a atenção de todos os clientes no balcão.',
    detailedDescription: `Destaque absoluto no ponto de venda. A base de acrílico iluminada com LED de baixo consumo projeta um brilho halo sutil que direciona o olhar do cliente para o símbolo de aproximação NFC.
    
Acompanha fonte bivolt ultracompacta e cabo com interruptor de toque.`,
    images: [
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'placas-google',
    sku: 'PULSAR-TOT-LED06',
    salePrice: 179.90,
    promoPrice: 159.90,
    cost: 54.00,
    stock: 35,
    trackStock: true,
    dimensions: {
      heightCm: 22,
      widthCm: 14,
      lengthCm: 9
    },
    weightGrams: 420,
    isActive: true,
    isFeatured: true,
    isBestSeller: false,
    chipType: 'NXP NTAG215 Alta Sensibilidade',
    material: 'Acrílico 5mm com Difusor de Luz e LED 3000K',
    rating: 5.0,
    reviewsCount: 63,
    badge: 'Iluminação LED'
  }
];

export const INITIAL_KITS: Kit[] = [
  {
    id: 'kit-1-placa-individual',
    name: 'Kit 1: Placa Google NFC + QR Code',
    slug: 'kit-1-placa-google-nfc-qr-code',
    description: '1 Placa Inteligente Black Piano completa e personalizada com seu link e logotipo.',
    image: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80',
    items: [
      { productId: 'prod-google-black-piano', quantity: 1 }
    ],
    referencePrice: 80.00,
    kitPrice: 80.00,
    savingsAmount: 0,
    discountPercentage: 0,
    isActive: true,
    isFeatured: true,
    badge: 'Iniciante',
    targetAudience: 'Para negócios que possuem 1 ponto único de atendimento/caixa'
  },
  {
    id: 'kit-2-placas-dupla',
    name: 'Kit 2: Combo Duplo de Balcão (2 Placas)',
    slug: 'kit-2-combo-duplo-balcao-2-placas',
    description: '2 Placas Inteligentes para cobrir Caixa principal e Balcão de Atendimento / Recepção.',
    image: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=800&q=80',
    items: [
      { productId: 'prod-google-black-piano', quantity: 2 }
    ],
    referencePrice: 160.00, // 2 x 80
    kitPrice: 120.00, // R$ 60 por placa
    savingsAmount: 40.00,
    discountPercentage: 25,
    isActive: true,
    isFeatured: true,
    badge: 'Mais Popular — Economize R$ 40',
    targetAudience: 'Recepção + Caixa, ou 2 caixas simultâneos'
  },
  {
    id: 'kit-5-placas-pro',
    name: 'Kit 5: Combo Expansão Comercial (5 Placas)',
    slug: 'kit-5-combo-expansao-comercial-5-placas',
    description: '5 Placas Inteligentes configuradas para restaurantes com mesas, clínicas ou comércios médios.',
    image: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=800&q=80',
    items: [
      { productId: 'prod-google-black-piano', quantity: 5 }
    ],
    referencePrice: 400.00, // 5 x 80
    kitPrice: 260.00, // R$ 52 por placa
    savingsAmount: 140.00,
    discountPercentage: 35,
    isActive: true,
    isFeatured: true,
    badge: 'Melhor Custo-Benefício — Economize R$ 140',
    targetAudience: 'Comércios com vários ambientes, clínicas e restaurantes'
  },
  {
    id: 'kit-10-placas-corporativo',
    name: 'Kit 10: Plano Corporativo & Franquias (10 Placas)',
    slug: 'kit-10-plano-corporativo-franquias-10-placas',
    description: '10 Placas com suporte a múltiplas unidades/filiais e gestão centralizada de reputação.',
    image: 'https://images.unsplash.com/photo-1556742111-a301076d9d18?auto=format&fit=crop&w=800&q=80',
    items: [
      { productId: 'prod-google-black-piano', quantity: 10 }
    ],
    referencePrice: 800.00, // 10 x 80
    kitPrice: 480.00, // R$ 48 por placa
    savingsAmount: 320.00,
    discountPercentage: 40,
    isActive: true,
    isFeatured: true,
    badge: 'Super Desconto — Economize R$ 320',
    targetAudience: 'Redes de lojas, franquias e empresas com alta circulação'
  }
];

export const INITIAL_SETTINGS: SiteSettings = {
  storeName: 'Pulsar Tecnologia',
  slogan: 'TECNOLOGIA QUE IMPULSIONA SEU NEGÓCIO',
  logoUrl: '/assets/aistudio/WhatsApp_Image_2026-10-28_at_17.34.06_837cfca8.jpeg',
  brandPdfUrl: '/assets/aistudio/Manual_de_Identidade_Visual_-_Pulsar_b477388f.pdf',
  primaryColor: '#FF5500', // Laranja Pulsar Vibrante
  accentColor: '#FFAA00', // Amarelo Energia
  whatsappNumber: '5511999998888',
  supportEmail: 'contato@pulsartecnologia.com.br',
  originCep: '01310-100', // Av. Paulista, São Paulo - SP
  announcementBarText: '⚡ FRETE COM PREÇO ESPECIAL PARA TODO BRASIL | DESCONTOS DE ATÉ 40% NOS KITS PROMOCIONAIS',
  heroBadge: 'TECNOLOGIA NFC & QR CODE DE ALTO IMPACTO',
  heroTitle: 'Multiplique suas Avaliações no Google',
  heroTitleHighlight: 'em até 300% com 1 Toque',
  heroSubtitle: 'Placas inteligentes e elegantes com aproximação NFC e QR Code para balcões e recepções. Transforme clientes satisfeitos em autoridade máxima no Google Meu Negócio.',
  freeShippingMinimum: 250.00,
  mercadoPagoPublicKey: 'APP_USR-78619842-TEST-PULSAR-KEY',
  mercadoPagoAccessToken: 'APP_USR-TEST-ACCESS-TOKEN-SECRET',
  mercadoPagoSandbox: true,
  melhorEnvioToken: 'MELHOR_ENVIO_SANDBOX_TOKEN_SECURE',
  melhorEnvioClientId: '',
  melhorEnvioClientSecret: '',
  melhorEnvioSandbox: true,
  heroImageUrl: '',
  faqList: [
    {
      question: 'Como funciona a tecnologia de aproximação NFC da placa?',
      answer: 'O cliente apenas aproxima o celular (iPhone ou Android) a cerca de 2 a 4 cm da placa. Sem precisar abrir aplicativo algum, surge uma notificação imediata na tela do celular que, ao ser tocada, abre direto a página de avaliação 5 estrelas do seu estabelecimento no Google!'
    },
    {
      question: 'E se o celular do cliente não tiver leitor NFC?',
      answer: 'Todas as placas Pulsar contam com impressão de alta precisão do QR Code dinâmico na mesma face. Qualquer smartphone com câmera fotográfica consegue ler o QR Code em fração de segundo.'
    },
    {
      question: 'A placa precisa de bateria, pilha ou recarga na tomada?',
      answer: 'Não! O chip NFC interno da Pulsar é 100% passivo. Ele é alimentado pela própria onda de rádio de indução emitida pelo celular do cliente no momento da aproximação. A placa não tem pilhas, não gasta energia e tem durabilidade de anos.'
    },
    {
      question: 'Vocês já mandam a placa configurada para o meu negócio?',
      answer: 'Sim! Na hora da compra você pode informar o nome da sua empresa ou o link do seu Google Meu Negócio. Nossa equipe técnica grava o chip NFC e gera o QR Code com link direto antes de despachar seu pedido.'
    },
    {
      question: 'Posso alterar o link da placa no futuro caso mude de endereço ou telefone?',
      answer: 'Sim, nossos chips são regraváveis via aplicativo gratuito em qualquer smartphone (como o NFC Tools), garantindo total flexibilidade ao seu investimento.'
    },
    {
      question: 'Qual é o prazo de postagem e garantia?',
      answer: 'Enviamos seu pedido em até 24 a 48 horas úteis após a aprovação do pagamento. Oferecemos 1 ano de garantia total contra qualquer defeito de fabricação ou falha do chip NFC.'
    }
  ],
  testimonials: [
    {
      id: 'test-1',
      clientName: 'Dr. Marcelo Fonseca',
      companyName: 'Clínica Odontológica OrthoPremium',
      companyCity: 'São Paulo - SP',
      quote: 'Saímos de 47 avaliações para mais de 380 em apenas 60 dias! Colocamos uma placa na recepção e outra na sala de espera. O paciente aproxima o celular e avalia antes de sair.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      reviewsIncreased: '+708% Reviews'
    },
    {
      id: 'test-2',
      clientName: 'Carla Silveira',
      companyName: 'The Burger Lab',
      companyCity: 'Curitiba - PR',
      quote: 'Compramos o Kit de 5 placas para colocar nos caixas e no balcão de retirada. Foi a melhor decisão de marketing do ano. Viramos o primeiro lugar nas buscas de hamburgueria da região.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
      reviewsIncreased: '+450 Reviews 5★'
    },
    {
      id: 'test-3',
      clientName: 'Rodrigo Alcantara',
      companyName: 'AutoCenter Alcantara & Filhos',
      companyCity: 'Belo Horizonte - MG',
      quote: 'O acabamento da placa em acrílico Black Piano passa muita credibilidade no balcão. O cliente fica impressionado quando o celular abre o Google sozinho na aproximação.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      reviewsIncreased: 'Top 1 no Google Local'
    }
  ]
};

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-8921',
    orderNumber: 'PLS-8921',
    customerId: 'cust-1',
    customerName: 'Vinicius Castro',
    customerEmail: 'contatoviniciuscastro@gmail.com',
    customerWhatsapp: '(11) 98765-4321',
    customerCpf: '123.456.789-00',
    shippingAddress: {
      id: 'addr-1',
      recipientName: 'Vinicius Castro',
      zipCode: '04571-010',
      street: 'Avenida Engenheiro Luís Carlos Berrini',
      number: '105',
      complement: 'Conjunto 81',
      neighborhood: 'Cidade Monções',
      city: 'São Paulo',
      state: 'SP',
      isDefault: true
    },
    items: [
      {
        id: 'ord-item-1',
        isKit: true,
        kitId: 'kit-2-placas-dupla',
        name: 'Kit 2: Combo Duplo de Balcão (2 Placas)',
        image: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=800&q=80',
        unitPrice: 120.00,
        quantity: 1,
        totalPrice: 120.00,
        sku: 'PULSAR-KIT-02',
        customization: {
          businessName: 'Pulsar Café & Coworking',
          googleMapsUrl: 'https://maps.google.com/?cid=123456789'
        }
      }
    ],
    subtotal: 120.00,
    discount: 12.00,
    couponCode: 'PULSAR10',
    shipping: {
      id: 'sedex-1',
      carrier: 'Correios / Melhor Envio',
      service: 'SEDEX Express',
      price: 18.50,
      estimatedDays: 2
    },
    total: 126.50,
    paymentMethod: 'pix',
    paymentStatus: 'approved',
    shippingStatus: 'shipped',
    trackingCode: 'NL184920384BR',
    createdAt: '2026-10-29T14:22:00Z',
    paidAt: '2026-10-29T14:23:15Z',
    shippedAt: '2026-10-30T10:00:00Z'
  },
  {
    id: 'ord-8922',
    orderNumber: 'PLS-8922',
    customerId: 'cust-2',
    customerName: 'Renata Meirelles',
    customerEmail: 'renata.clinica@gmail.com',
    customerWhatsapp: '(21) 99887-1122',
    customerCpf: '321.654.987-11',
    shippingAddress: {
      id: 'addr-2',
      recipientName: 'Dra. Renata Meirelles',
      zipCode: '22041-001',
      street: 'Avenida Atlântica',
      number: '2400',
      neighborhood: 'Copacabana',
      city: 'Rio de Janeiro',
      state: 'RJ',
      isDefault: true
    },
    items: [
      {
        id: 'ord-item-2',
        isKit: true,
        kitId: 'kit-5-placas-pro',
        name: 'Kit 5: Combo Expansão Comercial (5 Placas)',
        image: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=800&q=80',
        unitPrice: 260.00,
        quantity: 1,
        totalPrice: 260.00,
        sku: 'PULSAR-KIT-05',
        customization: {
          businessName: 'Clínica Dermatológica Meirelles'
        }
      }
    ],
    subtotal: 260.00,
    discount: 0,
    shipping: {
      id: 'jadlog-1',
      carrier: 'Jadlog / Melhor Envio',
      service: '.Package',
      price: 22.00,
      estimatedDays: 3
    },
    total: 282.00,
    paymentMethod: 'credit_card',
    paymentStatus: 'approved',
    shippingStatus: 'processing',
    createdAt: '2026-10-31T05:15:00Z',
    paidAt: '2026-10-31T05:16:30Z'
  }
];

export const INITIAL_CUSTOMERS: CustomerProfile[] = [
  {
    id: 'cust-1',
    fullName: 'Vinicius Castro',
    email: 'contatoviniciuscastro@gmail.com',
    cpf: '123.456.789-00',
    whatsapp: '(11) 98765-4321',
    role: 'customer',
    createdAt: '2026-09-15T10:00:00Z',
    addresses: [
      {
        id: 'addr-1',
        recipientName: 'Vinicius Castro',
        zipCode: '04571-010',
        street: 'Avenida Engenheiro Luís Carlos Berrini',
        number: '105',
        complement: 'Conjunto 81',
        neighborhood: 'Cidade Monções',
        city: 'São Paulo',
        state: 'SP',
        isDefault: true
      }
    ]
  },
  {
    id: 'admin-1',
    fullName: 'Administrador Pulsar',
    email: 'admin@pulsartecnologia.com.br',
    cpf: '000.000.000-00',
    whatsapp: '(11) 99999-8888',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00Z',
    addresses: []
  }
];
