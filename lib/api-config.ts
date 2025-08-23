// Configuração centralizada para a API Python
export const API_CONFIG = {
  // URL base da API Python (deve ser configurada no .env)
  BASE_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
  
  // Headers padrão para todas as requisições
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
  
  // Endpoints da API
  ENDPOINTS: {
    // Autenticação
    AUTH: {
      LOGIN: '/auth/login/',
      REGISTER: '/auth/register/',
      REFRESH: '/auth/refresh/',
      LOGOUT: '/auth/logout/',
      PROFILE: '/auth/profile/',
      UPDATE_PROFILE: '/auth/update-profile/',
    },
    
    // Usuários
    USERS: {
      LIST: '/users/',
      DETAIL: (id: string) => `/users/${id}/`,
      ME: '/users/me/',
      UPDATE_ME: '/users/me/',
    },
    
    // Planos
    PLANS: {
      LIST: '/plans/',
      POPULAR: '/plans/popular/',
      BY_TYPE: (type: string) => `/plans/by-type/?type=${type}`,
      DETAIL: (id: string) => `/plans/${id}/`,
    },
    
    // Assinaturas
    SUBSCRIPTIONS: {
      CREATE: '/subscriptions/',
      MY_SUBSCRIPTION: '/subscriptions/my-subscription/',
      HISTORY: '/subscriptions/history/',
      CANCEL: (id: string) => `/subscriptions/${id}/cancel/`,
      CHANGE_PLAN: (id: string) => `/subscriptions/${id}/change-plan/`,
      PAUSE: (id: string) => `/subscriptions/${id}/pause/`,
      RESUME: (id: string) => `/subscriptions/${id}/resume/`,
    },
    
    // Pagamentos
    PAYMENTS: {
      LIST: '/payments/',
      MY_PAYMENTS: '/payments/my-payments/',
      OVERDUE: '/payments/overdue/',
      CREATE_PAYMENT_LINK: '/payments/create_payment_link/',
    },
    
    // Geração de Artigos
    ARTICLE_GENERATIONS: {
      CREATE: '/article-generations/',
      MY_GENERATIONS: '/article-generations/my_generations/',
      PENDING: '/article-generations/pending/',
      COMPLETED: '/article-generations/completed/',
      CHECK_STATUS: (id: string) => `/article-generations/${id}/check_status/`,
      CANCEL: (id: string) => `/article-generations/${id}/cancel/`,
      DOWNLOAD: (id: string) => `/article-generations/${id}/download/`,
      BULK_CHECK_STATUS: '/article-generations/bulk_check_status/',
    },
    
    // Webhooks
    WEBHOOKS: {
      ASAAS: '/webhooks/asaas/',
    },
  },
}

// Função helper para criar headers com autenticação
export function createAuthHeaders(token?: string) {
  // Debug: verificar se o token está sendo lido
  console.log('createAuthHeaders chamado com token:', token ? 'SIM' : 'NÃO')
  
  const headers: Record<string, string> = {
    ...API_CONFIG.DEFAULT_HEADERS,
  }
  
  if (token) {
    console.log('Token JWT fornecido, adicionando Authorization')
    headers['Authorization'] = `Bearer ${token}`
  } else {
    console.log('Nenhum token fornecido, headers sem autenticação')
  }
  
  console.log('Headers finais:', headers)
  return headers
}

// Função helper para fazer requisições para a API
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  token?: string
) {
  const url = `${API_CONFIG.BASE_URL}/api${endpoint}`
  const headers = createAuthHeaders(token)
  
  console.log('Fazendo requisição para:', url)
  console.log('Headers:', headers)
  console.log('Options:', options)
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  })
  
  console.log('Status da resposta:', response.status)
  console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()))
  
  if (!response.ok) {
    let errorData: any = {}
    try {
      errorData = await response.json()
      console.log('Erro da API:', errorData)
    } catch (parseError) {
      console.log('Não foi possível parsear o erro da API')
    }
    
    // Criar mensagem de erro mais detalhada
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`
    
    if (errorData.detail) {
      errorMessage = errorData.detail
    } else if (errorData.error) {
      errorMessage = errorData.error
    } else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
      // Para erros de validação do Django, mostrar o primeiro erro
      const firstError = Object.values(errorData)[0]
      if (Array.isArray(firstError) && firstError.length > 0) {
        errorMessage = firstError[0]
      } else if (typeof firstError === 'string') {
        errorMessage = firstError
      }
    }
    
    throw new Error(errorMessage)
  }
  
  const responseData = await response.json()
  console.log('Resposta da API:', responseData)
  return responseData
}
