"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/date-utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  FileText,
  BarChart3,
  Sparkles,
  LogOut,
  CreditCard,
  Calendar,
  Download,
  RefreshCw,
} from "lucide-react"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { PlansButton } from "@/components/PlansButton"

interface Author {
  id: string
  name: string
  institution: string
  email: string
  department: string
  city: string
  country: string
}



interface RecentArticle {
  id: string
  title: string
  status: "completed" | "generating" | "draft" | "outline" | "review" | "published"
  createdAt: string
  wordCount: number
  journal: string
}

export default function DashboardPage() {
  // Sempre chamar hooks de autenticação primeiro
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Estados locais - todos devem ser declarados antes de qualquer early return
  const [articleRequests, setArticleRequests] = useState<any[]>([])
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false)
  const [completedArticlesCount, setCompletedArticlesCount] = useState<number>(0)
  const [authors, setAuthors] = useState<Author[]>([
    {
      id: "1",
      name: "",
      institution: "",
      email: "",
      department: "",
      city: "",
      country: "Brasil",
    },
  ])
  const [formData, setFormData] = useState({
    title: "",
    abstract: "",
    keywords: "",
    citationStyle: "",
    targetJournal: "",
    fieldOfStudy: "",
    methodology: "",
    includeCharts: true,
    includeTables: false,
    researchObjectives: "",
    hypothesis: "",
    sampleSize: "",
    dataCollection: "",
    statisticalAnalysis: "",
  })

  // Redirecionar se não estiver logado
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  // Carregar artigos do usuário
  useEffect(() => {
    if (user) {
      loadUserArticles()
    }
  }, [user])

  // Preencher dados do usuário no primeiro autor quando disponível
  useEffect(() => {
    if (user && authors.length > 0 && !authors[0].name) {
      setAuthors(prevAuthors => [
        {
          ...prevAuthors[0],
          name: user.name || "",
          institution: user.institution || "",
          email: user.email || "",
          department: user.department || "",
          city: user.city || "",
          country: user.country || "Brasil",
        },
        ...prevAuthors.slice(1)
      ])
    }
  }, [user, authors.length])

  // Função para calcular artigos concluídos com sucesso
  const calculateCompletedArticles = (requests: any[]) => {
    const completed = requests.filter((request: any) => 
      request.status === 'completed' || 
      request.status === 'success' ||
      (request.statusMessage && request.statusMessage.toLowerCase().includes('concluído'))
    ).length
    
    setCompletedArticlesCount(completed)
    return completed
  }

  // Função para calcular artigos restantes
  const getRemainingArticles = () => {
    // Se não há plano ativo, retornar 0
    if (!user?.plan) return 0
    
    // Se não há limite definido, retornar null (ilimitado)
    if (!user?.articlesLimit) return null
    
    // Garantir que completedArticlesCount seja um número válido
    const completed = typeof completedArticlesCount === 'number' ? completedArticlesCount : 0
    const limit = typeof user.articlesLimit === 'number' ? user.articlesLimit : 0
    
    const remaining = Math.max(0, limit - completed)
    
    return remaining
  }

  // Função para verificar se o usuário pode gerar artigos
  const canGenerateArticles = () => {
    console.log('🔍 canGenerateArticles - Início:', {
      userPlan: user?.plan,
      userArticlesLimit: user?.articlesLimit,
      subscriptionStatus: user?.subscriptionStatus,
      completedArticlesCount,
      userObject: user
    })
    
    // BLOQUEAR se não há plano ativo
    if (!user?.plan) {
      console.log('❌ canGenerateArticles - Bloqueado: sem plano ativo')
      return false
    }

    // BLOQUEAR se o pagamento estiver vencido ou atrasado
    if (user?.subscriptionStatus === 'overdue' || user?.subscriptionStatus === 'expired') {
      console.log('❌ canGenerateArticles - Bloqueado por pagamento vencido:', user.subscriptionStatus)
      return false
    }

    // BLOQUEAR se a assinatura estiver inativa ou pendente por muito tempo
    if (user?.subscriptionStatus === 'inactive' || user?.subscriptionStatus === 'pending') {
      console.log('❌ canGenerateArticles - Bloqueado por assinatura inativa:', user.subscriptionStatus)
      return false
    }
    
    // Se for plano ilimitado, sempre pode gerar (desde que não esteja bloqueado por status)
    if (!user.articlesLimit || user.articlesLimit === 0) {
      return true
    }
    
    // Se for plano com limite, verificar se ainda tem artigos disponíveis
    const remainingArticles = getRemainingArticles()
    return remainingArticles !== null && remainingArticles > 0
  }



  // Função para limpar título para uso como nome de arquivo
  const cleanFileName = (title: string) => {
    return title
      .replace(/[^\w\s-]/g, '') // Remove caracteres especiais exceto hífen
      .replace(/\s+/g, '_') // Substitui espaços por underscore
      .replace(/_+/g, '_') // Remove underscores duplicados
      .trim()
  }

  const loadUserArticles = async () => {
    try {
      // Carregar requests de artigos da IA
      const requestsResponse = await fetch(`/api/external-articles?userId=${user?.id}`)
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json()
        const requests = requestsData.requests || []
        
        setArticleRequests(requests)
        
        // Calcular artigos concluídos
        const completed = calculateCompletedArticles(requests)
        
        // Verificar se há algum artigo sendo gerado
        const hasGeneratingArticle = requests.some((request: any) => 
          request.status === 'processing' || 
          request.status === 'pending' ||
          request.status === 'generating' ||
          (request.statusMessage && request.statusMessage.toLowerCase().includes('gerando'))
        )
        setIsGeneratingArticle(hasGeneratingArticle)
      }
    } catch (error) {
      console.error('Error loading articles:', error)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "generating":
        return "bg-blue-100 text-blue-800"
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      case "outline":
        return "bg-purple-100 text-purple-800"
      case "review":
        return "bg-orange-100 text-orange-800"
      case "published":
        return "bg-emerald-100 text-emerald-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Concluído"
      case "generating":
        return "Gerando..."
      case "draft":
        return "Rascunho"
      case "outline":
        return "Esboço"
      case "review":
        return "Em Revisão"
      case "published":
        return "Publicado"
      default:
        return "Desconhecido"
    }
  }



  // Função para fazer download ou verificar status do artigo
  const handleDownloadArticle = async (articleRequestId: string, title: string) => {
    try {
      toast({
        title: "Verificando artigo...",
        description: "Aguarde enquanto verificamos o status do artigo.",
        variant: "default",
      })

      const response = await fetch(`/api/external-articles/download/${articleRequestId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao verificar artigo')
      }

      // Verificar se é um arquivo (download direto)
      const contentType = response.headers.get('content-type')
      if (contentType && !contentType.includes('application/json')) {
        // É um arquivo - fazer download
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        // Usar o título limpo para o nome do arquivo
        const cleanTitle = cleanFileName(title)
        a.download = `${cleanTitle}.docx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        toast({
          title: "Download iniciado!",
          description: "O artigo foi baixado com sucesso.",
          variant: "default",
        })

        // Recarregar lista para atualizar status e contagem
        loadUserArticles()
        return
      }

      // É uma resposta JSON - artigo ainda sendo gerado
      const data = await response.json()
      if (data.success && !data.isReady) {
        if (data.data.status === 'Erro') {
      toast({
            title: "Erro na geração",
            description: "Ocorreu um erro durante a geração do artigo.",
        variant: "destructive",
      })
        } else {
        toast({
            title: "Artigo sendo gerado",
            description: `Status: ${data.data.statusMessage || data.data.status}. Tente novamente em alguns minutos.`,
          variant: "default",
        })
        }
        
        // Recarregar lista para atualizar status e verificar se ainda está gerando
        loadUserArticles()
      }
    } catch (error) {
      console.error('Erro ao baixar artigo:', error)
      toast({
        title: "Erro no download",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">IA</span>
                </div>
                <span className="text-xl font-bold text-gray-900 hidden sm:block">iArtigo</span>
              </Link>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name || "Usuário"}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Dashboard Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Bem-vindo de volta! Gerencie seus artigos científicos e acompanhe seu progresso.
                </p>
              </div>

            {/* Plan and Usage Information */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Current Plan */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Plano Atual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {user?.plan ? (
                      // Usuário tem plano ativo
                      <>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-lg">{user?.plan}</span>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Ativo
                          </Badge>
                        </div>
                        {user?.subscriptionExpiresAt && (
                          <p className="text-sm text-gray-600">
                            Válido até: {new Date(user.subscriptionExpiresAt).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                        <div className="space-y-2">
                          <PlansButton size="sm" variant="outline" className="w-full" />
                        </div>
                      </>
                    ) : (
                      // Usuário não tem plano ativo
                      <>
                        <div className="text-center py-4">
                          <p className="font-semibold text-lg text-gray-600">Nenhum plano ativo</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Assine um plano para começar a gerar artigos
                          </p>
                        </div>
                        <PlansButton 
                          size="sm" 
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          Escolher Plano
                        </PlansButton>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Articles Usage */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Artigos Disponíveis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {user?.plan ? (
                      // Usuário tem plano ativo
                      user?.articlesLimit && user.articlesLimit > 0 ? (
                        // Plano com limite mensal
                        <div>
                          {(() => {
                            const remaining = getRemainingArticles()
                            const hasRemaining = remaining !== null && remaining > 0
                            const usagePercentage = user.articlesLimit ? Math.min(100, (completedArticlesCount / user.articlesLimit) * 100) : 0
                            
                            return (
                              <>
                                <div className="flex items-center justify-between mb-3">
                                  <span className={`text-3xl font-bold ${
                                    hasRemaining ? 'text-blue-600' : 'text-red-600'
                                  }`}>
                                    {remaining}
                                  </span>
                                  <span className="text-sm text-gray-600 font-medium">restantes</span>
                                </div>
                                
                                {/* Barra de progresso */}
                                <div className="w-full bg-gray-100 rounded-full h-3 mb-3 overflow-hidden">
                                  <div 
                                    className={`h-3 rounded-full transition-all duration-300 ${
                                      hasRemaining ? 'bg-blue-500' : 'bg-red-500'
                                    }`}
                                    style={{ 
                                      width: `${usagePercentage}%` 
                                    }}
                                  ></div>
                                </div>
                                
                                {/* Informações de uso */}
                                <div className="space-y-1">
                                  <p className={`text-sm ${
                                    hasRemaining ? 'text-gray-600' : 'text-red-600 font-medium'
                                  }`}>
                                    {completedArticlesCount} de {user.articlesLimit} usados este mês
                                  </p>
                                  {!hasRemaining && (
                                    <p className="text-sm text-red-600 font-medium bg-red-50 px-2 py-1 rounded">
                                      ⚠️ Limite atingido!
                                    </p>
                                  )}
                                </div>
                              </>
                            )
                          })()}
                        </div>
                      ) : (
                        // Plano ilimitado (apenas se articlesLimit for null ou 0)
                        <div className="text-center py-2">
                          <div className="flex items-center justify-center mb-3">
                            <span className="text-4xl font-bold text-purple-600">∞</span>
                          </div>
                          <span className="text-sm text-gray-500 font-medium">ilimitado</span>
                          <p className="text-sm text-gray-600 mt-2">
                            Gere quantos artigos precisar
                          </p>
                        </div>
                      )
                    ) : (
                      // Usuário não tem plano ativo
                      <div className="text-center py-4">
                        <div className="text-3xl font-bold text-gray-400 mb-2">0</div>
                        <p className="text-sm text-gray-500 font-medium">
                          Nenhum artigo disponível
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Assine um plano para começar
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Estatísticas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm text-gray-700 font-medium">Artigos concluídos</span>
                      <span className="font-bold text-blue-600 text-lg">{completedArticlesCount}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <span className="text-sm text-gray-700 font-medium">Em geração</span>
                      <span className="font-bold text-orange-600 text-lg">
                        {isGeneratingArticle ? '1' : '0'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-gray-700 font-medium">Último acesso</span>
                      <span className="font-semibold text-sm text-gray-800">
                        {user?.lastLoginAt ? 
                          new Date(user.lastLoginAt).toLocaleDateString('pt-BR') : 
                          'Hoje'
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm text-gray-700 font-medium">Membro desde</span>
                      <span className="font-semibold text-sm text-gray-800">
                        {user?.createdAt ? 
                          new Date(user.createdAt).toLocaleDateString('pt-BR') : 
                          'Recente'
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

                {/* Quick Actions */}
                  <div className="space-y-8">
                    {/* Aviso quando há artigo sendo gerado ou limite atingido */}
                    {(isGeneratingArticle || !canGenerateArticles()) && (
                      <Card className={`${isGeneratingArticle ? 'border-orange-300 bg-orange-50' : 'border-red-300 bg-red-50'} shadow-sm`}>
                        <CardContent className="pt-6">
                          <div className={`flex items-center gap-4 ${isGeneratingArticle ? 'text-orange-800' : 'text-red-800'}`}>
                            {isGeneratingArticle ? (
                              <>
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 flex-shrink-0"></div>
                                <div className="flex-1">
                                  <p className="font-semibold text-lg mb-1">Artigo em geração</p>
                                  <p className="text-sm opacity-90">Aguarde a conclusão do artigo atual para criar um novo</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-xs font-bold">!</span>
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-lg mb-1">Limite de artigos atingido</p>
                                  <p className="text-sm opacity-90">Você não tem mais artigos disponíveis neste mês</p>
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5" />
                          Ações Rápidas
                      </CardTitle>
                        <CardDescription>
                          {isGeneratingArticle 
                            ? "Gerador bloqueado durante a geração de artigo" 
                            : !canGenerateArticles()
                              ? "Limite de artigos atingido - Renove seu plano para continuar"
                              : "Crie e edite artigos científicos profissionais"
                          }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                        <div className="relative">
                        <Button 
                            className={`h-24 flex-col gap-2 w-full ${
                              canGenerateArticles() && !isGeneratingArticle
                                ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" 
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                          size="lg"
                            disabled={!canGenerateArticles() || isGeneratingArticle}
                            onClick={() => {
                              if (canGenerateArticles() && !isGeneratingArticle) {
                                router.push('/generator')
                              } else if (isGeneratingArticle) {
                                toast({
                                  title: "Artigo em geração",
                                  description: "Aguarde a conclusão do artigo atual para criar um novo.",
                                  variant: "destructive",
                                })
                              } else if (!canGenerateArticles()) {
                                // Verificar o motivo específico do bloqueio
                                if (user?.subscriptionStatus === 'overdue' || user?.subscriptionStatus === 'expired') {
                                  toast({
                                    title: "Pagamento vencido",
                                    description: "Sua assinatura está com pagamento vencido. Regularize para continuar usando o gerador.",
                                    variant: "destructive",
                                  })
                                } else if (user?.subscriptionStatus === 'inactive' || user?.subscriptionStatus === 'pending') {
                                  toast({
                                    title: "Assinatura inativa",
                                    description: "Sua assinatura não está ativa. Verifique o status do pagamento.",
                                    variant: "destructive",
                                  })
                                } else {
                                  toast({
                                    title: "Limite de artigos atingido",
                                    description: "Você não tem mais artigos disponíveis neste mês. Renove seu plano ou aguarde o próximo ciclo.",
                                    variant: "destructive",
                                  })
                                }
                              } else {
                                router.push(user?.plan ? '/plans/manage' : '/plans')
                              }
                            }}
                          >
                            <Sparkles className="h-6 w-6" />
                            <span>IA IArtigo</span>
                            <span className="text-xs opacity-75">
                              {isGeneratingArticle 
                                ? 'Artigo em geração' 
                                : !canGenerateArticles()
                                  ? 'Limite atingido'
                                  : 'Gerador avançado'
                              }
                            </span>
                        </Button>
                          {(!canGenerateArticles() || isGeneratingArticle) && (
                            <Badge className={`absolute -top-2 -right-2 ${
                              isGeneratingArticle 
                                ? 'bg-orange-500 text-orange-100 border-orange-400' 
                                : !canGenerateArticles()
                                  ? 'bg-red-500 text-red-100 border-red-400'
                                  : 'bg-red-500 text-red-100 border-red-400'
                            }`}>
                              {isGeneratingArticle ? 'Gerando' : 
                               user?.subscriptionStatus === 'overdue' || user?.subscriptionStatus === 'expired' ? 'Vencido' :
                               user?.subscriptionStatus === 'inactive' || user?.subscriptionStatus === 'pending' ? 'Inativo' :
                               'Bloqueado'}
                            </Badge>
                          )}
                        </div>

                        <Button 
                          variant="outline" 
                          className="h-24 flex-col gap-2 opacity-50 cursor-not-allowed" 
                          size="lg"
                          disabled
                        >
                          <FileText className="h-6 w-6" />
                          <span>Editor com IA</span>
                          <span className="text-xs opacity-75">Em desenvolvimento</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Articles - IA IArtigo */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5" />
                          IA IArtigo
                        </span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {articleRequests.length} {articleRequests.length === 1 ? 'artigo' : 'artigos'}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {articleRequests.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhum artigo gerado ainda</p>
                            <p className="text-sm">Use o botão "IA IArtigo" para criar seu primeiro artigo</p>
                          </div>
                        ) : (
                          articleRequests.map((request) => (
                              <div
                              key={request.id} 
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex-1">
                                <h3 className="font-medium text-gray-900 mb-1">{request.title}</h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                    {formatDate(request.createdAt)}
                                    </span>

                                  <span>Status: {request.statusMessage || request.status}</span>
                                </div>
                              </div>
                        <div className="flex items-center gap-3">
                                <Badge className={
                                  request.status === 'completed' ? "bg-green-100 text-green-800" :
                                  request.status === 'error' ? "bg-red-100 text-red-800" :
                                  request.status === 'processing' ? "bg-blue-100 text-blue-800" :
                                  "bg-yellow-100 text-yellow-800"
                                }>
                                  {request.status === 'completed' ? 'Pronto' :
                                   request.status === 'error' ? 'Erro' :
                                   request.status === 'processing' ? 'Gerando' :
                                   'Pendente'}
                                </Badge>
                        <Button 
                          variant="outline" 
                          size="sm" 
                                  onClick={() => handleDownloadArticle(request.id, request.title)}
                                  className="flex items-center gap-1"
                                >
                                  {request.status === 'completed' ? (
                                    <Download className="h-4 w-4" />
                                  ) : (
                                    <RefreshCw className="h-4 w-4" />
                                  )}
                                  {request.status === 'completed' ? 'Download' : 'Verificar'}
                        </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
              </div>
            </div>
          </div>
        </main>
    </div>
  )
}
