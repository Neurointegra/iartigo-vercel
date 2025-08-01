import { type NextRequest, NextResponse } from "next/server"
import { hotmartClient } from "@/lib/hotmart-client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get("transaction_id")

    if (!transactionId) {
      return NextResponse.json(
        {
          success: false,
          error: "transaction_id é obrigatório",
        },
        { status: 400 },
      )
    }

    console.log("🔍 Verificando status da transação Hotmart:", transactionId)

    const transaction = await hotmartClient.getTransaction(transactionId)

    console.log("📊 Status atual:", {
      id: transaction.transaction_id,
      status: transaction.status,
      amount: transaction.purchase?.price?.value,
    })

    return NextResponse.json({
      success: true,
      transaction_id: transaction.transaction_id,
      status: transaction.status,
      amount: transaction.purchase?.price?.value,
      currency: transaction.purchase?.price?.currency_code,
      offer_code: transaction.purchase?.offer?.code,
      customer_email: transaction.buyer?.email,
      created_at: transaction.creation_date,
      updated_at: transaction.last_modified,
      payment_method: transaction.payment?.type,
    })
  } catch (error) {
    console.error("❌ Erro ao verificar transação Hotmart:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
