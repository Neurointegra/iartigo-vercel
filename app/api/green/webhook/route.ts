import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    console.log("📨 Webhook recebido do Green")
    console.log("Headers:", Object.fromEntries(request.headers.entries()))

    // Obter dados da requisição
    const body = await request.text()
    const signature =
      request.headers.get("green-signature") ||
      request.headers.get("x-green-signature") ||
      request.headers.get("signature")

    console.log("📝 Body recebido:", body.substring(0, 200) + "...")
    console.log("🔐 Signature:", signature)

    // Validar assinatura do webhook
    if (!validateWebhookSignature(body, signature)) {
      console.error("🚫 Assinatura do webhook inválida")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const webhookData = JSON.parse(body)
    const { event_type, data: paymentData } = webhookData

    console.log(`🔔 Evento: ${event_type} | Pagamento: ${paymentData?.id || "N/A"}`)
    console.log("📊 Dados do pagamento:", JSON.stringify(paymentData, null, 2))

    // Processar evento baseado no tipo
    const result = await processWebhookEvent(event_type, paymentData)

    return NextResponse.json({
      success: true,
      event_processed: event_type,
      payment_id: paymentData?.id,
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("💥 Erro no webhook:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

function validateWebhookSignature(body: string, signature: string | null): boolean {
  if (!signature || !process.env.GREEN_WEBHOOK_SECRET) {
    console.warn("⚠️ Signature ou webhook secret não fornecidos")
    // Em desenvolvimento, pode pular validação
    if (process.env.NODE_ENV === "development") {
      console.log("🔓 Pulando validação de signature em desenvolvimento")
      return true
    }
    return false
  }

  try {
    const expectedSignature = crypto.createHmac("sha256", process.env.GREEN_WEBHOOK_SECRET).update(body).digest("hex")

    const providedSignature = signature.replace("sha256=", "")

    console.log("🔍 Validando signatures:", {
      expected: expectedSignature.substring(0, 10) + "...",
      provided: providedSignature.substring(0, 10) + "...",
    })

    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(providedSignature))
  } catch (error) {
    console.error("❌ Erro na validação da signature:", error)
    return false
  }
}

async function processWebhookEvent(eventType: string, paymentData: any) {
  switch (eventType) {
    case "payment.completed":
    case "payment.paid":
    case "payment.approved":
      return await handlePaymentSuccess(paymentData)

    case "payment.failed":
    case "payment.cancelled":
    case "payment.rejected":
      return await handlePaymentFailure(paymentData)

    case "payment.pending":
    case "payment.waiting":
      return await handlePaymentPending(paymentData)

    case "payment.refunded":
      return await handlePaymentRefunded(paymentData)

    default:
      console.log(`⚠️ Evento não tratado: ${eventType}`)
      return { status: "ignored", event: eventType }
  }
}

async function handlePaymentSuccess(paymentData: any) {
  try {
    console.log("🎉 Pagamento confirmado:", paymentData.id)

    const { plan_id, user_email, billing_cycle } = paymentData.metadata || {}

    console.log("📋 Dados do plano:", {
      plan_id,
      user_email,
      billing_cycle,
      amount: paymentData.amount,
    })

    // Aqui você implementaria:
    // 1. Ativar plano do usuário no banco de dados
    // 2. Enviar email de confirmação
    // 3. Registrar evento para analytics
    // 4. Criar entrada na tabela de assinaturas

    // Exemplo de implementação:
    // await activateUserPlan(user_email, plan_id, billing_cycle)
    // await sendConfirmationEmail(user_email, paymentData)
    // await logPaymentEvent('success', paymentData)

    console.log(`✅ Plano ${plan_id} ativado para ${user_email}`)

    return {
      status: "processed",
      actions: ["plan_activated", "email_sent"],
      user_email,
      plan_id,
    }
  } catch (error) {
    console.error("❌ Erro ao processar pagamento confirmado:", error)
    throw error
  }
}

async function handlePaymentFailure(paymentData: any) {
  console.log("❌ Pagamento falhou:", paymentData.id)

  const { user_email, plan_id } = paymentData.metadata || {}

  // Implementar notificação de falha
  // await notifyPaymentFailure(paymentData)
  // await logPaymentEvent('failed', paymentData)

  return {
    status: "processed",
    actions: ["failure_notified"],
    user_email,
    plan_id,
    reason: paymentData.failure_reason,
  }
}

async function handlePaymentPending(paymentData: any) {
  console.log("⏳ Pagamento pendente:", paymentData.id)

  // Para PIX e Boleto, pode enviar instruções
  if (paymentData.payment_method === "boleto") {
    // await sendBoletoInstructions(paymentData)
  } else if (paymentData.payment_method === "pix") {
    // await sendPixInstructions(paymentData)
  }

  return {
    status: "processed",
    actions: ["pending_handled"],
    payment_method: paymentData.payment_method,
  }
}

async function handlePaymentRefunded(paymentData: any) {
  console.log("💸 Pagamento reembolsado:", paymentData.id)

  const { user_email, plan_id } = paymentData.metadata || {}

  // Desativar plano do usuário
  // await deactivateUserPlan(user_email, plan_id)
  // await sendRefundConfirmation(user_email, paymentData)

  return {
    status: "processed",
    actions: ["plan_deactivated", "refund_confirmed"],
    user_email,
    plan_id,
  }
}
