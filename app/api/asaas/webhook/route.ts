import { NextRequest, NextResponse } from 'next/server'
import { AsaasService } from '@/lib/services/asaas.service'
import { PaymentService } from '@/lib/services/payment.service'
import { UserService } from '@/lib/services/user.service'

export async function POST(request: NextRequest) {
  try {
    console.log('📨 Webhook recebido do Asaas')

    // Obter dados da requisição
    const body = await request.text()
    const asaasSignature = request.headers.get('asaas-access-token')

    // Validar assinatura do webhook (se necessário)
    if (asaasSignature && !AsaasService.validateWebhookSignature(body, asaasSignature)) {
      console.error('🚫 Assinatura do webhook Asaas inválida')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const webhookData = JSON.parse(body)
    const { event, payment } = webhookData

    console.log(`🔔 Evento: ${event} | Pagamento: ${payment?.id || 'N/A'}`)

    // Processar evento baseado no tipo
    const result = await processAsaasEvent(event, webhookData)

    return NextResponse.json({
      success: true,
      event_processed: event,
      payment_id: payment?.id,
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('💥 Erro no webhook Asaas:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

async function processAsaasEvent(eventType: string, eventData: any) {
  switch (eventType) {
    case 'PAYMENT_RECEIVED':
      return await handlePaymentReceived(eventData)
    case 'PAYMENT_CONFIRMED':
      return await handlePaymentConfirmed(eventData)
    case 'PAYMENT_OVERDUE':
      return await handlePaymentOverdue(eventData)
    case 'PAYMENT_DELETED':
      return await handlePaymentDeleted(eventData)
    case 'PAYMENT_RESTORED':
      return await handlePaymentRestored(eventData)
    case 'PAYMENT_UPDATED':
      return await handlePaymentUpdated(eventData)
    case 'SUBSCRIPTION_CREATED':
      return await handleSubscriptionCreated(eventData)
    case 'SUBSCRIPTION_UPDATED':
      return await handleSubscriptionUpdated(eventData)
    case 'SUBSCRIPTION_CANCELLED':
      return await handleSubscriptionCancelled(eventData)
    default:
      console.log(`⚠️ Evento Asaas não tratado: ${eventType}`)
      return { status: 'ignored', event: eventType }
  }
}

async function handlePaymentReceived(eventData: any) {
  try {
    const { payment } = eventData
    console.log('💰 Pagamento recebido:', payment.id)

    // Buscar pagamento no banco local
    const localPayment = await PaymentService.getByAsaasId ? 
      await PaymentService.getByAsaasId(payment.id) : null

    if (!localPayment) {
      console.warn('⚠️ Pagamento não encontrado no banco local:', payment.id)
      return { status: 'payment_not_found', paymentId: payment.id }
    }

    // Atualizar status do pagamento
    await PaymentService.update(localPayment.id, {
      status: 'completed',
      processedAt: new Date(),
      transactionId: payment.id,
    })

    // Ativar plano do usuário
    await activateUserPlan(localPayment.userId, localPayment.planType)

    console.log(`✅ Plano ${localPayment.planType} ativado para usuário ${localPayment.userId}`)

    return {
      status: 'processed',
      actions: ['payment_confirmed', 'plan_activated'],
      userId: localPayment.userId,
      planType: localPayment.planType,
      paymentId: payment.id,
    }
  } catch (error) {
    console.error('❌ Erro ao processar pagamento recebido:', error)
    throw error
  }
}

async function handlePaymentConfirmed(eventData: any) {
  // Similar ao handlePaymentReceived
  return await handlePaymentReceived(eventData)
}

async function handlePaymentOverdue(eventData: any) {
  try {
    const { payment } = eventData
    console.log('⏰ Pagamento em atraso:', payment.id)

    // Buscar pagamento no banco local
    const localPayment = await PaymentService.getByAsaasId ? 
      await PaymentService.getByAsaasId(payment.id) : null

    if (localPayment) {
      // Atualizar status do pagamento
      await PaymentService.update(localPayment.id, {
        status: 'overdue',
      })

      // Opcional: Suspender acesso do usuário ou enviar notificação
      // await suspendUserAccess(localPayment.userId)
    }

    return {
      status: 'processed',
      actions: ['payment_marked_overdue'],
      paymentId: payment.id,
    }
  } catch (error) {
    console.error('❌ Erro ao processar pagamento em atraso:', error)
    throw error
  }
}

async function handlePaymentDeleted(eventData: any) {
  try {
    const { payment } = eventData
    console.log('🗑️ Pagamento cancelado:', payment.id)

    // Buscar pagamento no banco local
    const localPayment = await PaymentService.getByAsaasId ? 
      await PaymentService.getByAsaasId(payment.id) : null

    if (localPayment) {
      // Atualizar status do pagamento
      await PaymentService.update(localPayment.id, {
        status: 'cancelled',
      })

      // Desativar plano do usuário
      await deactivateUserPlan(localPayment.userId)
    }

    return {
      status: 'processed',
      actions: ['payment_cancelled', 'plan_deactivated'],
      paymentId: payment.id,
    }
  } catch (error) {
    console.error('❌ Erro ao processar cancelamento de pagamento:', error)
    throw error
  }
}

async function handlePaymentRestored(eventData: any) {
  try {
    const { payment } = eventData
    console.log('🔄 Pagamento restaurado:', payment.id)

    // Buscar pagamento no banco local
    const localPayment = await PaymentService.getByAsaasId ? 
      await PaymentService.getByAsaasId(payment.id) : null

    if (localPayment) {
      // Atualizar status do pagamento
      await PaymentService.update(localPayment.id, {
        status: 'pending',
      })
    }

    return {
      status: 'processed',
      actions: ['payment_restored'],
      paymentId: payment.id,
    }
  } catch (error) {
    console.error('❌ Erro ao processar restauração de pagamento:', error)
    throw error
  }
}

async function activateUserPlan(userId: string, planType: string) {
  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setMonth(expiresAt.getMonth() + 1) // 1 mês de validade

  let updateData: any = {
    subscriptionPaidAt: now,
    subscriptionExpiresAt: expiresAt,
  }

  // Configurar plano baseado no tipo
  switch (planType) {
    case 'estudante':
      updateData = {
        ...updateData,
        plan: 'Estudante',
        planType: 'monthly',
        articlesLimit: 1,
        articlesUsed: 0,
      }
      break
    case 'pesquisador':
      updateData = {
        ...updateData,
        plan: 'Pesquisador',
        planType: 'monthly',
        articlesLimit: 5,
        articlesUsed: 0,
      }
      break
    case 'institucional':
      updateData = {
        ...updateData,
        plan: 'Institucional',
        planType: 'monthly',
        articlesLimit: null, // Ilimitado
        articlesUsed: 0,
      }
      break
  }

  await UserService.update(userId, updateData)
}

async function deactivateUserPlan(userId: string) {
  await UserService.update(userId, {
    plan: 'Por Artigo',
    planType: 'per-article',
    articlesLimit: 0,
    creditsRemaining: 0,
  })
}

async function handlePaymentUpdated(eventData: any) {
  try {
    const { payment } = eventData
    console.log('📝 Pagamento atualizado:', payment.id)

    // Buscar pagamento no banco local
    const localPayment = await PaymentService.getByAsaasId ? 
      await PaymentService.getByAsaasId(payment.id) : null

    if (!localPayment) {
      console.warn('⚠️ Pagamento não encontrado no banco local:', payment.id)
      return { status: 'payment_not_found', paymentId: payment.id }
    }

    // Atualizar status do pagamento baseado no status do Asaas
    let newStatus = 'pending'
    if (payment.status === 'CONFIRMED') {
      newStatus = 'completed'
      // Ativar plano do usuário
      await activateUserPlan(localPayment.userId, localPayment.planType)
    } else if (payment.status === 'OVERDUE') {
      newStatus = 'overdue'
    } else if (payment.status === 'CANCELLED') {
      newStatus = 'cancelled'
    }

    await PaymentService.update(localPayment.id, {
      status: newStatus,
      processedAt: new Date(),
    })

    return {
      status: 'processed',
      actions: ['payment_updated', newStatus === 'completed' ? 'plan_activated' : null].filter(Boolean),
      paymentId: payment.id,
      newStatus,
    }
  } catch (error) {
    console.error('❌ Erro ao processar atualização de pagamento:', error)
    throw error
  }
}

async function handleSubscriptionCreated(eventData: any) {
  try {
    const { subscription } = eventData
    console.log('📅 Assinatura criada:', subscription.id)

    return {
      status: 'processed',
      actions: ['subscription_created'],
      subscriptionId: subscription.id,
    }
  } catch (error) {
    console.error('❌ Erro ao processar criação de assinatura:', error)
    throw error
  }
}

async function handleSubscriptionUpdated(eventData: any) {
  try {
    const { subscription } = eventData
    console.log('📝 Assinatura atualizada:', subscription.id)

    // Buscar pagamento no banco local pela assinatura
    const localPayment = await PaymentService.getByAsaasId ? 
      await PaymentService.getByAsaasId(subscription.id) : null

    if (!localPayment) {
      console.warn('⚠️ Assinatura não encontrada no banco local:', subscription.id)
      return { status: 'subscription_not_found', subscriptionId: subscription.id }
    }

    // Atualizar status baseado no status da assinatura
    if (subscription.status === 'ACTIVE') {
      // Ativar plano do usuário
      await activateUserPlan(localPayment.userId, localPayment.planType)
    } else if (subscription.status === 'OVERDUE') {
      // Marcar como vencida
      await PaymentService.update(localPayment.id, { status: 'overdue' })
    } else if (subscription.status === 'CANCELLED') {
      // Desativar plano
      await deactivateUserPlan(localPayment.userId)
      await PaymentService.update(localPayment.id, { status: 'cancelled' })
    }

    return {
      status: 'processed',
      actions: ['subscription_updated', subscription.status],
      subscriptionId: subscription.id,
      newStatus: subscription.status,
    }
  } catch (error) {
    console.error('❌ Erro ao processar atualização de assinatura:', error)
    throw error
  }
}

async function handleSubscriptionCancelled(eventData: any) {
  try {
    const { subscription } = eventData
    console.log('❌ Assinatura cancelada:', subscription.id)

    // Buscar pagamento no banco local pela assinatura
    const localPayment = await PaymentService.getByAsaasId ? 
      await PaymentService.getByAsaasId(subscription.id) : null

    if (localPayment) {
      // Desativar plano do usuário
      await deactivateUserPlan(localPayment.userId)
      await PaymentService.update(localPayment.id, { status: 'cancelled' })
    }

    return {
      status: 'processed',
      actions: ['subscription_cancelled', 'plan_deactivated'],
      subscriptionId: subscription.id,
    }
  } catch (error) {
    console.error('❌ Erro ao processar cancelamento de assinatura:', error)
    throw error
  }
}
