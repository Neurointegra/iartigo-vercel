'use client'

import { useState, useEffect } from 'react'
import { X, CreditCard, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  checkoutUrl: string
  planDetails: {
    name: string
    price: number
    description: string
    articlesLimit: number | null
  }
  onPaymentSuccess: () => void
  paymentId?: string // ID local do pagamento
  asaasId?: string // ID do Asaas para verificação
}

export function PaymentModal({
  isOpen,
  onClose,
  checkoutUrl,
  planDetails,
  onPaymentSuccess,
  paymentId,
  asaasId
}: PaymentModalProps) {
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'error'>('pending')
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [checkInterval, setCheckInterval] = useState<NodeJS.Timeout | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 3

  useEffect(() => {
    if (isOpen && checkoutUrl) {
      // Resetar estados
      setPaymentStatus('pending')
      setProgress(0)
      setRetryCount(0)
      setStatusMessage('')
      
      // Abrir o link de pagamento em uma nova janela
      const paymentWindow = window.open(
        checkoutUrl,
        'AsaasPayment',
        'width=800,height=600,scrollbars=yes,resizable=yes'
      )

      if (paymentWindow) {
        // Monitorar se a janela foi fechada
        const interval = setInterval(() => {
          if (paymentWindow.closed) {
            clearInterval(interval)
            setCheckInterval(null)
            // Verificar status do pagamento apenas uma vez
            checkPaymentStatus()
          }
        }, 1000)
        
        setCheckInterval(interval)
        
        // Timeout de segurança: parar carregamento após 2 minutos
        const safetyTimeout = setTimeout(() => {
          if (paymentStatus === 'processing') {
            clearInterval(interval)
            setCheckInterval(null)
            setPaymentStatus('error')
            setStatusMessage('Tempo limite excedido. Verifique o status do pagamento ou tente novamente.')
            setProgress(0)
          }
        }, 120000) // 2 minutos
        
        return () => {
          clearTimeout(safetyTimeout)
          // Limpar o intervalo se o modal for fechado durante a abertura
          if (interval) {
            clearInterval(interval)
          }
        }
      }
    }

    // Cleanup quando o modal for fechado
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval)
        setCheckInterval(null)
      }
    }
  }, [isOpen, checkoutUrl])

  // Cleanup adicional quando o modal for fechado
  useEffect(() => {
    if (!isOpen) {
      console.log('🚫 Modal fechado, limpando recursos e parando verificações')
      // Limpar todos os intervalos e timeouts quando o modal for fechado
      if (checkInterval) {
        clearInterval(checkInterval)
        setCheckInterval(null)
      }
      // Resetar estados para evitar verificações futuras
      setPaymentStatus('pending')
      setProgress(0)
      setRetryCount(0)
      setStatusMessage('')
    }
  }, [isOpen, checkInterval])

  // Função para limpar todos os recursos
  const cleanupResources = () => {
    console.log('🧹 Limpando todos os recursos do modal')
    if (checkInterval) {
      clearInterval(checkInterval)
      setCheckInterval(null)
    }
    setPaymentStatus('pending')
    setProgress(0)
    setRetryCount(0)
    setStatusMessage('')
  }

  // Função de fechamento personalizada
  const handleClose = () => {
    cleanupResources()
    onClose()
  }

  const checkPaymentStatus = async () => {
    // Verificar se o modal ainda está aberto antes de continuar
    if (!isOpen) {
      console.log('🚫 Modal fechado, parando verificação de pagamento')
      return
    }
    
    // Evitar múltiplas verificações simultâneas
    if (paymentStatus === 'processing') {
      console.log('🚫 Já está verificando pagamento, ignorando chamada duplicada')
      return
    }
    
    setPaymentStatus('processing')
    setStatusMessage('Verificando status do pagamento...')
    setProgress(50)

    try {
      // Aguardar um pouco para o webhook processar
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Verificar status real do pagamento
      if (!asaasId) {
        console.error('❌ asaasId não disponível:', asaasId)
        throw new Error('ID do pagamento Asaas não disponível para verificação')
      }
      
      console.log('🔍 Verificando status do pagamento Asaas:', asaasId)
      
      const response = await fetch('/api/asaas/check-payment-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: asaasId,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao verificar status')
      }

      const statusData = await response.json()
      
      if (statusData.success) {
        console.log('🔍 Status recebido:', statusData.data.status)
        
        if (statusData.data.status === 'CONFIRMED' || statusData.data.status === 'RECEIVED') {
          setProgress(100)
          setPaymentStatus('success')
          setStatusMessage('Pagamento confirmado! Redirecionando...')
          
          // Aguardar um pouco para o usuário ver a mensagem
          setTimeout(() => {
            onPaymentSuccess()
            onClose()
          }, 2000)
        } else if (statusData.data.status === 'PENDING') {
          setPaymentStatus('processing')
          setStatusMessage('Pagamento ainda pendente. Aguarde...')
          setProgress(75)
          
          // Tentar novamente apenas se não excedeu o limite de tentativas
          if (retryCount < MAX_RETRIES) {
            setRetryCount(prev => prev + 1)
            // Aguardar 5 segundos antes da próxima tentativa
            setTimeout(() => {
              // Só verifica se o modal ainda estiver aberto
              if (isOpen) {
                checkPaymentStatus()
              }
            }, 5000)
          } else {
            setPaymentStatus('error')
            setStatusMessage('Pagamento pendente por muito tempo. Verifique o status ou tente novamente.')
            setProgress(0)
          }
        } else if (statusData.data.status === 'OVERDUE' || statusData.data.status === 'CANCELLED') {
          setPaymentStatus('error')
          setStatusMessage(`Pagamento ${statusData.data.status.toLowerCase()}. Tente novamente.`)
          setProgress(0)
        } else {
          setPaymentStatus('error')
          setStatusMessage(`Status desconhecido: ${statusData.data.status}. Tente novamente.`)
          setProgress(0)
        }
      } else {
        throw new Error('Erro na resposta da API')
      }
      
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error)
      setPaymentStatus('error')
      setStatusMessage('Erro ao verificar pagamento. Tente novamente.')
      setProgress(0)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">
            {paymentStatus === 'pending' && 'Pagamento via Asaas'}
            {paymentStatus === 'processing' && 'Processando Pagamento'}
            {paymentStatus === 'success' && 'Pagamento Confirmado!'}
            {paymentStatus === 'error' && 'Erro no Pagamento'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Detalhes do Plano */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">{planDetails.name}</h3>
              <Badge variant="secondary">
                R$ {planDetails.price.toFixed(2)}/mês
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-2">{planDetails.description}</p>
            <div className="flex items-center text-sm text-gray-500">
              <CreditCard className="h-4 w-4 mr-2" />
              {planDetails.articlesLimit 
                ? `${planDetails.articlesLimit} artigos por mês`
                : 'Artigos ilimitados'
              }
            </div>
          </div>

          {/* Status do Pagamento */}
          {paymentStatus === 'pending' && (
            <div className="text-center py-6">
              <div className="mb-4">
                <CreditCard className="h-12 w-12 mx-auto text-blue-600 mb-2" />
                <p className="text-sm text-gray-600">
                  Uma nova janela será aberta para completar o pagamento.
                </p>
              </div>
              <Button 
                onClick={() => window.open(checkoutUrl, 'AsaasPayment', 'width=800,height=600')}
                className="w-full"
              >
                Abrir Página de Pagamento
              </Button>
            </div>
          )}

          {paymentStatus === 'processing' && (
            <div className="text-center py-6">
              <div className="mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">{statusMessage}</p>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="text-center py-6">
              <div className="mb-4">
                <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-2" />
                <p className="text-sm text-gray-600">{statusMessage}</p>
              </div>
            </div>
          )}

          {paymentStatus === 'error' && (
            <div className="text-center py-6">
              <div className="mb-4">
                <AlertCircle className="h-12 w-12 mx-auto text-red-600 mb-2" />
                <p className="text-sm text-gray-600">{statusMessage}</p>
              </div>
              <Button onClick={checkPaymentStatus} variant="outline" className="w-full">
                Tentar Novamente
              </Button>
            </div>
          )}

          {/* Instruções */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>• Não feche esta janela até confirmar o pagamento</p>
            <p>• Após o pagamento, você será redirecionado automaticamente</p>
            {paymentStatus === 'processing' && (
              <p className="text-orange-600 font-medium">
                • Se o pagamento demorar muito, você pode fechar este modal
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
