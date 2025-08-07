"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Upload,
  Download,
  Image as ImageIcon,
  FileSpreadsheet,
  Mail,
  Sparkles,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

interface FileUpload {
  file: File
  type: 'thesis' | 'data' | 'image'
  name: string
  size: string
  content?: string // Conteúdo do arquivo de texto ou URL da imagem
  imageUrl?: string // URL específica para imagens
  description?: string // Descrição manual da imagem fornecida pelo usuário
  needsDescription?: boolean // Indica se a imagem precisa de descrição
}

export default function GeneratorPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dataInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedContent, setGeneratedContent] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([])
  const [generationStep, setGenerationStep] = useState("")
  
  const [formData, setFormData] = useState({
    title: "",
    articleType: "",
    centralTheme: "",
    justification: "",
    objectives: "",
    keywords: "",
    transformThesis: false,
    hasCollectedData: false,
    hasImages: false,
  })

  const articleTypes = [
    "Artigo Científico",
    "Artigo de Revisão",
    "Estudo de Caso",
    "Pesquisa Experimental",
    "Pesquisa Qualitativa",
    "Pesquisa Quantitativa",
    "Meta-análise",
    "Revisão Sistemática",
  ]

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = (type: 'thesis' | 'data' | 'image') => {
    const input = type === 'thesis' ? fileInputRef.current : 
                  type === 'data' ? dataInputRef.current : 
                  imageInputRef.current
    
    if (input) {
      input.click()
    }
  }

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        resolve(content)
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file)
    })
  }

  const uploadImageFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Erro ao fazer upload da imagem')
    }

    const result = await response.json()
    return result.url // Retorna a URL pública da imagem
  }

  const processFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'thesis' | 'data' | 'image') => {
    const files = event.target.files
    if (files && files.length > 0) {
      const file = files[0]
      
      let fileContent: string | undefined = undefined
      
      // Processar conteúdo baseado no tipo
      if (type === 'image') {
        try {
          fileContent = await uploadImageFile(file)
          
        } catch (error) {
          toast({
            title: "Erro no upload",
            description: "Não foi possível fazer upload da imagem. Tente novamente.",
            variant: "destructive",
          })
          return
        }
      } else if (type === 'thesis' || type === 'data') {
        try {
          // Para arquivos de dados, sempre tentar ler o conteúdo como texto
          fileContent = await readFileContent(file)
        } catch (error) {
          // Erro silencioso, arquivo será enviado sem conteúdo
        }
      }
      
      const fileUpload: FileUpload = {
        file,
        type,
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        content: fileContent,
        imageUrl: type === 'image' ? fileContent : undefined,
        needsDescription: type === 'image' // Marcar imagens como precisando de descrição
      }
      
      setUploadedFiles(prev => [...prev, fileUpload])
      
      toast({
        title: "Arquivo carregado",
        description: `${file.name} foi carregado com sucesso.${
          type === 'image' ? ' Por favor, adicione uma descrição da imagem.' :
          fileContent ? ' Conteúdo processado e pronto para uso.' : ''
        }`,
        variant: "default",
      })
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const updateImageDescription = (index: number, description: string) => {
    setUploadedFiles(prev => 
      prev.map((file, i) => 
        i === index ? { ...file, description, needsDescription: false } : file
      )
    )
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
    
    if (!formData.articleType) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, selecione o tipo de artigo.",
        variant: "destructive",
      })
      return false
    }

    // Verificar se todas as imagens têm descrição
    const imagesWithoutDescription = uploadedFiles.filter(file => 
      file.type === 'image' && (!file.description || file.description.trim() === '')
    )
    
    if (imagesWithoutDescription.length > 0) {
      toast({
        title: "Descrições pendentes",
        description: `Por favor, adicione uma descrição para ${imagesWithoutDescription.length === 1 ? 'a imagem' : `as ${imagesWithoutDescription.length} imagens`} carregada(s).`,
        variant: "destructive",
      })
      return false
    }
    
    return true
  }

  const simulateProgress = () => {
    setGenerationProgress(0)
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval)
          return 95
        }
        return prev + Math.random() * 15
      })
    }, 500)
    return interval
  }

  const handleGenerateArticle = async () => {
    if (!validateForm()) return
    
    setIsGenerating(true)
    const progressInterval = simulateProgress()
    
    try {
      // Preparar dados dos arquivos enviados
      const filesData = uploadedFiles.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        fileName: file.file.name,
        content: file.type === 'image' ? file.imageUrl : file.content, // Para imagens, usar a URL
        imageUrl: file.imageUrl, // Incluir URL específica para imagens
        description: file.description // Incluir descrição visual das imagens
      }))

      // Preparar dados para envio
      const articleData = {
        title: formData.title,
        abstract: formData.centralTheme?.trim() || '',
        articleType: formData.articleType,
        keywords: formData.keywords,
        fieldOfStudy: "Geral",
        methodology: formData.justification,
        researchObjectives: formData.objectives,
        includeTables: formData.hasCollectedData,
        authors: user ? [{
          id: user.id,
          name: user.name || "",
          institution: user.institution || "",
          email: user.email || "",
          department: user.department || "",
          city: user.city || "",
          country: user.country || "Brasil",
        }] : [],
        literatureSuggestions: [],
        attachedFiles: filesData,
      }

      // Chamar API de geração
      const response = await fetch('/api/generate-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      })

      if (!response.ok) {
        throw new Error('Erro na geração do artigo')
      }

      const result = await response.json()
      
      clearInterval(progressInterval)
      setGenerationProgress(100)
      setGeneratedContent(result.content)

      // Processar conteúdo adicional
      let additionalContent = result.content;

      // Criar artigo no banco de dados
      if (!user?.id) {
        toast({
          title: "Erro de autenticação",
          description: "Usuário não autenticado. Faça login para salvar artigos.",
          variant: "destructive",
        })
        return;
      }

      const articleResponse = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          content: additionalContent,
          keywords: formData.keywords,
          status: 'draft',
          citationStyle: 'ABNT',
          targetJournal: '',
          fieldOfStudy: 'Geral',
          userId: user?.id
        }),
      })

      if (articleResponse.ok) {
        const newArticle = await articleResponse.json()
        
        toast({
          title: "Artigo criado com sucesso!",
          description: `Artigo gerado com formatação HTML/CSS${formData.hasImages ? ' e referências de imagens' : ''}. Redirecionando para o editor...`,
          variant: "default",
        })

        // Redirecionar para o editor do artigo após 2 segundos
        setTimeout(() => {
          router.push(`/article/${newArticle.id}`)
        }, 2000)
      } else {
        const errorData = await articleResponse.text()
        console.error('Erro ao salvar artigo:', {
          status: articleResponse.status,
          statusText: articleResponse.statusText,
          error: errorData
        });
        
        toast({
          title: "Artigo gerado, mas não salvo",
          description: `O conteúdo foi gerado, mas não foi possível salvar no banco. Erro: ${articleResponse.status}`,
          variant: "destructive",
        })
      }

    } catch (error) {
      console.error('Erro ao gerar artigo:', error)
      clearInterval(progressInterval)
      setGenerationProgress(0)
      
      toast({
        title: "Erro na geração",
        description: "Ocorreu um erro ao gerar o artigo. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
      setGenerationStep("")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">IA</span>
              </div>
              <span className="text-xl font-bold text-gray-900">iArtigo</span>
            </Link>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">Gerador de Artigos</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerador de Artigos iArtigo</h1>
          <p className="text-gray-600">Crie artigos científicos profissionais com inteligência artificial</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário Principal */}
          <div className="lg:col-span-2 space-y-6">
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
                  />
                </div>

                <div>
                  <Label htmlFor="articleType">Tipo de Artigo *</Label>
                  <Select value={formData.articleType} onValueChange={(value) => handleInputChange('articleType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de artigo" />
                    </SelectTrigger>
                    <SelectContent>
                      {articleTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="centralTheme">
                    Resumo Personalizado (Opcional)
                    <span className="text-sm text-gray-500 font-normal ml-2">
                      💡 Deixe vazio para gerar automaticamente com base no conteúdo final
                    </span>
                  </Label>
                  <Textarea
                    id="centralTheme"
                    placeholder="Deixe em branco para gerar automaticamente baseado no conteúdo do artigo, ou insira um resumo personalizado..."
                    value={formData.centralTheme}
                    onChange={(e) => handleInputChange('centralTheme', e.target.value)}
                    rows={3}
                    required={false}
                  />
                </div>

                <div>
                  <Label htmlFor="justification">Justificativa da Pesquisa</Label>
                  <Textarea
                    id="justification"
                    placeholder="Ex: A crescente adoção de tecnologias de IA na educação exige uma análise aprofundada de seus benefícios e desafios para otimizar a experiência de aprendizado."
                    value={formData.justification}
                    onChange={(e) => handleInputChange('justification', e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="objectives">Objetivos da Pesquisa</Label>
                  <Textarea
                    id="objectives"
                    placeholder="Ex: Objetivo geral: Analisar o impacto da IA na personalização. Objetivos específicos: 1. Identificar ferramentas de IA; 2. Avaliar a eficácia; 3. Propor diretrizes."
                    value={formData.objectives}
                    onChange={(e) => handleInputChange('objectives', e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="keywords">Palavras-chave (separadas por vírgula)</Label>
                  <Input
                    id="keywords"
                    placeholder="Ex: Inteligência Artificial, Educação, Personalização, Aprendizado"
                    value={formData.keywords}
                    onChange={(e) => handleInputChange('keywords', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dados e Mídia */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Dados e Mídia
                </CardTitle>
                <CardDescription>
                  Adicione arquivos e configure opções de conteúdo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Checkbox para dados coletados */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasCollectedData"
                    checked={formData.hasCollectedData}
                    onCheckedChange={(checked) => handleInputChange('hasCollectedData', checked as boolean)}
                  />
                  <Label htmlFor="hasCollectedData">Tenho dados coletados para inserir na pesquisa.</Label>
                </div>

                {/* Upload de dados */}
                {formData.hasCollectedData && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <div className="text-center">
                      <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          onClick={() => handleFileUpload('data')}
                        >
                          Anexar Dados Coletados (CSV, Excel, TXT)
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Dados serão processados para análise
                      </p>
                    </div>
                  </div>
                )}

                {/* Checkbox para figuras/imagens */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasImages"
                    checked={formData.hasImages}
                    onCheckedChange={(checked) => handleInputChange('hasImages', checked as boolean)}
                  />
                  <Label htmlFor="hasImages">Tenho figuras/imagens para anexar.</Label>
                </div>

                {/* Upload de imagens */}
                {formData.hasImages && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <div className="text-center">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          onClick={() => handleFileUpload('image')}
                        >
                          Anexar Figura
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Imagens serão incluídas no artigo
                      </p>
                    </div>
                  </div>
                )}

                {/* Lista de arquivos carregados */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Arquivos Carregados:</Label>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className={`p-4 bg-gray-50 rounded-lg border ${
                        file.type === 'image' ? 'border-l-4 border-blue-500' : 'border-gray-200'
                      }`}>
                        {file.type === 'image' && file.imageUrl ? (
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <img 
                                src={file.imageUrl} 
                                alt={file.name}
                                className="w-16 h-16 object-cover rounded border"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">{file.name}</span>
                                  <Badge variant="outline" className="text-xs">{file.size}</Badge>
                                </div>
                                <span className="text-xs text-gray-500 block mb-2">URL: {file.imageUrl}</span>
                                
                                {/* Campo para descrição da imagem */}
                                <div className="space-y-2">
                                  <Label className="text-xs font-medium text-gray-700">
                                    Descreva esta imagem: *
                                  </Label>
                                  <textarea
                                    placeholder="Ex: Gráfico de barras mostrando resultados do experimento..."
                                    value={file.description || ''}
                                    onChange={(e) => updateImageDescription(index, e.target.value)}
                                    className={`w-full p-2 text-sm border rounded resize-none h-20 ${
                                      file.needsDescription && !file.description 
                                        ? 'border-red-300 bg-red-50' 
                                        : 'border-gray-300'
                                    }`}
                                  />
                                  {file.needsDescription && !file.description && (
                                    <span className="text-xs text-red-600">
                                      ⚠️ Descrição obrigatória para gerar o artigo
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex items-center gap-2">
                                {file.type === 'data' ? (
                                  <FileSpreadsheet className="h-4 w-4 text-green-500" />
                                ) : (
                                  <FileText className="h-4 w-4 text-gray-500" />
                                )}
                                <span className="text-sm">{file.name}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">{file.size}</Badge>
                              {file.content && (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                  ✓ Conteúdo processado
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Botão remover */}
                        <div className="flex justify-end mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Painel Lateral */}
          <div className="space-y-6">
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
                      Gerar Artigo Completo
                    </>
                  )}
                </Button>

                {isGenerating && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progresso</span>
                      <span>{Math.round(generationProgress)}%</span>
                    </div>
                    <Progress value={generationProgress} className="w-full" />
                    {generationStep && (
                      <div className="mt-2 text-sm text-blue-600 font-medium">
                        {generationStep}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Artigo Gerado */}
            {generatedContent && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Artigo Gerado</CardTitle>
                  <CardDescription>
                    Seu artigo foi criado com sucesso! Redirecionando para o editor...
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Preencha todos os campos obrigatórios (*)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Use palavras-chave específicas para melhor resultado</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Arquivos suportados: PDF, DOCX, CSV, Excel, TXT</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Gráficos requerem dados:</strong> anexe arquivos CSV/Excel</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Inputs ocultos para upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={(e) => processFileUpload(e, 'thesis')}
          className="hidden"
        />
        <input
          ref={dataInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.txt"
          onChange={(e) => processFileUpload(e, 'data')}
          className="hidden"
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => processFileUpload(e, 'image')}
          className="hidden"
        />
      </div>
    </div>
  )
}

