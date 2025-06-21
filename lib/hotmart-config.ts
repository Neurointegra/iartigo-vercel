// Configurações da Hotmart (após aprovação)
export const hotmartConfig = {
  // Dados que você receberá da Hotmart
  productIds: {
    professional: "PRODUTO_ID_AQUI", // Hotmart vai fornecer
    institutional: "PRODUTO_ID_AQUI", // Se criar outro produto
    "per-article": "PRODUTO_ID_AQUI", // Se criar como serviço
  },

  // URLs base
  checkoutBaseUrl: "https://pay.hotmart.com",

  // Webhook secret (Hotmart fornece)
  webhookSecret: process.env.HOTMART_WEBHOOK_SECRET || "",

  // URLs do seu sistema
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
  webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/hotmart/webhook`,
}

// Função para gerar URL de checkout
export function generateHotmartCheckoutUrl(planId: string, customerData: any) {
  const productId = hotmartConfig.productIds[planId as keyof typeof hotmartConfig.productIds]

  if (!productId) {
    throw new Error(`Produto não encontrado para o plano: ${planId}`)
  }

  const params = new URLSearchParams({
    // Dados obrigatórios
    email: customerData.email,
    name: customerData.name,

    // URLs de retorno
    success_url: hotmartConfig.successUrl,
    cancel_url: hotmartConfig.cancelUrl,

    // Dados extras (opcional)
    ...(customerData.document && { document: customerData.document }),
    ...(customerData.phone && { phone: customerData.phone }),

    // Metadados customizados
    custom: JSON.stringify({
      plan: planId,
      user_id: customerData.user_id || "guest",
      source: "iartigo_website",
    }),
  })

  return `${hotmartConfig.checkoutBaseUrl}/${productId}?${params.toString()}`
}
