import { NextRequest, NextResponse } from 'next/server'
import { AsaasService } from '@/lib/services/asaas.service'
import { PaymentService } from '@/lib/services/payment.service'
import { UserService } from '@/lib/services/user.service'

export async function POST(request: NextRequest) {
  try {
    const { userId, planType, userCpf } = await request.json()

    if (!userId || !planType) {
      return NextResponse.json(
        { error: 'userId e planType são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar dados do usuário
    const user = await UserService.getById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Definir configurações dos planos
    const planConfigs = {
      'estudante': {
        name: 'Plano Estudante',
        description: 'Plano estudante do iArtigo - 1 artigo por mês',
        value: 29.90,
        cycle: 'MONTHLY' as const,
        creditsAmount: 0,
        articlesLimit: 1
      },
      'pesquisador': {
        name: 'Plano Pesquisador', 
        description: 'Plano pesquisador do iArtigo - 5 artigos por mês',
        value: 99.90,
        cycle: 'MONTHLY' as const,
        creditsAmount: 0,
        articlesLimit: 5
      },
      'institucional': {
        name: 'Plano Institucional',
        description: 'Plano institucional do iArtigo - artigos ilimitados',
        value: 297.00,
        cycle: 'MONTHLY' as const,
        creditsAmount: 0,
        articlesLimit: null
      }
    }

    const planConfig = planConfigs[planType as keyof typeof planConfigs]
    if (!planConfig) {
      return NextResponse.json(
        { error: 'Tipo de plano inválido' },
        { status: 400 }
      )
    }

    // Criar ou atualizar cliente no Asaas
    const customerData = {
      name: user.name,
      email: user.email,
      cpfCnpj: userCpf,
      phone: '',
      city: user.city || '',
      state: '',
    }

    const asaasCustomer = await AsaasService.createOrUpdateCustomer(customerData)
    
    // Verificar se o cliente foi criado/atualizado corretamente
    if (!asaasCustomer || !asaasCustomer.id) {
      console.error('❌ Erro ao criar/atualizar cliente no Asaas:', asaasCustomer)
      return NextResponse.json(
        { error: 'Erro ao criar cliente no Asaas' },
        { status: 500 }
      )
    }

    console.log('✅ Cliente Asaas criado/atualizado:', asaasCustomer.id)

    // Calcular data de vencimento (7 dias a partir de hoje)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 7)

    // Criar assinatura mensal recorrente no Asaas
    const subscriptionData = {
      customer: asaasCustomer.id,
      billingType: 'CREDIT_CARD' as const, // Forma de pagamento padrão
      value: planConfig.value,
      nextDueDate: dueDate.toISOString().split('T')[0], // YYYY-MM-DD
      cycle: planConfig.cycle,
      description: planConfig.description,
      externalReference: userId, // Referência para identificar o usuário
    }

    // Criar assinatura recorrente
    console.log('📅 Criando assinatura no Asaas...')
    const asaasSubscription = await AsaasService.createSubscription(subscriptionData)
    
    // Verificar se a assinatura foi criada corretamente
    if (!asaasSubscription || !asaasSubscription.id) {
      console.error('❌ Erro ao criar assinatura no Asaas:', asaasSubscription)
      return NextResponse.json(
        { error: 'Erro ao criar assinatura no Asaas' },
        { status: 500 }
      )
    }

    console.log('✅ Assinatura Asaas criada:', asaasSubscription.id)
    console.log('🔍 Resposta completa do Asaas:', JSON.stringify(asaasSubscription, null, 2))

    // Gerar link de pagamento usando o método que já funcionou
    console.log('🔗 Gerando link de pagamento...')
    const paymentData = {
      customer: asaasCustomer.id,
      billingType: 'CREDIT_CARD' as const,
      value: planConfig.value,
      dueDate: dueDate.toISOString().split('T')[0],
      description: `Pagamento inicial - ${planConfig.description}`,
      externalReference: `${userId}_initial`,
    }

    console.log('🔍 Dados do pagamento:', JSON.stringify(paymentData, null, 2))
    const paymentLink = await AsaasService.generatePaymentLink(paymentData)
    console.log('✅ Link de pagamento gerado:', paymentLink.paymentUrl)
    console.log('🔍 Resposta completa do pagamento:', JSON.stringify(paymentLink, null, 2))

    // Criar registro de pagamento no banco local
    const payment = await PaymentService.create({
      amount: planConfig.value,
      currency: 'BRL',
      planType,
      creditsAmount: planConfig.creditsAmount,
      userId,
      asaasId: asaasSubscription.id,
      asaasCustomerId: asaasCustomer.id,
      asaasSubscriptionId: asaasSubscription.id, // ID da assinatura
      description: planConfig.description,
      externalReference: userId,
      dueDate: dueDate,
      checkoutUrl: paymentLink.paymentUrl || '', // URL do link de pagamento
    })

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        asaasSubscriptionId: asaasSubscription.id,
        checkoutUrl: paymentLink.paymentUrl || '',
        dueDate: dueDate.toISOString(),
        amount: planConfig.value,
        planType,
        description: planConfig.description,
      },
    })

  } catch (error) {
    console.error('Erro ao criar pagamento Asaas:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
