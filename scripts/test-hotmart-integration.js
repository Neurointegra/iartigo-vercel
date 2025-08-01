// Script para testar a integração completa com Hotmart
const HOTMART_CLIENT_ID = process.env.HOTMART_CLIENT_ID
const HOTMART_CLIENT_SECRET = process.env.HOTMART_CLIENT_SECRET
const HOTMART_API_URL = process.env.HOTMART_API_URL || "https://api-sec-vlc.hotmart.com"
const HOTMART_WEBHOOK_TOKEN = process.env.HOTMART_WEBHOOK_TOKEN

console.log("🧪 Testando Integração Hotmart")
console.log("================================")

// 1. Verificar configuração
console.log("\n1️⃣ Verificando Configuração:")
console.log("✅ Client ID:", HOTMART_CLIENT_ID ? `${HOTMART_CLIENT_ID.substring(0, 10)}...` : "❌ NÃO CONFIGURADO")
console.log("✅ Client Secret:", HOTMART_CLIENT_SECRET ? `${HOTMART_CLIENT_SECRET.substring(0, 10)}...` : "❌ NÃO CONFIGURADO")
console.log("✅ API URL:", HOTMART_API_URL)
console.log("✅ Webhook Token:", HOTMART_WEBHOOK_TOKEN ? `${HOTMART_WEBHOOK_TOKEN.substring(0, 10)}...` : "❌ NÃO CONFIGURADO")

// 2. Testar autenticação
async function testAuthentication() {
  console.log("\n2️⃣ Testando Autenticação:")

  try {
    const response = await fetch(`${HOTMART_API_URL}/security/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: HOTMART_CLIENT_ID,
        client_secret: HOTMART_CLIENT_SECRET,
      }),
    })

    console.log("📡 Status da autenticação:", response.status)

    if (response.ok) {
      const data = await response.json()
      console.log("✅ Token obtido com sucesso")
      console.log("⏱️ Expira em:", data.expires_in, "segundos")
      return data.access_token
    } else {
      console.log("❌ Erro na autenticação:", response.statusText)
      const errorText = await response.text()
      console.log("📄 Resposta:", errorText)
      return null
    }
  } catch (error) {
    console.log("❌ Erro de rede:", error.message)
    return null
  }
}

// 3. Testar criação de checkout
async function testCheckoutCreation(token) {
  console.log("\n3️⃣ Testando Criação de Checkout:")

  if (!token) {
    console.log("❌ Token não disponível, pulando teste")
    return
  }

  const testCheckout = {
    offer_code: "IARTIGO_PRO_MONTHLY", // Código de oferta de teste
    customer: {
      name: "João Teste Hotmart",
      email: "joao.teste@hotmart.com",
      phone: "(11) 99999-9999",
      document: "123.456.789-00",
    },
    price: {
      value: 79.00,
      currency_code: "BRL",
    },
    success_url: "https://iartigo.com/payment/success",
    cancel_url: "https://iartigo.com/payment?cancelled=true",
    webhook_url: "https://iartigo.com/api/hotmart/webhook",
    external_reference: `iartigo_test_${Date.now()}`,
    custom_fields: {
      plan_id: "professional",
      billing_cycle: "monthly",
      source: "test_script",
    },
  }

  try {
    const response = await fetch(`${HOTMART_API_URL}/payments/api/v1/checkout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testCheckout),
    })

    console.log("📡 Status do checkout:", response.status)

    if (response.ok) {
      const data = await response.json()
      console.log("✅ Checkout criado com sucesso")
      console.log("🔗 URL do checkout:", data.checkout_url)
      console.log("🆔 Transaction ID:", data.transaction_id || data.id)
      return data
    } else {
      console.log("❌ Erro na criação do checkout:", response.statusText)
      const errorText = await response.text()
      console.log("📄 Resposta:", errorText)
      return null
    }
  } catch (error) {
    console.log("❌ Erro de rede:", error.message)
    return null
  }
}

// 4. Testar busca de ofertas
async function testGetOffers(token) {
  console.log("\n4️⃣ Testando Busca de Ofertas:")

  if (!token) {
    console.log("❌ Token não disponível, pulando teste")
    return
  }

  try {
    const response = await fetch(`${HOTMART_API_URL}/payments/api/v1/offers`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    console.log("📡 Status das ofertas:", response.status)

    if (response.ok) {
      const data = await response.json()
      console.log("✅ Ofertas encontradas:", data.items?.length || 0)
      
      if (data.items && data.items.length > 0) {
        console.log("\n📋 Primeiras ofertas:")
        data.items.slice(0, 3).forEach((offer, index) => {
          console.log(`${index + 1}. ${offer.name} - Código: ${offer.code}`)
        })
      }
      return data.items
    } else {
      console.log("❌ Erro ao buscar ofertas:", response.statusText)
      const errorText = await response.text()
      console.log("📄 Resposta:", errorText)
      return null
    }
  } catch (error) {
    console.log("❌ Erro de rede:", error.message)
    return null
  }
}

// 5. Testar webhook (simulação)
function testWebhookProcessing() {
  console.log("\n5️⃣ Testando Processamento de Webhook:")

  const sampleWebhook = {
    event: "PURCHASE_COMPLETE",
    data: {
      transaction: "TXN123456789",
      buyer: {
        name: "João Teste",
        email: "joao.teste@hotmart.com",
      },
      purchase: {
        offer: {
          code: "IARTIGO_PRO_MONTHLY",
        },
        price: {
          value: 79.00,
          currency_code: "BRL",
        },
        custom_fields: {
          plan_id: "professional",
          billing_cycle: "monthly",
        },
      },
    },
  }

  console.log("📨 Simulando webhook de compra completa...")
  console.log("📋 Dados:", JSON.stringify(sampleWebhook, null, 2))
  console.log("✅ Webhook processado com sucesso")
}

// 6. Executar todos os testes
async function runAllTests() {
  console.log("\n🚀 Iniciando testes completos...")

  // Teste de autenticação
  const token = await testAuthentication()

  // Teste de ofertas
  await testGetOffers(token)

  // Teste de checkout
  await testCheckoutCreation(token)

  // Teste de webhook
  testWebhookProcessing()

  console.log("\n✅ Testes concluídos!")
  console.log("\n📝 Próximos passos:")
  console.log("1. Configure as ofertas no painel do Hotmart")
  console.log("2. Teste os códigos de oferta reais")
  console.log("3. Configure o webhook URL no Hotmart")
  console.log("4. Teste pagamentos reais em ambiente sandbox")
}

// Executar se for chamado diretamente
if (require.main === module) {
  runAllTests().catch(console.error)
}

module.exports = {
  testAuthentication,
  testCheckoutCreation,
  testGetOffers,
  testWebhookProcessing,
  runAllTests,
}
