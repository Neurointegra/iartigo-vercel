interface HotmartPaymentData {
  offer_code: string
  customer: {
    name: string
    email: string
    phone?: string
    document?: string
  }
  price: number
  currency: string
  success_url?: string
  cancel_url?: string
  webhook_url?: string
  metadata?: Record<string, any>
}

interface HotmartPaymentResponse {
  checkout_url: string
  payment_id: string
  status: string
  offer_code: string
  customer_email: string
  amount: number
  currency: string
}

interface HotmartOfferData {
  name: string
  price: number
  currency: string
  recurrence?: {
    frequency: 'MONTHLY' | 'YEARLY'
    cycles?: number
  }
}

class HotmartClient {
  private clientId: string
  private clientSecret: string
  private apiUrl: string
  private environment: string
  private accessToken: string | null = null

  constructor() {
    this.clientId = process.env.HOTMART_CLIENT_ID || ""
    this.clientSecret = process.env.HOTMART_CLIENT_SECRET || ""
    this.apiUrl = process.env.HOTMART_API_URL || "https://api-sec-vlc.hotmart.com"
    this.environment = process.env.HOTMART_ENVIRONMENT || "sandbox"

    if (!this.clientId || !this.clientSecret) {
      throw new Error("HOTMART_CLIENT_ID e HOTMART_CLIENT_SECRET devem ser configurados")
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken
    }

    try {
      const response = await fetch(`${this.apiUrl}/security/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "client_credentials",
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      })

      if (!response.ok) {
        throw new Error(`Erro ao obter token Hotmart: ${response.status}`)
      }

      const data = await response.json()
      this.accessToken = data.access_token

      // Token expira em 1 hora, renovar automaticamente
      setTimeout(() => {
        this.accessToken = null
      }, (data.expires_in - 60) * 1000)

      return this.accessToken!
    } catch (error) {
      console.error("❌ Erro ao obter token Hotmart:", error)
      throw error
    }
  }

  async createCheckout(data: HotmartPaymentData): Promise<HotmartPaymentResponse> {
    try {
      console.log("🔄 Criando checkout Hotmart:", {
        offer_code: data.offer_code,
        customer_email: data.customer.email,
        amount: data.price,
      })

      const token = await this.getAccessToken()

      const checkoutData = {
        offer_code: data.offer_code,
        customer: {
          name: data.customer.name,
          email: data.customer.email,
          phone: data.customer.phone || "",
          document: data.customer.document || "",
        },
        price: {
          value: data.price,
          currency_code: data.currency,
        },
        success_url: data.success_url,
        cancel_url: data.cancel_url,
        webhook_url: data.webhook_url,
        external_reference: data.metadata?.external_reference || `iartigo_${Date.now()}`,
        custom_fields: data.metadata || {},
      }

      console.log("🚀 Enviando para Hotmart API...")

      const response = await fetch(`${this.apiUrl}/payments/api/v1/checkout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
      })

      const responseText = await response.text()
      console.log("📥 Resposta Hotmart (raw):", responseText)

      if (!response.ok) {
        let errorMessage = `Erro Hotmart API: ${response.status}`
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.message || errorData.error_description || errorMessage
        } catch {
          errorMessage = `${errorMessage} - ${responseText}`
        }
        throw new Error(errorMessage)
      }

      const hotmartResponse = JSON.parse(responseText)

      console.log("✅ Checkout criado com sucesso:", hotmartResponse.checkout_url)

      return {
        checkout_url: hotmartResponse.checkout_url,
        payment_id: hotmartResponse.transaction_id || hotmartResponse.id,
        status: "pending",
        offer_code: data.offer_code,
        customer_email: data.customer.email,
        amount: data.price,
        currency: data.currency,
      }
    } catch (error) {
      console.error("💥 Erro ao criar checkout Hotmart:", error)
      throw error
    }
  }

  async getTransaction(transactionId: string): Promise<any> {
    try {
      const token = await this.getAccessToken()

      const response = await fetch(`${this.apiUrl}/payments/api/v1/transactions/${transactionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Erro ao buscar transação: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Erro ao buscar transação:", error)
      throw error
    }
  }

  async getOffers(): Promise<HotmartOfferData[]> {
    try {
      const token = await this.getAccessToken()

      const response = await fetch(`${this.apiUrl}/payments/api/v1/offers`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Erro ao buscar ofertas: ${response.status}`)
      }

      const data = await response.json()
      return data.items || []
    } catch (error) {
      console.error("Erro ao buscar ofertas:", error)
      throw error
    }
  }
}

export const hotmartClient = new HotmartClient()
