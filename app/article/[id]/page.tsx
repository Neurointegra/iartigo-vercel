'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Download, Share2, Edit, Save, X, Sparkles, RefreshCw, Trash2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/date-utils'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Article {
  id: string
  title: string
  content: string
  abstract: string
  keywords: string
  status: string
  citationStyle: string
  targetJournal: string
  fieldOfStudy: string
  createdAt: string
  updatedAt: string
  user: {
    name: string
    email: string
  }
  authors: Array<{
    id: string
    name: string
    institution: string
    email: string
    department: string
    city: string
    country: string
  }>
}

export default function ArticlePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [editedTitle, setEditedTitle] = useState('')
  const [editedAbstract, setEditedAbstract] = useState('')
  const [editedKeywords, setEditedKeywords] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [isAiEditing, setIsAiEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await fetch(`/api/articles/${params.id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Artigo não encontrado')
          } else {
            setError('Erro ao carregar artigo')
          }
          return
        }

        const data = await response.json()
        setArticle(data)
      } catch (error) {
        console.error('Erro ao buscar artigo:', error)
        setError('Erro ao carregar artigo')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchArticle()
    }
  }, [params.id])

  const handleDownloadPDF = async () => {
    if (!article) return
    
    try {
      toast({
        title: "Gerando PDF",
        description: "Preparando o documento para download...",
        variant: "default",
      })

      // Criar um elemento temporário com o conteúdo do artigo
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.width = '210mm' // A4 width
      tempDiv.style.padding = '20mm'
      tempDiv.style.fontFamily = 'Arial, sans-serif'
      tempDiv.style.fontSize = '12px'
      tempDiv.style.lineHeight = '1.6'
      tempDiv.style.color = '#000'
      tempDiv.style.background = '#fff'

      // Estrutura do PDF
      tempDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">${article.title}</h1>
          <p style="font-size: 12px; color: #666;">
            ${article.authors.map(author => `${author.name} (${author.institution})`).join(', ')}
          </p>
          <p style="font-size: 10px; color: #888; margin-top: 10px;">
            Gerado em: ${formatDate(new Date().toISOString())} | 
            Revista: ${article.targetJournal || 'Não especificada'} | 
            Estilo: ${article.citationStyle || 'ABNT'}
          </p>
        </div>

        ${article.abstract ? `
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">Resumo</h2>
            <p style="text-align: justify;">${article.abstract}</p>
          </div>
        ` : ''}

        ${article.keywords ? `
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">Palavras-chave</h2>
            <p>${article.keywords}</p>
          </div>
        ` : ''}

        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 15px;">Conteúdo</h2>
          <div style="text-align: justify; white-space: pre-wrap;">${article.content.replace(/\n/g, '<br>')}</div>
        </div>

        <div style="margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; font-size: 10px; color: #666;">
          <p>Documento gerado pelo iArtigo - Plataforma de Geração de Artigos Científicos com IA</p>
          <p>Data de criação: ${formatDate(article.createdAt)} | Última atualização: ${formatDate(article.updatedAt)}</p>
        </div>
      `

      document.body.appendChild(tempDiv)

      // Capturar o elemento como canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight
      })

      // Remover elemento temporário
      document.body.removeChild(tempDiv)

      // Criar PDF
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 295 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      // Adicionar primeira página
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Adicionar páginas adicionais se necessário
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Fazer o download
      const filename = `${article.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}.pdf`
      pdf.save(filename)

      toast({
        title: "PDF gerado com sucesso!",
        description: "O download do arquivo foi iniciado.",
        variant: "default",
      })

    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o documento. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleShare = () => {
    // Verificar se estamos no cliente antes de usar APIs do navegador
    if (typeof window === 'undefined') return
    
    if (navigator.share) {
      navigator.share({
        title: article?.title,
        text: article?.abstract,
        url: window.location.href,
      })
    } else {
      // Fallback para clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast({
          title: "Link copiado!",
          description: "O link do artigo foi copiado para a área de transferência",
          variant: "default",
        })
      }).catch(() => {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o link",
          variant: "destructive",
        })
      })
    }
  }

  const handleEdit = () => {
    if (!article) return
    setEditedTitle(article.title)
    setEditedContent(article.content)
    setEditedAbstract(article.abstract)
    setEditedKeywords(article.keywords)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedTitle('')
    setEditedContent('')
    setEditedAbstract('')
    setEditedKeywords('')
    setAiPrompt('')
  }

  const handleSave = async () => {
    if (!article) return
    
    setIsSaving(true)
    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editedTitle,
          content: editedContent,
          abstract: editedAbstract,
          keywords: editedKeywords,
        }),
      })

      if (response.ok) {
        const updatedArticle = await response.json()
        setArticle(updatedArticle)
        setIsEditing(false)
        setAiPrompt('')
        toast({
          title: "Artigo salvo!",
          description: "Suas alterações foram salvas com sucesso",
          variant: "default",
        })
      } else {
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar o artigo. Tente novamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAiEdit = async () => {
    if (!aiPrompt.trim() || !article) {
      toast({
        title: "Instrução necessária",
        description: "Por favor, digite uma instrução para a IA",
        variant: "destructive",
      })
      return
    }

    setIsAiEditing(true)
    try {
      const response = await fetch('/api/edit-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentContent: editedContent || article.content,
          editInstruction: aiPrompt,
          title: editedTitle || article.title,
          abstract: editedAbstract || article.abstract,
          keywords: editedKeywords || article.keywords,
          fieldOfStudy: article.fieldOfStudy
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setEditedContent(result.content)
        setAiPrompt('')
        toast({
          title: "Edição concluída!",
          description: "A IA editou o conteúdo com sucesso",
          variant: "default",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Erro na edição",
          description: `Erro ao processar edição com IA: ${errorData.error}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro na edição com IA:', error)
      toast({
        title: "Erro na edição",
        description: "Ocorreu um erro ao processar a edição com IA",
        variant: "destructive",
      })
    } finally {
      setIsAiEditing(false)
    }
  }

  // Função para formatar texto com marcações especiais
  const formatText = (text: string) => {
    if (!text) return text
    
    // Substituir **texto** por <strong>texto</strong> com estilos
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold; color: #1f2937; background-color: #fef3c7; padding: 2px 4px; border-radius: 3px;">$1</strong>')
    
    // Substituir *texto* por <em>texto</em> com estilos
    formatted = formatted.replace(/\*(.*?)\*/g, '<em style="font-style: italic; color: #3b82f6;">$1</em>')
    
    // Substituir _texto_ por <u>texto</u> com estilos
    formatted = formatted.replace(/_(.*?)_/g, '<u style="text-decoration: underline; text-decoration-color: #ef4444; text-decoration-thickness: 2px;">$1</u>')
    
    return formatted
  }

  // Função para iniciar o processo de deletar o artigo
  const handleDeleteArticle = () => {
    setDeleteDialogOpen(true)
  }

  // Função para confirmar a deleção do artigo
  const confirmDeleteArticle = async () => {
    if (!article) return

    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Artigo deletado",
          description: "O artigo foi removido com sucesso.",
          variant: "default",
        })
        // Redirecionar para o dashboard após deletar
        router.push('/dashboard')
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
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-32 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              {error || 'Artigo não encontrado'}
            </h1>
            <p className="text-gray-600 mb-6">
              O artigo que você está procurando não existe ou foi removido.
            </p>
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          onClick={() => router.push('/dashboard')}
          variant="outline"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button 
                onClick={handleCancelEdit} 
                variant="outline" 
                size="sm"
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                size="sm"
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleEdit} variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button onClick={handleShare} variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
              <Button onClick={handleDownloadPDF} size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button 
                onClick={handleDeleteArticle} 
                variant="outline" 
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Article Content */}
      <div className="space-y-6">
        {/* AI Editor */}
        {isEditing && (
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Sparkles className="h-5 w-5" />
                Editor Assistido por IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Instrua a IA sobre como editar o artigo... Ex: 'Adicione mais detalhes sobre metodologia', 'Reescreva a conclusão de forma mais clara', 'Adicione exemplos práticos'..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="min-h-[80px] bg-white"
                />
                <Button 
                  onClick={handleAiEdit}
                  disabled={isAiEditing || !aiPrompt.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isAiEditing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Aplicar Edição com IA
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Title and Metadata */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary">{article.status}</Badge>
              <Badge variant="outline">{article.fieldOfStudy}</Badge>
              <Badge variant="outline">{article.citationStyle}</Badge>
            </div>
            <CardTitle className="text-3xl leading-tight">
              {isEditing ? (
                <Textarea
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-3xl font-bold border-none p-0 resize-none min-h-[80px] leading-tight"
                  placeholder="Título do artigo..."
                />
              ) : (
                article.title
              )}
            </CardTitle>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Criado em: {formatDate(article.createdAt)}</p>
              <p>Última atualização: {formatDate(article.updatedAt)}</p>
              {article.targetJournal && (
                <p>Revista alvo: {article.targetJournal}</p>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Authors */}
        {article.authors && article.authors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Autores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {article.authors.map((author) => (
                  <div key={author.id} className="border rounded-lg p-4">
                    <h4 className="font-semibold">{author.name}</h4>
                    <p className="text-sm text-gray-600">{author.institution}</p>
                    <p className="text-sm text-gray-600">{author.department}</p>
                    <p className="text-sm text-gray-600">
                      {author.city}, {author.country}
                    </p>
                    <p className="text-sm text-blue-600">{author.email}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Abstract */}
        {article.abstract && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editedAbstract}
                  onChange={(e) => setEditedAbstract(e.target.value)}
                  className="min-h-[150px] leading-relaxed"
                  placeholder="Resumo do artigo..."
                />
              ) : (
                <p className="text-gray-700 leading-relaxed">{article.abstract}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Keywords */}
        {article.keywords && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Palavras-chave</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editedKeywords}
                  onChange={(e) => setEditedKeywords(e.target.value)}
                  className="min-h-[80px]"
                  placeholder="Palavras-chave separadas por vírgula..."
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {article.keywords.split(',').map((keyword, index) => (
                    <Badge key={index} variant="secondary">
                      {keyword.trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Conteúdo</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[500px] font-mono text-sm leading-relaxed"
                placeholder="Conteúdo do artigo..."
              />
            ) : (
              <div 
                className="prose prose-gray max-w-none leading-relaxed article-content"
                style={{ whiteSpace: 'pre-wrap' }}
                dangerouslySetInnerHTML={{ __html: formatText(article.content) }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmação de deleção */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Artigo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o artigo "{article?.title}"? 
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
