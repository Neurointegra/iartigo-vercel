import { NextRequest, NextResponse } from 'next/server'
import { AsaasService } from '@/lib/services/asaas.service'
import { PaymentService } from '@/lib/services/payment.service'

export async function POST(request: NextRequest) {
  try {
    const { paymentId } = await request.json()

    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar pagamento no banco local
    const localPayment = await PaymentService.getByAsaasId(paymentId)
    
    if (!localPayment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      )
    }

    // Verificar status no Asaas
    const asaasStatus = await AsaasService.getPaymentStatus(paymentId)
    
    console.log('🔍 Status do Asaas:', asaasStatus.status)
    console.log('🔍 Status local:', localPayment.status)
    
    // Atualizar status local se necessário
    if (asaasStatus.status !== localPayment.status) {
      await PaymentService.update(localPayment.id, {
        status: asaasStatus.status,
        processedAt: new Date(),
      })
      console.log('✅ Status local atualizado para:', asaasStatus.status)
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentId: localPayment.id,
        asaasId: paymentId,
        status: asaasStatus.status,
        localStatus: localPayment.status,
        planType: localPayment.planType,
        amount: localPayment.amount,
      }
    })

  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
