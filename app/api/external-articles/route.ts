import { NextRequest, NextResponse } from 'next/server'
import { ArticleRequestService } from '@/lib/services/article-request.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    let result
    if (status) {
      // Buscar por status específico (não implementado ainda no service, usando getByUserId)
      result = await ArticleRequestService.getByUserId(userId, page, limit)
    } else {
      result = await ArticleRequestService.getByUserId(userId, page, limit)
    }
    
    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Erro ao buscar requests de artigos:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
