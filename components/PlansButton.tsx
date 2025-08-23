'use client'

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

interface PlansButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  children?: React.ReactNode
}

export function PlansButton({ 
  variant = "default", 
  size = "default", 
  className = "",
  children 
}: PlansButtonProps) {
  const { user } = useAuth()

  // Função para determinar qual rota de planos o usuário deve seguir
  const getPlansRoute = () => {
    // Se o usuário tem um plano ativo, vai para gerenciamento
    if (user?.plan && user.subscriptionStatus !== 'cancelled') {
      return '/plans/manage' 
    } else {
      return '/plans' // Usuário sem plano ou plano cancelado vai para escolha de planos
    }
  }

  // Texto padrão baseado no status do usuário
  const getDefaultText = () => {
    if (user?.plan && user.subscriptionStatus !== 'cancelled') {
      return 'Gerenciar Plano'
    } else {
      return 'Ver Todos os Planos'
    }
  }

  return (
    <Link href={getPlansRoute()}>
      <Button 
        variant={variant} 
        size={size} 
        className={className}
      >
        {children || getDefaultText()}
      </Button>
    </Link>
  )
}
