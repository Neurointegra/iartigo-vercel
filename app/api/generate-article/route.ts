import { NextRequest, NextResponse } from 'next/server'
import { GeminiService } from '@/lib/services/gemini.service'
import { ArticleService } from '@/lib/services/article.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
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
      userId 
    } = body

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
        literatureSuggestions
      })
    }

    // Se articleId for fornecido, atualizar o artigo existente
    if (articleId) {
      const updatedArticle = await ArticleService.update(articleId, {
        content: generatedContent,
        status: 'completed'
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
        abstract,
        keywords,
        fieldOfStudy,
        methodology,
        targetJournal,
        content: generatedContent,
        status: 'completed',
        userId,
        wordCount: generatedContent.split(' ').length
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
