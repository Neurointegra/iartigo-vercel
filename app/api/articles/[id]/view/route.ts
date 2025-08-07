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

    // Verificar se há um token válido
    let isOwner = false
    const token = request.cookies.get('token')?.value

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any
        isOwner = decoded.email === article.user.email
      } catch (error) {
        // Token inválido, continuar como não autenticado
      }
    }

    // Se não é o dono, verificar se pode ver publicamente
    if (!isOwner) {
      if (article.status !== 'completed' && article.status !== 'published') {
        return NextResponse.json(
          { error: 'Article not available for public viewing' },
          { status: 403 }
        )
      }
      
      // Retornar apenas dados para visualização pública
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
        literatureSuggestions: article.literatureSuggestions,
        charts: article.charts,
        wordCount: article.wordCount,
        qualityScore: article.qualityScore,
        status: article.status,
        isOwner: false,
        isPublicView: true
      }
      
      return NextResponse.json(publicArticle)
    }
    
    // Se é o dono, retornar tudo
    return NextResponse.json({
      ...article,
      isOwner: true,
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
