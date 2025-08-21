import { prisma } from '@/lib/database'

// Tipo temporário para resolver problemas de tipagem do Prisma
const articleRequestModel = (prisma as any).articleRequest

export type CreateArticleRequestData = {
  requestId: number
  userId: string
  title: string
  status?: string
  statusMessage?: string
  authorSSN?: string
  resume?: string
  keywords?: string
  introduction?: string
  articleType?: string
  justification?: string
  objective: string
  literatureReview?: string
  methodology?: string
  discussion?: string
  conclusion?: string
  files?: string // JSON string
  requestUrl?: string // URL da API para verificar status
}

export type UpdateArticleRequestData = {
  status?: string
  statusMessage?: string
  downloadUrl?: string
  requestUrl?: string
}

export class ArticleRequestService {
  // Criar novo request de artigo
  static async create(data: CreateArticleRequestData) {
    return await articleRequestModel.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  // Buscar request por ID
  static async getById(id: string) {
    return await articleRequestModel.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  // Buscar request por requestId da API externa
  static async getByRequestId(requestId: number) {
    return await articleRequestModel.findFirst({
      where: { requestId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  // Buscar requests por usuário
  static async getByUserId(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit
    
    const [requests, total] = await Promise.all([
      articleRequestModel.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      articleRequestModel.count({
        where: { userId },
      }),
    ])

    return {
      requests,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  // Atualizar request
  static async update(id: string, data: UpdateArticleRequestData) {
    return await articleRequestModel.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  // Atualizar request por requestId da API externa
  static async updateByRequestId(requestId: number, data: UpdateArticleRequestData) {
    return await articleRequestModel.updateMany({
      where: { requestId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })
  }

  // Deletar request
  static async delete(id: string) {
    return await articleRequestModel.delete({
      where: { id },
    })
  }

  // Buscar requests pendentes (para monitoramento)
  static async getPendingRequests() {
    return await articleRequestModel.findMany({
      where: {
        status: {
          notIn: ['completed', 'error'],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  // Buscar requests por status
  static async getByStatus(status: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit
    
    const [requests, total] = await Promise.all([
      articleRequestModel.findMany({
        where: { status },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      articleRequestModel.count({
        where: { status },
      }),
    ])

    return {
      requests,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  // Buscar estatísticas de requests
  static async getStatistics(userId?: string) {
    const whereClause = userId ? { userId } : {}

    const [
      total,
      pending,
      processing,
      completed,
      error,
    ] = await Promise.all([
      articleRequestModel.count({ where: whereClause }),
      articleRequestModel.count({ where: { ...whereClause, status: 'pending' } }),
      articleRequestModel.count({ 
        where: { 
          ...whereClause, 
          status: { 
            notIn: ['pending', 'completed', 'error'] 
          } 
        } 
      }),
      articleRequestModel.count({ where: { ...whereClause, status: 'completed' } }),
      articleRequestModel.count({ where: { ...whereClause, status: 'error' } }),
    ])

    return {
      total,
      pending,
      processing,
      completed,
      error,
    }
  }
}
