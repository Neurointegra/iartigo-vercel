"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  BarChart3,
  CheckCircle,
  Star,
  ArrowRight,
  Play,
  FileText,
  Search,
  Settings,
  Clock,
  TrendingUp,
  Brain,
  Target,
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const [language, setLanguage] = useState<"pt" | "en">("pt")
  const [activeFeature, setActiveFeature] = useState(0)

  const content = {
    pt: {
      nav: {
        features: "Recursos",
        pricing: "Preços",
        testimonials: "Depoimentos",
        login: "Entrar",
        start: "Começar Grátis",
      },
      hero: {
        badge: "🚀 Novo: Sugestões de Literatura com IA",
        title: "Revolucione sua Produção Científica",
        subtitle: "com Inteligência Artificial",
        description:
          "Transforme suas ideias em artigos científicos profissionais em minutos. Formatação automática, referências inteligentes e gráficos de qualidade acadêmica.",
        cta: "Começar Gratuitamente",
        demo: "Ver Demonstração",
      },
      stats: [
        { number: "10,000+", label: "Artigos Gerados" },
        { number: "500+", label: "Pesquisadores Ativos" },
        { number: "50+", label: "Universidades Parceiras" },
        { number: "98%", label: "Satisfação dos Usuários" },
      ],
      pitch: {
        title: "Por que o iArtigo é Revolucionário?",
        subtitle: "Descubra como nossa IA está transformando a pesquisa científica mundial",
        slides: [
          {
            icon: <Brain className="h-12 w-12" />,
            title: "IA Treinada em Milhões de Artigos",
            description:
              "Nossa inteligência artificial foi treinada com mais de 2 milhões de artigos científicos de alta qualidade das principais revistas mundiais.",
            stats: "2M+ artigos analisados",
          },
          {
            icon: <Clock className="h-12 w-12" />,
            title: "Economize 90% do Tempo",
            description:
              "O que levava semanas para escrever, agora leva apenas algumas horas. Foque na pesquisa, deixe a redação conosco.",
            stats: "90% menos tempo",
          },
          {
            icon: <Target className="h-12 w-12" />,
            title: "Precisão Científica Garantida",
            description:
              "Formatação automática para mais de 1000 revistas científicas. Citações corretas, estrutura perfeita, qualidade acadêmica.",
            stats: "1000+ formatos",
          },
          {
            icon: <TrendingUp className="h-12 w-12" />,
            title: "Aumente sua Produtividade em 300%",
            description:
              "Pesquisadores que usam o iArtigo publicam 3x mais artigos por ano. Acelere sua carreira acadêmica.",
            stats: "300% mais produtivo",
          },
        ],
      },
      features: {
        title: "Recursos Poderosos para Pesquisadores",
        subtitle: "Tudo que você precisa para criar artigos científicos de qualidade internacional",
        items: [
          {
            icon: <Sparkles className="h-8 w-8" />,
            title: "IA Avançada",
            description: "Geração automática de conteúdo científico com qualidade acadêmica",
            details: "Nossa IA foi treinada com milhares de artigos científicos de alta qualidade",
          },
          {
            icon: <Search className="h-8 w-8" />,
            title: "Literatura Inteligente",
            description: "Sugestões automáticas de referências relevantes por área",
            details: "Base de dados com mais de 50.000 referências científicas atualizadas",
          },
          {
            icon: <BarChart3 className="h-8 w-8" />,
            title: "Gráficos e Tabelas",
            description: "Visualizações profissionais geradas automaticamente",
            details: "Gráficos estatísticos, tabelas comparativas e figuras explicativas",
          },
          {
            icon: <FileText className="h-8 w-8" />,
            title: "Múltiplos Formatos",
            description: "Exportação em PDF, Word, LaTeX e mais",
            details: "Formatação automática para revistas como Nature, Science, IEEE",
          },
        ],
      },
      howItWorks: {
        title: "Como Funciona",
        subtitle: "Três passos simples para seu artigo científico",
        steps: [
          {
            icon: <Settings className="h-8 w-8" />,
            title: "1. Configure",
            description:
              "Insira título, resumo, palavras-chave e dados dos autores. Escolha a área de estudo e revista alvo.",
          },
          {
            icon: <Search className="h-8 w-8" />,
            title: "2. Literatura",
            description:
              "Nossa IA sugere referências relevantes baseadas no seu tema. Revise e selecione as mais adequadas.",
          },
          {
            icon: <Sparkles className="h-8 w-8" />,
            title: "3. Gere",
            description:
              "Clique em gerar e receba seu artigo completo com formatação profissional, gráficos e referências.",
          },
        ],
      },
      pricing: {
        title: "Planos para Todos os Pesquisadores",
        subtitle: "Escolha o plano ideal para suas necessidades acadêmicas",
        plans: [
          {
            name: "Por Artigo",
            price: "R$ 15",
            period: "/artigo",
            description: "Ideal para uso esporádico e testes",
            features: [
              "Pagamento por artigo gerado",
              "Formatação básica (APA, ABNT)",
              "Suporte por email",
              "Exportação PDF",
              "Sem compromisso mensal",
            ],
            popular: false,
            buttonText: "Gerar Artigo",
          },
          {
            name: "Profissional",
            price: "R$ 79",
            period: "/mês",
            description: "Para pesquisadores ativos",
            features: [
              "5 artigos por mês",
              "Todos os estilos de citação",
              "Sugestões de literatura",
              "Gráficos e tabelas avançados",
              "Exportação em todos os formatos",
              "Suporte prioritário",
            ],
            popular: true,
            buttonText: "Mais Popular",
          },
          {
            name: "Institucional",
            price: "R$ 199",
            period: "/mês",
            description: "Para universidades - Pacote 12 meses",
            features: [
              "Artigos ilimitados",
              "Múltiplos usuários (até 10)",
              "Contrato anual (12 meses)",
              "API personalizada",
              "Integração com bases científicas",
              "Relatórios de uso",
              "Suporte dedicado 24/7",
            ],
            popular: false,
            buttonText: "Contatar Vendas",
          },
        ],
      },
      testimonials: {
        title: "O que Dizem os Pesquisadores",
        subtitle: "Depoimentos de quem já transformou sua produção científica",
        items: [
          {
            name: "Dr. Maria Silva",
            role: "Professora de Ciência da Computação - USP",
            content:
              "O iArtigo revolucionou minha produtividade acadêmica. Consigo gerar artigos de qualidade em metade do tempo.",
            rating: 5,
          },
          {
            name: "Prof. João Santos",
            role: "Pesquisador - UNICAMP",
            content:
              "A qualidade das referências sugeridas é impressionante. Encontro literatura relevante que eu não conhecia.",
            rating: 5,
          },
          {
            name: "Dra. Ana Costa",
            role: "Coordenadora de Pesquisa - UFRJ",
            content: "Implementamos o iArtigo em nosso laboratório e a produção científica aumentou 300%.",
            rating: 5,
          },
        ],
      },
      cta: {
        title: "Pronto para Revolucionar sua Pesquisa?",
        subtitle:
          "Junte-se a milhares de pesquisadores que já descobriram o poder da IA para acelerar sua produção científica.",
        button: "Começar Gratuitamente",
        demo: "Agendar Demonstração",
      },
      footer: {
        description: "Transformando a produção científica com inteligência artificial.",
        product: "Produto",
        company: "Empresa",
        support: "Suporte",
        copyright: "Todos os direitos reservados.",
      },
    },
    en: {
      nav: {
        features: "Features",
        pricing: "Pricing",
        testimonials: "Testimonials",
        login: "Login",
        start: "Get Started",
      },
      hero: {
        badge: "🚀 New: AI-Powered Literature Suggestions",
        title: "Revolutionize Your Scientific Production",
        subtitle: "with Artificial Intelligence",
        description:
          "Transform your ideas into professional scientific articles in minutes. Automatic formatting, intelligent references, and academic-quality graphics.",
        cta: "Get Started for Free",
        demo: "Watch Demo",
      },
      stats: [
        { number: "10,000+", label: "Articles Generated" },
        { number: "500+", label: "Active Researchers" },
        { number: "50+", label: "Partner Universities" },
        { number: "98%", label: "User Satisfaction" },
      ],
      pitch: {
        title: "Why iArtigo is Revolutionary?",
        subtitle: "Discover how our AI is transforming scientific research worldwide",
        slides: [
          {
            icon: <Brain className="h-12 w-12" />,
            title: "AI Trained on Millions of Articles",
            description:
              "Our artificial intelligence was trained with over 2 million high-quality scientific articles from leading global journals.",
            stats: "2M+ articles analyzed",
          },
          {
            icon: <Clock className="h-12 w-12" />,
            title: "Save 90% of Your Time",
            description:
              "What used to take weeks to write now takes just a few hours. Focus on research, let us handle the writing.",
            stats: "90% less time",
          },
          {
            icon: <Target className="h-12 w-12" />,
            title: "Guaranteed Scientific Precision",
            description:
              "Automatic formatting for over 1000 scientific journals. Correct citations, perfect structure, academic quality.",
            stats: "1000+ formats",
          },
          {
            icon: <TrendingUp className="h-12 w-12" />,
            title: "Increase Productivity by 300%",
            description:
              "Researchers using iArtigo publish 3x more articles per year. Accelerate your academic career.",
            stats: "300% more productive",
          },
        ],
      },
      features: {
        title: "Powerful Features for Researchers",
        subtitle: "Everything you need to create international-quality scientific articles",
        items: [
          {
            icon: <Sparkles className="h-8 w-8" />,
            title: "Advanced AI",
            description: "Automatic generation of scientific content with academic quality",
            details: "Our AI was trained with thousands of high-quality scientific articles",
          },
          {
            icon: <Search className="h-8 w-8" />,
            title: "Smart Literature",
            description: "Automatic suggestions of relevant references by field",
            details: "Database with over 50,000 updated scientific references",
          },
          {
            icon: <BarChart3 className="h-8 w-8" />,
            title: "Charts and Tables",
            description: "Professional visualizations generated automatically",
            details: "Statistical charts, comparative tables and explanatory figures",
          },
          {
            icon: <FileText className="h-8 w-8" />,
            title: "Multiple Formats",
            description: "Export to PDF, Word, LaTeX and more",
            details: "Automatic formatting for journals like Nature, Science, IEEE",
          },
        ],
      },
      howItWorks: {
        title: "How It Works",
        subtitle: "Three simple steps to your scientific article",
        steps: [
          {
            icon: <Settings className="h-8 w-8" />,
            title: "1. Configure",
            description: "Enter title, abstract, keywords and author data. Choose study area and target journal.",
          },
          {
            icon: <Search className="h-8 w-8" />,
            title: "2. Literature",
            description:
              "Our AI suggests relevant references based on your topic. Review and select the most appropriate ones.",
          },
          {
            icon: <Sparkles className="h-8 w-8" />,
            title: "3. Generate",
            description:
              "Click generate and receive your complete article with professional formatting, charts and references.",
          },
        ],
      },
      pricing: {
        title: "Plans for All Researchers",
        subtitle: "Choose the ideal plan for your academic needs",
        plans: [
          {
            name: "Per Article",
            price: "$5",
            period: "/article",
            description: "Ideal for sporadic use and testing",
            features: [
              "Pay per generated article",
              "Basic formatting (APA, MLA)",
              "Email support",
              "PDF export",
              "No monthly commitment",
            ],
            popular: false,
            buttonText: "Generate Article",
          },
          {
            name: "Professional",
            price: "$29",
            period: "/month",
            description: "For active researchers",
            features: [
              "5 articles per month",
              "All citation styles",
              "Literature suggestions",
              "Advanced charts and tables",
              "Export in all formats",
              "Priority support",
            ],
            popular: true,
            buttonText: "Most Popular",
          },
          {
            name: "Institutional",
            price: "$79",
            period: "/month",
            description: "For universities - 12-month package",
            features: [
              "Unlimited articles",
              "Multiple users (up to 10)",
              "Annual contract (12 months)",
              "Custom API",
              "Scientific database integration",
              "Usage reports",
              "24/7 dedicated support",
            ],
            popular: false,
            buttonText: "Contact Sales",
          },
        ],
      },
      testimonials: {
        title: "What Researchers Say",
        subtitle: "Testimonials from those who have already transformed their scientific production",
        items: [
          {
            name: "Dr. Maria Silva",
            role: "Computer Science Professor - USP",
            content:
              "iArtigo revolutionized my academic productivity. I can generate quality articles in half the time.",
            rating: 5,
          },
          {
            name: "Prof. John Santos",
            role: "Researcher - UNICAMP",
            content:
              "The quality of suggested references is impressive. I find relevant literature I didn't know about.",
            rating: 5,
          },
          {
            name: "Dr. Ana Costa",
            role: "Research Coordinator - UFRJ",
            content: "We implemented iArtigo in our lab and scientific production increased by 300%.",
            rating: 5,
          },
        ],
      },
      cta: {
        title: "Ready to Revolutionize Your Research?",
        subtitle:
          "Join thousands of researchers who have already discovered the power of AI to accelerate their scientific production.",
        button: "Get Started for Free",
        demo: "Schedule Demo",
      },
      footer: {
        description: "Transforming scientific production with artificial intelligence.",
        product: "Product",
        company: "Company",
        support: "Support",
        copyright: "All rights reserved.",
      },
    },
  }

  const t = content[language]

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
                {t.nav.features}
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">
                {t.nav.pricing}
              </a>
              <a href="#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors">
                {t.nav.testimonials}
              </a>

              {/* Language Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant={language === "pt" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setLanguage("pt")}
                  className="h-8 px-3"
                >
                  🇧🇷 PT
                </Button>
                <Button
                  variant={language === "en" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setLanguage("en")}
                  className="h-8 px-3"
                >
                  🇺🇸 EN
                </Button>
              </div>

              <Link href="/auth/login">
                <Button variant="outline">{t.nav.login}</Button>
              </Link>
              <Link href="/auth/register">
                <Button>{t.nav.start}</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-800 border-blue-200">{t.hero.badge}</Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              {t.hero.title}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {" "}
                {t.hero.subtitle}
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">{t.hero.description}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/auth/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
                  <Sparkles className="h-5 w-5 mr-2" />
                  {t.hero.cta}
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4">
                <Play className="h-5 w-5 mr-2" />
                {t.hero.demo}
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
              {t.stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stat.number}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pitch Deck Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.pitch.title}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t.pitch.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {t.pitch.slides.map((slide, index) => (
              <Card
                key={index}
                className="p-8 border-2 hover:border-blue-200 transition-all duration-300 hover:shadow-lg"
              >
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white">
                    {slide.icon}
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 text-sm font-semibold">{slide.stats}</Badge>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">{slide.title}</h3>
                <p className="text-gray-600 text-center leading-relaxed">{slide.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.features.title}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t.features.subtitle}</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {t.features.items.map((feature, index) => (
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
                  <span className="text-sm text-gray-500 ml-2">iArtigo - AI Article Generator</span>
                </div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Sparkles className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {language === "pt" ? "Artigo sendo gerado..." : "Article being generated..."}
                      </p>
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
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.howItWorks.title}</h2>
            <p className="text-xl text-gray-600">{t.howItWorks.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {t.howItWorks.steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.pricing.title}</h2>
            <p className="text-xl text-gray-600">{t.pricing.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {t.pricing.plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative ${plan.popular ? "border-blue-500 shadow-lg scale-105" : "border-gray-200"}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1">{plan.buttonText}</Badge>
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
                      {plan.popular ? t.nav.start : plan.buttonText}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.testimonials.title}</h2>
            <p className="text-xl text-gray-600">{t.testimonials.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {t.testimonials.items.map((testimonial, index) => (
              <Card key={index} className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">{t.cta.title}</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">{t.cta.subtitle}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4">
                {t.cta.button}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4"
            >
              {t.cta.demo}
            </Button>
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
              <p className="text-gray-400">{t.footer.description}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">{t.footer.product}</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    {t.nav.features}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    {t.nav.pricing}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">{t.footer.company}</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">{t.footer.support}</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Status
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Community
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 iArtigo. {t.footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
