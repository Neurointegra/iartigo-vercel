import { type NextRequest, NextResponse } from "next/server"
import { greenClient } from "@/lib/green-client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get("payment_id")

    if (!paymentId) {
      return NextResponse.json(
        {
          success: false,
          error: "payment_id é obrigatório",
        },
        { status: 400 },
      )
    }

    console.log("🔍 Verificando status do pagamento:", paymentId)

    const payment = await greenClient.getPayment(paymentId)

    console.log("📊 Status atual:", {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
    })

    return NextResponse.json({
      success: true,
      payment_id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      payment_method: payment.payment_method,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
    })
  } catch (error) {
    console.error("❌ Erro ao verificar pagamento:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
