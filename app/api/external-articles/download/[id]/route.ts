import { NextRequest, NextResponse } from 'next/server'
import { ArticleRequestService } from '@/lib/services/article-request.service'
import { ExternalArticleService } from '@/lib/services/external-article.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Buscar request no banco local
    const articleRequest = await ArticleRequestService.getById(id)
    if (!articleRequest) {
      return NextResponse.json(
        { error: 'Artigo não encontrado' },
        { status: 404 }
      )
    }

    // Verificar status na API externa
    const externalResponse = await ExternalArticleService.getArticleStatus(articleRequest.requestId)

    // Verificar se é um arquivo (artigo pronto)
    if (ExternalArticleService.isFileResponse(externalResponse)) {
      // Artigo está pronto - retornar arquivo
      const blob = externalResponse
      
      // Atualizar status no banco local
      await ArticleRequestService.update(articleRequest.id, {
        status: 'completed',
        statusMessage: 'Artigo concluído e disponível para download',
      })

      // Retornar o arquivo diretamente
      const headers = new Headers()
      headers.set('Content-Type', blob.type || 'application/pdf')
      headers.set('Content-Disposition', `attachment; filename="artigo-${articleRequest.requestId}.pdf"`)
      
      return new NextResponse(blob, {
        status: 200,
        headers,
      })
    }

    // É uma resposta de status JSON
    if (ExternalArticleService.isStatusResponse(externalResponse)) {
      const statusData = externalResponse.data
      
      // Atualizar status no banco local
      await ArticleRequestService.update(articleRequest.id, {
        status: statusData.status === 'Erro' ? 'error' : 'processing',
        statusMessage: statusData.status,
      })

      return NextResponse.json({
        success: true,
        isReady: false,
        data: {
          id: articleRequest.id,
          requestId: articleRequest.requestId,
          title: articleRequest.title,
          status: statusData.status,
          statusMessage: statusData.status,
          createdAt: articleRequest.createdAt,
          updatedAt: articleRequest.updatedAt,
        }
      })
    }

    // Resposta inesperada
    return NextResponse.json(
      { error: 'Resposta inesperada da API externa' },
      { status: 500 }
    )

  } catch (error) {
    console.error('Erro ao verificar/baixar artigo:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
