"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { PlanChangeModal } from "@/components/PlanChangeModal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  CreditCard,
  Star,
  FileText,
  Grid3X3,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

interface Plan {
  id: string
  name: string
  price: number
  description: string
  articlesLimit: number | null
  features: string[]
  icon: React.ReactNode
  popular?: boolean
  unlimited?: boolean
}

export default function ManagePlansPage() {
  const { toast } = useToast()
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showChangePlanModal, setShowChangePlanModal] = useState(false)
  const [selectedNewPlan, setSelectedNewPlan] = useState<Plan | null>(null)

  const plans: Plan[] = [
    {
      id: "estudante",
      name: "Estudante",
      price: 29.90,
      description: "Perfeito para estudantes de graduação e pós-graduação",
      articlesLimit: 1,
      features: [
        "1 artigo por mês",
        "Formatação ABNT",
        "Anti-plágio básico",
        "Suporte por email",
        "Exportação PDF/Word"
      ],
      icon: <Star className="h-6 w-6" />
    },
    {
      id: "pesquisador",
      name: "Pesquisador",
      price: 99.90,
      description: "Ideal para pesquisadores e professores ativos",
      articlesLimit: 5,
      features: [
        "5 artigos por mês",
        "Todas as formatações",
        "Anti-plágio avançado",
        "Revisão IA especializada",
        "Base de dados premium",
        "Suporte prioritário",
        "Templates exclusivos"
      ],
      icon: <FileText className="h-6 w-6" />,
      popular: true
    },
    {
      id: "institucional",
      name: "Institucional",
      price: 297.00,
      description: "Para instituições e equipes de pesquisa",
      articlesLimit: null,
      features: [
        "Artigos ilimitados",
        "Multi-usuários (até 10)",
        "Dashboard analytics",
        "API personalizada",
        "Treinamento dedicado",
        "Suporte 24/7",
        "Customizações exclusivas",
        "Relatórios detalhados"
      ],
      icon: <Grid3X3 className="h-6 w-6" />,
      unlimited: true
    }
  ]

  const currentPlan = plans.find(plan => plan.id === user?.planType?.toLowerCase()) || 
                     plans.find(plan => plan.name === user?.plan)

  const handleChangePlan = async (newPlanId: string) => {
    if (!user) return

    const newPlan = plans.find(plan => plan.id === newPlanId)
    if (!newPlan) return

    // Se for o mesmo plano, não fazer nada
    if (newPlanId === user.planType?.toLowerCase()) {
      toast({
        title: "Plano já selecionado",
        description: "Você já possui este plano ativo.",
        variant: "default",
      })
      return
    }

    // Verificar se o usuário tem subscriptionId (para upgrades)
    if (!user.subscriptionId && user.planType !== 'per-article') {
      toast({
        title: "Erro ao alterar plano",
        description: "Usuário não possui assinatura ativa para alterar.",
        variant: "destructive",
      })
      return
    }

    // Mostrar modal de confirmação
    setSelectedNewPlan(newPlan)
    setShowChangePlanModal(true)
  }

  const confirmChangePlan = async () => {
    if (!user || !selectedNewPlan) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/asaas/change-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          currentPlanType: user.planType,
          newPlanType: selectedNewPlan.id,
          userCpf: user.cpf
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao alterar plano')
      }

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Plano alterado com sucesso!",
          description: "Seu novo plano foi ativado e os artigos bônus foram adicionados.",
          variant: "default",
        })
        
        // Recarregar dados do usuário
        await refreshUser()
        router.push('/dashboard')
      } else {
        throw new Error('Resposta inesperada da API')
      }

    } catch (error) {
      console.error('Erro ao alterar plano:', error)
      toast({
        title: "Erro ao alterar plano",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setShowChangePlanModal(false)
      setSelectedNewPlan(null)
    }
  }

  const handleSyncSubscription = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/asaas/sync-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao sincronizar assinatura')
      }

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Assinatura sincronizada!",
          description: "Seus dados foram atualizados com sucesso.",
          variant: "default",
        })
        
        // Recarregar dados do usuário
        await refreshUser()
      } else {
        throw new Error('Resposta inesperada da API')
      }

    } catch (error) {
      console.error('Erro ao sincronizar assinatura:', error)
      toast({
        title: "Erro ao sincronizar",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelPlan = async () => {
    if (!user) return

    // Verificar se o usuário tem subscriptionId
    if (!user.subscriptionId) {
      toast({
        title: "Erro ao cancelar plano",
        description: "Usuário não possui assinatura ativa para cancelar.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      console.log('🔍 Tentando cancelar plano:', { userId: user.id, subscriptionId: user.subscriptionId })
      
      const response = await fetch('/api/asaas/cancel-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          subscriptionId: user.subscriptionId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao cancelar plano')
      }

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Plano cancelado com sucesso!",
          description: "Seu plano foi cancelado e não será renovado automaticamente.",
          variant: "default",
        })
        
        // Recarregar dados do usuário
        await refreshUser()
        router.push('/dashboard')
      } else {
        throw new Error('Resposta inesperada da API')
      }

    } catch (error) {
      console.error('Erro ao cancelar plano:', error)
      toast({
        title: "Erro ao cancelar plano",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setShowCancelDialog(false)
    }
  }

  if (!user) {
    return null
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
                Voltar ao Dashboard
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">IA</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Gerenciar Plano</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciar Plano</h1>
          <p className="text-gray-600">Altere seu plano atual ou cancele sua assinatura</p>
          
          {/* Resumo do usuário */}
          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usuário: <span className="font-medium text-gray-900">{user.name}</span></p>
                <p className="text-sm text-gray-600">Email: <span className="font-medium text-gray-900">{user.email}</span></p>
                <p className="text-sm text-gray-600">CPF: <span className="font-medium text-gray-900">{user.cpf}</span></p>
              </div>

            </div>
          </div>
        </div>

        {/* Plano Atual */}
        {currentPlan && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <CreditCard className="h-5 w-5" />
                Plano Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    {currentPlan.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-blue-900">{currentPlan.name}</h3>
                    <p className="text-blue-700">R$ {currentPlan.price.toFixed(2)}/mês</p>
                    <p className="text-sm text-blue-600">
                      {currentPlan.unlimited 
                        ? 'Artigos ilimitados' 
                        : `${currentPlan.articlesLimit} artigo(s) por mês`
                      }
                    </p>
                    {/* Informações adicionais do usuário */}
                    {!currentPlan.unlimited && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-blue-600">
                          Artigos usados: <span className="font-medium">{user?.articlesUsed || 0}</span>
                        </p>
                        <p className="text-xs text-blue-600">
                          Artigos restantes: <span className="font-medium">
                            {Math.max(0, (currentPlan.articlesLimit || 0) - (user?.articlesUsed || 0))}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 mb-2">
                    {user?.subscriptionStatus === 'active' ? 'Ativo' : 
                     user?.subscriptionStatus === 'cancelled' ? 'Cancelado' : 'Pendente'}
                  </Badge>
                  {user?.subscriptionExpiresAt && (
                    <p className="text-sm text-blue-600">
                      {user?.subscriptionStatus === 'cancelled' ? 'Expira em' : 'Renova em'}: {new Date(user.subscriptionExpiresAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                                     {user?.subscriptionPaidAt && (
                     <p className="text-xs text-blue-500">
                       Último pagamento: {new Date(user.subscriptionPaidAt).toLocaleDateString('pt-BR')}
                     </p>
                   )}
                   
                                       {/* Aviso se não tiver subscriptionId */}
                    {!user?.subscriptionId && (
                      <div className="mt-2">
                        <p className="text-xs text-yellow-600 mb-2">
                          ⚠️ Usuário não possui assinatura ativa no Asaas
                        </p>
                        <Button 
                          onClick={handleSyncSubscription}
                          disabled={isLoading}
                          variant="outline" 
                          size="sm"
                          className="text-xs"
                        >
                          🔄 Sincronizar com Asaas
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Botão de Cancelamento */}
                <div className="mt-6 flex justify-end">
                 <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                   <AlertDialogTrigger asChild>
                     <Button 
                       variant="outline" 
                       className="border-red-200 text-red-700 hover:bg-red-50"
                       disabled={user?.subscriptionStatus === 'cancelled' || !user?.subscriptionId}
                     >
                       <XCircle className="h-4 w-4 mr-2" />
                       {user?.subscriptionStatus === 'cancelled' ? 'Plano Já Cancelado' : 
                        !user?.subscriptionId ? 'Sem Assinatura' : 'Cancelar Plano'}
                     </Button>
                   </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar Plano</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja cancelar seu plano atual? 
                        <br /><br />
                        <strong>⚠️ Atenção:</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Seu plano continuará ativo até o final do período atual</li>
                          <li>Não será renovado automaticamente</li>
                          <li>Você perderá acesso aos recursos premium após o vencimento</li>
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Manter Plano</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleCancelPlan}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Cancelando...' : 'Sim, Cancelar Plano'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aviso se não houver plano ativo */}
        {!currentPlan && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Nenhum plano ativo</p>
                  <p className="text-sm">Você não possui um plano ativo no momento.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Planos Disponíveis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === user?.planType?.toLowerCase() || plan.name === user?.plan
            const isUpgrade = currentPlan && plan.articlesLimit && currentPlan.articlesLimit && plan.articlesLimit > currentPlan.articlesLimit
            const isDowngrade = currentPlan && plan.articlesLimit && currentPlan.articlesLimit && plan.articlesLimit < currentPlan.articlesLimit

            return (
              <Card 
                key={plan.id} 
                className={`relative ${
                  isCurrentPlan 
                    ? 'border-blue-300 bg-blue-50' 
                    : plan.popular 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white">
                    Mais Popular
                  </Badge>
                )}
                {plan.unlimited && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white">
                    Ilimitado
                  </Badge>
                )}

                <CardHeader className="text-center">
                  <div className="w-12 h-12 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    {plan.icon}
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="text-3xl font-bold text-gray-900">
                    R$ {plan.price.toFixed(2)}
                    <span className="text-sm font-normal text-gray-500">/mês</span>
                  </div>
                  {/* Status do plano atual */}
                  {isCurrentPlan && (
                    <Badge className="mt-2 bg-blue-100 text-blue-800">
                      Plano Atual
                    </Badge>
                  )}
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <Button disabled className="w-full bg-gray-300 text-gray-500">
                      Plano Atual
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button 
                        onClick={() => handleChangePlan(plan.id)}
                        disabled={isLoading}
                        className={`w-full ${
                          isUpgrade 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : isDowngrade 
                              ? 'bg-yellow-600 hover:bg-yellow-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {isLoading ? 'Processando...' : (
                          <>
                            {isUpgrade ? 'Fazer Upgrade' : isDowngrade ? 'Fazer Downgrade' : 'Escolher Plano'}
                            {isUpgrade && <CheckCircle className="h-4 w-4 ml-2" />}
                            {isDowngrade && <AlertTriangle className="h-4 w-4 ml-2" />}
                          </>
                        )}
                      </Button>
                      
                      {isUpgrade && (
                        <p className="text-xs text-green-600 text-center">
                          ✨ Upgrade com artigos bônus!
                        </p>
                      )}
                      {isDowngrade && (
                        <p className="text-xs text-yellow-600 text-center">
                          ⚠️ Downgrade - menos artigos por mês
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Informações sobre Mudança de Plano */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Informações Importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p><strong>Upgrade:</strong> Artigos bônus do novo plano são adicionados aos artigos restantes do plano atual</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p><strong>Downgrade:</strong> O novo plano entra em vigor no próximo ciclo de cobrança</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p><strong>Plano Institucional:</strong> Artigos ilimitados - não há contagem mensal</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p><strong>Cancelamento:</strong> Seu plano continua ativo até o final do período atual</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Confirmação de Mudança de Plano */}
      {selectedNewPlan && currentPlan && (
        <PlanChangeModal
          isOpen={showChangePlanModal}
          onClose={() => {
            setShowChangePlanModal(false)
            setSelectedNewPlan(null)
          }}
          onConfirm={confirmChangePlan}
          currentPlan={{
            name: currentPlan.name,
            articlesLimit: currentPlan.articlesLimit,
            articlesUsed: user?.articlesUsed || 0
          }}
          newPlan={{
            name: selectedNewPlan.name,
            articlesLimit: selectedNewPlan.articlesLimit,
            price: selectedNewPlan.price
          }}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
