import { NextRequest, NextResponse } from 'next/server'
import { ExternalArticleService } from '@/lib/services/external-article.service'
import { ArticleRequestService } from '@/lib/services/article-request.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId: requestIdParam } = await params
    const requestId = parseInt(requestIdParam)

    if (isNaN(requestId)) {
      return NextResponse.json(
        { error: 'requestId deve ser um número' },
        { status: 400 }
      )
    }

    // Buscar request no banco local
    const localRequest = await ArticleRequestService.getByRequestId(requestId)
    if (!localRequest) {
      return NextResponse.json(
        { error: 'Request não encontrado' },
        { status: 404 }
      )
    }

    // Verificar status na API externa
    const externalResponse = await ExternalArticleService.getArticleStatus(requestId)

    // Verificar se é um arquivo (artigo pronto)
    if (ExternalArticleService.isFileResponse(externalResponse)) {
      // Artigo está pronto - criar URL de download temporária
      const blob = externalResponse
      
      // Atualizar status no banco local
      await ArticleRequestService.updateByRequestId(requestId, {
        status: 'completed',
        statusMessage: 'Artigo concluído e disponível para download',
      })

      // Retornar o arquivo diretamente
      const headers = new Headers()
      headers.set('Content-Type', blob.type || 'application/pdf')
      headers.set('Content-Disposition', `attachment; filename="artigo-${requestId}.pdf"`)
      
      return new NextResponse(blob, {
        status: 200,
        headers,
      })
    }

    // É uma resposta de status JSON
    if (ExternalArticleService.isStatusResponse(externalResponse)) {
      const statusData = externalResponse.data
      
      // Atualizar status no banco local
      await ArticleRequestService.updateByRequestId(requestId, {
        status: statusData.status === 'Erro' ? 'error' : 'processing',
        statusMessage: statusData.status,
      })

      return NextResponse.json({
        success: true,
        data: {
          requestId,
          status: statusData.status,
          localRequest: {
            id: localRequest.id,
            title: localRequest.title,
            createdAt: localRequest.createdAt,
            updatedAt: localRequest.updatedAt,
          }
        }
      })
    }

    // Resposta inesperada
    return NextResponse.json(
      { error: 'Resposta inesperada da API externa' },
      { status: 500 }
    )

  } catch (error) {
    console.error('Erro ao verificar status do artigo:', error)
    
    // Tentar atualizar status para erro no banco local
    try {
      const { requestId: requestIdParam } = await params
      const requestIdNum = parseInt(requestIdParam)
      if (!isNaN(requestIdNum)) {
        await ArticleRequestService.updateByRequestId(requestIdNum, {
          status: 'error',
          statusMessage: 'Erro ao verificar status na API externa',
        })
      }
    } catch (updateError) {
      console.error('Erro ao atualizar status de erro:', updateError)
    }

    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
