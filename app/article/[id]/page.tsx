'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Download, Share2, Edit, Save, X, Sparkles, RefreshCw, Trash2, Upload, Image as ImageIcon, BarChart3, FileText, Plus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/date-utils'
import { processImageTagsClient } from '@/lib/utils/image-processor-client'
import ArticleContentRenderer from '@/components/article-content-renderer'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
} from 'chart.js'
import { Bar, Line, Pie } from 'react-chartjs-2'
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

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

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

interface AttachedImage {
  id: string
  name: string
  url: string
  description: string
  referenceId: string
}

interface AttachedChart {
  id: string
  name: string
  type: 'bar' | 'line' | 'pie' | 'scatter'
  data: any
  description: string
  referenceId: string
}

interface AttachedFile {
  id: string
  name: string
  type: string
  size: number
  data: ArrayBuffer | null
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
  
  // Estados para imagens e gráficos
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([])
  const [attachedCharts, setAttachedCharts] = useState<AttachedChart[]>([])
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [showChartGenerator, setShowChartGenerator] = useState(false)
  const [isGeneratingChart, setIsGeneratingChart] = useState(false)
  const [chartDescription, setChartDescription] = useState('')

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
        
        // Carregar gráficos salvos se existirem
        if (data.charts) {
          try {
            const savedCharts = JSON.parse(data.charts)
            setAttachedCharts(savedCharts) // Usar IDs originais
          } catch (error) {
            console.error('Erro ao carregar gráficos salvos:', error)
          }
        }
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

  // Função para gerar IDs únicos
  const generateId = (): string => Math.random().toString(36).substr(2, 9);

  // Função para formatar data
  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Função para exportar para PDF
  const exportToPDF = async () => {
    try {
      // Processar conteúdo para PDF
      let processedContent = editedContent || article?.content || '';
      
      // Converter tags de imagens para HTML
      attachedImages.forEach((image) => {
        const imageTagPattern = new RegExp(`\\[Imagem: ${image.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g');
        const imageHtml = `
<div class="image-container" style="margin: 20px 0; text-align: center;">
  <img src="${image.url}" alt="${image.name}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
  <p style="margin: 10px 0 0 0; font-style: italic; color: #666; font-size: 14px;">${image.description || image.name}</p>
</div>`;
        processedContent = processedContent.replace(imageTagPattern, imageHtml);
      });

      // Converter referências de gráficos para HTML
      attachedCharts.forEach((chart) => {
        const chartRegex = new RegExp(`\\[CHART:${chart.referenceId}\\]`, 'g');
        processedContent = processedContent.replace(chartRegex, `
          <div class="chart-container" style="margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h4 style="margin: 0 0 10px 0; font-weight: bold;">${chart.name}</h4>
            <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">${chart.description}</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 12px;">
              Gráfico: ${chart.type}<br/>
              Dados: ${JSON.stringify(chart.data.labels?.slice(0, 5))}...
            </div>
          </div>
        `);
      });

      const element = document.createElement('div');
      element.innerHTML = `
        <div style="padding: 40px; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h1 style="color: #2563eb; margin-bottom: 10px; font-size: 28px;">${article?.title}</h1>
          <p style="color: #6b7280; margin-bottom: 30px; font-size: 14px;">
            Criado em ${article?.createdAt ? formatDate(new Date(article.createdAt)) : 'Data não disponível'}
          </p>
          <div style="font-size: 16px;">
            ${processedContent}
          </div>
        </div>
      `;
      
      document.body.appendChild(element);
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      document.body.removeChild(element);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${article?.title || 'artigo'}.pdf`);
      toast({
        title: "PDF exportado com sucesso",
        description: "O arquivo foi baixado para seu computador."
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro ao exportar PDF",
        description: "Ocorreu um erro durante a exportação.",
        variant: "destructive"
      });
    }
  };

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
            Gerado em: ${formatDate(new Date())} | 
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
          <div style="text-align: justify; white-space: pre-wrap;">${await processArticleContent(article.content)}</div>
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
      const currentContent = editedContent || article.content;
      
      // Extrair tags de imagens e gráficos antes da edição
      const imageTags = [...currentContent.matchAll(/\[Imagem: ([^\]]+)\]/g)].map(match => match[0]);
      const chartTags = [...currentContent.matchAll(/\[CHART:[^\]]+\]/g)].map(match => match[0]);
      
      // Criar placeholders temporários únicos para preservar as posições
      let contentWithPlaceholders = currentContent;
      const imagePlaceholders: Array<{placeholder: string, original: string}> = [];
      const chartPlaceholders: Array<{placeholder: string, original: string}> = [];
      
      imageTags.forEach((tag, index) => {
        const placeholder = `__IMAGE_PLACEHOLDER_${index}__`;
        imagePlaceholders.push({ placeholder, original: tag });
        contentWithPlaceholders = contentWithPlaceholders.replace(tag, placeholder);
      });
      
      chartTags.forEach((tag, index) => {
        const placeholder = `__CHART_PLACEHOLDER_${index}__`;
        chartPlaceholders.push({ placeholder, original: tag });
        contentWithPlaceholders = contentWithPlaceholders.replace(tag, placeholder);
      });

      const response = await fetch('/api/edit-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentContent: contentWithPlaceholders,
          editInstruction: aiPrompt + `

INSTRUÇÕES CRÍTICAS DE PRESERVAÇÃO:
- PRESERVE EXATAMENTE os placeholders que começam com __IMAGE_PLACEHOLDER_ e __CHART_PLACEHOLDER_
- NÃO remova, altere ou substitua estes placeholders
- Mantenha-os nas mesmas posições no texto
- NUNCA use blocos de código markdown (\`\`\`) no início ou fim da resposta
- Retorne APENAS o conteúdo HTML editado, sem prefixos ou sufixos`,
          title: editedTitle || article.title,
          abstract: editedAbstract || article.abstract,
          keywords: editedKeywords || article.keywords,
          fieldOfStudy: article.fieldOfStudy
        }),
      })

      if (response.ok) {
        const result = await response.json()
        let processedContent = result.content;
        
        // Restaurar tags originais substituindo os placeholders
        imagePlaceholders.forEach(({ placeholder, original }) => {
          processedContent = processedContent.replace(new RegExp(placeholder, 'g'), original);
        });
        
        chartPlaceholders.forEach(({ placeholder, original }) => {
          processedContent = processedContent.replace(new RegExp(placeholder, 'g'), original);
        });
        
        setEditedContent(processedContent)
        setAiPrompt('')
        toast({
          title: "Edição concluída!",
          description: "A IA editou o conteúdo preservando as referências de imagens e gráficos",
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
    
    // Primeiro corrigir entidades HTML problemáticas
    let formatted = text
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
    
    // Substituir **texto** por <strong>texto</strong> com estilos
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold; color: #1f2937; background-color: #fef3c7; padding: 2px 4px; border-radius: 3px;">$1</strong>')
    
    // Substituir *texto* por <em>texto</em> com estilos
    formatted = formatted.replace(/\*(.*?)\*/g, '<em style="font-style: italic; color: #3b82f6;">$1</em>')
    
    // Substituir _texto_ por <u>texto</u> APENAS em texto normal (não URLs, arquivos ou HTML)
    // Usar regex complexa com negative lookbehind para evitar formatação em contextos HTML
    try {
      // Regex complexa que evita formatar _texto_ dentro de:
      // - Tags HTML (src="...", href="...", etc.)
      // - URLs (http://, https://, ftp://)
      // - Nomes de arquivos (.svg, .png, .jpg, etc.)
      formatted = formatted.replace(/(?<!(?:src|href|data|class|id|style|alt|title)=['"][^'"]*|(?:https?|ftp):\/\/[^\s]*|[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+[^\s]*)\b_([^_\s]+(?:\s+[^_\s]+)*)_\b(?![^<]*>)/g, '<u style="text-decoration: underline; text-decoration-color: #ef4444; text-decoration-thickness: 2px;">$1</u>')
    } catch (error) {
      // Fallback para navegadores que não suportam negative lookbehind
      console.warn('Negative lookbehind não suportado, usando fallback')
      // Aplicar formatação básica apenas em palavras isoladas
      formatted = formatted.replace(/\b_([a-zA-Z0-9]+(?:\s+[a-zA-Z0-9]+)*)_\b/g, (match, content) => {
        // Verificar se não está dentro de uma tag HTML
        const beforeMatch = formatted.substring(0, formatted.indexOf(match))
        const afterMatch = formatted.substring(formatted.indexOf(match) + match.length)
        
        // Se estiver entre < e >, provavelmente é uma tag HTML
        const lastOpenTag = beforeMatch.lastIndexOf('<')
        const lastCloseTag = beforeMatch.lastIndexOf('>')
        const nextCloseTag = afterMatch.indexOf('>')
        
        if (lastOpenTag > lastCloseTag && nextCloseTag !== -1) {
          return match // Não formatar se estiver dentro de uma tag
        }
        
        return `<u style="text-decoration: underline; text-decoration-color: #ef4444; text-decoration-thickness: 2px;">${content}</u>`
      })
    }
    
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

  // Funções para manipular imagens
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      const imageId = `img_${Date.now()}`
      
      // Criar tag simplificada para o modo de edição
      const imageTag = `[Imagem: ${file.name}]`

      // Inserir a tag no local do cursor no textarea
      const textarea = document.querySelector('#content-editor') as HTMLTextAreaElement
      if (textarea) {
        const cursorPos = textarea.selectionStart || editedContent.length
        const beforeCursor = editedContent.substring(0, cursorPos)
        const afterCursor = editedContent.substring(cursorPos)
        
        // Inserir tag simplificada
        const newContent = beforeCursor + imageTag + afterCursor
        setEditedContent(newContent)
        
        // Atualizar posição do cursor após a tag
        setTimeout(() => {
          const newCursorPos = cursorPos + imageTag.length
          textarea.setSelectionRange(newCursorPos, newCursorPos)
          textarea.focus()
        }, 0)
      } else {
        // Fallback: adicionar no final
        setEditedContent(prev => prev + imageTag)
      }

      // Adicionar à lista de imagens anexadas para controle
      const newImage: AttachedImage = {
        id: imageId,
        name: file.name,
        url: imageUrl,
        description: file.name,
        referenceId: imageId
      }

      setAttachedImages(prev => [...prev, newImage])

      toast({
        title: "Imagem inserida",
        description: `A imagem "${file.name}" foi inserida no artigo.`,
        variant: "default",
      })

      // Fechar o painel de upload
      setShowImageUpload(false)
    }
    reader.readAsDataURL(file)
  }

  const updateImageDescription = (imageId: string, description: string) => {
    const image = attachedImages.find(img => img.id === imageId)
    if (image) {
      const oldTag = `[Imagem: ${image.name}]`
      const newTag = `[Imagem: ${description}]`
      
      // Atualizar a tag no conteúdo
      setEditedContent(prev => prev.replace(oldTag, newTag))
      
      // Atualizar a lista de imagens
      setAttachedImages(prev =>
        prev.map(img => img.id === imageId ? { ...img, description, name: description } : img)
      )
    }
  }

  const removeImage = (imageId: string) => {
    const image = attachedImages.find(img => img.id === imageId)
    if (image) {
      // Remover a tag simplificada do conteúdo
      const imageTag = `[Imagem: ${image.name}]`
      setEditedContent(prev => prev.replace(imageTag, ''))
      
      setAttachedImages(prev => prev.filter(img => img.id !== imageId))
      
      toast({
        title: "Imagem removida",
        description: "A imagem foi removida do artigo.",
        variant: "default",
      })
    }
  }

  // Funções para manipular arquivos e gerar gráficos
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Arquivo não suportado",
        description: "Por favor, selecione arquivos CSV, Excel ou TXT.",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const fileData = e.target?.result as ArrayBuffer
      
      const newFile: AttachedFile = {
        id: `file_${Date.now()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        data: fileData
      }

      setAttachedFiles(prev => [...prev, newFile])
      
      toast({
        title: "Arquivo anexado",
        description: `O arquivo "${file.name}" foi anexado para análise.`,
        variant: "default",
      })
    }
    reader.readAsArrayBuffer(file)
  }

  const generateChartFromFile = async (fileId: string) => {
    const file = attachedFiles.find(f => f.id === fileId)
    if (!file || !chartDescription.trim()) {
      toast({
        title: "Dados insuficientes",
        description: "Selecione um arquivo e descreva o gráfico desejado.",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingChart(true)
    try {
      // Criar FormData para enviar arquivo
      const formData = new FormData()
      const fileBlob = new Blob([file.data!], { type: file.type })
      const actualFile = new File([fileBlob], file.name, { type: file.type })
      
      formData.append('file', actualFile)
      formData.append('description', chartDescription)

      // Chamar API para processar arquivo e gerar gráfico
      const response = await fetch('/api/process-chart', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Erro ao processar arquivo')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido')
      }

      // Criar gráfico com dados processados
      const chartId = `chart_${Date.now()}`
      const referenceId = `[CHART:${chartId}]`

      const newChart: AttachedChart = {
        id: chartId,
        name: `Gráfico - ${file.name}`,
        type: result.chart.type,
        data: result.chart.data,
        description: chartDescription,
        referenceId
      }

      setAttachedCharts(prev => [...prev, newChart])
      
      // Inserir referência no texto
      const cursorPos = (document.querySelector('#content-editor') as HTMLTextAreaElement)?.selectionStart || editedContent.length
      const beforeCursor = editedContent.substring(0, cursorPos)
      const afterCursor = editedContent.substring(cursorPos)
      setEditedContent(beforeCursor + referenceId + afterCursor)

      setChartDescription('')
      setShowChartGenerator(false)

      toast({
        title: "Gráfico gerado",
        description: `Gráfico criado com base em ${result.processedRows} linhas de dados.`,
        variant: "default",
      })

    } catch (error) {
      console.error('Erro ao gerar gráfico:', error)
      toast({
        title: "Erro ao gerar gráfico",
        description: "Não foi possível processar o arquivo.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingChart(false)
    }
  }

  const removeChart = (chartId: string) => {
    const chart = attachedCharts.find(c => c.id === chartId)
    if (chart) {
      // Remover referência do texto
      setEditedContent(prev => prev.replace(chart.referenceId, ''))
      setAttachedCharts(prev => prev.filter(c => c.id !== chartId))
      
      toast({
        title: "Gráfico removido",
        description: "O gráfico foi removido do artigo.",
        variant: "default",
      })
    }
  }

  // Função para processar e compilar o artigo final
  const processArticleContent = async (content: string) => {
    // Primeiro, processar tags de imagens automaticamente da pasta uploads
    let processedContent = await processImageTagsClient(content)

    // Depois processar imagens em anexo (se houver)
    attachedImages.forEach((image) => {
      const imageTagPattern = new RegExp(`\\[Imagem: ${image.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g');
      const imageHtml = `
<div class="image-container" style="margin: 20px 0; text-align: center;">
  <img src="${image.url}" alt="${image.name}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
  <p style="margin: 10px 0 0 0; font-style: italic; color: #666; font-size: 14px;">${image.description || image.name}</p>
</div>`;
      processedContent = processedContent.replace(imageTagPattern, imageHtml);
    });

    // Depois processar referências de gráficos
    attachedCharts.forEach(chart => {
      const chartHtml = `
        <div style="text-align: center; margin: 20px 0;">
          <div style="border: 1px solid #ddd; border-radius: 4px; padding: 15px; background-color: #f9f9f9;">
            <h4 style="margin: 0 0 10px 0; font-size: 14px;">${chart.name}</h4>
            <p style="font-size: 12px; color: #666; margin: 0;">
              ${chart.description}
            </p>
            <p style="font-size: 10px; color: #888; margin-top: 10px; font-style: italic;">
              [Gráfico ${chart.type} - Dados processados de ${chart.name}]
            </p>
          </div>
        </div>
      `
      processedContent = processedContent.replace(chart.referenceId, chartHtml)
    })

    return processedContent
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
              <Button onClick={exportToPDF} size="sm">
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
                  placeholder="Instrua a IA sobre como editar o artigo... Ex: 'Adicione mais detalhes sobre metodologia', 'Reescreva a conclusão de forma mais clara', 'Adicione exemplos práticos', 'Formate o texto com HTML/CSS'... A IA pode usar HTML e CSS para formatação avançada."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="min-h-[80px] bg-white"
                />
                <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <p className="font-medium text-blue-800 mb-1">💡 Dica: A IA pode usar HTML e CSS!</p>
                  <p>Você pode pedir para a IA formatar o texto com tags HTML (&lt;h1&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, etc.) e estilos CSS inline para uma apresentação mais rica.</p>
                </div>
                <div className="text-xs text-gray-600 bg-green-50 p-3 rounded-lg">
                  <p className="font-medium text-green-800 mb-1">🛡️ Proteção de Conteúdo:</p>
                  <p>As tags [Imagem: nome] e [CHART:id] são automaticamente preservadas durante a edição por IA, mantendo suas posições no texto.</p>
                </div>
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
            {isEditing && (
              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  onClick={() => setShowImageUpload(!showImageUpload)}
                  variant="outline"
                  size="sm"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Adicionar Imagem
                </Button>
                <Button
                  onClick={() => setShowChartGenerator(!showChartGenerator)}
                  variant="outline"
                  size="sm"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Gerar Gráfico
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isEditing && showImageUpload && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-lg">Upload de Imagem</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="mb-4"
                  />
                  <p className="text-sm text-gray-600">
                    Selecione uma imagem para inserir no artigo. A tag [Imagem: nome] será adicionada automaticamente.
                  </p>
                </CardContent>
              </Card>
            )}

            {isEditing && showChartGenerator && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-lg">Gerador de Gráficos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="file-upload">Anexar arquivo de dados (CSV, Excel, TXT)</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls,.txt"
                      onChange={handleFileUpload}
                    />
                  </div>
                  {attachedFiles.length > 0 && (
                    <div>
                      <Label htmlFor="chart-description">Descrição do gráfico desejado</Label>
                      <Textarea
                        id="chart-description"
                        value={chartDescription}
                        onChange={(e) => setChartDescription(e.target.value)}
                        placeholder="Ex: Gráfico de barras comparando vendas por mês"
                        rows={3}
                      />
                      <div className="mt-2">
                        <Label>Arquivos anexados:</Label>
                        {attachedFiles.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-2 border rounded mt-1">
                            <span className="text-sm">{file.name}</span>
                            <Button
                              onClick={() => generateChartFromFile(file.id)}
                              disabled={isGeneratingChart || !chartDescription.trim()}
                              size="sm"
                            >
                              {isGeneratingChart ? 'Gerando...' : 'Gerar Gráfico'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isEditing && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-medium text-gray-800 mb-2">📝 Guia de Formatação</h4>
                <div className="grid md:grid-cols-2 gap-4 text-xs text-gray-600">
                  <div>
                    <p className="font-medium mb-1">Multimídia:</p>
                    <p>• [Imagem: nome] - Inserir imagem</p>
                    <p>• [CHART:id] - Inserir gráfico</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">HTML/CSS:</p>
                    <p>• &lt;h1&gt;, &lt;h2&gt;, &lt;h3&gt; - Títulos</p>
                    <p>• &lt;p&gt; - Parágrafos</p>
                    <p>• &lt;strong&gt;, &lt;em&gt; - Negrito/Itálico</p>
                    <p>• &lt;ul&gt;, &lt;ol&gt;, &lt;li&gt; - Listas</p>
                    <p>• style="..." - CSS inline</p>
                  </div>
                </div>
              </div>
            )}

            {isEditing ? (
              <Textarea
                id="content-editor"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[500px] font-mono text-sm leading-relaxed"
                placeholder="Conteúdo do artigo... Use [Imagem: nome] para imagens, [CHART:id] para gráficos, e HTML/CSS para formatação avançada (ex: <h2>, <p>, <strong>, <em>, etc.)"
              />
            ) : (
              <div className="prose prose-gray max-w-none leading-relaxed article-content">
                <ArticleContentRenderer 
                  content={article.content}
                  attachedImages={attachedImages}
                  attachedCharts={attachedCharts}
                  formatText={formatText}
                />
              </div>
            )}

            {/* Seção de elementos anexados */}
            {attachedCharts.length > 0 && (
              <div className="mt-6 space-y-4">
                {attachedCharts.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Gráficos Gerados</h4>
                    <div className="grid gap-4">
                      {attachedCharts.map((chart) => (
                        <div key={chart.id} className="border rounded-lg p-3">
                          <h5 className="font-medium">{chart.name}</h5>
                          <p className="text-sm text-gray-600 mb-2">{chart.description}</p>
                          <p className="text-xs text-gray-500 mb-2">Referência: {chart.referenceId}</p>
                          <div className="bg-gray-100 p-3 rounded text-xs">
                            Tipo: {chart.type} | Dados: {JSON.stringify(chart.data.labels?.slice(0, 3))}...
                          </div>
                          {isEditing && (
                            <Button
                              onClick={() => removeChart(chart.id)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 mt-2"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Remover
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Controle de imagens (apenas no modo de edição) */}
            {isEditing && attachedImages.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Imagens no Artigo ({attachedImages.length})</h4>
                <div className="text-sm text-gray-600 space-y-2">
                  {attachedImages.map((image) => (
                    <div key={image.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3 flex-1">
                        <img src={image.url} alt={image.name} className="w-12 h-12 object-cover rounded" />
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-1">Tag: [Imagem: {image.name}]</p>
                          <Input
                            value={image.description}
                            onChange={(e) => updateImageDescription(image.id, e.target.value)}
                            placeholder="Editar nome/descrição"
                            className="text-xs"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={() => removeImage(image.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 ml-2"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 italic">
                    As imagens aparecem no texto como tags simplificadas durante a edição e são renderizadas como HTML na visualização.
                  </p>
                </div>
              </div>
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
