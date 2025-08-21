"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Upload,
  Download,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

interface ArticleRequest {
  requestId: number
  localId: string
  status: string
  title: string
  createdAt: string
}

export default function NewGeneratorPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentRequest, setCurrentRequest] = useState<ArticleRequest | null>(null)
  const [statusMessage, setStatusMessage] = useState("")
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  
  const [formData, setFormData] = useState({
    title: "",
    resume: "",
    keywords: "",
    introduction: "",
    articleType: "",
    justification: "",
    objective: "",
    literatureReview: "",
    methodology: "",
    discussion: "",
    conclusion: "",
  })
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const processFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const newFiles = Array.from(files)
      setUploadedFiles(prev => [...prev, ...newFiles])
      
      toast({
        title: "Arquivos carregados",
        description: `${newFiles.length} arquivo(s) adicionado(s)`,
        variant: "default",
      })
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha o título do artigo.",
        variant: "destructive",
      })
      return false
    }
    
    if (!user?.cpf || !user.cpf.trim()) {
      toast({
        title: "CPF necessário",
        description: "Por favor, complete seu CPF no perfil para gerar artigos.",
        variant: "destructive",
      })
      return false
    }

    if (!formData.justification.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha a justificativa da pesquisa.",
        variant: "destructive",
      })
      return false
    }

    if (!formData.objective.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha o objetivo da pesquisa.",
        variant: "destructive",
      })
      return false
    }
    
    return true
  }

  const startStatusPolling = (requestId: number) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/external-articles/${requestId}`, {
          method: 'GET',
        })

        if (response.ok) {
          // Verificar se é um arquivo (artigo pronto)
          const contentType = response.headers.get('content-type')
          if (contentType && !contentType.includes('application/json')) {
            // É um arquivo - parar polling e fazer download
            clearInterval(interval)
            setPollingInterval(null)
            setIsGenerating(false)
            setStatusMessage("Artigo concluído! Fazendo download...")

            // Fazer download do arquivo
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `artigo-${requestId}.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            toast({
              title: "Artigo pronto!",
              description: "O download foi iniciado automaticamente.",
              variant: "default",
            })

            // Limpar estado após sucesso
            setTimeout(() => {
              setCurrentRequest(null)
              setStatusMessage("")
            }, 3000)

            return
          }

          // É uma resposta JSON de status
          const data = await response.json()
          if (data.success && data.data.status) {
            setStatusMessage(data.data.status)
            
            // Se erro, parar polling
            if (data.data.status === 'Erro') {
              clearInterval(interval)
              setPollingInterval(null)
              setIsGenerating(false)
              
              toast({
                title: "Erro na geração",
                description: "Ocorreu um erro durante a geração do artigo.",
                variant: "destructive",
              })
            }
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error)
      }
    }, 5000) // Verificar a cada 5 segundos

    setPollingInterval(interval)
  }

  const handleGenerateArticle = async () => {
    if (!validateForm()) return
    
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para gerar artigos",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setStatusMessage("Iniciando geração...")
    
    try {
      // Preparar FormData
      const formDataToSend = new FormData()
      
      // Campos obrigatórios
      formDataToSend.append('userId', user.id)
      formDataToSend.append('authorSSN', user.cpf || '')
      formDataToSend.append('title', formData.title)
      formDataToSend.append('justification', formData.justification)
      formDataToSend.append('objective', formData.objective)
      
      // Campos opcionais
      if (formData.resume) formDataToSend.append('resume', formData.resume)
      if (formData.keywords) formDataToSend.append('keywords', formData.keywords)
      if (formData.introduction) formDataToSend.append('introduction', formData.introduction)
      if (formData.articleType) formDataToSend.append('articleType', formData.articleType)
      if (formData.literatureReview) formDataToSend.append('literatureReview', formData.literatureReview)
      if (formData.methodology) formDataToSend.append('methodology', formData.methodology)
      if (formData.discussion) formDataToSend.append('discussion', formData.discussion)
      if (formData.conclusion) formDataToSend.append('conclusion', formData.conclusion)
      
      // Arquivos
      uploadedFiles.forEach((file) => {
        formDataToSend.append('files', file)
      })

      // Chamar API
      const response = await fetch('/api/external-articles/create', {
        method: 'POST',
        body: formDataToSend,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro na geração do artigo')
      }

      const result = await response.json()
      
      if (result.success) {
        setCurrentRequest({
          requestId: result.data.requestId,
          localId: result.data.localId,
          status: result.data.status,
          title: result.data.title,
          createdAt: result.data.createdAt,
        })

        setStatusMessage("Artigo enviado para geração...")
        
        // Iniciar polling para verificar status
        startStatusPolling(result.data.requestId)

        toast({
          title: "Artigo enviado para geração!",
          description: "Acompanhe o progresso abaixo. O processo pode levar alguns minutos.",
          variant: "default",
        })
      } else {
        throw new Error('Resposta inesperada da API')
      }

    } catch (error) {
      console.error('Erro ao gerar artigo:', error)
      setIsGenerating(false)
      setStatusMessage("")
      
      toast({
        title: "Erro na geração",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      })
    }
  }

  const handleCancelGeneration = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
    setIsGenerating(false)
    setCurrentRequest(null)
    setStatusMessage("")
    
    toast({
      title: "Geração cancelada",
      description: "O monitoramento foi interrompido.",
      variant: "default",
    })
  }

  const getStatusIcon = () => {
    if (!statusMessage) return null
    
    if (statusMessage.includes('Erro')) {
      return <AlertCircle className="h-5 w-5 text-red-500" />
    } else if (statusMessage.includes('concluído')) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    } else {
      return <Clock className="h-5 w-5 text-blue-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">IA</span>
                </div>
                <span className="text-xl font-bold text-gray-900">iArtigo - Gerador Avançado</span>
              </div>
            </div>
            <Badge variant="secondary">Nova API</Badge>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerador de Artigos Avançado</h1>
          <p className="text-gray-600">Crie artigos científicos profissionais com nossa nova API de inteligência artificial</p>
        </div>

        {/* Status da geração */}
        {isGenerating && currentRequest && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                Gerando Artigo
              </CardTitle>
              <CardDescription>
                Request ID: {currentRequest.requestId} | Título: {currentRequest.title}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                {getStatusIcon()}
                <span className="text-sm font-medium">{statusMessage || "Processando..."}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Progress value={undefined} className="w-full" />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelGeneration}
                >
                  Cancelar Monitoramento
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                A geração pode levar alguns minutos. O download será iniciado automaticamente quando concluído.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informações do Artigo
              </CardTitle>
              <CardDescription>
                Preencha as informações básicas do seu artigo científico
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Título do Artigo *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Impacto da IA na Educação"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div>
                <Label htmlFor="justification">Justificativa da Pesquisa *</Label>
                <Textarea
                  id="justification"
                  placeholder="Justifique a importância e relevância da sua pesquisa..."
                  value={formData.justification}
                  onChange={(e) => handleInputChange('justification', e.target.value)}
                  rows={3}
                  disabled={isGenerating}
                />
              </div>

              <div>
                <Label htmlFor="objective">Objetivo da Pesquisa *</Label>
                <Textarea
                  id="objective"
                  placeholder="Descreva o objetivo principal da sua pesquisa..."
                  value={formData.objective}
                  onChange={(e) => handleInputChange('objective', e.target.value)}
                  rows={3}
                  disabled={isGenerating}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="keywords">Palavras-chave</Label>
                  <Input
                    id="keywords"
                    placeholder="Ex: IA, Educação, Tecnologia"
                    value={formData.keywords}
                    onChange={(e) => handleInputChange('keywords', e.target.value)}
                    disabled={isGenerating}
                  />
                </div>

                <div>
                  <Label htmlFor="articleType">Tipo de Artigo</Label>
                  <Input
                    id="articleType"
                    placeholder="Ex: Artigo Científico, Revisão"
                    value={formData.articleType}
                    onChange={(e) => handleInputChange('articleType', e.target.value)}
                    disabled={isGenerating}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seções Opcionais */}
          <Card>
            <CardHeader>
              <CardTitle>Seções Opcionais</CardTitle>
              <CardDescription>
                Preencha as seções que você já tem ou deixe em branco para a IA gerar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="resume">Resumo</Label>
                <Textarea
                  id="resume"
                  placeholder="Resumo do artigo (opcional)"
                  value={formData.resume}
                  onChange={(e) => handleInputChange('resume', e.target.value)}
                  rows={3}
                  disabled={isGenerating}
                />
              </div>

              <div>
                <Label htmlFor="introduction">Introdução</Label>
                <Textarea
                  id="introduction"
                  placeholder="Introdução do artigo (opcional)"
                  value={formData.introduction}
                  onChange={(e) => handleInputChange('introduction', e.target.value)}
                  rows={3}
                  disabled={isGenerating}
                />
              </div>

              <div>
                <Label htmlFor="methodology">Metodologia</Label>
                <Textarea
                  id="methodology"
                  placeholder="Metodologia utilizada (opcional)"
                  value={formData.methodology}
                  onChange={(e) => handleInputChange('methodology', e.target.value)}
                  rows={3}
                  disabled={isGenerating}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discussion">Discussão</Label>
                  <Textarea
                    id="discussion"
                    placeholder="Discussão dos resultados (opcional)"
                    value={formData.discussion}
                    onChange={(e) => handleInputChange('discussion', e.target.value)}
                    rows={3}
                    disabled={isGenerating}
                  />
                </div>

                <div>
                  <Label htmlFor="conclusion">Conclusão</Label>
                  <Textarea
                    id="conclusion"
                    placeholder="Conclusão do artigo (opcional)"
                    value={formData.conclusion}
                    onChange={(e) => handleInputChange('conclusion', e.target.value)}
                    rows={3}
                    disabled={isGenerating}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload de Arquivos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Arquivos de Dados
              </CardTitle>
              <CardDescription>
                Adicione arquivos CSV, TXT ou XLS para análise de dados pela IA (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={handleFileUpload}
                      disabled={isGenerating}
                    >
                      Selecionar Arquivos
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Formatos aceitos: CSV, TXT, XLS
                  </p>
                </div>
              </div>

              {/* Lista de arquivos carregados */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label>Arquivos Carregados:</Label>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{file.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {(file.size / 1024).toFixed(1)} KB
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        disabled={isGenerating}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botão de Geração */}
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={handleGenerateArticle}
                disabled={isGenerating}
                className="w-full h-12 text-lg"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Gerando Artigo...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Gerar Artigo com Nova API
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Input oculto para upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt,.xls,.xlsx"
          multiple
          onChange={processFileUpload}
          className="hidden"
        />
      </div>
    </div>
  )
}
