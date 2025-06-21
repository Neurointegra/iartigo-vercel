// Script para debugar a API Green
console.log("🔍 Debug Green API")
console.log("==================")

const GREEN_API_KEY = process.env.GREEN_API_KEY
const GREEN_API_URL = process.env.GREEN_API_URL || "https://api.green.com.br/v1"

console.log("🔑 API Key:", GREEN_API_KEY ? `${GREEN_API_KEY.substring(0, 20)}...` : "❌ NÃO CONFIGURADA")
console.log("🌐 API URL:", GREEN_API_URL)

// Testar diferentes endpoints
async function testEndpoints() {
  const endpoints = ["/health", "/ping", "/status", "/payments", "/me", "/account"]

  for (const endpoint of endpoints) {
    console.log(`\n🧪 Testando: ${GREEN_API_URL}${endpoint}`)

    try {
      const response = await fetch(`${GREEN_API_URL}${endpoint}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${GREEN_API_KEY}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`📡 Status: ${response.status}`)
      console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()))

      const responseText = await response.text()
      console.log(`📄 Body: ${responseText.substring(0, 200)}${responseText.length > 200 ? "..." : ""}`)
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`)
    }
  }
}

// Testar criação de pagamento simples
async function testSimplePayment() {
  console.log("\n💳 Testando criação de pagamento simples...")

  const simplePayment = {
    amount: 1000, // R$ 10,00
    currency: "BRL",
    description: "Teste iArtigo",
    customer: {
      name: "Teste",
      email: "teste@teste.com",
    },
  }

  try {
    const response = await fetch(`${GREEN_API_URL}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GREEN_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(simplePayment),
    })

    console.log(`📡 Status: ${response.status}`)
    const responseText = await response.text()
    console.log(`📄 Resposta: ${responseText}`)
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`)
  }
}

// Executar testes
async function runDebug() {
  await testEndpoints()
  await testSimplePayment()

  console.log("\n🎯 Próximos passos:")
  console.log("1. Verifique se a API Key está correta")
  console.log("2. Confirme se está usando o ambiente correto (sandbox/production)")
  console.log("3. Verifique a documentação da Green API")
  console.log("4. Entre em contato com o suporte da Green se necessário")
}

runDebug().catch(console.error)
