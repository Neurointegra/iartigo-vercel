"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import {
  Check,
  CreditCard,
  Sparkles,
  Users,
  Building,
  Loader2,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { PaymentModal } from "@/components/PaymentModal"

interface Plan {
  id: string
  name: string
  description: string
  price: number
  features: string[]
  badge?: string
  badgeColor?: string
  popular?: boolean
  articlesLimit: number | null
}

const plans: Plan[] = [
  {
    id: 'estudante',
    name: 'Estudante',
    description: 'Perfeito para estudantes de graduação e pós-graduação',
    price: 29.90,
    articlesLimit: 1,
    features: [
      '1 artigo por mês',
      'Formatação ABNT',
      'Anti-plágio básico',
      'Suporte por email',
      'Exportação PDF/Word',
    ],
  },
  {
    id: 'pesquisador',
    name: 'Pesquisador',
    description: 'Ideal para pesquisadores e professores ativos',
    price: 99.90,
    articlesLimit: 5,
    badge: 'Mais Popular',
    badgeColor: 'bg-green-500',
    popular: true,
    features: [
      '5 artigos por mês',
      'Todas as formatações',
      'Anti-plágio avançado',
      'Revisão IA especializada',
      'Base de dados premium',
      'Suporte prioritário',
      'Templates exclusivos',
    ],
  },
  {
    id: 'institucional',
    name: 'Institucional',
    description: 'Para instituições e equipes de pesquisa',
    price: 297.00,
    articlesLimit: null,
    badge: 'Ilimitado',
    badgeColor: 'bg-green-500',
    features: [
      'Artigos ilimitados',
      'Multi-usuários (até 10)',
      'Dashboard analytics',
      'API personalizada',
      'Treinamento dedicado',
      'Suporte 24/7',
      'Customizações exclusivas',
      'Relatórios detalhados',
    ],
  },
]

export default function PlansPage() {
  const { user, isLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isCreatingPayment, setIsCreatingPayment] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para escolher um plano",
        variant: "destructive",
      })
      router.push('/auth/login')
      return
    }

    setSelectedPlan(planId)
  }

  const handleCreatePayment = async () => {
    if (!selectedPlan || !user) return

    // Validar CPF do usuário
    if (!user.cpf || user.cpf.length < 11) {
      toast({
        title: "CPF necessário",
        description: "Por favor, complete seu CPF no perfil para continuar",
        variant: "destructive",
      })
      return
    }

    setIsCreatingPayment(true)

    try {
      const response = await fetch('/api/asaas/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          planType: selectedPlan,
          userCpf: user.cpf.replace(/\D/g, ''), // Remove caracteres não numéricos
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar pagamento')
      }

      const paymentResponse = await response.json()

      if (paymentResponse.success && paymentResponse.data.checkoutUrl) {
        // Salvar dados do pagamento e mostrar modal
        setPaymentData(paymentResponse.data)
        setShowPaymentModal(true)
        
        toast({
          title: "Pagamento criado!",
          description: "Abrindo modal de pagamento...",
          variant: "default",
        })
      } else {
        throw new Error('URL de checkout não fornecida')
      }

    } catch (error) {
      console.error('Erro ao criar pagamento:', error)
      toast({
        title: "Erro ao criar pagamento",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      })
    } finally {
      setIsCreatingPayment(false)
    }
  }

  const handlePaymentSuccess = () => {
    toast({
      title: "Pagamento confirmado!",
      description: "Seu plano foi ativado com sucesso!",
      variant: "default",
    })
    
    // Redirecionar para o dashboard
    router.push('/dashboard')
  }



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">IA</span>
                </div>
                <span className="text-xl font-bold text-gray-800">iArtigo - Planos</span>
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700 font-medium">Olá, {user.name}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Aviso para usuários com plano ativo (não cancelado) */}
        {user?.plan && user?.plan !== 'Por Artigo' && user?.subscriptionStatus !== 'cancelled' && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-blue-800">
                  <CreditCard className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Você já possui um plano ativo!</p>
                    <p className="text-sm">Plano atual: <strong>{user.plan}</strong></p>
                  </div>
                </div>
                <Link href="/plans/manage">
                  <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                    Gerenciar Plano Atual
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Escolha o plano ideal para você
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Gere artigos científicos profissionais com inteligência artificial. 
            Todos os planos incluem acesso completo à nossa IA avançada.
          </p>
        </div>

        {/* Planos */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative bg-white/90 backdrop-blur-sm border-2 hover:shadow-xl transition-all duration-300 ${
                plan.popular ? 'border-blue-500 shadow-2xl scale-105' : 'border-gray-200 hover:border-blue-300'
              } ${
                selectedPlan === plan.id ? 'ring-4 ring-blue-500/30 shadow-2xl' : ''
              }`}
            >
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2`}>
                  <Badge className={`${plan.badgeColor} text-white px-3 py-1`}>
                    {plan.badge}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="mb-4">
                  {plan.id === 'estudante' && <Sparkles className="h-12 w-12 mx-auto text-yellow-600" />}
                  {plan.id === 'pesquisador' && <CreditCard className="h-12 w-12 mx-auto text-blue-600" />}
                  {plan.id === 'institucional' && <Building className="h-12 w-12 mx-auto text-green-600" />}
                </div>
                <CardTitle className="text-2xl text-gray-800 font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-base text-gray-600 leading-relaxed">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-800">R$ {plan.price.toFixed(2)}</span>
                  <span className="text-gray-600 font-medium">/mês</span>
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {plan.articlesLimit ? `${plan.articlesLimit} artigo${plan.articlesLimit > 1 ? 's' : ''} por mês` : 'Artigos ilimitados'}
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full font-semibold transition-all duration-200 ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl' 
                      : selectedPlan === plan.id 
                        ? 'bg-blue-600 hover:bg-blue-700 shadow-lg'
                        : 'bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-blue-400 text-gray-700 hover:text-blue-700'
                  }`}
                  variant={selectedPlan === plan.id ? "default" : "outline"}
                >
                  {selectedPlan === plan.id ? '✓ Selecionado' : 'Escolher Plano'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Resumo do plano selecionado */}
        {selectedPlan && user && (
          <Card className="max-w-md mx-auto bg-white/90 backdrop-blur-sm border-2 border-blue-200 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-gray-800">Finalizar Assinatura</CardTitle>
              <CardDescription className="text-gray-600">
                Plano selecionado: <span className="font-semibold text-blue-600">{plans.find(p => p.id === selectedPlan)?.name}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-700 font-medium">Plano:</span>
                  <span className="font-semibold text-gray-800">{plans.find(p => p.id === selectedPlan)?.name}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-700 font-medium">Valor mensal:</span>
                  <span className="font-bold text-xl text-blue-600">R$ {plans.find(p => p.id === selectedPlan)?.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 font-medium">CPF:</span>
                  <span className="text-sm font-semibold text-gray-800">{user.cpf || 'Não informado'}</span>
                </div>
              </div>

              {!user.cpf ? (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800 mb-2">
                    ⚠️ CPF necessário para pagamento
                  </p>
                  <p className="text-xs text-yellow-700">
                    Complete seu CPF no perfil para continuar
                  </p>
                </div>
              ) : null}

              <Button
                onClick={handleCreatePayment}
                disabled={isCreatingPayment || !user.cpf}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isCreatingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando pagamento...
                  </>
                ) : (
                  'Prosseguir para Pagamento'
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                O pagamento será processado pelo Asaas em uma nova janela. Após a confirmação, você será redirecionado para o dashboard.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Pagamento */}
      {showPaymentModal && paymentData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          checkoutUrl={paymentData.checkoutUrl}
          paymentId={paymentData.paymentId} // ID local do pagamento
          asaasId={paymentData.asaasId} // ID do Asaas para verificação
          planDetails={{
            name: plans.find(p => p.id === selectedPlan)?.name || '',
            price: plans.find(p => p.id === selectedPlan)?.price || 0,
            description: plans.find(p => p.id === selectedPlan)?.description || '',
            articlesLimit: plans.find(p => p.id === selectedPlan)?.articlesLimit || null,
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}
