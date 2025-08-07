import { prisma } from '@/lib/database'

export type CreateArticleData = {
  title: string
  keywords?: string
  citationStyle?: string
  targetJournal?: string
  fieldOfStudy?: string
  methodology?: string
  includeCharts?: boolean
  includeTables?: boolean
  researchObjectives?: string
  hypothesis?: string
  sampleSize?: string
  dataCollection?: string
  statisticalAnalysis?: string
  content?: string
  charts?: any[] // Gráficos gerados
  status?: string
  wordCount?: number
  userId: string
}

export type UpdateArticleData = Partial<Omit<CreateArticleData, 'userId'>> & {
  status?: string
  content?: string
  charts?: any[] // Gráficos gerados
  wordCount?: number
  qualityScore?: number
  timeSpent?: number
}

export type CreateAuthorData = {
  name: string
  institution?: string
  email?: string
  department?: string
  city?: string
  country?: string
  order?: number
}

export type CreateLiteratureData = {
  title: string
  authors: string
  journal: string
  year: number
  doi?: string
  abstract?: string
  relevance?: string
  citation: string
  isSelected?: boolean
}

export class ArticleService {
  // Create article
  static async create(data: {
    title: string;
    content: string;
    userId: string;
    charts?: string | any[];
  }) {
    console.log('ArticleService.create - dados de entrada:', {
      title: data.title,
      userId: data.userId,
      hasCharts: !!data.charts,
      chartsLength: Array.isArray(data.charts) ? data.charts.length : data.charts?.length,
      contentLength: data.content.length
    });

    try {
      // Converter charts para JSON string se for um array
      const chartsString = Array.isArray(data.charts) 
        ? JSON.stringify(data.charts) 
        : data.charts;

      const article = await prisma.article.create({
        data: {
          title: data.title,
          content: data.content,
          userId: data.userId,
          ...(chartsString && { charts: chartsString }),
        },
      });

      console.log('ArticleService.create - artigo criado:', {
        id: article.id,
        title: article.title,
        userId: article.userId,
        hasCharts: !!(article as any).charts
      });

      return article;
    } catch (error) {
      console.error('ArticleService.create - erro no banco de dados:', {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorCode: error instanceof Error && 'code' in error ? (error as any).code : null,
        data: {
          title: data.title,
          userId: data.userId,
          hasCharts: !!data.charts
        }
      });
      throw error;
    }
  }

  // Get article by ID
  static async getById(id: string) {
    return await prisma.article.findUnique({
      where: { id },
      include: {
        user: true,
        authors: {
          orderBy: { order: 'asc' },
        },
        literatureSuggestions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })
  }

  // Update article
  static async update(id: string, data: UpdateArticleData) {
    // Processar gráficos para JSON se existirem
    const { charts, ...articleData } = data
    const processedData = {
      ...articleData,
      charts: charts ? JSON.stringify(charts) : undefined
    }
    
    return await prisma.article.update({
      where: { id },
      data: processedData,
      include: {
        user: true,
        authors: true,
        literatureSuggestions: true,
      },
    })
  }

  // Delete article
  static async delete(id: string) {
    return await prisma.article.delete({
      where: { id },
    })
  }

  // Get articles by user ID
  static async getByUserId(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit
    
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          authors: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              literatureSuggestions: true,
            },
          },
        },
      }),
      prisma.article.count({
        where: { userId },
      }),
    ])

    return {
      articles,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  // Get articles by user ID and status
  static async getByUserIdAndStatus(userId: string, status: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit
    
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where: { 
          userId,
          status 
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          authors: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              literatureSuggestions: true,
            },
          },
        },
      }),
      prisma.article.count({
        where: { 
          userId,
          status 
        },
      }),
    ])

    return {
      articles,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  // Get recent articles
  static async getRecent(userId: string, limit = 5) {
    return await prisma.article.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        authors: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            literatureSuggestions: true,
          },
        },
      },
    })
  }

  // Add authors to article
  static async addAuthors(articleId: string, authors: CreateAuthorData[]) {
    const authorPromises = authors.map((author, index) =>
      prisma.author.create({
        data: {
          ...author,
          order: author.order ?? index,
          articleId,
        },
      })
    )

    return await Promise.all(authorPromises)
  }

  // Update authors
  static async updateAuthors(articleId: string, authors: CreateAuthorData[]) {
    // Delete existing authors
    await prisma.author.deleteMany({
      where: { articleId },
    })

    // Add new authors
    return await this.addAuthors(articleId, authors)
  }

  // Add literature suggestions
  static async addLiteratureSuggestions(articleId: string, suggestions: CreateLiteratureData[]) {
    const suggestionPromises = suggestions.map(suggestion =>
      prisma.literatureSuggestion.create({
        data: {
          ...suggestion,
          articleId,
        },
      })
    )

    return await Promise.all(suggestionPromises)
  }

  // Update literature suggestions
  static async updateLiteratureSuggestions(articleId: string, suggestions: CreateLiteratureData[]) {
    // Delete existing suggestions
    await prisma.literatureSuggestion.deleteMany({
      where: { articleId },
    })

    // Add new suggestions
    return await this.addLiteratureSuggestions(articleId, suggestions)
  }

  // Update article status
  static async updateStatus(id: string, status: string) {
    return await prisma.article.update({
      where: { id },
      data: { status },
    })
  }

  // Set article content and mark as completed
  static async completeArticle(id: string, content: string, wordCount: number, qualityScore?: number) {
    return await prisma.article.update({
      where: { id },
      data: {
        content,
        wordCount,
        qualityScore,
        status: 'completed',
      },
      include: {
        user: true,
        authors: true,
        literatureSuggestions: true,
      },
    })
  }

  // Get article statistics
  static async getStatistics(userId?: string) {
    const whereClause = userId ? { userId } : {}

    const [
      total,
      completed,
      generating,
      drafts,
      avgQuality,
      avgWordCount,
      totalWordCount,
    ] = await Promise.all([
      prisma.article.count({ where: whereClause }),
      prisma.article.count({ where: { ...whereClause, status: 'completed' } }),
      prisma.article.count({ where: { ...whereClause, status: 'generating' } }),
      prisma.article.count({ where: { ...whereClause, status: 'draft' } }),
      prisma.article.aggregate({
        where: { ...whereClause, qualityScore: { not: null } },
        _avg: { qualityScore: true },
      }),
      prisma.article.aggregate({
        where: { ...whereClause, wordCount: { gt: 0 } },
        _avg: { wordCount: true },
      }),
      prisma.article.aggregate({
        where: whereClause,
        _sum: { wordCount: true },
      }),
    ])

    return {
      total,
      completed,
      generating,
      drafts,
      averageQuality: Math.round((avgQuality._avg.qualityScore || 0) * 10) / 10,
      averageWordCount: Math.round(avgWordCount._avg.wordCount || 0),
      totalWordCount: totalWordCount._sum.wordCount || 0,
    }
  }

  // Search articles
  static async search(userId: string, query: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit
    
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: query } },
            { abstract: { contains: query } },
            { keywords: { contains: query } },
            { fieldOfStudy: { contains: query } },
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          authors: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              literatureSuggestions: true,
            },
          },
        },
      }),
      prisma.article.count({
        where: {
          userId,
          OR: [
            { title: { contains: query } },
            { abstract: { contains: query } },
            { keywords: { contains: query } },
            { fieldOfStudy: { contains: query } },
          ],
        },
      }),
    ])

    return {
      articles,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      query,
    }
  }

  // Get popular keywords and journals
  static async getPopularData(userId?: string) {
    const whereClause = userId ? { userId } : {}

    const articles = await prisma.article.findMany({
      where: whereClause,
      select: {
        keywords: true,
        targetJournal: true,
        fieldOfStudy: true,
      },
    })

    // Process keywords
    const keywordCount: Record<string, number> = {}
    const journalCount: Record<string, number> = {}
    const fieldCount: Record<string, number> = {}

    articles.forEach((article: any) => {
      if (article.keywords) {
        const keywords = article.keywords.split(',').map((k: string) => k.trim().toLowerCase())
        keywords.forEach((keyword: string) => {
          keywordCount[keyword] = (keywordCount[keyword] || 0) + 1
        })
      }

      if (article.targetJournal) {
        journalCount[article.targetJournal] = (journalCount[article.targetJournal] || 0) + 1
      }

      if (article.fieldOfStudy) {
        fieldCount[article.fieldOfStudy] = (fieldCount[article.fieldOfStudy] || 0) + 1
      }
    })

    return {
      popularKeywords: Object.entries(keywordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([keyword, count]) => ({ keyword, count })),
      popularJournals: Object.entries(journalCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([journal, count]) => ({ journal, count })),
      popularFields: Object.entries(fieldCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([field, count]) => ({ field, count })),
    }
  }
}
