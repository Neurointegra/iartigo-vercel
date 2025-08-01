import { prisma } from '@/lib/database'

export type CreateUserData = {
  email: string
  password: string
  name: string
  institution?: string
  department?: string
  city?: string
  country?: string
  avatar?: string
  plan?: string
  planType?: string
  creditsRemaining?: number
  articlesLimit?: number | null
  isEmailVerified?: boolean
}

export type UpdateUserData = Partial<CreateUserData> & {
  lastLoginAt?: Date
}

export class UserService {
  // Create user
  static async create(data: CreateUserData) {
    return await prisma.user.create({
      data,
    })
  }

  // Get user by ID
  static async getById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        articles: {
          orderBy: { createdAt: 'desc' },
          take: 5, // Last 5 articles
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 payments
        },
      },
    })
  }

  // Get user by email
  static async getByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        articles: true,
        payments: true,
      },
    })
  }

  // Update user
  static async update(id: string, data: UpdateUserData) {
    return await prisma.user.update({
      where: { id },
      data,
    })
  }

  // Delete user
  static async delete(id: string) {
    return await prisma.user.delete({
      where: { id },
    })
  }

  // Get all users with pagination
  static async getAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              articles: true,
              payments: true,
            },
          },
        },
      }),
      prisma.user.count(),
    ])

    return {
      users,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  // Update user credits
  static async updateCredits(id: string, credits: number) {
    return await prisma.user.update({
      where: { id },
      data: {
        creditsRemaining: {
          increment: credits,
        },
      },
    })
  }

  // Consume user credits
  static async consumeCredits(id: string, credits = 1) {
    return await prisma.user.update({
      where: { id },
      data: {
        creditsRemaining: {
          decrement: credits,
        },
        articlesUsed: {
          increment: 1,
        },
      },
    })
  }

  // Check if user can generate article
  static async canGenerateArticle(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) return false

    // Per-article plan - check credits
    if (user.planType === 'per-article') {
      return user.creditsRemaining > 0
    }

    // Monthly/Annual plan - check limit
    if (user.articlesLimit && user.articlesUsed >= user.articlesLimit) {
      return false
    }

    return true
  }

  // Get user statistics
  static async getStatistics(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        articles: {
          select: {
            id: true,
            status: true,
            wordCount: true,
            qualityScore: true,
            timeSpent: true,
            createdAt: true,
          },
        },
        payments: {
          select: {
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    })

    if (!user) return null

    const totalArticles = user.articles.length
    const completedArticles = user.articles.filter((a: any) => a.status === 'completed').length
    const averageQuality = user.articles
      .filter((a: any) => a.qualityScore)
      .reduce((sum: number, a: any) => sum + (a.qualityScore || 0), 0) / 
      user.articles.filter((a: any) => a.qualityScore).length || 0
    
    const totalWordCount = user.articles.reduce((sum: number, a: any) => sum + a.wordCount, 0)
    const totalTimeSpent = user.articles.reduce((sum: number, a: any) => sum + a.timeSpent, 0)
    const totalSpent = user.payments
      .filter((p: any) => p.status === 'completed')
      .reduce((sum: number, p: any) => sum + p.amount, 0)

    return {
      totalArticles,
      completedArticles,
      averageQuality: Math.round(averageQuality * 10) / 10,
      totalWordCount,
      totalTimeSpent, // in minutes
      totalSpent,
      articlesThisMonth: user.articlesUsed,
      creditsRemaining: user.creditsRemaining,
    }
  }
}
