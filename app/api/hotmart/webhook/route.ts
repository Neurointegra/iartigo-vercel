import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    console.log("📨 Webhook recebido do Hotmart")
    console.log("Headers:", Object.fromEntries(request.headers.entries()))

    // Obter dados da requisição
    const body = await request.text()
    const hotmartSignature = request.headers.get("x-hotmart-hottok")

    console.log("📝 Body recebido:", body.substring(0, 200) + "...")
    console.log("🔐 Hotmart Signature:", hotmartSignature)

    // Validar assinatura do webhook Hotmart
    if (!validateHotmartSignature(body, hotmartSignature)) {
      console.error("🚫 Assinatura do webhook Hotmart inválida")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const webhookData = JSON.parse(body)
    const { event, data } = webhookData

    console.log(`🔔 Evento: ${event} | Transação: ${data?.transaction || "N/A"}`)
    console.log("📊 Dados da transação:", JSON.stringify(data, null, 2))

    // Processar evento baseado no tipo
    const result = await processHotmartEvent(event, data)

    return NextResponse.json({
      success: true,
      event_processed: event,
      transaction_id: data?.transaction,
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("💥 Erro no webhook Hotmart:", error)
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

function validateHotmartSignature(body: string, signature: string | null): boolean {
  if (!signature || !process.env.HOTMART_WEBHOOK_TOKEN) {
    console.warn("⚠️ Signature ou webhook token não fornecidos")
    // Em desenvolvimento, pode pular validação
    if (process.env.NODE_ENV === "development") {
      console.log("🔓 Pulando validação de signature em desenvolvimento")
      return true
    }
    return false
  }

  try {
    // Hotmart usa um token específico para validação
    const expectedSignature = crypto
      .createHash("sha256")
      .update(body + process.env.HOTMART_WEBHOOK_TOKEN)
      .digest("hex")

    console.log("🔍 Validando signatures:", {
      expected: expectedSignature.substring(0, 10) + "...",
      provided: signature.substring(0, 10) + "...",
    })

    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))
  } catch (error) {
    console.error("❌ Erro na validação da signature:", error)
    return false
  }
}

async function processHotmartEvent(eventType: string, transactionData: any) {
  switch (eventType) {
    case "PURCHASE_COMPLETE":
    case "PURCHASE_APPROVED":
      return await handlePurchaseSuccess(transactionData)

    case "PURCHASE_CANCELED":
    case "PURCHASE_REFUNDED":
      return await handlePurchaseFailure(transactionData)

    case "PURCHASE_DELAYED":
    case "PURCHASE_PROTEST":
      return await handlePurchasePending(transactionData)

    case "PURCHASE_CHARGEBACK":
      return await handlePurchaseChargeback(transactionData)

    case "SUBSCRIPTION_CANCELLATION":
      return await handleSubscriptionCancellation(transactionData)

    default:
      console.log(`⚠️ Evento Hotmart não tratado: ${eventType}`)
      return { status: "ignored", event: eventType }
  }
}

async function handlePurchaseSuccess(transactionData: any) {
  try {
    console.log("🎉 Compra confirmada no Hotmart:", transactionData.transaction)

    const { 
      buyer, 
      purchase, 
      transaction,
      affiliates 
    } = transactionData

    // Extrair metadados do external_reference se disponível
    const customData = purchase?.custom_fields || {}
    const planId = customData.plan_id
    const userEmail = buyer?.email
    const billingCycle = customData.billing_cycle

    console.log("📋 Dados da compra:", {
      transaction_id: transaction,
      plan_id: planId,
      user_email: userEmail,
      billing_cycle: billingCycle,
      amount: purchase?.price?.value,
      offer_code: purchase?.offer?.code,
    })

    // Aqui você implementaria:
    // 1. Ativar plano do usuário no banco de dados
    // 2. Enviar email de confirmação
    // 3. Registrar evento para analytics
    // 4. Criar entrada na tabela de assinaturas
    // 5. Registrar comissões de afiliados se houver

    // Exemplo de implementação:
    // await activateUserPlan(userEmail, planId, billingCycle)
    // await sendPurchaseConfirmationEmail(userEmail, transactionData)
    // await logPurchaseEvent('success', transactionData)
    // await processAffiliateCommission(affiliates)

    console.log(`✅ Plano ${planId} ativado para ${userEmail}`)

    return {
      status: "processed",
      actions: ["plan_activated", "email_sent", "analytics_logged"],
      user_email: userEmail,
      plan_id: planId,
      transaction_id: transaction,
    }
  } catch (error) {
    console.error("❌ Erro ao processar compra confirmada:", error)
    throw error
  }
}

async function handlePurchaseFailure(transactionData: any) {
  console.log("❌ Compra cancelada/reembolsada:", transactionData.transaction)

  const { buyer, purchase, transaction } = transactionData
  const customData = purchase?.custom_fields || {}
  const userEmail = buyer?.email
  const planId = customData.plan_id

  // Implementar lógica de cancelamento
  // await deactivateUserPlan(userEmail, planId)
  // await sendCancellationEmail(userEmail, transactionData)
  // await logPurchaseEvent('cancelled', transactionData)

  return {
    status: "processed",
    actions: ["plan_deactivated", "cancellation_notified"],
    user_email: userEmail,
    plan_id: planId,
    transaction_id: transaction,
    reason: transactionData.reason,
  }
}

async function handlePurchasePending(transactionData: any) {
  console.log("⏳ Compra pendente/em protesto:", transactionData.transaction)

  const { buyer, purchase, transaction } = transactionData
  const userEmail = buyer?.email

  // Notificar sobre status pendente
  // await sendPendingNotification(userEmail, transactionData)

  return {
    status: "processed",
    actions: ["pending_notification_sent"],
    user_email: userEmail,
    transaction_id: transaction,
  }
}

async function handlePurchaseChargeback(transactionData: any) {
  console.log("💸 Chargeback detectado:", transactionData.transaction)

  const { buyer, purchase, transaction } = transactionData
  const customData = purchase?.custom_fields || {}
  const userEmail = buyer?.email
  const planId = customData.plan_id

  // Suspender acesso imediatamente
  // await suspendUserAccess(userEmail, planId, 'chargeback')
  // await notifyChargebackTeam(transactionData)

  return {
    status: "processed",
    actions: ["access_suspended", "chargeback_team_notified"],
    user_email: userEmail,
    plan_id: planId,
    transaction_id: transaction,
  }
}

async function handleSubscriptionCancellation(transactionData: any) {
  console.log("🔄 Assinatura cancelada:", transactionData.subscription_id)

  const { buyer, subscription } = transactionData
  const userEmail = buyer?.email

  // Processar cancelamento de assinatura
  // await cancelUserSubscription(userEmail, subscription.id)
  // await sendSubscriptionCancellationEmail(userEmail, transactionData)

  return {
    status: "processed",
    actions: ["subscription_cancelled", "email_sent"],
    user_email: userEmail,
    subscription_id: subscription?.id,
  }
}
