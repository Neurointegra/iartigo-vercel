import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const signature = request.headers.get("green-signature")

    // Verificar assinatura do webhook (segurança)
    const GREEN_WEBHOOK_SECRET = process.env.GREEN_WEBHOOK_SECRET

    if (!GREEN_WEBHOOK_SECRET || !signature) {
      return NextResponse.json({ error: "Webhook não autorizado" }, { status: 401 })
    }

    // Processar evento do webhook
    const { event_type, data } = body

    switch (event_type) {
      case "payment.completed":
        await handlePaymentCompleted(data)
        break

      case "payment.failed":
        await handlePaymentFailed(data)
        break

      case "subscription.created":
        await handleSubscriptionCreated(data)
        break

      case "subscription.cancelled":
        await handleSubscriptionCancelled(data)
        break

      default:
        console.log(`Evento não tratado: ${event_type}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro no webhook Green:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

async function handlePaymentCompleted(data: any) {
  // Ativar acesso do usuário
  console.log("Pagamento confirmado:", data)

  // Aqui você salvaria no banco de dados:
  // - Ativar plano do usuário
  // - Registrar pagamento
  // - Enviar email de confirmação
  // - Liberar acesso ao dashboard
}

async function handlePaymentFailed(data: any) {
  // Notificar falha no pagamento
  console.log("Pagamento falhou:", data)

  // Aqui você:
  // - Notificaria o usuário
  // - Registraria a tentativa falhada
  // - Ofereceria nova tentativa
}

async function handleSubscriptionCreated(data: any) {
  // Assinatura criada com sucesso
  console.log("Assinatura criada:", data)
}

async function handleSubscriptionCancelled(data: any) {
  // Assinatura cancelada
  console.log("Assinatura cancelada:", data)

  // Aqui você:
  // - Desativaria o plano do usuário
  // - Manteria acesso até o fim do período pago
  // - Enviaria email de confirmação
}
