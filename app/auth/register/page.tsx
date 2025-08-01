"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Lock, Eye, EyeOff, User, Building, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    institution: "",
    role: "",
    area: "",
    plan: "basic",
  })
  const router = useRouter()
  const { register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (step === 1) {
      // Validações do primeiro passo
      if (formData.password !== formData.confirmPassword) {
        setError("As senhas não coincidem")
        return
      }
      if (formData.password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres")
        return
      }
      setStep(2)
      return
    }

    setIsLoading(true)

    const result = await register({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      institution: formData.institution,
      department: formData.area,
      role: formData.role,
      area: formData.area,
      plan: formData.plan,
    })

    if (result.success) {
      if (formData.plan === "basic") {
        router.push("/dashboard")
      } else {
        router.push("/payment")
      }
    } else {
      setError(result.error || "Erro no registro")
    }

    setIsLoading(false)
  }

  const areas = [
    "Ciência da Computação",
    "Medicina",
    "Biologia",
    "Física",
    "Química",
    "Engenharia",
    "Psicologia",
    "Economia",
    "Educação",
    "Direito",
    "Outros",
  ]

  const roles = [
    "Estudante de Graduação",
    "Estudante de Pós-graduação",
    "Professor/Pesquisador",
    "Profissional da Indústria",
    "Outros",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/landing" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao site
          </Link>
          <Link href="/" className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">IA</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">iArtigo</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Criar conta gratuita</h1>
          <p className="text-gray-600">Comece a gerar artigos científicos hoje</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Cadastro
              <span className="text-sm font-normal text-gray-500">(Etapa {step} de 2)</span>
            </CardTitle>
            <CardDescription>
              {step === 1 ? "Crie sua conta para começar" : "Complete seu perfil acadêmico"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Seu nome completo"
                        className="pl-10"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 8 caracteres"
                        className="pl-10 pr-10"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Digite a senha novamente"
                        className="pl-10 pr-10"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="institution">Instituição</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="institution"
                        type="text"
                        placeholder="Universidade ou empresa"
                        className="pl-10"
                        value={formData.institution}
                        onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Função</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione sua função" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="area">Área de pesquisa</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, area: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione sua área" />
                      </SelectTrigger>
                      <SelectContent>
                        {areas.map((area) => (
                          <SelectItem key={area} value={area}>
                            {area}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Plano inicial</Label>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="border rounded-lg p-3 bg-blue-50 border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-blue-900">Básico - Gratuito</p>
                            <p className="text-sm text-blue-700">5 artigos por mês</p>
                          </div>
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Criando conta..." : step === 1 ? "Continuar" : "Criar conta"}
              </Button>
            </form>

            {step === 1 && (
              <div className="mt-6">
                <Separator className="my-4" />
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Já tem uma conta?{" "}
                    <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                      Entrar
                    </Link>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Ao criar uma conta, você concorda com nossos{" "}
            <Link href="/terms" className="text-blue-600 hover:text-blue-700">
              Termos de Uso
            </Link>{" "}
            e{" "}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
              Política de Privacidade
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
