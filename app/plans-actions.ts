"use server"

import { buildApiUrl, getAuthHeaders } from "./config"

// ============================================================================
// INTERFACES
// ============================================================================

export interface Plan {
  id: number
  name: string
  plan_type: string
  description: string
  monthly_price: string
  articles_per_month: number
  is_popular: boolean
  is_active: boolean
  features: string[]
  articles_display: string
  is_unlimited: boolean
}

export interface Subscription {
  id: number
  user: number
  plan: Plan
  status: string
  start_date: string
  end_date: string
  next_due_date: string
  auto_renew: boolean
  articles_used_this_month: number
  asaas_customer_id: string
  asaas_subscription_id: string
}

export interface SubscriptionHistory {
  id: number
  plan: {
    id: number
    name: string
  }
  status: string
  start_date: string
  end_date: string
  created_at: string
}

export interface Payment {
  id: number
  asaas_payment_id: string
  user: number
  subscription: number
  amount: string
  payment_method: string
  status: string
  due_date: string
  payment_date?: string
  description: string
}

export interface PaymentLinkRequest {
  amount: string
  description: string
  payment_method: string
  due_date: string
}

export interface PaymentLinkResponse {
  message: string
  payment: {
    id: number
    asaas_payment_id: string
    amount: string
    payment_method: string
    due_date: string
    description: string
    status: string
    payment_url: string
    barcode?: string
    pix_code?: string
  }
}

// ============================================================================
// FUNÇÕES DE PLANOS
// ============================================================================

export async function getPlans(authToken?: string): Promise<Plan[]> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    // Se há token, adicionar autenticação
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }

    const response = await fetch(buildApiUrl('/plans/'), {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error(`Erro ao buscar planos: ${response.status}`)
    }

    const data = await response.json()
    
    // Garantir que a resposta seja um array
    if (!Array.isArray(data)) {
      console.error('Formato inválido de resposta da API:', data)
      return []
    }
    
    return data
  } catch (error) {
    console.error('Erro ao buscar planos:', error)
    throw error
  }
}

export async function getPopularPlans(authToken?: string): Promise<Plan[]> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    // Se há token, adicionar autenticação
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }

    const response = await fetch(buildApiUrl('/plans/popular/'), {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error(`Erro ao buscar planos populares: ${response.status}`)
    }

    const data = await response.json()
    
    // Garantir que a resposta seja um array
    if (!Array.isArray(data)) {
      console.error('Formato inválido de resposta da API:', data)
      return []
    }
    
    return data
  } catch (error) {
    console.error('Erro ao buscar planos populares:', error)
    throw error
  }
}

export async function getPlansByType(planType: string, authToken?: string): Promise<Plan[]> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    // Se há token, adicionar autenticação
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }

    const response = await fetch(buildApiUrl(`/plans/type/${planType}/`), {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error(`Erro ao buscar planos por tipo: ${response.status}`)
    }

    const data = await response.json()
    
    // Garantir que a resposta seja um array
    if (!Array.isArray(data)) {
      console.error('Formato inválido de resposta da API:', data)
      return []
    }
    
    return data
  } catch (error) {
    console.error('Erro ao buscar planos por tipo:', error)
    throw error
  }
}

export async function getPlanById(planId: number, authToken?: string): Promise<Plan> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    // Se há token, adicionar autenticação
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }

    const response = await fetch(buildApiUrl(`/plans/${planId}/`), {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error(`Erro ao buscar plano: ${response.status}`)
    }

    const data = await response.json()
    
    // Garantir que a resposta seja um objeto válido
    if (!data || typeof data !== 'object') {
      console.error('Formato inválido de resposta da API:', data)
      throw new Error('Formato de resposta inválido')
    }
    
    return data
  } catch (error) {
    console.error('Erro ao buscar plano:', error)
    throw error
  }
}

// ============================================================================
// FUNÇÕES DE ASSINATURAS
// ============================================================================

export async function createSubscription(planId: number, autoRenew: boolean = true, authToken: string): Promise<Subscription> {
  try {
    const response = await fetch(buildApiUrl('/subscriptions/'), {
      method: 'POST',
      headers: getAuthHeaders(authToken),
      body: JSON.stringify({
        plan: planId,
        auto_renew: autoRenew
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Erro ao criar assinatura: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao criar assinatura:', error)
    throw error
  }
}

export async function getMySubscription(authToken: string): Promise<Subscription | null> {
  try {
    const response = await fetch(buildApiUrl('/subscriptions/my-subscription/'), {
      method: 'GET',
      headers: getAuthHeaders(authToken),
    })

    if (response.status === 404) {
      return null // Usuário não tem assinatura
    }

    if (!response.ok) {
      throw new Error(`Erro ao buscar assinatura: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error)
    throw error
  }
}

export async function getSubscriptionHistory(authToken: string): Promise<SubscriptionHistory[]> {
  try {
    const response = await fetch(buildApiUrl('/subscriptions/history/'), {
      method: 'GET',
      headers: getAuthHeaders(authToken),
    })

    if (!response.ok) {
      throw new Error(`Erro ao buscar histórico: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao buscar histórico de assinaturas:', error)
    throw error
  }
}

export async function cancelSubscription(subscriptionId: number, reason: string = '', immediate: boolean = false, authToken: string): Promise<{ message: string; subscription: Subscription }> {
  try {
    const response = await fetch(buildApiUrl(`/subscriptions/${subscriptionId}/cancel/`), {
      method: 'POST',
      headers: getAuthHeaders(authToken),
      body: JSON.stringify({
        reason,
        immediate
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Erro ao cancelar assinatura: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error)
    throw error
  }
}

export async function changePlan(subscriptionId: number, newPlanId: number, authToken: string): Promise<{ message: string; subscription: Subscription }> {
  try {
    const response = await fetch(buildApiUrl(`/subscriptions/${subscriptionId}/change-plan/`), {
      method: 'POST',
      headers: getAuthHeaders(authToken),
      body: JSON.stringify({
        new_plan_id: newPlanId
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Erro ao alterar plano: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao alterar plano:', error)
    throw error
  }
}

export async function pauseSubscription(subscriptionId: number, authToken: string): Promise<{ message: string; subscription: Subscription }> {
  try {
    const response = await fetch(buildApiUrl(`/subscriptions/${subscriptionId}/pause/`), {
      method: 'POST',
      headers: getAuthHeaders(authToken),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Erro ao pausar assinatura: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao pausar assinatura:', error)
    throw error
  }
}

export async function resumeSubscription(subscriptionId: number, authToken: string): Promise<{ message: string; subscription: Subscription }> {
  try {
    const response = await fetch(buildApiUrl(`/subscriptions/${subscriptionId}/resume/`), {
      method: 'POST',
      headers: getAuthHeaders(authToken),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Erro ao retomar assinatura: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao retomar assinatura:', error)
    throw error
  }
}

// ============================================================================
// FUNÇÕES DE PAGAMENTOS
// ============================================================================

export async function getMyPayments(authToken: string): Promise<Payment[]> {
  try {
    const response = await fetch(buildApiUrl('/payments/my-payments/'), {
      method: 'GET',
      headers: getAuthHeaders(authToken),
    })

    if (!response.ok) {
      throw new Error(`Erro ao buscar pagamentos: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error)
    throw error
  }
}

export async function getOverduePayments(authToken: string): Promise<Payment[]> {
  try {
    const response = await fetch(buildApiUrl('/payments/overdue/'), {
      method: 'GET',
      headers: getAuthHeaders(authToken),
    })

    if (!response.ok) {
      throw new Error(`Erro ao buscar pagamentos em atraso: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao buscar pagamentos em atraso:', error)
    throw error
  }
}

export async function createPaymentLink(paymentData: PaymentLinkRequest, authToken: string): Promise<PaymentLinkResponse> {
  try {
    const response = await fetch(buildApiUrl('/payments/create-payment-link/'), {
      method: 'POST',
      headers: getAuthHeaders(authToken),
      body: JSON.stringify(paymentData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Erro ao criar link de pagamento: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao criar link de pagamento:', error)
    throw error
  }
}
