import { NextRequest, NextResponse } from 'next/server'
import { ArticleService } from '@/lib/services/article.service'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const article = await ArticleService.getById(id)
    
    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Verificar se o usuário está autenticado
    const token = request.cookies.get('token')?.value
    let isOwner = false
    let userId = null

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any
        userId = decoded.userId
        isOwner = article.userId === userId
      } catch (error) {
        // Token inválido, mas pode ser acesso público
      }
    }

    // Se não é o dono, verificar se o artigo pode ser acessado publicamente
    if (!isOwner) {
      // Apenas artigos com status "completed" podem ser visualizados publicamente
      if (article.status !== 'completed') {
        return NextResponse.json(
          { error: 'Este artigo não está disponível para visualização pública' },
          { status: 403 }
        )
      }
      
      // Para acesso público, retornar apenas dados essenciais (sem informações de edição)
      const publicArticle = {
        id: article.id,
        title: article.title,
        content: article.content,
        abstract: article.abstract,
        keywords: article.keywords,
        citationStyle: article.citationStyle,
        targetJournal: article.targetJournal,
        fieldOfStudy: article.fieldOfStudy,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        authors: article.authors,
        charts: article.charts,
        status: article.status,
        isPublicView: true // Flag para indicar que é visualização pública
      }
      
      return NextResponse.json(publicArticle)
    }
    
    // Se é o dono, retornar todos os dados
    return NextResponse.json({
      ...article,
      isPublicView: false
    })
  } catch (error) {
    console.error('Error fetching article:', error)
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const data = await request.json()
    
    const article = await ArticleService.update(id, data)
    
    return NextResponse.json(article)
  } catch (error) {
    console.error('Error updating article:', error)
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    await ArticleService.delete(id)
    
    return NextResponse.json({ message: 'Article deleted successfully' })
  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    )
  }
}
