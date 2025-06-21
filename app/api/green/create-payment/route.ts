import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("📨 Nova requisição de pagamento")

    const body = await request.json()
    console.log("📋 Dados recebidos:", {
      plan_id: body.plan_id,
      payment_method: body.payment_method,
      customer_email: body.customer?.email,
      amount: body.amount,
    })

    // Verificar se as variáveis de ambiente estão configuradas
    const GREEN_API_KEY = process.env.GREEN_API_KEY
    const GREEN_API_URL = process.env.GREEN_API_URL || "https://api.green.com.br/v1"

    if (!GREEN_API_KEY) {
      console.error("❌ GREEN_API_KEY não configurada")
      return NextResponse.json(
        {
          success: false,
          error: "Configuração de pagamento não encontrada. Entre em contato com o suporte.",
          code: "CONFIG_ERROR",
        },
        { status: 500 },
      )
    }

    console.log("🔑 Usando API Key:", GREEN_API_KEY.substring(0, 10) + "...")
    console.log("🌐 URL da API:", GREEN_API_URL)

    // Validar dados obrigatórios
    const { plan_id, payment_method, customer, billing_cycle } = body

    if (!plan_id || !payment_method || !customer?.email || !customer?.name) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados obrigatórios não fornecidos",
          required: ["plan_id", "payment_method", "customer.email", "customer.name"],
        },
        { status: 400 },
      )
    }

    // Configuração dos planos (valores em centavos)
    const plans = {
      "per-article": {
        name: "Por Artigo",
        price: 1500, // R$ 15,00
      },
      professional: {
        name: "Profissional",
        monthlyPrice: 7900, // R$ 79,00
        yearlyPrice: 79000, // R$ 790,00
      },
      institutional: {
        name: "Institucional",
        yearlyPrice: 199900, // R$ 1.999,00
      },
    }

    const plan = plans[plan_id as keyof typeof plans]
    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          error: "Plano não encontrado",
          available_plans: Object.keys(plans),
        },
        { status: 404 },
      )
    }

    // Calcular preço baseado no ciclo de cobrança
    let amount = 0
    let description = ""

    if (plan_id === "per-article") {
      amount = plan.price
      description = `iArtigo - ${plan.name}`
    } else if (plan_id === "institutional") {
      amount = plan.yearlyPrice
      description = `iArtigo - ${plan.name} (Anual)`
    } else {
      // Profissional
      amount = billing_cycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice
      description = `iArtigo - ${plan.name} (${billing_cycle === "yearly" ? "Anual" : "Mensal"})`
    }

    console.log("💰 Calculando pagamento:", {
      plan_id,
      billing_cycle,
      amount: amount / 100,
      description,
    })

    // Preparar dados para Green API
    const paymentData = {
      amount,
      currency: "BRL",
      description,
      customer: {
        name: customer.name,
        email: customer.email,
        document: customer.document || "",
        phone: customer.phone || "",
      },
      payment_method,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?payment_id={payment_id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment?status=cancelled`,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/green/webhook`,
      metadata: {
        plan_id,
        billing_cycle: billing_cycle || "one-time",
        user_email: customer.email,
        amount_brl: (amount / 100).toFixed(2),
        source: "iartigo_web",
        timestamp: new Date().toISOString(),
      },
    }

    console.log("🚀 Enviando para Green API...")
    console.log("📦 Payload:", JSON.stringify(paymentData, null, 2))

    // Fazer requisição para Green API
    const response = await fetch(`${GREEN_API_URL}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GREEN_API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": "iArtigo/1.0",
      },
      body: JSON.stringify(paymentData),
    })

    const responseText = await response.text()
    console.log("📥 Resposta Green (status):", response.status)
    console.log("📥 Resposta Green (headers):", Object.fromEntries(response.headers.entries()))
    console.log("📥 Resposta Green (body):", responseText)

    if (!response.ok) {
      console.error("❌ Erro Green API:", {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
      })

      // Tentar parsear erro
      let errorMessage = "Erro no processamento do pagamento"
      try {
        const errorData = JSON.parse(responseText)
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        errorMessage = `Erro ${response.status}: ${response.statusText}`
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: {
            status: response.status,
            statusText: response.statusText,
            response: responseText.substring(0, 500), // Primeiros 500 chars
          },
        },
        { status: 400 },
      )
    }

    // Parsear resposta de sucesso
    let greenResponse
    try {
      greenResponse = JSON.parse(responseText)
    } catch (error) {
      console.error("❌ Erro ao parsear resposta:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Resposta inválida da API de pagamento",
          details: responseText.substring(0, 200),
        },
        { status: 500 },
      )
    }

    // Preparar resposta baseada no método de pagamento
    const response_data: any = {
      success: true,
      payment_id: greenResponse.id,
      status: greenResponse.status,
      amount: amount / 100, // Converter para reais
      plan_name: plan.name,
      description,
    }

    if (payment_method === "credit_card") {
      response_data.checkout_url = greenResponse.checkout_url
      response_data.redirect_url = greenResponse.checkout_url
    } else if (payment_method === "pix") {
      response_data.pix_code = greenResponse.pix?.qr_code
      response_data.pix_qr_code_base64 = greenResponse.pix?.qr_code_base64
      response_data.expires_at = greenResponse.pix?.expires_at
    } else if (payment_method === "boleto") {
      response_data.boleto_url = greenResponse.boleto?.url
      response_data.boleto_barcode = greenResponse.boleto?.barcode
      response_data.expires_at = greenResponse.boleto?.expires_at
    }

    console.log("✅ Pagamento criado com sucesso:", response_data.payment_id)
    return NextResponse.json(response_data)
  } catch (error) {
    console.error("❌ Erro na API de pagamento:", error)

    // Log detalhado do erro
    if (error instanceof Error) {
      console.error("Detalhes do erro:", {
        message: error.message,
        stack: error.stack,
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor. Tente novamente em alguns minutos.",
        details: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
