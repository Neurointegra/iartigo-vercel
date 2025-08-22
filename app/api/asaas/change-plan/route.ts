import { NextRequest, NextResponse } from 'next/server'
import { AsaasService } from '@/lib/services/asaas.service'
import { UserService } from '@/lib/services/user.service'
import { PaymentService } from '@/lib/services/payment.service'
import { prisma } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔍 Dados recebidos na API de mudança de plano:', body)
    
    const { userId, currentPlanType, newPlanType, userCpf } = body

    if (!userId || !currentPlanType || !newPlanType || !userCpf) {
      console.log('❌ Campos obrigatórios faltando:', { userId, currentPlanType, newPlanType, userCpf })
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar usuário atual com campos de subscription
    console.log('🔍 Buscando usuário com ID:', userId)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    }) as any // Cast para any para acessar campos de subscription
    if (!currentUser) {
      console.log('❌ Usuário não encontrado para ID:', userId)
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    console.log('✅ Usuário encontrado:', { id: currentUser.id, name: currentUser.name, plan: currentUser.plan, subscriptionId: currentUser.subscriptionId })

    // Configurações dos planos
    const planConfigs = {
      estudante: { value: 29.90, creditsAmount: 1, description: 'Plano Estudante' },
      pesquisador: { value: 99.90, creditsAmount: 5, description: 'Plano Pesquisador' },
      institucional: { value: 297.00, creditsAmount: null, description: 'Plano Institucional' }
    }

    const newPlanConfig = planConfigs[newPlanType as keyof typeof planConfigs]
    if (!newPlanConfig) {
      return NextResponse.json(
        { error: 'Tipo de plano inválido' },
        { status: 400 }
      )
    }

    // Verificar se é um upgrade (mais artigos) ou downgrade (menos artigos)
    const currentPlanConfig = planConfigs[currentPlanType.toLowerCase() as keyof typeof planConfigs]
    const isUpgrade = currentPlanConfig && newPlanConfig.creditsAmount && currentPlanConfig.creditsAmount && 
                     newPlanConfig.creditsAmount > currentPlanConfig.creditsAmount
    const isDowngrade = currentPlanConfig && newPlanConfig.creditsAmount && currentPlanConfig.creditsAmount && 
                       newPlanConfig.creditsAmount < currentPlanConfig.creditsAmount

    // Se for downgrade, apenas atualizar o plano (entra em vigor no próximo ciclo)
    if (isDowngrade) {
      const updateData: any = {
        plan: newPlanConfig.description,
        planType: newPlanType,
        articlesLimit: newPlanConfig.creditsAmount,
        // Manter artigos usados e data de expiração atuais
      }

      await UserService.update(userId, updateData)

      return NextResponse.json({
        success: true,
        message: 'Plano alterado com sucesso. O novo plano entrará em vigor no próximo ciclo de cobrança.',
        data: {
          newPlan: newPlanConfig.description,
          newLimit: newPlanConfig.creditsAmount,
          effectiveDate: 'próximo ciclo'
        }
      })
    }

    // Se for upgrade ou mudança lateral, aplicar imediatamente com artigos bônus
    let newArticlesLimit = newPlanConfig.creditsAmount
    let articlesBonus = 0
    
    // Se for plano institucional (ilimitado), não aplicar bônus
    if (newPlanType === 'institucional') {
      newArticlesLimit = null // Ilimitado
      articlesBonus = 0
    }

    // CANCELAR ASSINATURA ANTIGA se existir
    if (currentUser.subscriptionId) {
      console.log('🔄 Cancelando assinatura antiga:', currentUser.subscriptionId)
      console.log('🔄 Status atual da assinatura:', currentUser.subscriptionStatus)
      
      try {
        await AsaasService.cancelSubscription(currentUser.subscriptionId)
        console.log('✅ Assinatura antiga cancelada com sucesso no Asaas')
        
        // Atualizar status local da assinatura para 'cancelled'
        await UserService.update(userId, {
          subscriptionStatus: 'cancelled'
        })
        console.log('✅ Status local atualizado para "cancelled"')
        
      } catch (error) {
        console.warn('⚠️ Erro ao cancelar assinatura antiga:', error)
        console.warn('⚠️ Continuando com a criação da nova assinatura...')
        // Continuar mesmo se falhar o cancelamento
      }
    } else {
      console.log('ℹ️ Usuário não possui assinatura ativa para cancelar')
    }

    if (isUpgrade && currentPlanConfig && newPlanConfig.creditsAmount) {
      // Calcular artigos bônus: artigos restantes do plano atual
      const currentArticlesRemaining = Math.max(0, (currentPlanConfig.creditsAmount || 0) - (currentUser.articlesUsed || 0))
      articlesBonus = currentArticlesRemaining
      newArticlesLimit = newPlanConfig.creditsAmount + articlesBonus
      
      console.log('🔍 Cálculo de artigos bônus:', {
        currentPlanCredits: currentPlanConfig.creditsAmount,
        currentArticlesUsed: currentUser.articlesUsed,
        currentArticlesRemaining,
        newPlanCredits: newPlanConfig.creditsAmount,
        articlesBonus,
        newArticlesLimit
      })
    }

    // Criar nova assinatura no Asaas
    const asaasCustomer = await AsaasService.createOrUpdateCustomer({
      name: currentUser.name,
      email: currentUser.email,
      cpfCnpj: userCpf,
      phone: '', // Campo não obrigatório
    })

    // Criar nova assinatura
    console.log('🔍 Criando assinatura no Asaas:', {
      customer: asaasCustomer.id,
      value: newPlanConfig.value,
      description: newPlanConfig.description
    })
    
    const asaasSubscription = await AsaasService.createSubscription({
      customer: asaasCustomer.id,
      billingType: 'CREDIT_CARD',
      value: newPlanConfig.value,
      nextDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Amanhã
      cycle: 'MONTHLY',
      description: newPlanConfig.description,
    })
    
    console.log('✅ Assinatura criada no Asaas:', asaasSubscription.id)

    // Criar pagamento inicial
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 1) // Vencimento amanhã

    const paymentData = {
      customer: asaasCustomer.id,
      billingType: 'CREDIT_CARD' as const,
      value: newPlanConfig.value,
      dueDate: dueDate.toISOString().split('T')[0],
      description: newPlanConfig.description,
      externalReference: userId,
      // Removido o campo subscription - não é suportado pela API do Asaas
    }

    console.log('🔍 Dados do pagamento para Asaas:', paymentData)
    
    const paymentLink = await AsaasService.createPayment(paymentData)
    console.log('✅ Pagamento criado no Asaas:', paymentLink)

    // Criar registro de pagamento no banco local
    const payment = await PaymentService.create({
      amount: newPlanConfig.value,
      currency: 'BRL',
      planType: newPlanType,
      creditsAmount: newPlanConfig.creditsAmount || undefined,
      userId,
      asaasId: paymentLink.id,
      asaasCustomerId: asaasCustomer.id,
      asaasSubscriptionId: asaasSubscription.id,
      description: newPlanConfig.description,
      externalReference: userId,
      dueDate: dueDate,
      checkoutUrl: paymentLink.paymentUrl || '',
    })

    // Atualizar usuário com novo plano
    const now = new Date()
    const expiresAt = new Date(now)
    expiresAt.setMonth(expiresAt.getMonth() + 1)

    const updateData: any = {
      plan: newPlanConfig.description,
      planType: newPlanType,
      articlesLimit: newArticlesLimit,
      articlesUsed: 0, // Resetar contador
      subscriptionId: asaasSubscription.id,
      subscriptionStatus: 'active',
      subscriptionExpiresAt: expiresAt,
      subscriptionPaidAt: now,
    }

    console.log('🔄 Atualizando usuário com novo plano:', updateData)
    await UserService.update(userId, updateData)
    console.log('✅ Usuário atualizado com novo plano e assinatura')

    return NextResponse.json({
      success: true,
      message: 'Plano alterado com sucesso!',
      data: {
        newPlan: newPlanConfig.description,
        newLimit: newArticlesLimit,
        articlesBonus: articlesBonus,
        checkoutUrl: paymentLink.paymentUrl,
        paymentId: paymentLink.id,
        subscriptionId: asaasSubscription.id
      }
    })

  } catch (error) {
    console.error('Erro ao alterar plano:', error)
    
    // Log detalhado do erro
    if (error instanceof Error) {
      console.error('Erro detalhado:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
