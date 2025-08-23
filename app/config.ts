// Configurações da aplicação
export const config = {
  // URLs da API
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
  apiBaseUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api`,
  
  // Configurações de autenticação
  auth: {
    tokenKey: 'iartigo_token',
    refreshTokenKey: 'iartigo_refresh_token',
  },
  
  // Configurações de pagamento
  payment: {
    asaasApiUrl: process.env.NEXT_PUBLIC_ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3',
    asaasAccessToken: process.env.NEXT_PUBLIC_ASAAS_ACCESS_TOKEN,
  },
  
  // Configurações de geração de artigos
  articleGeneration: {
    pollingInterval: 5000, // 5 segundos
    maxRetries: 3,
    timeout: 300000, // 5 minutos
  },
  
  // Configurações de UI
  ui: {
    toastDuration: 5000,
    loadingDelay: 1000,
  }
}

// Função para construir URLs da API
export const buildApiUrl = (endpoint: string): string => {
  return `${config.apiBaseUrl}${endpoint}`
}

// Função para obter headers de autenticação
export const getAuthHeaders = (token: string): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

// Função para validar token
export const isValidToken = (token: string | null): boolean => {
  if (!token) return false
  
  try {
    // Verificar se o token não está expirado (implementar lógica de expiração se necessário)
    return token.length > 10
  } catch {
    return false
  }
}
