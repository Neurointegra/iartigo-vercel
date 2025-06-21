import { type NextRequest, NextResponse } from "next/server"
import { greenClient } from "@/lib/green-client"

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

    // Preparar dados para Green
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
    const greenResponse = await greenClient.createPayment(paymentData)

    // Preparar resposta baseada no método de pagamento
    const response: any = {
      success: true,
      payment_id: greenResponse.id,
      status: greenResponse.status,
      amount: amount / 100, // Converter para reais
      plan_name: plan.name,
      description,
    }

    if (payment_method === "credit_card") {
      response.checkout_url = greenResponse.checkout_url
      response.redirect_url = greenResponse.checkout_url
    } else if (payment_method === "pix") {
      response.pix_code = greenResponse.pix?.qr_code
      response.pix_qr_code_base64 = greenResponse.pix?.qr_code_base64
      response.expires_at = greenResponse.pix?.expires_at
    } else if (payment_method === "boleto") {
      response.boleto_url = greenResponse.boleto?.url
      response.boleto_barcode = greenResponse.boleto?.barcode
      response.expires_at = greenResponse.boleto?.expires_at
    }

    console.log("✅ Pagamento criado com sucesso:", response.payment_id)
    return NextResponse.json(response)
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
        error: error instanceof Error ? error.message : "Erro interno do servidor",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
