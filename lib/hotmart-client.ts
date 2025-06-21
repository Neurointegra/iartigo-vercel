interface HotmartProduct {
  id: string
  name: string
  price: number
  currency: string
}

interface HotmartCheckoutData {
  product_id: string
  customer: {
    name: string
    email: string
    document?: string
    phone?: string
  }
  success_url?: string
  cancel_url?: string
  metadata?: Record<string, any>
}

class HotmartClient {
  private baseUrl: string
  private environment: string

  constructor() {
    this.environment = process.env.NODE_ENV === "production" ? "production" : "sandbox"
    this.baseUrl = "https://pay.hotmart.com"
  }

  generateCheckoutUrl(data: HotmartCheckoutData): string {
    const params = new URLSearchParams({
      // ID do produto na Hotmart (você precisa criar)
      product: data.product_id,
      // Dados do cliente
      email: data.customer.email,
      name: data.customer.name,
      // URLs de retorno
      success_url: data.success_url || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      cancel_url: data.cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/payment?status=cancelled`,
      // Metadados customizados
      ...(data.metadata && { custom: JSON.stringify(data.metadata) }),
    })

    return `${this.baseUrl}/${data.product_id}?${params.toString()}`
  }

  // Produtos do iArtigo na Hotmart
  getProducts(): Record<string, HotmartProduct> {
    return {
      "per-article": {
        id: "IARTIGO_PER_ARTICLE", // Você criará na Hotmart
        name: "iArtigo - Por Artigo",
        price: 15,
        currency: "BRL",
      },
      professional: {
        id: "IARTIGO_PROFESSIONAL", // Você criará na Hotmart
        name: "iArtigo - Profissional",
        price: 79,
        currency: "BRL",
      },
      institutional: {
        id: "IARTIGO_INSTITUTIONAL", // Você criará na Hotmart
        name: "iArtigo - Institucional",
        price: 199,
        currency: "BRL",
      },
    }
  }
}

export const hotmartClient = new HotmartClient()
