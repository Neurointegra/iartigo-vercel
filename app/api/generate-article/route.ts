import { NextRequest, NextResponse } from 'next/server'
import { GeminiService } from '@/lib/services/gemini.service'
import { ArticleService } from '@/lib/services/article.service'
import { processImageTags } from '@/lib/utils/image-processor'
import fs from 'fs'
import path from 'path'

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
      userId,
      attachedFiles, // Arquivos enviados pelo usuário
      includeTables // Indicador para gerar tabelas
    } = body

    // Verificar descrições manuais das imagens
    if (attachedFiles && attachedFiles.length > 0) {
      for (const file of attachedFiles) {
        if (file.type === 'image') {
          if (!file.description) {
            file.description = 'Imagem relacionada ao tema da pesquisa'
          }
        }
      }
    }

    if (!title && !sectionType) {
      return NextResponse.json(
        { error: 'Título ou tipo de seção é obrigatório' },
        { status: 400 }
      )
    }

    let generatedContent = ''
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
      includeTables
    })

    // Processar tags de imagem para buscar arquivos na pasta uploads
    generatedContent = await processImageTags(generatedContent)

    // Gerar resumo se não foi fornecido
    if (!abstract || abstract.trim().length < 20) {
      try {
        const generatedAbstract = await GeminiService.generateSimpleAbstract(title, generatedContent)
        
        // Inserir o resumo após o título
        const resumoSection = `
<div style="margin-bottom: 30px; padding: 20px; border-left: 4px solid #3b82f6; background-color: #f8fafc;">
  <h2 style="color: #1f2937; margin-bottom: 15px; font-size: 18px;">Resumo</h2>
  <p style="text-align: justify; line-height: 1.6; color: #374151;">${generatedAbstract}</p>
</div>
        `
        
        // Inserir após o título
        generatedContent = generatedContent.replace(
          /(<h1[^>]*>.*?<\/h1>)/i,
          `$1${resumoSection}`
        )
        
      } catch (error) {
        console.error('❌ Erro ao gerar resumo:', error)
      }
    }

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
