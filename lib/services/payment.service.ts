import { prisma } from '@/lib/database'

export type CreatePaymentData = {
  amount: number
  currency?: string
  planType: string
  creditsAmount?: number
  userId: string
  hotmartId?: string
  checkoutUrl?: string
}

export type UpdatePaymentData = {
  status?: string
  paymentMethod?: string
  transactionId?: string
  processedAt?: Date
  hotmartId?: string
}

export class PaymentService {
  // Create payment
  static async create(data: CreatePaymentData) {
    return await prisma.payment.create({
      data,
      include: {
        user: true,
      },
    })
  }

  // Get payment by ID
  static async getById(id: string) {
    return await prisma.payment.findUnique({
      where: { id },
      include: {
        user: true,
      },
    })
  }

  // Get payment by Hotmart ID
  static async getByHotmartId(hotmartId: string) {
    return await prisma.payment.findUnique({
      where: { hotmartId },
      include: {
        user: true,
      },
    })
  }

  // Update payment
  static async update(id: string, data: UpdatePaymentData) {
    return await prisma.payment.update({
      where: { id },
      data,
      include: {
        user: true,
      },
    })
  }

  // Update payment by Hotmart ID
  static async updateByHotmartId(hotmartId: string, data: UpdatePaymentData) {
    return await prisma.payment.update({
      where: { hotmartId },
      data,
      include: {
        user: true,
      },
    })
  }

  // Delete payment
  static async delete(id: string) {
    return await prisma.payment.delete({
      where: { id },
    })
  }

  // Get payments by user ID
  static async getByUserId(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit
    
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({
        where: { userId },
      }),
    ])

    return {
      payments,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  // Get all payments with pagination
  static async getAll(page = 1, limit = 10, status?: string) {
    const skip = (page - 1) * limit
    const where = status ? { status } : {}
    
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
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
      prisma.payment.count({ where }),
    ])

    return {
      payments,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  // Complete payment and update user credits/usage
  static async completePayment(id: string, transactionId?: string) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!payment) {
      throw new Error('Payment not found')
    }

    if (payment.status === 'completed') {
      return payment // Already completed
    }

    // Start transaction
    return await prisma.$transaction(async (tx: any) => {
      // Update payment status
      const updatedPayment = await tx.payment.update({
        where: { id },
        data: {
          status: 'completed',
          processedAt: new Date(),
          transactionId,
        },
        include: { user: true },
      })

      // Update user based on plan type
      if (payment.planType === 'per-article' && payment.creditsAmount) {
        // Add credits for per-article plan
        await tx.user.update({
          where: { id: payment.userId },
          data: {
            creditsRemaining: {
              increment: payment.creditsAmount,
            },
          },
        })
      } else if (payment.planType === 'monthly') {
        // Set monthly plan
        await tx.user.update({
          where: { id: payment.userId },
          data: {
            plan: 'Profissional',
            planType: 'monthly',
            articlesLimit: 5,
            articlesUsed: 0, // Reset monthly usage
          },
        })
      } else if (payment.planType === 'annual') {
        // Set annual plan
        await tx.user.update({
          where: { id: payment.userId },
          data: {
            plan: 'Institucional',
            planType: 'annual',
            articlesLimit: null, // Unlimited
            articlesUsed: 0,
          },
        })
      }

      return updatedPayment
    })
  }

  // Cancel payment
  static async cancelPayment(id: string) {
    return await prisma.payment.update({
      where: { id },
      data: {
        status: 'cancelled',
      },
    })
  }

  // Get payment statistics
  static async getStatistics(userId?: string) {
    const whereClause = userId ? { userId } : {}

    const [
      total,
      completed,
      pending,
      failed,
      totalRevenue,
      monthlyRevenue,
    ] = await Promise.all([
      prisma.payment.count({ where: whereClause }),
      prisma.payment.count({ where: { ...whereClause, status: 'completed' } }),
      prisma.payment.count({ where: { ...whereClause, status: 'pending' } }),
      prisma.payment.count({ where: { ...whereClause, status: 'failed' } }),
      prisma.payment.aggregate({
        where: { ...whereClause, status: 'completed' },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          ...whereClause,
          status: 'completed',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { amount: true },
      }),
    ])

    return {
      total,
      completed,
      pending,
      failed,
      totalRevenue: totalRevenue._sum.amount || 0,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
    }
  }

  // Get pending payments
  static async getPendingPayments() {
    return await prisma.payment.findMany({
      where: {
        status: 'pending',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  // Get revenue by period
  static async getRevenueByPeriod(days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    const payments = await prisma.payment.findMany({
      where: {
        status: 'completed',
        createdAt: { gte: startDate },
      },
      select: {
        amount: true,
        createdAt: true,
        planType: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Group by date
    const revenueByDate: Record<string, { total: number; count: number; byPlan: Record<string, number> }> = {}
    
    payments.forEach((payment: any) => {
      const dateKey = payment.createdAt.toISOString().split('T')[0]
      
      if (!revenueByDate[dateKey]) {
        revenueByDate[dateKey] = { total: 0, count: 0, byPlan: {} }
      }
      
      revenueByDate[dateKey].total += payment.amount
      revenueByDate[dateKey].count += 1
      revenueByDate[dateKey].byPlan[payment.planType] = 
        (revenueByDate[dateKey].byPlan[payment.planType] || 0) + payment.amount
    })

    return Object.entries(revenueByDate).map(([date, data]) => ({
      date,
      ...data,
    }))
  }
}
