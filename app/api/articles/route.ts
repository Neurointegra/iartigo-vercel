import { NextRequest, NextResponse } from 'next/server'
import { ArticleService } from '@/lib/services/article.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    let result
    if (search) {
      result = await ArticleService.search(userId, search, page, limit)
    } else {
      result = await ArticleService.getByUserId(userId, page, limit)
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.userId) {
      console.error('API articles POST - userId ausente');
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }
    
    const article = await ArticleService.create(data)
    
    return NextResponse.json(article, { status: 201 })
  } catch (error) {
    console.error('Error creating article:', error)
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    )
  }
}
