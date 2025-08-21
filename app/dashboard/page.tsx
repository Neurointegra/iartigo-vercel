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

interface Author {
  id: string
  name: string
  institution: string
  email: string
  department: string
  city: string
  country: string
}

interface LiteratureSuggestion {
  title: string
  authors: string
  journal: string
  year: number
  doi: string
  abstract: string
  relevance: string
  citation: string
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

  const loadUserArticles = async () => {
    try {
      // Carregar requests de artigos da IA
      const requestsResponse = await fetch(`/api/external-articles?userId=${user?.id}`)
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json()
        setArticleRequests(requestsData.requests || [])
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
        a.download = `${title}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast({
          title: "Download iniciado!",
          description: "O artigo foi baixado com sucesso.",
          variant: "default",
        })

        // Recarregar lista para atualizar status
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
                    {user?.subscriptionStatus === 'active' ? (
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
                        <Link href="/plans">
                          <Button size="sm" variant="outline" className="w-full">
                            Alterar Plano
                          </Button>
                        </Link>
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
                        <Link href="/plans">
                          <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                            Escolher Plano
                          </Button>
                        </Link>
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
                    {user?.subscriptionStatus === 'active' ? (
                      // Usuário tem plano ativo
                      user?.articlesLimit ? (
                        // Plano com limite mensal
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl font-bold text-blue-600">
                              {(user.articlesLimit - user.articlesUsed) || 0}
                            </span>
                            <span className="text-sm text-gray-500">restantes</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ 
                                width: `${user.articlesLimit ? (user.articlesUsed / user.articlesLimit) * 100 : 0}%` 
                              }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {user.articlesUsed} de {user.articlesLimit} usados este mês
                          </p>
                        </div>
                      ) : (
                        // Plano ilimitado
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl font-bold text-purple-600">∞</span>
                            <span className="text-sm text-gray-500">ilimitado</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Gere quantos artigos precisar
                          </p>
                        </div>
                      )
                    ) : (
                      // Usuário não tem plano ativo
                      <div className="text-center py-4">
                        <div className="text-2xl font-bold text-gray-400 mb-2">0</div>
                        <p className="text-sm text-gray-500">
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
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Artigos criados</span>
                      <span className="font-semibold">{user?.articlesUsed || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Último acesso</span>
                      <span className="font-semibold text-sm">
                        {user?.lastLoginAt ? 
                          new Date(user.lastLoginAt).toLocaleDateString('pt-BR') : 
                          'Hoje'
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Membro desde</span>
                      <span className="font-semibold text-sm">
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
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Ações Rápidas
                      </CardTitle>
                      <CardDescription>Crie e edite artigos científicos profissionais</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                        <div className="relative">
                          <Button 
                            className={`h-24 flex-col gap-2 w-full ${
                              user?.subscriptionStatus === 'active' 
                                ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800" 
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                            size="lg"
                            onClick={() => {
                              if (user?.subscriptionStatus === 'active') {
                                router.push('/new-generator')
                              } else {
                                router.push('/plans')
                              }
                            }}
                          >
                            <Sparkles className="h-6 w-6" />
                            <span>IA IArtigo</span>
                            <span className="text-xs opacity-75">
                              {user?.subscriptionStatus === 'active' ? 'Gerador avançado' : 'Requer plano ativo'}
                            </span>
                          </Button>
                          {user?.subscriptionStatus === 'active' ? (
                            <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-900 border-yellow-400">
                              Disponível
                            </Badge>
                          ) : (
                            <Badge className="absolute -top-2 -right-2 bg-red-500 text-red-100 border-red-400">
                              Bloqueado
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
