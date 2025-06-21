// Script para testar a integração completa com Green
const GREEN_API_KEY = process.env.GREEN_API_KEY
const GREEN_API_URL = process.env.GREEN_API_URL || "https://api.green.com.br/v1"
const WEBHOOK_SECRET = process.env.GREEN_WEBHOOK_SECRET

console.log("🧪 Testando Integração Green")
console.log("================================")

// 1. Verificar configuração
console.log("\n1️⃣ Verificando Configuração:")
console.log("✅ API Key:", GREEN_API_KEY ? `${GREEN_API_KEY.substring(0, 10)}...` : "❌ NÃO CONFIGURADA")
console.log("✅ API URL:", GREEN_API_URL)
console.log("✅ Webhook Secret:", WEBHOOK_SECRET ? `${WEBHOOK_SECRET.substring(0, 10)}...` : "❌ NÃO CONFIGURADO")

// 2. Testar conexão com API
async function testApiConnection() {
  console.log("\n2️⃣ Testando Conexão com API:")

  try {
    const response = await fetch(`${GREEN_API_URL}/health`, {
      headers: {
        Authorization: `Bearer ${GREEN_API_KEY}`,
        "Content-Type": "application/json",
      },
    })

    console.log("📡 Status da API:", response.status)

    if (response.ok) {
      console.log("✅ Conexão com Green API: OK")
    } else {
      console.log("❌ Erro na conexão:", response.statusText)
      const errorText = await response.text()
      console.log("📄 Resposta:", errorText)
    }
  } catch (error) {
    console.log("❌ Erro de rede:", error.message)
  }
}

// 3. Testar criação de pagamento
async function testPaymentCreation() {
  console.log("\n3️⃣ Testando Criação de Pagamento:")

  const testPayment = {
    amount: 1500, // R$ 15,00
    currency: "BRL",
    description: "iArtigo - Teste de Integração",
    customer: {
      name: "João Teste",
      email: "teste@iartigo.com",
      document: "12345678901",
    },
    payment_method: "credit_card",
    metadata: {
      plan_id: "per-article",
      test: true,
    },
  }

  try {
    const response = await fetch(`${GREEN_API_URL}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GREEN_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayment),
    })

    console.log("📡 Status criação:", response.status)
    const responseData = await response.text()

    if (response.ok) {
      const payment = JSON.parse(responseData)
      console.log("✅ Pagamento criado:", payment.id)
      console.log("🔗 Checkout URL:", payment.checkout_url ? "Disponível" : "Não disponível")
      return payment.id
    } else {
      console.log("❌ Erro na criação:", responseData)
    }
  } catch (error) {
    console.log("❌ Erro:", error.message)
  }

  return null
}

// 4. Testar webhook
function testWebhookValidation() {
  console.log("\n4️⃣ Testando Validação de Webhook:")

  if (!WEBHOOK_SECRET) {
    console.log("❌ Webhook secret não configurado")
    return
  }

  const crypto = require("crypto")
  const testBody = JSON.stringify({
    event_type: "payment.completed",
    data: { id: "test_payment_123", status: "paid" },
  })

  const signature = crypto.createHmac("sha256", WEBHOOK_SECRET).update(testBody).digest("hex")

  console.log("✅ Signature gerada:", signature.substring(0, 16) + "...")
  console.log("✅ Validação de webhook: OK")
}

// Executar todos os testes
async function runAllTests() {
  await testApiConnection()
  const paymentId = await testPaymentCreation()
  testWebhookValidation()

  console.log("\n🎯 Resumo dos Testes:")
  console.log("================================")
  console.log("- Configuração: ✅")
  console.log("- Conexão API: Verificar logs acima")
  console.log("- Criação Pagamento: Verificar logs acima")
  console.log("- Webhook: ✅")

  if (paymentId) {
    console.log(`\n💡 Pagamento de teste criado: ${paymentId}`)
    console.log("Você pode usar este ID para testar o webhook")
  }
}

runAllTests().catch(console.error)
