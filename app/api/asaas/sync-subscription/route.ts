import { NextRequest, NextResponse } from 'next/server'
import { AsaasService } from '@/lib/services/asaas.service'
import { prisma } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        payments: {
          where: {
            asaasSubscriptionId: { not: null }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Buscar pagamento com subscriptionId
    const payment = user.payments[0]
    if (!payment?.asaasSubscriptionId) {
      return NextResponse.json(
        { error: 'Usuário não possui assinatura no Asaas' },
        { status: 400 }
      )
    }

    // Buscar dados da assinatura no Asaas
    const subscription = await AsaasService.getSubscriptionStatus(payment.asaasSubscriptionId)
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'Assinatura não encontrada no Asaas' },
        { status: 404 }
      )
    }

    // Atualizar usuário com dados da assinatura
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status || 'active',
        subscriptionExpiresAt: subscription.nextDueDate ? new Date(subscription.nextDueDate) : null,
        subscriptionPaidAt: subscription.nextDueDate ? new Date(subscription.nextDueDate) : null,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Assinatura sincronizada com sucesso',
      data: {
        subscriptionId: subscription.id,
        status: subscription.status,
        nextDueDate: subscription.nextDueDate,
        user: {
          id: updatedUser.id,
          subscriptionId: updatedUser.subscriptionId,
          subscriptionStatus: updatedUser.subscriptionStatus,
          subscriptionExpiresAt: updatedUser.subscriptionExpiresAt,
        }
      }
    })

  } catch (error) {
    console.error('Erro ao sincronizar assinatura:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
