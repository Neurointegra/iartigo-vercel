// ⚠️ SUBSTITUA PELOS SEUS CÓDIGOS REAIS APÓS APROVAÇÃO

export const hotmartProducts = {
  // 🔄 ASSINATURA PROFISSIONAL (R$ 79/mês)
  professional: {
    monthly: "https://pay.hotmart.com/[SEU_CODIGO_MENSAL]", // ← Substituir
    yearly: "https://pay.hotmart.com/[SEU_CODIGO_ANUAL]", // ← Substituir (se criar)
  },

  // 💰 POR ARTIGO (R$ 15)
  "per-article": {
    single: "https://pay.hotmart.com/[SEU_CODIGO_ARTIGO]", // ← Substituir
  },

  // 🏢 INSTITUCIONAL (R$ 199/mês)
  institutional: {
    yearly: "https://pay.hotmart.com/[SEU_CODIGO_INSTITUCIONAL]", // ← Substituir
  },
}

// Função para pegar URL correta
export function getHotmartUrl(plan: string, billing = "monthly") {
  const product = hotmartProducts[plan as keyof typeof hotmartProducts]

  if (!product) {
    throw new Error(`Plano não encontrado: ${plan}`)
  }

  if (plan === "per-article") {
    return product.single
  }

  if (plan === "institutional") {
    return product.yearly
  }

  // Profissional
  return billing === "yearly" ? product.yearly : product.monthly
}
