import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    console.log("📨 Webhook Hotmart recebido")

    const body = await request.text()
    const signature = request.headers.get("x-hotmart-signature")

    // Validar assinatura (se configurado)
    if (process.env.HOTMART_WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", process.env.HOTMART_WEBHOOK_SECRET)
        .update(body)
        .digest("hex")

      if (signature !== expectedSignature) {
        console.error("❌ Assinatura inválida")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const webhookData = JSON.parse(body)
    console.log("📊 Dados do webhook:", JSON.stringify(webhookData, null, 2))

    const { event, data } = webhookData

    switch (event) {
      case "PURCHASE_COMPLETE":
        await handlePurchaseComplete(data)
        break

      case "PURCHASE_CANCELED":
        await handlePurchaseCanceled(data)
        break

      case "PURCHASE_REFUNDED":
        await handlePurchaseRefunded(data)
        break

      case "SUBSCRIPTION_CANCELED":
        await handleSubscriptionCanceled(data)
        break

      default:
        console.log(`⚠️ Evento não tratado: ${event}`)
    }

    return NextResponse.json({ success: true, message: "Webhook processado" })
  } catch (error) {
    console.error("❌ Erro no webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function handlePurchaseComplete(data: any) {
  console.log("🎉 Compra confirmada!")

  const { buyer, product, purchase } = data
  const customData = purchase.custom ? JSON.parse(purchase.custom) : {}

  console.log("👤 Cliente:", buyer.email)
  console.log("📦 Produto:", product.name)
  console.log("💰 Valor:", purchase.price)
  console.log("🏷️ Plano:", customData.plan)

  // AQUI VOCÊ IMPLEMENTA:
  // 1. Criar/ativar usuário no banco de dados
  // 2. Enviar email de boas-vindas
  // 3. Dar acesso ao dashboard
  // 4. Registrar evento de conversão

  // Exemplo de implementação:
  try {
    // await createOrActivateUser({
    //   email: buyer.email,
    //   name: buyer.name,
    //   plan: customData.plan,
    //   transaction_id: purchase.transaction,
    //   hotmart_product_id: product.id
    // })

    console.log("✅ Usuário ativado com sucesso")
  } catch (error) {
    console.error("❌ Erro ao ativar usuário:", error)
  }

  return { status: "processed" }
}

async function handlePurchaseCanceled(data: any) {
  console.log("❌ Compra cancelada")
  // Implementar lógica de cancelamento se necessário
  return { status: "processed" }
}

async function handlePurchaseRefunded(data: any) {
  console.log("💸 Compra reembolsada")

  // IMPLEMENTAR:
  // 1. Desativar acesso do usuário
  // 2. Enviar email de confirmação
  // 3. Registrar evento

  return { status: "processed" }
}

async function handleSubscriptionCanceled(data: any) {
  console.log("🔄 Assinatura cancelada")

  // IMPLEMENTAR:
  // 1. Manter acesso até o fim do período pago
  // 2. Enviar email de confirmação
  // 3. Oferecer reativação

  return { status: "processed" }
}
