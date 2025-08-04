import { NextRequest, NextResponse } from 'next/server'
import { GeminiService } from '@/lib/services/gemini.service'
import { ArticleService } from '@/lib/services/article.service'
import { processImageTags } from '@/lib/utils/image-processor'
import { processChartTags } from '@/lib/utils/chart-processor-ai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Dados recebidos na API generate-article:', JSON.stringify(body, null, 2))
    
    const { 
      articleId,
      title, 
      abstract, 
      keywords, 
      fieldOfStudy, 
      methodology, 
      targetJournal,
      authors,
      literatureSuggestions,
      sectionType, // Para gerar seções específicas
      userId,
      attachedFiles, // Arquivos enviados pelo usuário
      includeCharts, // Indicador para gerar gráficos
      chartIds, // IDs específicos dos gráficos
      includeTables // Indicador para gerar tabelas
    } = body

    if (attachedFiles && attachedFiles.length > 0) {
      console.log('Arquivos anexados recebidos:')
      attachedFiles.forEach((file: any, index: number) => {
        console.log(`  Arquivo ${index + 1}:`, {
          name: file.name,
          fileName: file.fileName,
          type: file.type,
          size: file.size
        })
      })
    }

    if (includeCharts && chartIds) {
      console.log('Chart IDs recebidos:', chartIds)
    }

    if (!title && !sectionType) {
      return NextResponse.json(
        { error: 'Título ou tipo de seção é obrigatório' },
        { status: 400 }
      )
    }

    let generatedContent = ''

    if (sectionType) {
      // Gerar seção específica
      const context = `Título: ${title}\nÁrea: ${fieldOfStudy}\nResumo: ${abstract}`
      generatedContent = await GeminiService.generateSection(
        sectionType,
        context,
        `Metodologia: ${methodology}\nPalavras-chave: ${keywords}`
      )
    } else {
      // Gerar artigo completo
      generatedContent = await GeminiService.generateArticle({
        title,
        abstract,
        keywords,
        fieldOfStudy,
        methodology,
        targetJournal,
        authors,
        literatureSuggestions,
        attachedFiles,
        includeCharts,
        chartIds,
        includeTables
      })
    }

    // Primeiro, processar tags [CHART:] para gerar imagens com IA e converter em tags [Imagem:]
    if (includeCharts) {
      console.log('🔄 Processando tags de gráficos com IA...')
      generatedContent = await processChartTags(generatedContent, {
        title,
        fieldOfStudy
      })
    }

    // Depois, processar tags de imagem para buscar arquivos na pasta uploads (incluindo gráficos gerados)
    generatedContent = await processImageTags(generatedContent)

    // Se articleId for fornecido, atualizar o artigo existente
    if (articleId) {
      const updatedArticle = await ArticleService.update(articleId, {
        content: generatedContent
      })
      
      return NextResponse.json({
        success: true,
        content: generatedContent,
        article: updatedArticle
      })
    }

    // Senão, criar novo artigo se userId for fornecido
    if (userId) {
      const newArticle = await ArticleService.create({
        title,
        content: generatedContent,
        userId
      })

      return NextResponse.json({
        success: true,
        content: generatedContent,
        article: newArticle
      })
    }

    // Apenas retornar o conteúdo gerado
    return NextResponse.json({
      success: true,
      content: generatedContent
    })

  } catch (error) {
    console.error('Erro na geração do artigo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
