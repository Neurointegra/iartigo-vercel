import { NextRequest, NextResponse } from 'next/server'
import { ExternalArticleService } from '@/lib/services/external-article.service'
import { ArticleRequestService } from '@/lib/services/article-request.service'
import { UserService } from '@/lib/services/user.service'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Extrair dados obrigatórios
    const userId = formData.get('userId') as string
    const title = formData.get('title') as string
    const objective = formData.get('objective') as string

    if (!userId || !title || !objective) {
      return NextResponse.json(
        { error: 'userId, title e objective são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar dados do usuário
    const user = await UserService.getById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se usuário tem CPF
    if (!user.cpf || !user.cpf.trim()) {
      return NextResponse.json(
        { 
          error: 'CPF necessário',
          details: 'Complete seu CPF no perfil para gerar artigos'
        },
        { status: 400 }
      )
    }

    // Verificar se usuário pode gerar artigos
    const canGenerate = await UserService.canGenerateArticle(userId)
    if (!canGenerate) {
      return NextResponse.json(
        { 
          error: 'Limite de artigos atingido ou assinatura expirada',
          details: 'Faça upgrade do seu plano ou renove sua assinatura'
        },
        { status: 403 }
      )
    }

    // Extrair dados opcionais
    const resume = formData.get('resume') as string || undefined
    const keywords = formData.get('keywords') as string || undefined
    const introduction = formData.get('introduction') as string || undefined
    const articleType = formData.get('articleType') as string || undefined
    const justification = formData.get('justification') as string || undefined
    const literatureReview = formData.get('literatureReview') as string || undefined
    const methodology = formData.get('methodology') as string || undefined
    const discussion = formData.get('discussion') as string || undefined
    const conclusion = formData.get('conclusion') as string || undefined

    // Extrair arquivos
    const files: File[] = []
    const fileEntries = formData.getAll('files')
    
    for (const entry of fileEntries) {
      if (entry instanceof File) {
        files.push(entry)
      }
    }

    // Preparar dados para a API externa
    const articleData = {
      author: user.name,
      institution: user.institution || 'Não informado',
      authorSSN: user.cpf,
      title,
      objective,
      resume,
      keywords,
      introduction,
      articleType,
      justification,
      literatureReview,
      methodology,
      discussion,
      conclusion,
      files: files.length > 0 ? files : undefined,
    }

    // Chamar API externa para criar artigo
    const externalResponse = await ExternalArticleService.createArticle(articleData)

    if (!externalResponse.success) {
      return NextResponse.json(
        { error: 'Erro na API externa de geração de artigos' },
        { status: 500 }
      )
    }

    // Salvar request no banco local
    const requestUrl = `${process.env.ARTICLE_API_URL}/${externalResponse.data.requestId}`
    const articleRequest = await ArticleRequestService.create({
      requestId: externalResponse.data.requestId,
      userId,
      title,
      status: externalResponse.data.status,
      authorSSN: user.cpf,
      resume,
      keywords,
      introduction,
      articleType,
      justification,
      objective,
      literatureReview,
      methodology,
      discussion,
      conclusion,
      files: files.length > 0 ? JSON.stringify(files.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      }))) : undefined,
      requestUrl,
    })

    // Consumir crédito/uso do usuário
    if (user.planType === 'per-article') {
      await UserService.consumeCredits(userId, 1)
    } else {
      await UserService.update(userId, {
        articlesUsed: user.articlesUsed + 1
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        requestId: externalResponse.data.requestId,
        localId: articleRequest.id,
        status: externalResponse.data.status,
        title,
        createdAt: articleRequest.createdAt,
      }
    })

  } catch (error) {
    console.error('Erro ao criar artigo externo:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
