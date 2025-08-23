"use client"

import { useState, useEffect } from "react"
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
  AlertTriangle,
  Info,
} from "lucide-react"
import Link from "next/link"
import { PaymentModal } from "@/components/PaymentModal"
import { getPlans, getPopularPlans, createSubscription, getMySubscription, cancelSubscription, changePlan, pauseSubscription, resumeSubscription } from "@/app/plans-actions"

interface Plan {
  id: number
  name: string
  plan_type: string
  description: string
  monthly_price: string
  articles_per_month: number
  is_popular: boolean
  is_active: boolean
  features: string[]
  articles_display: string
  is_unlimited: boolean
}

interface Subscription {
  id: number
  user: number
  plan: Plan
  status: string
  start_date: string
  end_date: string
  next_due_date: string
  auto_renew: boolean
  articles_used_this_month: number
  asaas_customer_id: string
  asaas_subscription_id: string
}

export default function PlansPage() {
  const { user, isLoading, getToken } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)
  const [isCreatingPayment, setIsCreatingPayment] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null)
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isChangingPlan, setIsChangingPlan] = useState(false)
  const [isPausing, setIsPausing] = useState(false)
  const [isResuming, setIsResuming] = useState(false)
  const [showChangePlanModal, setShowChangePlanModal] = useState(false)
  const [planToChange, setPlanToChange] = useState<Plan | null>(null)

  // Carregar planos e assinatura atual
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('=== INICIANDO CARREGAMENTO DE DADOS ===')
        console.log('Status do usuário:', { user, isLoading })
        console.log('getToken disponível:', !!getToken)
        
        setIsLoadingPlans(true)
        setIsLoadingSubscription(true)
        
        // Carregar planos e assinatura atual se usuário estiver logado
        const token = getToken()
        console.log('Token disponível:', !!token)
        
        if (token) {
          try {
            // Carregar planos com autenticação
            console.log('Carregando planos com autenticação...')
            const plansData = await getPlans(token)
            console.log('Planos recebidos da API:', plansData)
            // Garantir que plansData seja um array
            if (Array.isArray(plansData)) {
              setPlans(plansData)
            } else {
              console.error('Formato inválido de planos recebido:', plansData)
              setPlans([])
            }
            
            // Carregar assinatura atual
            console.log('Carregando assinatura atual...')
            const subscription = await getMySubscription(token)
            console.log('Assinatura carregada:', subscription)
            setCurrentSubscription(subscription)
          } catch (error) {
            console.error('Erro ao carregar dados:', error)
            setCurrentSubscription(null)
            setPlans([]) // Garantir que plans seja um array vazio em caso de erro
          }
        } else {
          // Se não há token, apenas carregar planos públicos (se existirem)
          try {
            const plansData = await getPlans()
            console.log('Planos públicos recebidos da API:', plansData)
            // Garantir que plansData seja um array
            if (Array.isArray(plansData)) {
              setPlans(plansData)
            } else {
              console.error('Formato inválido de planos recebido:', plansData)
              setPlans([])
            }
          } catch (error) {
            console.error('Erro ao carregar planos:', error)
            setPlans([]) // Garantir que plans seja um array vazio em caso de erro
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os planos disponíveis.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingPlans(false)
        setIsLoadingSubscription(false)
      }
    }

    loadData()
  }, [getToken, toast])

  const handleSelectPlan = async (planId: number) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para selecionar um plano",
        variant: "destructive",
      })
      router.push('/auth/login')
      return
    }

    // Se o usuário já tem uma assinatura ativa, mostrar aviso
    if (currentSubscription && currentSubscription.status === 'active') {
      toast({
        title: "Assinatura ativa",
        description: "Você já possui uma assinatura ativa. Cancele a atual para escolher um novo plano.",
        variant: "destructive",
      })
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

    const token = getToken()
    if (!token) {
      toast({
        title: "Token de autenticação necessário",
        description: "Faça login novamente para continuar",
        variant: "destructive",
      })
      return
    }

    setIsCreatingPayment(true)

    try {
      // Validar que plans é um array
      if (!Array.isArray(plans) || plans.length === 0) {
        throw new Error('Lista de planos não disponível')
      }
      
      // Buscar dados do plano selecionado
      const selectedPlanData = plans.find(p => p.id === selectedPlan)
      if (!selectedPlanData) {
        throw new Error('Plano não encontrado')
      }

      // Criar assinatura usando a nova API
      const subscription = await createSubscription(selectedPlan, true, token)
      
      // Simular dados de pagamento (será integrado com Asaas posteriormente)
      setPaymentData({
        checkoutUrl: '#', // Placeholder - será integrado com Asaas
        planDetails: {
          name: selectedPlanData.name,
          price: parseFloat(selectedPlanData.monthly_price),
          description: selectedPlanData.description,
          articlesLimit: selectedPlanData.is_unlimited ? null : selectedPlanData.articles_per_month
        },
        paymentId: subscription.id,
        asaasId: subscription.asaas_subscription_id
      })
      
        setShowPaymentModal(true)
        
        toast({
        title: "Assinatura criada!",
        description: "Sua assinatura foi criada com sucesso.",
          variant: "default",
        })
    } catch (error) {
      console.error('Erro ao criar assinatura:', error)
      toast({
        title: "Erro ao criar assinatura",
        description: error instanceof Error ? error.message : 'Não foi possível criar a assinatura. Tente novamente.',
        variant: "destructive",
      })
    } finally {
      setIsCreatingPayment(false)
    }
  }

  

  const handleChangePlan = async (newPlan: Plan) => {
    if (!currentSubscription || !user) return

    try {
      setIsChangingPlan(true)
      const token = getToken()
      if (!token) {
        toast({
          title: "Erro de autenticação",
          description: "Token não encontrado. Faça login novamente.",
          variant: "destructive",
        })
        return
      }

      await changePlan(currentSubscription.id, newPlan.id, token)
      
      toast({
        title: "Plano alterado",
        description: `Seu plano foi alterado para ${newPlan.name} com sucesso!`,
        variant: "default",
      })

      // Recarregar dados
      const subscription = await getMySubscription(token)
      setCurrentSubscription(subscription)
      setShowChangePlanModal(false)
      setPlanToChange(null)
    } catch (error: any) {
      console.error('Erro ao alterar plano:', error)
      toast({
        title: "Erro ao alterar plano",
        description: error.message || "Não foi possível alterar seu plano. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsChangingPlan(false)
    }
  }

  const handlePauseSubscription = async () => {
    if (!currentSubscription || !user) return

    try {
      setIsPausing(true)
      const token = getToken()
      if (!token) {
        toast({
          title: "Erro de autenticação",
          description: "Token não encontrado. Faça login novamente.",
          variant: "destructive",
        })
        return
      }

      await pauseSubscription(currentSubscription.id, token)
      
      toast({
        title: "Assinatura pausada",
        description: "Sua assinatura foi pausada com sucesso. Você pode retomá-la a qualquer momento.",
        variant: "default",
      })

      // Recarregar dados
      const subscription = await getMySubscription(token)
      setCurrentSubscription(subscription)
    } catch (error: any) {
      console.error('Erro ao pausar assinatura:', error)
      toast({
        title: "Erro ao pausar assinatura",
        description: error.message || "Não foi possível pausar sua assinatura. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsPausing(false)
    }
  }

  const handleResumeSubscription = async () => {
    if (!currentSubscription || !user) return

    try {
      setIsResuming(true)
      const token = getToken()
      if (!token) {
        toast({
          title: "Erro de autenticação",
          description: "Token não encontrado. Faça login novamente.",
          variant: "destructive",
        })
        return
      }

      await resumeSubscription(currentSubscription.id, token)
      
      toast({
        title: "Assinatura retomada",
        description: "Sua assinatura foi retomada com sucesso!",
        variant: "default",
      })

      // Recarregar dados
      const subscription = await getMySubscription(token)
      setCurrentSubscription(subscription)
    } catch (error: any) {
      console.error('Erro ao retomar assinatura:', error)
      toast({
        title: "Erro ao retomar assinatura",
        description: error.message || "Não foi possível retomar sua assinatura. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsResuming(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!currentSubscription || !user) return

    try {
      setIsCancelling(true)
      const token = getToken()
      if (!token) {
        toast({
          title: "Erro de autenticação",
          description: "Token não encontrado. Faça login novamente.",
          variant: "destructive",
        })
        return
      }

      await cancelSubscription(currentSubscription.id, "Usuário solicitou cancelamento", false, token)
      
      toast({
        title: "Assinatura cancelada",
        description: "Sua assinatura foi cancelada com sucesso. Você pode escolher um novo plano agora.",
        variant: "default",
      })

      // Recarregar dados
      const subscription = await getMySubscription(token)
      setCurrentSubscription(subscription)
      setSelectedPlan(null)
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error)
      toast({
        title: "Erro ao cancelar assinatura",
        description: "Não foi possível cancelar sua assinatura. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
    }
  }



  const handlePaymentSuccess = () => {
    toast({
      title: "Pagamento confirmado!",
      description: "Seu plano foi ativado com sucesso!",
      variant: "default",
    })
    
    // Recarregar dados
    const token = getToken()
    if (token) {
      getMySubscription(token).then(setCurrentSubscription)
    }
    
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
                <span className="text-sm text-gray-700 font-medium">
                  Olá, {user.first_name} {user.last_name}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Status da Assinatura Atual */}
        {currentSubscription && currentSubscription.status === 'active' && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-5 w-5" />
                Assinatura Ativa
              </CardTitle>
              <CardDescription className="text-orange-700">
                Você possui uma assinatura ativa no plano <strong>{currentSubscription.plan.name}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-orange-100 rounded-lg">
                  <p className="text-sm text-orange-700 font-medium">Plano Atual</p>
                  <p className="text-lg font-bold text-orange-800">{currentSubscription.plan.name}</p>
                </div>
                <div className="text-center p-3 bg-orange-100 rounded-lg">
                  <p className="text-sm text-orange-700 font-medium">Valor Mensal</p>
                  <p className="text-lg font-bold text-orange-800">R$ {currentSubscription.plan.monthly_price}</p>
                </div>
                <div className="text-center p-3 bg-orange-100 rounded-lg">
                  <p className="text-sm text-orange-700 font-medium">Artigos Usados</p>
                  <p className="text-lg font-bold text-orange-800">
                    {currentSubscription.articles_used_this_month} / {currentSubscription.plan.is_unlimited ? '∞' : currentSubscription.plan.articles_per_month}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-orange-700">
                  <p>Próxima cobrança: <strong>{new Date(currentSubscription.next_due_date).toLocaleDateString('pt-BR')}</strong></p>
                </div>
                <div className="flex gap-2">
                  {currentSubscription.status === 'active' && (
                    <>
                      <Button
                        variant="outline"
                        onClick={handlePauseSubscription}
                        disabled={isPausing}
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        {isPausing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Pausando...
                          </>
                        ) : (
                          'Pausar Assinatura'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowChangePlanModal(true)}
                        className="border-green-300 text-green-700 hover:bg-green-100"
                      >
                        Trocar Plano
                      </Button>
                    </>
                  )}
                  {currentSubscription.status !== 'active' && currentSubscription.status !== 'cancelled' && (
                    <Button
                      variant="outline"
                      onClick={handleResumeSubscription}
                      disabled={isResuming}
                      className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                      {isResuming ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Retomando...
                        </>
                      ) : (
                        'Retomar Assinatura'
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleCancelSubscription}
                    disabled={isCancelling}
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelando...
                      </>
                    ) : (
                      'Cancelar Assinatura'
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-orange-100 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-orange-700">
                    <p className="font-medium">Para escolher um novo plano:</p>
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                      <li>Cancele sua assinatura atual (acima)</li>
                      <li>Escolha um novo plano na lista abaixo</li>
                      <li>Complete o processo de pagamento</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aviso para usuários sem assinatura */}
        {!currentSubscription && user && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-blue-800">
                <Info className="h-5 w-5" />
                  <div>
                  <p className="font-medium">Escolha seu plano!</p>
                  <p className="text-sm">Selecione um dos planos abaixo para começar a usar o iArtigo</p>
                </div>
                  </div>
            </CardContent>
          </Card>
        )}

        {/* Aviso para usuários não logados */}
        {!user && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Login necessário</p>
                  <p className="text-sm">Faça login para visualizar e escolher planos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Título da Seção */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {!user 
              ? 'Planos Disponíveis'
              : currentSubscription && currentSubscription.status === 'active' 
                ? 'Planos Disponíveis' 
                : 'Escolha seu Plano'
            }
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {!user
              ? 'Faça login para visualizar e escolher planos'
              : currentSubscription && currentSubscription.status === 'active'
                ? 'Após cancelar sua assinatura atual, você poderá escolher um destes planos:'
                : 'Selecione o plano ideal para suas necessidades de pesquisa e publicação'
            }
          </p>
        </div>

        {/* Lista de Planos */}
        {!user ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Faça login para ver os planos</h3>
              <p className="text-gray-600 mb-6">Entre na sua conta para visualizar e escolher planos disponíveis</p>
              <Button onClick={() => router.push('/auth/login')} className="bg-blue-600 hover:bg-blue-700">
                Fazer Login
              </Button>
            </div>
          </div>
        ) : isLoadingPlans ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Carregando planos...</p>
          </div>
        ) : !Array.isArray(plans) || plans.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum plano disponível</h3>
              <p className="text-gray-600 mb-6">Não foi possível carregar os planos. Tente novamente mais tarde.</p>
              <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
                Tentar Novamente
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {plans.map((plan) => {
              const isCurrentPlan = currentSubscription?.plan.id === plan.id
              const isDisabled = currentSubscription?.status === 'active' && !isCurrentPlan
              
              return (
            <Card 
              key={plan.id} 
                  className={`relative bg-white/90 backdrop-blur-sm border-2 transition-all duration-300 hover:shadow-xl ${
                    isCurrentPlan 
                      ? 'border-green-400 shadow-lg ring-2 ring-green-400/30' 
                      : plan.is_popular 
                        ? 'border-blue-300 shadow-lg' 
                        : selectedPlan === plan.id 
                          ? 'border-blue-400 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300'
                  } ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-green-500 text-white px-3 py-1">
                        Plano Atual
                      </Badge>
                    </div>
                  )}
                  
                  {plan.is_popular && !isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white px-3 py-1">
                        Mais Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="mb-4">
                      {plan.plan_type === 'student' && <Sparkles className="h-12 w-12 mx-auto text-yellow-600" />}
                      {plan.plan_type === 'researcher' && <CreditCard className="h-12 w-12 mx-auto text-blue-600" />}
                      {plan.plan_type === 'institutional' && <Building className="h-12 w-12 mx-auto text-green-600" />}
                </div>
                <CardTitle className="text-2xl text-gray-800 font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-base text-gray-600 leading-relaxed">{plan.description}</CardDescription>
                <div className="mt-4">
                      <span className="text-4xl font-bold text-gray-800">R$ {plan.monthly_price}</span>
                  <span className="text-gray-600 font-medium">/mês</span>
                </div>
                <div className="text-sm text-gray-600 font-medium">
                      {plan.is_unlimited ? 'Artigos ilimitados' : `${plan.articles_per_month} artigo${plan.articles_per_month > 1 ? 's' : ''} por mês`}
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
                      disabled={isDisabled || isCurrentPlan}
                  className={`w-full font-semibold transition-all duration-200 ${
                        isCurrentPlan
                          ? 'bg-green-600 hover:bg-green-700 shadow-lg cursor-default'
                          : plan.is_popular 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl' 
                      : selectedPlan === plan.id 
                        ? 'bg-blue-600 hover:bg-blue-700 shadow-lg'
                        : 'bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-blue-400 text-gray-700 hover:text-blue-700'
                  }`}
                      variant={isCurrentPlan ? "default" : selectedPlan === plan.id ? "default" : "outline"}
                    >
                      {isCurrentPlan 
                        ? '✓ Plano Atual' 
                        : selectedPlan === plan.id 
                          ? '✓ Selecionado' 
                          : isDisabled 
                            ? 'Assinatura Ativa' 
                            : 'Escolher Plano'
                      }
                </Button>
              </CardContent>
            </Card>
              )
            })}
        </div>
        )}

        {/* Resumo do plano selecionado */}
        {selectedPlan && user && !currentSubscription && (
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
                  <span className="font-bold text-xl text-blue-600">R$ {plans.find(p => p.id === selectedPlan)?.monthly_price}</span>
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
                    Criando assinatura...
                  </>
                ) : (
                  'Prosseguir para Pagamento'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Aviso para usuários com assinatura ativa que tentam selecionar plano */}
        {selectedPlan && user && currentSubscription && currentSubscription.status === 'active' && (
          <Card className="max-w-md mx-auto bg-orange-50 border-orange-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-orange-800 mb-2">Assinatura Ativa</h3>
                <p className="text-orange-700 mb-4">
                  Você já possui uma assinatura ativa no plano <strong>{currentSubscription.plan.name}</strong>.
                </p>
                <p className="text-sm text-orange-600 mb-4">
                  Para escolher um novo plano, primeiro cancele sua assinatura atual.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSelectedPlan(null)}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  Entendi
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Modal de Pagamento */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          checkoutUrl={paymentData?.checkoutUrl || '#'}
          planDetails={paymentData?.planDetails || {}}
          onPaymentSuccess={handlePaymentSuccess}
          paymentId={paymentData?.paymentId}
          asaasId={paymentData?.asaasId}
        />

        {/* Modal de Troca de Plano */}
        {showChangePlanModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trocar Plano</h3>
              <p className="text-gray-600 mb-6">
                Escolha o novo plano para sua assinatura. A troca será aplicada imediatamente.
              </p>
              
              <div className="space-y-3 mb-6">
                {plans
                  .filter(plan => plan.id !== currentSubscription?.plan.id)
                  .map((plan) => (
                    <div
                      key={plan.id}
                      className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                      onClick={() => setPlanToChange(plan)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{plan.name}</h4>
                          <p className="text-sm text-gray-600">R$ {plan.monthly_price}/mês</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          planToChange?.id === plan.id 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-gray-300'
                        }`}>
                          {planToChange?.id === plan.id && (
                            <div className="w-2 h-2 bg-white rounded-full m-auto" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowChangePlanModal(false)
                    setPlanToChange(null)
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => planToChange && handleChangePlan(planToChange)}
                  disabled={!planToChange || isChangingPlan}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isChangingPlan ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    'Confirmar Troca'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
