"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
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
} from "lucide-react"
import { generateArticle, suggestLiterature } from "../actions"
import Link from "next/link"

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
  status: "completed" | "generating" | "draft"
  createdAt: string
  wordCount: number
  journal: string
}

export default function DashboardPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingLiterature, setIsLoadingLiterature] = useState(false)
  const [generatedArticle, setGeneratedArticle] = useState("")
  const [literatureSuggestions, setLiteratureSuggestions] = useState<LiteratureSuggestion[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
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

  // Dados simulados do usuário - atualizar baseado no plano
  const user = {
    name: "Dr. Maria Silva",
    email: "maria.silva@universidade.edu.br",
    institution: "Universidade Federal do Brasil",
    plan: "Profissional", // ou "Por Artigo" ou "Institucional"
    planType: "monthly", // "per-article", "monthly", "annual"
    articlesUsed: 3,
    articlesLimit: 5, // null para ilimitado
    creditsRemaining: 0, // para plano por artigo
    avatar: "/placeholder.svg?height=40&width=40&text=MS",
  }

  // Artigos recentes simulados
  const recentArticles: RecentArticle[] = [
    {
      id: "1",
      title: "Análise Comparativa de Algoritmos de Machine Learning para Classificação de Dados Médicos",
      status: "completed",
      createdAt: "2024-01-15",
      wordCount: 4500,
      journal: "Nature Medicine",
    },
    {
      id: "2",
      title: "Impacto da Inteligência Artificial na Educação Superior",
      status: "generating",
      createdAt: "2024-01-14",
      wordCount: 0,
      journal: "IEEE Transactions",
    },
    {
      id: "3",
      title: "Metodologias Ágeis em Projetos de Pesquisa Científica",
      status: "draft",
      createdAt: "2024-01-13",
      wordCount: 2300,
      journal: "Science",
    },
  ]

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
      alert("Por favor, preencha a área de estudo e palavras-chave primeiro.")
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
      default:
        return "Desconhecido"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
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
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.plan}</p>
                </div>
                <Avatar>
                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                  <AvatarFallback>MS</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
        >
          <div className="flex flex-col h-full pt-16 lg:pt-0">
            <div className="flex-1 flex flex-col min-h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center gap-3 px-4 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">IA</span>
                </div>
                <span className="text-lg font-bold text-gray-900">iArtigo</span>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                <a
                  href="#"
                  className="bg-blue-50 text-blue-700 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                >
                  <Sparkles className="text-blue-500 mr-3 h-5 w-5" />
                  Novo Artigo
                </a>
                <a
                  href="#"
                  className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                >
                  <History className="text-gray-400 mr-3 h-5 w-5" />
                  Meus Artigos
                </a>
                <a
                  href="#"
                  className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                >
                  <Book className="text-gray-400 mr-3 h-5 w-5" />
                  Literatura
                </a>
                <a
                  href="#"
                  className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                >
                  <BarChart3 className="text-gray-400 mr-3 h-5 w-5" />
                  Estatísticas
                </a>
                <a
                  href="#"
                  className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                >
                  <Settings className="text-gray-400 mr-3 h-5 w-5" />
                  Configurações
                </a>
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback>MS</AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{user.name}</p>
                      <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">{user.institution}</p>
                    </div>
                  </div>
                  <Link href="/">
                    <Button variant="ghost" size="sm">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:pl-0">
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
                    <span>Plano {user.plan}</span>
                    {user.planType === "per-article" ? (
                      <Badge variant="secondary">{user.creditsRemaining} créditos restantes</Badge>
                    ) : user.articlesLimit ? (
                      <Badge variant="secondary">
                        {user.articlesUsed}/{user.articlesLimit} artigos
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Artigos Ilimitados
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user.planType === "per-article" ? (
                    <>
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">
                          Você tem {user.creditsRemaining} créditos para gerar artigos.
                        </p>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          Comprar Mais Créditos
                        </Button>
                      </div>
                    </>
                  ) : user.articlesLimit ? (
                    <>
                      <Progress value={(user.articlesUsed / user.articlesLimit) * 100} className="mb-2" />
                      <p className="text-sm text-gray-600">
                        Você usou {user.articlesUsed} de {user.articlesLimit} artigos este mês.{" "}
                        <Link href="/upgrade" className="text-blue-600 hover:text-blue-700">
                          Fazer upgrade
                        </Link>
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-green-600 mb-2">
                        <CheckCircle className="h-8 w-8 mx-auto" />
                      </div>
                      <p className="text-sm text-gray-600">Plano Institucional - Artigos ilimitados para sua equipe</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Quick Actions */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Ações Rápidas
                      </CardTitle>
                      <CardDescription>Comece um novo artigo ou continue um existente</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button className="h-24 flex-col gap-2" size="lg">
                          <Plus className="h-6 w-6" />
                          <span>Novo Artigo</span>
                          <span className="text-xs opacity-75">Começar do zero</span>
                        </Button>
                        <Button variant="outline" className="h-24 flex-col gap-2" size="lg">
                          <Search className="h-6 w-6" />
                          <span>Buscar Literatura</span>
                          <span className="text-xs opacity-75">Encontrar referências</span>
                        </Button>
                        <Button variant="outline" className="h-24 flex-col gap-2" size="lg">
                          <FileText className="h-6 w-6" />
                          <span>Templates</span>
                          <span className="text-xs opacity-75">Usar modelo pronto</span>
                        </Button>
                        <Button variant="outline" className="h-24 flex-col gap-2" size="lg">
                          <BarChart3 className="h-6 w-6" />
                          <span>Análise de Dados</span>
                          <span className="text-xs opacity-75">Gerar gráficos</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Articles */}
                  <Card className="mt-8">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <History className="h-5 w-5" />
                          Artigos Recentes
                        </span>
                        <Button variant="ghost" size="sm">
                          Ver todos
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentArticles.map((article) => (
                          <div key={article.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 mb-1">{article.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(article.createdAt).toLocaleDateString("pt-BR")}
                                </span>
                                <span>{article.wordCount > 0 ? `${article.wordCount} palavras` : "—"}</span>
                                <span>{article.journal}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={getStatusColor(article.status)}>{getStatusText(article.status)}</Badge>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                  {/* Tips Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5" />
                        Dicas de Hoje
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-1">Palavras-chave eficazes</h4>
                          <p className="text-sm text-blue-700">
                            Use 3-5 palavras-chave específicas para obter melhores sugestões de literatura.
                          </p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <h4 className="font-medium text-green-900 mb-1">Formatação automática</h4>
                          <p className="text-sm text-green-700">
                            Escolha a revista alvo antes de gerar para formatação otimizada.
                          </p>
                        </div>
                      </div>
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
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Plano atual</span>
                          <Badge>{user.plan}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Próxima cobrança</span>
                          <span className="text-sm font-medium">15/02/2024</span>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Gerenciar Plano
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
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
