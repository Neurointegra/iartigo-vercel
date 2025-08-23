"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { API_CONFIG, apiRequest } from './api-config'

interface User {
  id: string
  email: string
  username: string
  first_name: string
  last_name: string
  ssn: string
  institution?: string
  position?: string
  date_joined?: string
  last_login?: string
  is_active?: boolean
  // Campos para compatibilidade com código existente
  name?: string // Campo calculado: first_name + last_name
  cpf?: string // Alias para ssn
  // Campos para controle de assinatura (se implementados)
  plan?: string
  planType?: string
  creditsRemaining?: number
  articlesLimit?: number | null
  articlesUsed?: number
  isEmailVerified?: boolean
  // Campos para controle de assinatura Asaas
  subscriptionId?: string
  subscriptionStatus?: string
  subscriptionExpiresAt?: string
  subscriptionPaidAt?: string
  createdAt?: string
  updatedAt?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  refreshUser: () => Promise<void>
  getToken: () => string | null
}

interface RegisterData {
  email: string
  password: string
  name: string
  cpf: string
  institution?: string
  department?: string
  role?: string
  area?: string
  plan?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Verificar se usuário está logado ao carregar a página
  useEffect(() => {
    setIsHydrated(true)
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Verificar se há um token JWT armazenado
      const token = localStorage.getItem('jwt_token')
      console.log('checkAuth - Token encontrado:', token ? 'SIM' : 'NÃO')
      console.log('checkAuth - Token length:', token?.length || 0)
      console.log('checkAuth - Token valor:', token)
      
      if (!token) {
        console.log('checkAuth - Nenhum token encontrado, usuário não autenticado')
        setUser(null)
        setIsAuthenticated(false)
        setIsLoading(false)
        return
      }

      console.log('checkAuth - Fazendo requisição para obter perfil do usuário...')
      const data = await apiRequest(API_CONFIG.ENDPOINTS.AUTH.PROFILE, {}, token)
      console.log('checkAuth - Dados do usuário recebidos:', data)
      
      // Mapear dados da API Python para a interface User
      const userData: User = {
        ...data,
        // Campos de compatibilidade
        name: `${data.first_name} ${data.last_name}`.trim(),
        cpf: data.ssn,
        // Campos padrão se não existirem
        plan: data.plan || null,
        planType: data.planType || null,
        creditsRemaining: data.creditsRemaining || 0,
        articlesLimit: data.articlesLimit || 0,
        articlesUsed: data.articlesUsed || 0,
        isEmailVerified: data.isEmailVerified || true,
        createdAt: data.createdAt || data.date_joined || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      }
      
      console.log('checkAuth - Dados mapeados do usuário:', userData)
      setUser(userData)
      setIsAuthenticated(true)
      console.log('checkAuth - Usuário autenticado e dados carregados')
    } catch (error) {
      console.error('Error checking auth:', error)
      setUser(null)
      setIsAuthenticated(false)
      localStorage.removeItem('jwt_token')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const data = await apiRequest(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      // Armazenar token JWT
      if (data.access) {
        console.log('Token recebido:', data.access)
        console.log('Token length:', data.access.length)
        localStorage.setItem('jwt_token', data.access)
        
        // Verificar se foi salvo
        const savedToken = localStorage.getItem('jwt_token')
        console.log('Token salvo no localStorage:', savedToken ? 'SIM' : 'NÃO')
        console.log('Token salvo length:', savedToken?.length || 0)
        
        // Mapear dados da API Python para a interface User
        const userData: User = {
          ...data.user,
          // Campos de compatibilidade
          name: `${data.user.first_name} ${data.user.last_name}`.trim(),
          cpf: data.user.ssn,
          // Campos padrão se não existirem
          plan: data.user.plan || null,
          planType: data.user.planType || null,
          creditsRemaining: data.user.creditsRemaining || 0,
          articlesLimit: data.user.articlesLimit || 0,
          articlesUsed: data.user.articlesUsed || 0,
          isEmailVerified: data.user.isEmailVerified || true,
          createdAt: data.user.createdAt || data.user.date_joined || new Date().toISOString(),
          updatedAt: data.user.updatedAt || new Date().toISOString(),
        }
        
        console.log('Login - Dados mapeados do usuário:', userData)
        setUser(userData)
        setIsAuthenticated(true)
        return { success: true }
      } else {
        return { success: false, error: 'Token de acesso não recebido' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Erro de conexão' }
    }
  }

  const register = async (data: RegisterData) => {
    try {
      // Converter dados para o formato esperado pela API Python
      const apiData = {
        username: data.email.split('@')[0], // Usar parte do email como username
        email: data.email,
        password: data.password,
        password_confirm: data.password, // API espera password_confirm
        first_name: data.name.split(' ')[0] || data.name,
        last_name: data.name.split(' ').slice(1).join(' ') || '',
        ssn: data.cpf.replace(/\D/g, ''), // Remove formatação do CPF
        institution: data.institution || 'Não informado',
        position: data.role || 'Estudante',
      }

      // Validar campos obrigatórios
      if (!apiData.username || !apiData.email || !apiData.password || !apiData.password_confirm || !apiData.first_name || !apiData.ssn) {
        return { success: false, error: 'Todos os campos obrigatórios devem ser preenchidos' }
      }

      console.log('Dados sendo enviados para registro:', apiData)

      const result = await apiRequest(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        body: JSON.stringify(apiData),
      })

      console.log('Resposta do registro:', result)

      // Fazer login automático após registro
      if (result.id) {
        console.log('Registro bem-sucedido, fazendo login automático...')
        
        // Fazer login para obter o token JWT
        const loginResult = await login(data.email, data.password)
        
        if (loginResult.success) {
          // Aguardar um pouco para garantir que o token foi salvo
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Carregar dados do usuário
          await checkAuth()
          
          return { success: true, message: 'Usuário registrado e logado com sucesso' }
        } else {
          return loginResult
        }
      } else {
        return { success: false, error: 'Erro no registro' }
      }
    } catch (error) {
      console.error('Register error:', error)
      
      // Capturar detalhes específicos do erro da API
      if (error instanceof Error) {
        // Tentar extrair detalhes do erro da API
        try {
          const errorMessage = error.message
          if (errorMessage.includes('password_confirm')) {
            return { success: false, error: 'Campo de confirmação de senha é obrigatório' }
          }
          if (errorMessage.includes('400')) {
            return { success: false, error: 'Dados inválidos enviados para a API' }
          }
          return { success: false, error: errorMessage }
        } catch (parseError) {
          return { success: false, error: 'Erro de conexão com a API' }
        }
      }
      
      return { success: false, error: 'Erro de conexão' }
    }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem('jwt_token')
      if (token) {
        await apiRequest(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
          method: 'POST',
        }, token)
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('jwt_token')
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  const refreshUser = async () => {
    await checkAuth()
  }

  const getToken = () => {
    return localStorage.getItem('jwt_token')
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading: isLoading || !isHydrated,
      isAuthenticated,
      login,
      logout,
      register,
      refreshUser,
      getToken,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
