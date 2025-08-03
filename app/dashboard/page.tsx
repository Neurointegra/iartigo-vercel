"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  FileText,
  Eye,
  Settings,
  BarChart3,
  Sparkles,
  Plus,
  Users,
  Search,
  Book,
  ExternalLink,
  Bell,
  Menu,
  LogOut,
  User,
  CreditCard,
  HelpCircle,
  History,
  Star,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  Trash2,
} from "lucide-react"
import { generateArticle, suggestLiterature } from "../actions"
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
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingLiterature, setIsLoadingLiterature] = useState(false)
  const [generatedArticle, setGeneratedArticle] = useState("")
  const [literatureSuggestions, setLiteratureSuggestions] = useState<LiteratureSuggestion[]>([])
  const [recentArticles, setRecentArticles] = useState<RecentArticle[]>([])
  const [quickPrompt, setQuickPrompt] = useState("")
  const [isQuickGenerating, setIsQuickGenerating] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [articleToDelete, setArticleToDelete] = useState<{id: string, title: string} | null>(null)
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
    includeCharts: false,
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

  const loadUserArticles = async () => {
    try {
      const response = await fetch(`/api/articles?userId=${user?.id}&limit=5`)
      if (response.ok) {
        const data = await response.json()
        setRecentArticles(data.articles || [])
      }
    } catch (error) {
      console.error('Error loading articles:', error)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const handleQuickGenerate = async () => {
    if (!quickPrompt.trim()) {
      toast({
        title: "Descrição necessária",
        description: "Por favor, digite uma descrição para o artigo",
        variant: "destructive",
      })
      return
    }

    setIsQuickGenerating(true)
    try {
      // Dados básicos para geração rápida
      const articleData = {
        title: quickPrompt.slice(0, 100), // Usar o prompt como título inicial
        abstract: "",
        keywords: "",
        citationStyle: "ABNT",
        targetJournal: "",
        fieldOfStudy: "Geral",
        methodology: "Revisão de Literatura",
        includeCharts: false,
        includeTables: false,
        researchObjectives: quickPrompt,
        hypothesis: "",
        sampleSize: "",
        dataCollection: "",
        statisticalAnalysis: "",
        authors: [],
        literatureSuggestions: [],
        userId: user?.id
      }

      const content = await generateArticle(articleData)
      
      // Criar novo artigo no banco
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: quickPrompt.slice(0, 100),
          content: content,
          abstract: "",
          keywords: "",
          status: "draft",
          citationStyle: "ABNT",
          targetJournal: "",
          fieldOfStudy: "Geral",
          userId: user?.id
        }),
      })

      if (response.ok) {
        const newArticle = await response.json()
        // Redirecionar para visualizar o artigo criado
        router.push(`/article/${newArticle.id}`)
        setQuickPrompt("") // Limpar o campo
      } else {
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar o artigo",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao gerar artigo:', error)
      toast({
        title: "Erro na geração",
        description: "Erro ao gerar artigo. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsQuickGenerating(false)
    }
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

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const result = await generateArticle({ ...formData, authors, literatureSuggestions })
      setGeneratedArticle(result)
    } catch (error) {
      console.error("Erro ao gerar artigo:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSuggestLiterature = async () => {
    if (!formData.fieldOfStudy || !formData.keywords) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha a área de estudo e palavras-chave primeiro.",
        variant: "destructive",
      })
      return
    }

    setIsLoadingLiterature(true)
    try {
      const suggestions = await suggestLiterature({
        fieldOfStudy: formData.fieldOfStudy,
        keywords: formData.keywords,
        title: formData.title,
        abstract: formData.abstract,
      })
      setLiteratureSuggestions(suggestions)
    } catch (error) {
      console.error("Erro ao sugerir literatura:", error)
    } finally {
      setIsLoadingLiterature(false)
    }
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

  // Função para atualizar o status do artigo
  const updateArticleStatus = async (articleId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        // Atualizar a lista de artigos localmente
        setRecentArticles(prev => 
          prev.map(article => 
            article.id === articleId 
              ? { ...article, status: newStatus as RecentArticle['status'] }
              : article
          )
        )
        
        toast({
          title: "Status atualizado",
          description: `Artigo marcado como "${getStatusText(newStatus)}"`,
          variant: "default",
        })
      } else {
        toast({
          title: "Erro ao atualizar",
          description: "Não foi possível atualizar o status do artigo",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      })
    }
  }

  // Função para abrir o gerador avançado de artigos
  const handleAdvancedGenerator = () => {
    router.push('/generator')
  }

  // Função para criar um novo artigo simples (editor tradicional)
  const handleCreateSimpleArticle = async () => {
    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Novo Artigo',
          content: '',
          abstract: '',
          keywords: '',
          status: 'draft',
          citationStyle: 'ABNT',
          targetJournal: '',
          fieldOfStudy: '',
          userId: user?.id
        }),
      })

      if (response.ok) {
        const newArticle = await response.json()
        toast({
          title: "Artigo criado",
          description: "Redirecionando para o editor...",
          variant: "default",
        })
        // Redirecionar para a página do artigo
        router.push(`/article/${newArticle.id}`)
      } else {
        toast({
          title: "Erro ao criar artigo",
          description: "Não foi possível criar o novo artigo",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao criar artigo:', error)
      toast({
        title: "Erro ao criar artigo",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      })
    }
  }

  // Função para iniciar o processo de deletar um artigo
  const handleDeleteArticle = (articleId: string, articleTitle: string) => {
    setArticleToDelete({ id: articleId, title: articleTitle })
    setDeleteDialogOpen(true)
  }

  // Função para confirmar a deleção do artigo
  const confirmDeleteArticle = async () => {
    if (!articleToDelete) return

    try {
      const response = await fetch(`/api/articles/${articleToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remover o artigo da lista local
        setRecentArticles(prev => prev.filter(article => article.id !== articleToDelete.id))
        
        toast({
          title: "Artigo deletado",
          description: `O artigo "${articleToDelete.title}" foi removido com sucesso.`,
          variant: "default",
        })
      } else {
        toast({
          title: "Erro ao deletar",
          description: "Não foi possível deletar o artigo. Tente novamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao deletar artigo:', error)
      toast({
        title: "Erro ao deletar",
        description: "Ocorreu um erro inesperado ao deletar o artigo.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setArticleToDelete(null)
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
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name || "Usuário"}</p>
                  <p className="text-xs text-gray-500">Pesquisador</p>
                </div>
                <Avatar>
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>{user?.name?.split(' ').map(n => n[0]).join('') || 'U'}</AvatarFallback>
                </Avatar>
              </div>
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

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FileText className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Artigos Gerados</p>
                        <p className="text-2xl font-bold text-gray-900">12</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <TrendingUp className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Este Mês</p>
                        <p className="text-2xl font-bold text-gray-900">{user.articlesUsed}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Star className="h-8 w-8 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Qualidade Média</p>
                        <p className="text-2xl font-bold text-gray-900">9.2</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Clock className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Tempo Economizado</p>
                        <p className="text-2xl font-bold text-gray-900">48h</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Usage Progress */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Seu Plano</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Ativo
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Bem-vindo ao iArtigo! Você pode gerar artigos científicos de qualidade.
                    </p>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Ver Planos
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Quick AI Generator */}
                <div className="lg:col-span-3 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        Gerador Rápido de Artigo
                      </CardTitle>
                      <CardDescription>
                        Descreva o que você quer pesquisar e a IA criará um artigo científico completo
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Ex: Impactos da inteligência artificial na educação brasileira, métodos de análise de dados em saúde pública, sustentabilidade em empresas de tecnologia..."
                          value={quickPrompt}
                          onChange={(e) => setQuickPrompt(e.target.value)}
                          className="min-h-[100px] resize-none"
                        />
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-500">
                            {quickPrompt.length}/500 caracteres
                          </p>
                          <Button 
                            onClick={handleQuickGenerate}
                            disabled={isQuickGenerating || !quickPrompt.trim()}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            {isQuickGenerating ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Gerando...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Gerar Artigo com IA
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Ações Rápidas
                      </CardTitle>
                      <CardDescription>Comece a criação de um artigo científico com IA</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                          className="h-24 flex-col gap-2" 
                          size="lg"
                          onClick={handleAdvancedGenerator}
                        >
                          <Plus className="h-6 w-6" />
                          <span>Artigo Avançado</span>
                          <span className="text-xs opacity-75">IA para gerar artigos</span>
                        </Button>
                        <Button variant="outline" className="h-24 flex-col gap-2" size="lg">
                          <Search className="h-6 w-6" />
                          <span>Buscar Literatura</span>
                          <span className="text-xs opacity-75">Encontrar referências</span>
                        </Button>
                        <Button variant="outline" className="h-24 flex-col gap-2" size="lg">
                          <BarChart3 className="h-6 w-6" />
                          <span>Análise de Dados</span>
                          <span className="text-xs opacity-75">Gerar gráficos</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-24 flex-col gap-2" 
                          size="lg"
                          onClick={handleCreateSimpleArticle}
                        >
                          <FileText className="h-6 w-6" />
                          <span>Editor Simples</span>
                          <span className="text-xs opacity-75">Começar do zero</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Articles */}
                  <Card className="mt-8">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <History className="h-5 w-5" />
                          Artigos
                        </span>
                        <Button variant="ghost" size="sm">
                          Ver todos
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentArticles.map((article) => (
                          <div 
                            key={article.id} 
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => router.push(`/article/${article.id}`)}
                          >
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 mb-1">{article.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(article.createdAt)}
                                </span>
                                <span>{article.wordCount > 0 ? `${article.wordCount} palavras` : "—"}</span>
                                <span>{article.journal}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={getStatusColor(article.status)}>{getStatusText(article.status)}</Badge>
                              <Select
                                value={article.status}
                                onValueChange={(newStatus: 'draft' | 'outline' | 'completed' | 'generating' | 'review' | 'published') => 
                                  updateArticleStatus(article.id, newStatus)
                                }
                              >
                                <SelectTrigger 
                                  className="w-32"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="draft">Esboço</SelectItem>
                                  <SelectItem value="outline">Outline</SelectItem>
                                  <SelectItem value="completed">Completo</SelectItem>
                                  <SelectItem value="generating">Gerando</SelectItem>
                                  <SelectItem value="review">Revisão</SelectItem>
                                  <SelectItem value="published">Publicado</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/article/${article.id}`)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteArticle(article.id, article.title)
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Navigation Menu */}
                <div className="space-y-6">
                  {/* Menu de Navegação */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Menu className="h-5 w-5" />
                        Menu de Navegação
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <nav className="space-y-2">
                        <button
                          onClick={handleAdvancedGenerator}
                          className="w-full bg-blue-50 text-blue-700 group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-blue-100"
                        >
                          <Sparkles className="text-blue-500 mr-3 h-5 w-5" />
                          Artigo Avançado
                        </button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        >
                          <History className="text-gray-400 mr-3 h-5 w-5" />
                          Meus Artigos
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        >
                          <Book className="text-gray-400 mr-3 h-5 w-5" />
                          Literatura
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        >
                          <BarChart3 className="text-gray-400 mr-3 h-5 w-5" />
                          Estatísticas
                        </Button>
                      </nav>
                    </CardContent>
                  </Card>

                  {/* Account Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Minha Conta
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback>{user?.name?.split(' ').map(n => n[0]).join('') || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user?.name || "Usuário"}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Plano atual</span>
                          <Badge>Básico</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Próxima cobrança</span>
                          <span className="text-sm font-medium">15/02/2024</span>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Gerenciar Plano
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sair
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Support */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5" />
                        Precisa de Ajuda?
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Book className="h-4 w-4 mr-2" />
                          Central de Ajuda
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Tutoriais
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Users className="h-4 w-4 mr-2" />
                          Contato
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </main>

      {/* Dialog de confirmação de deleção */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Artigo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o artigo "{articleToDelete?.title}"? 
              Esta ação não pode ser desfeita e todos os dados do artigo serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteArticle}
              className="bg-red-600 hover:bg-red-700"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
