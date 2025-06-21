"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Shield, CheckCircle, ArrowLeft, Lock } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { HotmartCheckoutWidget } from "@/components/hotmart-checkout-widget"

export default function PaymentPage() {
  const [selectedPlan, setSelectedPlan] = useState("professional")
  const [billingType, setBillingType] = useState("monthly")
  const [customerData, setCustomerData] = useState({
    name: "",
    email: "",
    document: "",
    phone: "",
  })

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const planFromUrl = searchParams.get("plan")
    if (planFromUrl && plans[planFromUrl as keyof typeof plans]) {
      setSelectedPlan(planFromUrl)
    }
  }, [searchParams])

  const plans = {
    "per-article": {
      name: "Por Artigo",
      price: 15,
      hotmartUrl: "https://pay.hotmart.com/C100397020W", // Exemplo - substitua pelo seu
      features: ["Pagamento por artigo gerado", "Formatação básica", "Suporte por email", "Exportação PDF"],
    },
    professional: {
      name: "Profissional",
      monthlyPrice: 79,
      yearlyPrice: 790,
      hotmartUrl: "https://pay.hotmart.com/C100397020W", // Seu URL real aqui
      features: ["5 artigos por mês", "Todos os recursos", "Suporte prioritário", "Gráficos avançados"],
    },
    institutional: {
      name: "Institucional",
      monthlyPrice: 199,
      yearlyPrice: 2388,
      hotmartUrl: "https://pay.hotmart.com/C100397020W", // Criar produto separado
      features: [
        "Artigos ilimitados",
        "Múltiplos usuários (até 10)",
        "Contrato anual obrigatório",
        "API personalizada",
        "Suporte dedicado 24/7",
      ],
    },
  }

  const currentPlan = plans[selectedPlan as keyof typeof plans]
  let currentPrice = 0
  let billingText = ""

  if (selectedPlan === "per-article") {
    currentPrice = currentPlan.price
    billingText = "Por artigo"
  } else if (selectedPlan === "institutional") {
    currentPrice = currentPlan.yearlyPrice
    billingText = "Anual (obrigatório)"
  } else {
    currentPrice = billingType === "monthly" ? currentPlan.monthlyPrice : currentPlan.yearlyPrice
    billingText = billingType === "monthly" ? "Mensal" : "Anual"
  }

  const discount =
    selectedPlan === "professional" && billingType === "yearly"
      ? Math.round((1 - currentPlan.yearlyPrice / (currentPlan.monthlyPrice * 12)) * 100)
      : 0

  // Construir URL com dados do cliente
  const buildCheckoutUrl = () => {
    const baseUrl = currentPlan.hotmartUrl
    const params = new URLSearchParams()

    if (customerData.email) params.append("email", customerData.email)
    if (customerData.name) params.append("name", customerData.name)
    if (customerData.document) params.append("document", customerData.document)
    if (customerData.phone) params.append("phone", customerData.phone)

    // Adicionar dados do plano
    params.append(
      "custom",
      JSON.stringify({
        plan: selectedPlan,
        billing: billingType,
        price: currentPrice,
      }),
    )

    return `${baseUrl}?${params.toString()}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <Link href="/landing" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <Link href="/" className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">IA</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">iArtigo</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Finalizar Assinatura</h1>
          <p className="text-gray-600">Pagamento seguro via Hotmart</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Dados do Cliente */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados do Cliente</CardTitle>
                <CardDescription>Preencha seus dados para continuar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome completo *</Label>
                    <Input
                      id="name"
                      value={customerData.name}
                      onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerData.email}
                      onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="document">CPF/CNPJ</Label>
                    <Input
                      id="document"
                      value={customerData.document}
                      onChange={(e) => setCustomerData({ ...customerData, document: e.target.value })}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={customerData.phone}
                      onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seleção de Plano */}
            <Card>
              <CardHeader>
                <CardTitle>Escolha seu Plano</CardTitle>
                <CardDescription>Selecione o plano ideal para suas necessidades</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPlan === "professional" && (
                  <div className="flex items-center gap-4 mb-4">
                    <Button
                      variant={billingType === "monthly" ? "default" : "outline"}
                      onClick={() => setBillingType("monthly")}
                      size="sm"
                    >
                      Mensal
                    </Button>
                    <Button
                      variant={billingType === "yearly" ? "default" : "outline"}
                      onClick={() => setBillingType("yearly")}
                      size="sm"
                    >
                      Anual
                      {discount > 0 && <Badge className="ml-2 bg-green-100 text-green-800">-{discount}%</Badge>}
                    </Button>
                  </div>
                )}

                {Object.entries(plans).map(([key, plan]) => (
                  <div
                    key={key}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedPlan === key ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedPlan(key)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{plan.name}</h3>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          R${" "}
                          {key === "per-article"
                            ? plan.price
                            : billingType === "monthly"
                              ? plan.monthlyPrice
                              : plan.yearlyPrice}
                        </div>
                        <div className="text-sm text-gray-600">
                          /{key === "per-article" ? "artigo" : billingType === "monthly" ? "mês" : "ano"}
                        </div>
                      </div>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Resumo do Pedido */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Plano {currentPlan.name}</span>
                  <span className="font-medium">R$ {currentPrice}</span>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Cobrança</span>
                  <span>{billingText}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between items-center text-sm text-green-600">
                    <span>Desconto anual</span>
                    <span>-{discount}%</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total</span>
                  <span>R$ {currentPrice}</span>
                </div>

                <div className="text-sm text-gray-600">
                  <p>• Cobrança {billingText.toLowerCase()}</p>
                  <p>• Cancele a qualquer momento</p>
                  <p>• Suporte incluído</p>
                  <p>• Acesso imediato após confirmação</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Pagamento Seguro via Hotmart
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>Criptografia SSL 256-bit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Processado pela Hotmart</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-green-500" />
                    <span>Cartão, PIX, Boleto</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-green-500" />
                    <span>Dados protegidos</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Widget Hotmart */}
            <HotmartCheckoutWidget
              productUrl={buildCheckoutUrl()}
              buttonText={`Pagar via Hotmart - R$ ${currentPrice}`}
              customButton={true}
            />

            <div className="text-center text-sm text-gray-500">
              <p>Você será redirecionado para a página segura da Hotmart para finalizar o pagamento.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
