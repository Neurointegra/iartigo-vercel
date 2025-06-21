"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Shield, CheckCircle, ArrowLeft, Lock, QrCode, Building, DollarSign } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function PaymentPage() {
  const [selectedPlan, setSelectedPlan] = useState("professional")
  const [paymentMethod, setPaymentMethod] = useState("credit-card")
  const [isLoading, setIsLoading] = useState(false)
  const [billingType, setBillingType] = useState("monthly")
  const router = useRouter()

  const plans = {
    "per-article": {
      name: "Por Artigo",
      price: 15,
      yearlyPrice: 15, // Mesmo preço pois é por artigo
      features: ["Pagamento por artigo gerado", "Formatação básica", "Suporte por email", "Exportação PDF"],
      billing: "per-use",
    },
    professional: {
      name: "Profissional",
      monthlyPrice: 79,
      yearlyPrice: 790, // 10 meses pelo preço de 12
      features: ["5 artigos por mês", "Todos os recursos", "Suporte prioritário", "Gráficos avançados"],
      billing: "monthly",
    },
    institutional: {
      name: "Institucional",
      monthlyPrice: 199,
      yearlyPrice: 2388, // 12 meses obrigatório
      features: [
        "Artigos ilimitados",
        "Múltiplos usuários (até 10)",
        "Contrato anual obrigatório",
        "API personalizada",
        "Suporte dedicado 24/7",
      ],
      billing: "annual-only",
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

  const handlePayment = async () => {
    setIsLoading(true)

    try {
      // Integração com Green API
      const greenPayment = await createGreenPayment()

      if (greenPayment.success) {
        // Redirecionar para dashboard após pagamento confirmado
        router.push("/dashboard")
      } else {
        alert("Erro no pagamento. Tente novamente.")
      }
    } catch (error) {
      console.error("Erro ao processar pagamento:", error)
      alert("Erro no pagamento. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const createGreenPayment = async () => {
    // Integração real com Green API
    const paymentData = {
      amount: currentPrice * 100, // Green usa centavos
      currency: "BRL",
      description: `iArtigo - Plano ${currentPlan.name} (${billingText})`,
      customer: {
        name: "Nome do Cliente",
        email: "cliente@email.com",
      },
      payment_method: paymentMethod,
      metadata: {
        plan: selectedPlan,
        billing: billingType,
        product: "iartigo_subscription",
      },
      success_url: `${window.location.origin}/dashboard?payment=success`,
      cancel_url: `${window.location.origin}/payment?payment=cancelled`,
    }

    try {
      // Simular chamada para Green API
      const response = await fetch("/api/green/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      })

      const result = await response.json()

      if (result.success) {
        // Redirecionar para URL de pagamento do Green
        window.location.href = result.payment_url
        return { success: true }
      }

      return { success: false, error: result.error }
    } catch (error) {
      console.error("Erro na integração Green:", error)
      return { success: false, error: "Erro de conexão" }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <Link href="/auth/register" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao cadastro
          </Link>
          <Link href="/" className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">IA</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">iArtigo</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Finalizar Assinatura</h1>
          <p className="text-gray-600">Escolha seu plano e método de pagamento</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Seleção de Plano */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Escolha seu Plano</CardTitle>
                <CardDescription>Selecione o plano ideal para suas necessidades</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPlan !== "per-article" && selectedPlan !== "institutional" && (
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

                {selectedPlan === "per-article" && (
                  <div className="p-3 bg-blue-50 rounded-lg mb-4">
                    <p className="text-sm text-blue-700">
                      💡 <strong>Pagamento por uso:</strong> Você paga apenas pelos artigos que gerar, sem mensalidade.
                    </p>
                  </div>
                )}

                {selectedPlan === "institutional" && (
                  <div className="p-3 bg-purple-50 rounded-lg mb-4">
                    <p className="text-sm text-purple-700">
                      🏛️ <strong>Plano Institucional:</strong> Contrato anual obrigatório com desconto especial para
                      universidades.
                    </p>
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

            {/* Método de Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Método de Pagamento
                </CardTitle>
                <CardDescription>Pagamento seguro processado pela Green</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === "credit-card"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setPaymentMethod("credit-card")}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Cartão de Crédito</p>
                        <p className="text-sm text-gray-600">Visa, Mastercard, Elo</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === "pix" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setPaymentMethod("pix")}
                  >
                    <div className="flex items-center gap-3">
                      <QrCode className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">PIX</p>
                        <p className="text-sm text-gray-600">Pagamento instantâneo</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === "boleto"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setPaymentMethod("boleto")}
                  >
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium">Boleto Bancário</p>
                        <p className="text-sm text-gray-600">Vencimento em 3 dias úteis</p>
                      </div>
                    </div>
                  </div>
                </div>

                {paymentMethod === "credit-card" && (
                  <div className="space-y-4 mt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cardName">Nome no cartão</Label>
                        <Input id="cardName" placeholder="Nome completo" />
                      </div>
                      <div>
                        <Label htmlFor="cardNumber">Número do cartão</Label>
                        <Input id="cardNumber" placeholder="0000 0000 0000 0000" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiry">Validade</Label>
                        <Input id="expiry" placeholder="MM/AA" />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input id="cvv" placeholder="123" />
                      </div>
                    </div>
                  </div>
                )}
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
                  <span className="font-medium">
                    R${" "}
                    {selectedPlan === "per-article"
                      ? currentPlan.price
                      : billingType === "monthly"
                        ? currentPlan.monthlyPrice
                        : currentPlan.yearlyPrice}
                  </span>
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
                  <p>• Cobrança recorrente {billingText}</p>
                  <p>• Cancele a qualquer momento</p>
                  <p>• Suporte incluído</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Pagamento Seguro
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
                    <span>Processado pela Green</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-green-500" />
                    <span>Dados protegidos</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handlePayment}
              className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
              disabled={isLoading}
            >
              {isLoading ? (
                "Processando pagamento..."
              ) : (
                <>
                  <DollarSign className="h-5 w-5 mr-2" />
                  Finalizar Pagamento - R$ {currentPrice}
                </>
              )}
            </Button>

            <div className="text-center text-sm text-gray-500">
              <p>
                Ao finalizar, você concorda com nossos{" "}
                <Link href="/terms" className="text-blue-600 hover:text-blue-700">
                  Termos de Serviço
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
