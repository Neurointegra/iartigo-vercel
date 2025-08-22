"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CheckCircle,
  AlertTriangle,
  Sparkles,
  CreditCard,
} from "lucide-react"

interface PlanChangeModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  currentPlan: {
    name: string
    articlesLimit: number | null
    articlesUsed: number
  }
  newPlan: {
    name: string
    articlesLimit: number | null
    price: number
  }
  isLoading?: boolean
}

export function PlanChangeModal({
  isOpen,
  onClose,
  onConfirm,
  currentPlan,
  newPlan,
  isLoading = false
}: PlanChangeModalProps) {
  const isUpgrade = newPlan.articlesLimit && currentPlan.articlesLimit && 
                   newPlan.articlesLimit > currentPlan.articlesLimit
  const isDowngrade = newPlan.articlesLimit && currentPlan.articlesLimit && 
                     newPlan.articlesLimit < currentPlan.articlesLimit
  const isLateral = newPlan.articlesLimit === currentPlan.articlesLimit

  const currentArticlesRemaining = currentPlan.articlesLimit ? 
    Math.max(0, currentPlan.articlesLimit - currentPlan.articlesUsed) : 0
  
  const articlesBonus = isUpgrade ? currentArticlesRemaining : 0
  const newTotalLimit = isUpgrade && newPlan.articlesLimit ? 
    newPlan.articlesLimit + articlesBonus : newPlan.articlesLimit

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isUpgrade ? (
              <>
                <Sparkles className="h-5 w-5 text-green-600" />
                Upgrade de Plano
              </>
            ) : isDowngrade ? (
              <>
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Downgrade de Plano
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 text-blue-600" />
                Alterar Plano
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Confirme a alteração do seu plano atual
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Plano Atual */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Plano Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="font-medium">{currentPlan.name}</span>
                <Badge variant="outline" className="text-xs">
                  {currentPlan.articlesLimit ? `${currentPlan.articlesUsed}/${currentPlan.articlesLimit}` : 'Ilimitado'}
                </Badge>
              </div>
              {currentPlan.articlesLimit && (
                <p className="text-xs text-gray-500 mt-1">
                  {currentArticlesRemaining} artigo(s) restante(s)
                </p>
              )}
            </CardContent>
          </Card>

          {/* Novo Plano */}
          <Card className={`${
            isUpgrade ? 'border-green-200 bg-green-50' : 
            isDowngrade ? 'border-yellow-200 bg-yellow-50' : 
            'border-blue-200 bg-blue-50'
          }`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Novo Plano</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="font-medium">{newPlan.name}</span>
                <Badge className={`text-xs ${
                  isUpgrade ? 'bg-green-100 text-green-800' :
                  isDowngrade ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  R$ {newPlan.price.toFixed(2)}/mês
                </Badge>
              </div>
              
              {isUpgrade && articlesBonus > 0 && (
                <div className="mt-2 p-2 bg-green-100 rounded text-xs">
                  <div className="flex items-center gap-1 text-green-700 mb-1">
                    <Sparkles className="h-3 w-3" />
                    <span className="font-medium">Artigos Bônus!</span>
                  </div>
                  <p className="text-green-600">
                    +{articlesBonus} artigo(s) do plano atual + {newPlan.articlesLimit} do novo plano
                  </p>
                  <p className="text-green-700 font-medium mt-1">
                    Total: {newTotalLimit} artigo(s) disponíveis
                  </p>
                </div>
              )}

              {isDowngrade && (
                <div className="mt-2 p-2 bg-yellow-100 rounded text-xs">
                  <div className="flex items-center gap-1 text-yellow-700 mb-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="font-medium">Atenção</span>
                  </div>
                  <p className="text-yellow-600">
                    O novo plano entrará em vigor no próximo ciclo de cobrança
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações Importantes */}
          <div className="text-xs text-gray-600 space-y-2">
            {isUpgrade && (
              <div className="flex items-start gap-2">
                <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Seu novo plano será ativado imediatamente com artigos bônus</p>
              </div>
            )}
            {isDowngrade && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p>O downgrade entra em vigor no próximo ciclo de cobrança</p>
              </div>
            )}
            <div className="flex items-start gap-2">
              <CheckCircle className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
              <p>Você pode cancelar a qualquer momento</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isLoading}
            className={
              isUpgrade ? 'bg-green-600 hover:bg-green-700' :
              isDowngrade ? 'bg-yellow-600 hover:bg-yellow-700' :
              'bg-blue-600 hover:bg-blue-700'
            }
          >
            {isLoading ? 'Processando...' : (
              <>
                {isUpgrade ? 'Fazer Upgrade' : 
                 isDowngrade ? 'Fazer Downgrade' : 
                 'Confirmar Alteração'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
