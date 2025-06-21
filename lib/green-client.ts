interface GreenPaymentData {
  amount: number
  currency: string
  description: string
  customer: {
    name: string
    email: string
    document?: string
    phone?: string
  }
  payment_method: string
  success_url?: string
  cancel_url?: string
  webhook_url?: string
  metadata?: Record<string, any>
}

interface GreenPaymentResponse {
  id: string
  status: string
  amount: number
  currency: string
  checkout_url?: string
  pix?: {
    qr_code: string
    qr_code_base64: string
    expires_at: string
  }
  boleto?: {
    url: string
    barcode: string
    expires_at: string
  }
}

class GreenClient {
  private apiKey: string
  private apiUrl: string
  private environment: string

  constructor() {
    this.apiKey = process.env.GREEN_API_KEY || ""
    this.apiUrl = process.env.GREEN_API_URL || "https://api.green.com.br/v1"
    this.environment = process.env.GREEN_ENVIRONMENT || "sandbox"

    if (!this.apiKey) {
      throw new Error("GREEN_API_KEY não configurada")
    }
  }

  async createPayment(data: GreenPaymentData): Promise<GreenPaymentResponse> {
    try {
      console.log("🔄 Criando pagamento Green:", {
        amount: data.amount,
        method: data.payment_method,
        customer: data.customer.email,
      })

      const response = await fetch(`${this.apiUrl}/payments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "iArtigo/1.0",
        },
        body: JSON.stringify({
          ...data,
          environment: this.environment,
          // Adicionar campos específicos do Green
          notification_url: data.webhook_url,
          return_url: data.success_url,
          cancel_return_url: data.cancel_url,
        }),
      })

      const responseText = await response.text()
      console.log("📥 Resposta Green (raw):", responseText)

      if (!response.ok) {
        console.error("❌ Erro Green API:", {
          status: response.status,
          statusText: response.statusText,
          body: responseText,
        })

        // Tentar parsear erro
        try {
          const errorData = JSON.parse(responseText)
          throw new Error(errorData.message || `Erro Green API: ${response.status}`)
        } catch {
          throw new Error(`Erro Green API: ${response.status} - ${responseText}`)
        }
      }

      const result = JSON.parse(responseText)
      console.log("✅ Pagamento criado:", result.id)

      return result
    } catch (error) {
      console.error("💥 Erro ao criar pagamento:", error)
      throw error
    }
  }

  async getPayment(paymentId: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Erro ao buscar pagamento: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Erro ao buscar pagamento:", error)
      throw error
    }
  }

  async cancelPayment(paymentId: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/payments/${paymentId}/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Erro ao cancelar pagamento: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Erro ao cancelar pagamento:", error)
      throw error
    }
  }
}

export const greenClient = new GreenClient()
