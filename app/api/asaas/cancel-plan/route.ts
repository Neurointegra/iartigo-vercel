import { NextRequest, NextResponse } from 'next/server'
import { AsaasService } from '@/lib/services/asaas.service'
import { UserService } from '@/lib/services/user.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔍 Dados recebidos na API de cancelamento:', body)
    
    const { userId, subscriptionId } = body

    if (!userId || !subscriptionId) {
      console.log('❌ Campos obrigatórios faltando:', { userId, subscriptionId })
      return NextResponse.json(
        { error: 'userId e subscriptionId são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar usuário atual
    console.log('🔍 Buscando usuário com ID:', userId)
    const currentUser = await UserService.getById(userId)
    if (!currentUser) {
      console.log('❌ Usuário não encontrado para ID:', userId)
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    console.log('✅ Usuário encontrado:', { id: currentUser.id, name: currentUser.name, plan: currentUser.plan })

    // Cancelar assinatura no Asaas
    try {
      await AsaasService.cancelSubscription(subscriptionId)
    } catch (error) {
      console.error('Erro ao cancelar assinatura no Asaas:', error)
      // Continuar mesmo se falhar no Asaas, pois pode ser que a assinatura já tenha sido cancelada
    }

    // Atualizar usuário para remover completamente o plano
    const updateData: any = {
      plan: 'Por Artigo',
      planType: 'per-article',
      articlesLimit: 0,
      creditsRemaining: 0,
      subscriptionStatus: 'cancelled',
      subscriptionId: null, // Remover referência à assinatura cancelada
      subscriptionExpiresAt: null, // Remover data de expiração
      subscriptionPaidAt: null, // Remover data do último pagamento
    }

    console.log('🔄 Dados para atualização do usuário:', updateData)
    console.log('🔄 Plano atual do usuário:', currentUser.plan)
    console.log('🔄 Status atual da assinatura:', currentUser.subscriptionStatus)

    await UserService.update(userId, updateData)
    console.log('✅ Usuário atualizado com sucesso - plano removido')

    return NextResponse.json({
      success: true,
      message: 'Plano cancelado com sucesso',
      data: {
        status: 'cancelled',
        effectiveDate: 'imediato',
        message: 'Seu plano foi removido e você voltou ao plano gratuito "Por Artigo"'
      }
    })

  } catch (error) {
    console.error('Erro ao cancelar plano:', error)
    
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
