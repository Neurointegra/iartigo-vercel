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

      const paymentData = await response.json()

      if (paymentData.success && paymentData.data.checkoutUrl) {
        toast({
          title: "Pagamento criado!",
          description: "Redirecionando para o checkout...",
          variant: "default",
        })

        // Redirecionar para o checkout do Asaas
        window.location.href = paymentData.data.checkoutUrl
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">IA</span>
                </div>
                <span className="text-xl font-bold text-gray-900">iArtigo - Planos</span>
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Olá, {user.name}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Escolha o plano ideal para você
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Gere artigos científicos profissionais com inteligência artificial. 
            Todos os planos incluem acesso completo à nossa IA avançada.
          </p>
        </div>

        {/* Planos */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${
                plan.popular ? 'border-blue-500 border-2 shadow-lg scale-105' : ''
              } ${
                selectedPlan === plan.id ? 'ring-2 ring-blue-500' : ''
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
                  {plan.id === 'estudante' && <Sparkles className="h-12 w-12 mx-auto text-gray-600" />}
                  {plan.id === 'pesquisador' && <CreditCard className="h-12 w-12 mx-auto text-blue-600" />}
                  {plan.id === 'institucional' && <Building className="h-12 w-12 mx-auto text-green-600" />}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">R$ {plan.price.toFixed(2)}</span>
                  <span className="text-gray-600">/mês</span>
                </div>
                <div className="text-sm text-gray-500">
                  {plan.articlesLimit ? `${plan.articlesLimit} artigo${plan.articlesLimit > 1 ? 's' : ''} por mês` : 'Artigos ilimitados'}
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                  variant={selectedPlan === plan.id ? "default" : "outline"}
                >
                  {selectedPlan === plan.id ? 'Selecionado' : 'Escolher Plano'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Resumo do plano selecionado */}
        {selectedPlan && user && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Finalizar Assinatura</CardTitle>
              <CardDescription>
                Plano selecionado: {plans.find(p => p.id === selectedPlan)?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Plano:</span>
                  <span className="font-medium">{plans.find(p => p.id === selectedPlan)?.name}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Valor mensal:</span>
                  <span className="font-bold text-lg">R$ {plans.find(p => p.id === selectedPlan)?.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">CPF:</span>
                  <span className="text-sm font-medium">{user.cpf || 'Não informado'}</span>
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
                className="w-full"
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
                Você será redirecionado para o Asaas para finalizar o pagamento de forma segura.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
