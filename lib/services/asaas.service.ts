const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3'
const ASAAS_API_KEY = "$aact_hmlg_" + process.env.ASAAS_API_KEY || ''

interface AsaasCustomer {
  id?: string
  name: string
  email: string
  cpfCnpj?: string
  phone?: string
  mobilePhone?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  city?: string
  state?: string
  postalCode?: string
}

interface AsaasPayment {
  id?: string
  customer: string
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED'
  value: number
  dueDate: string
  description?: string
  externalReference?: string
  installmentCount?: number
  installmentValue?: number
}

interface AsaasSubscription {
  id?: string
  customer: string
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX'
  value: number
  nextDueDate: string
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'
  description?: string
  externalReference?: string
}

export class AsaasService {
  private static async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any) {
    // Debug: verificar se as variáveis estão sendo carregadas
    console.log('🔍 Debug AsaasService:')
    console.log('ASAAS_API_URL:', ASAAS_API_URL)
    console.log('ASAAS_API_KEY:', ASAAS_API_KEY ? `${ASAAS_API_KEY.substring(0, 20)}...` : 'NÃO DEFINIDA')
    console.log('process.env.ASAAS_API_KEY existe?', !!process.env.ASAAS_API_KEY)
    console.log('process.env.ASAAS_API_KEY valor:', process.env.ASAAS_API_KEY ? `${process.env.ASAAS_API_KEY.substring(0, 20)}...` : 'NÃO DEFINIDA')
    console.log('process.env.ASAAS_TOKEN existe?', !!process.env.ASAAS_TOKEN)
    console.log('process.env.ASAAS_TOKEN valor:', process.env.ASAAS_TOKEN ? `${process.env.ASAAS_TOKEN.substring(0, 20)}...` : 'NÃO DEFINIDA')
    console.log('Todas as variáveis process.env:', Object.keys(process.env).filter(key => key.includes('ASAAS')))
    
    const response = await fetch(`${ASAAS_API_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY,
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Asaas API Error: ${response.status} - ${errorData}`)
    }

    return await response.json()
  }

  // Criar ou atualizar cliente
  static async createOrUpdateCustomer(customerData: AsaasCustomer): Promise<any> {
    // Verificar se cliente já existe pelo email
    const existingCustomers = await this.makeRequest(`/customers?email=${customerData.email}`)
    
    if (existingCustomers.data && existingCustomers.data.length > 0) {
      // Cliente existe, atualizar
      const customerId = existingCustomers.data[0].id
      return await this.makeRequest(`/customers/${customerId}`, 'PUT', customerData)
    } else {
      // Criar novo cliente
      return await this.makeRequest('/customers', 'POST', customerData)
    }
  }

  // Criar cliente (alias para createOrUpdateCustomer)
  static async createCustomer(customerData: AsaasCustomer): Promise<any> {
    return await this.createOrUpdateCustomer(customerData)
  }

  // Criar cobrança única
  static async createPayment(paymentData: AsaasPayment): Promise<any> {
    return await this.makeRequest('/payments', 'POST', paymentData)
  }

  // Criar assinatura recorrente
  static async createSubscription(subscriptionData: AsaasSubscription): Promise<any> {
    return await this.makeRequest('/subscriptions', 'POST', subscriptionData)
  }

  // Gerar link de pagamento direto
  static async generatePaymentLink(paymentData: AsaasPayment): Promise<any> {
    const payment = await this.makeRequest('/payments', 'POST', paymentData)
    
    // O pagamento criado já deve ter uma URL de checkout
    // Vamos verificar todos os campos possíveis
    const paymentUrl = payment.invoiceUrl || payment.url || payment.checkoutUrl || payment.paymentUrl || ''
    
    console.log('🔍 Campos do pagamento para URL:', {
      invoiceUrl: payment.invoiceUrl,
      url: payment.url,
      checkoutUrl: payment.checkoutUrl,
      paymentUrl: payment.paymentUrl,
      finalUrl: paymentUrl
    })
    
    return {
      ...payment,
      paymentUrl: paymentUrl,
    }
  }

  // Buscar status de pagamento
  static async getPaymentStatus(paymentId: string): Promise<any> {
    return await this.makeRequest(`/payments/${paymentId}`)
  }

  // Buscar status de assinatura
  static async getSubscriptionStatus(subscriptionId: string): Promise<any> {
    return await this.makeRequest(`/subscriptions/${subscriptionId}`)
  }

  // Cancelar assinatura
  static async cancelSubscription(subscriptionId: string): Promise<any> {
    return await this.makeRequest(`/subscriptions/${subscriptionId}`, 'DELETE')
  }

  // Gerar link de pagamento
  static async createPaymentLink(paymentData: Partial<AsaasPayment> & { 
    name: string
    description: string
    endDate?: string
    maxInstallmentCount?: number
  }): Promise<any> {
    return await this.makeRequest('/paymentLinks', 'POST', paymentData)
  }

  // Webhook: validar assinatura
  static validateWebhookSignature(payload: string, signature: string): boolean {
    return process.env.ASAAS_WEBHOOK_TOKEN == signature
  }

  // Processar evento de webhook
  static async processWebhookEvent(eventType: string, eventData: any) {
    switch (eventType) {
      case 'PAYMENT_RECEIVED':
        return await this.handlePaymentReceived(eventData)
      case 'PAYMENT_OVERDUE':
        return await this.handlePaymentOverdue(eventData)
      case 'PAYMENT_DELETED':
        return await this.handlePaymentDeleted(eventData)
      default:
        console.log(`Evento Asaas não tratado: ${eventType}`)
        return { status: 'ignored', event: eventType }
    }
  }

  private static async handlePaymentReceived(paymentData: any) {
    // Implementar lógica quando pagamento é confirmado
    console.log('Pagamento confirmado:', paymentData.payment.id)
    return {
      status: 'processed',
      action: 'payment_confirmed',
      paymentId: paymentData.payment.id
    }
  }

  private static async handlePaymentOverdue(paymentData: any) {
    // Implementar lógica quando pagamento está em atraso
    console.log('Pagamento em atraso:', paymentData.payment.id)
    return {
      status: 'processed', 
      action: 'payment_overdue',
      paymentId: paymentData.payment.id
    }
  }

  private static async handlePaymentDeleted(paymentData: any) {
    // Implementar lógica quando pagamento é cancelado
    console.log('Pagamento cancelado:', paymentData.payment.id)
    return {
      status: 'processed',
      action: 'payment_cancelled', 
      paymentId: paymentData.payment.id
    }
  }
}
