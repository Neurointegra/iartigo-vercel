import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Configuração da API Green
    const GREEN_API_KEY = process.env.GREEN_API_KEY
    const GREEN_API_URL = process.env.GREEN_API_URL || "https://api.green.com.br/v1"

    if (!GREEN_API_KEY) {
      return NextResponse.json({ success: false, error: "Green API key não configurada" }, { status: 500 })
    }

    // Determinar tipo de cobrança baseado no plano
    let paymentType = "subscription" // padrão
    let recurringInterval = "monthly"

    if (body.metadata.plan === "per-article") {
      paymentType = "one-time"
      recurringInterval = null
    } else if (body.metadata.plan === "institutional") {
      paymentType = "subscription"
      recurringInterval = "yearly"
    } else {
      recurringInterval = body.metadata.billing === "yearly" ? "yearly" : "monthly"
    }

    // Criar pagamento na Green com configuração específica
    const greenPayload = {
      amount: body.amount,
      currency: body.currency,
      description: body.description,
      customer: body.customer,
      payment_method: body.payment_method,
      payment_type: paymentType,
      ...(paymentType === "subscription" && {
        recurring: {
          interval: recurringInterval,
          interval_count: 1,
        },
      }),
      metadata: {
        ...body.metadata,
        payment_type: paymentType,
        recurring_interval: recurringInterval,
      },
      success_url: body.success_url,
      cancel_url: body.cancel_url,
    }

    // Criar pagamento na Green
    const greenResponse = await fetch(`${GREEN_API_URL}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GREEN_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(greenPayload),
    })

    const greenData = await greenResponse.json()

    if (greenResponse.ok) {
      return NextResponse.json({
        success: true,
        payment_id: greenData.id,
        payment_url: greenData.checkout_url,
        status: greenData.status,
      })
    } else {
      return NextResponse.json(
        { success: false, error: greenData.message || "Erro ao criar pagamento" },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Erro na API Green:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
