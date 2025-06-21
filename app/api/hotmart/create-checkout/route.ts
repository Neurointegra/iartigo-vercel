import { type NextRequest, NextResponse } from "next/server"
import { generateHotmartCheckoutUrl } from "@/lib/hotmart-config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { plan_id, customer } = body

    console.log("🛒 Criando checkout Hotmart:", { plan_id, customer: customer.email })

    // Validar dados obrigatórios
    if (!customer.name || !customer.email) {
      return NextResponse.json({ success: false, error: "Nome e email são obrigatórios" }, { status: 400 })
    }

    // Gerar URL de checkout
    const checkoutUrl = generateHotmartCheckoutUrl(plan_id, customer)

    console.log("✅ Checkout URL gerada:", checkoutUrl)

    return NextResponse.json({
      success: true,
      checkout_url: checkoutUrl,
      message: "Redirecionando para Hotmart...",
    })
  } catch (error) {
    console.error("❌ Erro ao criar checkout:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
