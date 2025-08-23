"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, BarChart3, CheckCircle, Star, ArrowRight, Play, FileText, Search, Settings } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0)

  const features = [
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: "IA Avançada",
      description: "Geração automática de conteúdo científico com qualidade acadêmica",
      details: "Nossa IA foi treinada com artigos científicos de alta qualidade para produção acadêmica brasileira",
    },
    
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Formatação ABNT",
      description: "Formatação automática seguindo as normas ABNT",
      details: "Formatação automática para artigos acadêmicos brasileiros seguindo as normas ABNT",
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Anti-plágio",
      description: "Verificação de plágio para garantir originalidade",
      details: "Sistema de anti-plágio básico e avançado dependendo do seu plano",
    },
  ]

  const plans = [
    {
      name: "Estudante",
      price: "R$ 29,90",
      period: "/mês",
      description: "Perfeito para estudantes de graduação e pós-graduação",
      features: [
        "1 artigo por mês",
        "Formatação ABNT",
        "Exportação para Word"
      ],
      popular: false,
      buttonText: "Comece Agora",
    },
    {
      name: "Pesquisador",
      price: "R$ 99,90",
      period: "/mês",
      description: "Ideal para pesquisadores e professores ativos",
      features: [
        "5 artigos por mês",
        "Formatação ABNT",
        "Exportação para Word"
      ],
      popular: true,
      buttonText: "Comece Agora",
    },
    {
      name: "Institucional",
      price: "R$ 297",
      period: "/mês",
      description: "Para instituições e equipes de pesquisa",
      features: [
        "Artigos ilimitados",
        "Formatação ABNT",
        "Exportação para Word"
      ],
      popular: false,
      buttonText: "Comece Agora",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">IA</span>
              </div>
              <span className="text-xl font-bold text-gray-900">iArtigo</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
                Recursos
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">
                Preços
              </a>
              <Link href="/auth/login">
                <Button variant="outline">Entrar</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Começar</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-800 border-blue-200">
              🚀 Novo: Geração de Artigos Científicos com IA
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Gere Artigos Científicos
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {" "}
                com IA
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Transforme suas ideias em artigos científicos profissionais em minutos. Formatação automática ABNT, verificação de plágio
              e qualidade acadêmica para a produção científica brasileira.
            </p>
            <div className="flex justify-center mb-12">
              <Link href="/auth/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Começar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Recursos Poderosos para Pesquisadores</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tudo que você precisa para criar artigos científicos seguindo as normas ABNT brasileiras
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                    activeFeature === index ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        activeFeature === index ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-600 mb-2">{feature.description}</p>
                      {activeFeature === index && (
                        <p className="text-sm text-blue-600 font-medium">{feature.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-500 ml-2">iArtigo - Gerador de Artigos</span>
                </div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Sparkles className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Artigo sendo gerado...</p>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Como Funciona</h2>
            <p className="text-xl text-gray-600">Dois passos simples para seu artigo científico</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Configure</h3>
              <p className="text-xl text-gray-600">
                Insira título, resumo, palavras-chave e dados dos autores. Escolha a área de estudo e revista alvo.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Gere</h3>
              <p className="text-xl text-gray-600">
                Clique em gerar e receba seu artigo completo com formatação profissional, gráficos e referências.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Planos para Todos os Pesquisadores</h2>
            <p className="text-xl text-gray-600">Escolha o plano ideal para suas necessidades acadêmicas</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative ${plan.popular ? "border-blue-500 shadow-lg scale-105" : "border-gray-200"}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1">Mais Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth/register">
                    <Button
                      className={`w-full ${
                        plan.popular ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-900 hover:bg-gray-800"
                      }`}
                    >
                      {plan.buttonText}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Pronto para Revolucionar sua Pesquisa?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Junte-se aos pesquisadores que estão descobrindo o poder da IA para acelerar sua produção científica.
          </p>
          <div className="flex justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4">
                Começar
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">IA</span>
                </div>
                <span className="text-xl font-bold">iArtigo</span>
              </div>
              <p className="text-gray-400">Transformando a produção científica com inteligência artificial.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contato</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="https://wa.me/41995199718" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-2">
                    <span>📱</span>
                    WhatsApp: (41) 99519-9718
                  </a>
                </li>
                <li>
                  <a href="mailto:slsprimesolutions@gmail.com" className="hover:text-white flex items-center gap-2">
                    <span>✉️</span>
                    slsprimesolutions@gmail.com
                  </a>
                </li>
                <li>
                  <a href="https://www.instagram.com/iartigo_?igsh=eWdqZXZtbDY3NjZu" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-2">
                    <span>📷</span>
                    @iartigo_
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Acesso</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="/auth/login" className="hover:text-white">
                    Entrar
                  </a>
                </li>
                <li>
                  <a href="/auth/register" className="hover:text-white">
                    Cadastrar
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 iArtigo. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
