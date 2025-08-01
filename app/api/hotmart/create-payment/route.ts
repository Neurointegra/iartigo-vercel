import { type NextRequest, NextResponse } from "next/server"
import { hotmartClient } from "@/lib/hotmart-client"

export async function POST(request: NextRequest) {
  try {
    console.log("📨 Nova requisição de pagamento Hotmart")

    const body = await request.json()
    console.log("📋 Dados recebidos:", {
      plan_id: body.plan_id,
      customer_email: body.customer?.email,
      billing_cycle: body.billing_cycle,
    })

    // Validar dados obrigatórios
    const { plan_id, customer, billing_cycle } = body

    if (!plan_id || !customer?.email || !customer?.name) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados obrigatórios não fornecidos",
          required: ["plan_id", "customer.email", "customer.name"],
        },
        { status: 400 },
      )
    }

    // Configuração dos planos com códigos de oferta do Hotmart
    const plans = {
      "per-article": {
        name: "Por Artigo",
        offer_code: process.env.HOTMART_OFFER_PER_ARTICLE || "IARTIGO_ARTICLE",
        price: 15.00,
      },
      professional: {
        name: "Profissional",
        offer_code: billing_cycle === "yearly" 
          ? process.env.HOTMART_OFFER_PROFESSIONAL_YEARLY || "IARTIGO_PRO_YEARLY"
          : process.env.HOTMART_OFFER_PROFESSIONAL_MONTHLY || "IARTIGO_PRO_MONTHLY",
        price: billing_cycle === "yearly" ? 790.00 : 79.00,
      },
      institutional: {
        name: "Institucional",
        offer_code: process.env.HOTMART_OFFER_INSTITUTIONAL || "IARTIGO_INSTITUTIONAL",
        price: 1999.00, // Apenas anual
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
        { status: 400 },
      )
    }

    // Descrição personalizada
    let description = `iArtigo - ${plan.name}`
    if (billing_cycle === "yearly") {
      description += " (Anual)"
    } else if (billing_cycle === "monthly") {
      description += " (Mensal)"
    }

    // Preparar dados para Hotmart
    const paymentData = {
      offer_code: plan.offer_code,
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone || "",
        document: customer.document || "",
      },
      price: plan.price,
      currency: "BRL",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?transaction_id={transaction_id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment?status=cancelled`,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/hotmart/webhook`,
      metadata: {
        plan_id,
        billing_cycle: billing_cycle || "one-time",
        user_email: customer.email,
        source: "iartigo_web",
        timestamp: new Date().toISOString(),
        external_reference: `iartigo_${plan_id}_${Date.now()}`,
      },
    }

    console.log("🚀 Enviando para Hotmart API...")
    const hotmartResponse = await hotmartClient.createCheckout(paymentData)

    // Preparar resposta
    const response = {
      success: true,
      payment_id: hotmartResponse.payment_id,
      checkout_url: hotmartResponse.checkout_url,
      status: hotmartResponse.status,
      amount: hotmartResponse.amount,
      plan_name: plan.name,
      offer_code: plan.offer_code,
      description,
      redirect_url: hotmartResponse.checkout_url,
    }

    console.log("✅ Checkout Hotmart criado com sucesso:", response.payment_id)
    return NextResponse.json(response)
    
  } catch (error) {
    console.error("❌ Erro na API de pagamento Hotmart:", error)

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
