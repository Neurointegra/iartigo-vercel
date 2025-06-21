"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  FileText,
  Sparkles,
  ArrowLeft,
  Clock,
  Users,
  BarChart3,
  BookOpen,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { ChartExample } from "@/components/chart-example"
import { TableExample } from "@/components/table-example"

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")

  const demoSteps = [
    {
      id: 1,
      title: "Configuração do Artigo",
      description: "Defina título, área de estudo e parâmetros",
      icon: FileText,
    },
    {
      id: 2,
      title: "Geração de Conteúdo",
      description: "IA cria o artigo baseado nos parâmetros",
      icon: Sparkles,
    },
    {
      id: 3,
      title: "Resultado Final",
      description: "Artigo completo com formatação acadêmica",
      icon: CheckCircle,
    },
  ]

  const handleGenerateDemo = async () => {
    setIsGenerating(true)
    setCurrentStep(2)

    // Simular geração de artigo
    await new Promise((resolve) => setTimeout(resolve, 3000))

    setGeneratedContent(`
# Inteligência Artificial na Educação: Uma Análise Sistemática

## Resumo

Este estudo apresenta uma análise sistemática sobre a aplicação de inteligência artificial na educação, examinando 127 artigos publicados entre 2020-2024. Os resultados indicam que a IA tem potencial significativo para personalizar o aprendizado e melhorar os resultados educacionais.

**Palavras-chave:** Inteligência Artificial, Educação, Aprendizado Personalizado, Tecnologia Educacional

## 1. Introdução

A integração da inteligência artificial (IA) no setor educacional tem se tornado uma tendência crescente, prometendo revolucionar a forma como ensinamos e aprendemos. Este estudo visa analisar sistematicamente o estado atual da pesquisa sobre IA na educação.

## 2. Metodologia

Foi realizada uma revisão sistemática da literatura utilizando as bases de dados Scopus, Web of Science e IEEE Xplore. Os critérios de inclusão foram:

- Artigos publicados entre 2020-2024
- Foco em aplicações de IA na educação
- Estudos empíricos com dados quantitativos

## 3. Resultados

### 3.1 Análise Quantitativa

Foram identificados 127 artigos relevantes, dos quais 89% reportaram resultados positivos na implementação de IA em contextos educacionais.

### 3.2 Principais Aplicações

1. **Sistemas de Tutoria Inteligente (45%)**
2. **Análise de Aprendizado (32%)**
3. **Chatbots Educacionais (23%)**

## 4. Discussão

Os resultados sugerem que a IA pode efetivamente personalizar a experiência de aprendizado, adaptando-se às necessidades individuais dos estudantes. No entanto, questões éticas e de privacidade ainda precisam ser endereçadas.

## 5. Conclusão

A inteligência artificial apresenta potencial significativo para transformar a educação, mas sua implementação deve ser cuidadosamente planejada considerando aspectos pedagógicos e éticos.

## Referências

1. Smith, J. et al. (2023). AI in Education: A Comprehensive Review. *Journal of Educational Technology*, 45(2), 123-145.
2. Johnson, M. (2024). Personalized Learning Through AI. *Educational AI Quarterly*, 12(1), 67-89.
3. Brown, L. & Davis, K. (2023). Ethical Considerations in Educational AI. *AI Ethics Review*, 8(3), 234-256.
    `)

    setCurrentStep(3)
    setIsGenerating(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">IA</span>
              </div>
              <span className="text-xl font-bold text-gray-900">iArtigo</span>
            </Link>

            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Zap className="h-3 w-3 mr-1" />
                Demo Gratuita
              </Badge>
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Demo Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Demonstração do iArtigo</h1>
          <p className="text-lg text-gray-600 mb-6">Veja como nossa IA gera artigos científicos completos em minutos</p>

          {/* Progress Steps */}
          <div className="flex justify-center items-center gap-4 mb-8">
            {demoSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                    currentStep >= step.id
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="ml-3 text-left">
                  <p className={`text-sm font-medium ${currentStep >= step.id ? "text-blue-600" : "text-gray-500"}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < demoSteps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-4 ${currentStep > step.id ? "bg-blue-600" : "bg-gray-300"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Configuração do Artigo
              </CardTitle>
              <CardDescription>Parâmetros para geração do artigo de demonstração</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Título do Artigo</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-800">
                    "Inteligência Artificial na Educação: Uma Análise Sistemática"
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Área de Estudo</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-800">Tecnologia Educacional</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Palavras-chave</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-800">IA, Educação, Aprendizado, Tecnologia</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de Estudo</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-800">Revisão Sistemática</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Revista Alvo</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-800">Journal of Educational Technology</p>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Esta é uma demonstração com dados fictícios para mostrar as capacidades do iArtigo.
                </AlertDescription>
              </Alert>

              {currentStep === 1 && (
                <Button onClick={handleGenerateDemo} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Gerar Artigo Demo
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentStep === 1 && <Eye className="h-5 w-5" />}
                {currentStep === 2 && <Clock className="h-5 w-5 animate-spin" />}
                {currentStep === 3 && <CheckCircle className="h-5 w-5 text-green-600" />}

                {currentStep === 1 && "Aguardando Geração"}
                {currentStep === 2 && "Gerando Artigo..."}
                {currentStep === 3 && "Artigo Gerado!"}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && "Clique em 'Gerar Artigo Demo' para começar"}
                {currentStep === 2 && "Nossa IA está criando seu artigo científico"}
                {currentStep === 3 && "Artigo completo gerado com sucesso"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentStep === 1 && (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Configure os parâmetros e clique em gerar para ver a demonstração</p>
                </div>
              )}

              {currentStep === 2 && isGenerating && (
                <div className="text-center py-12">
                  <div className="animate-pulse">
                    <Sparkles className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  </div>
                  <p className="text-blue-600 font-medium mb-2">Gerando artigo científico...</p>
                  <p className="text-sm text-gray-500">
                    Analisando literatura • Estruturando conteúdo • Formatando referências
                  </p>
                </div>
              )}

              {currentStep === 3 && generatedContent && (
                <div className="space-y-4">
                  <div className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto">
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                        {generatedContent.substring(0, 1000)}...
                      </pre>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Completo
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>

                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Artigo gerado com sucesso!</strong> Este é apenas um exemplo das capacidades do iArtigo.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features Demo */}
        {currentStep === 3 && (
          <div className="mt-12 space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Recursos Inclusos no Artigo</h2>
              <p className="text-gray-600">Veja alguns dos elementos que o iArtigo gera automaticamente</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Chart Example */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Gráficos Automáticos
                  </CardTitle>
                  <CardDescription>Visualizações de dados geradas pela IA</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartExample />
                </CardContent>
              </Card>

              {/* Table Example */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Tabelas Formatadas
                  </CardTitle>
                  <CardDescription>Dados organizados em formato acadêmico</CardDescription>
                </CardHeader>
                <CardContent>
                  <TableExample />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* CTA Section */}
        {currentStep === 3 && (
          <div className="mt-12 text-center">
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">Impressionado com os resultados?</h3>
                <p className="text-blue-100 mb-6 text-lg">
                  Esta foi apenas uma demonstração. Com o iArtigo completo, você pode:
                </p>

                <div className="grid md:grid-cols-3 gap-4 mb-8 text-left">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-blue-200 mt-1" />
                    <div>
                      <h4 className="font-semibold">Colaboração</h4>
                      <p className="text-sm text-blue-100">Trabalhe em equipe</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-blue-200 mt-1" />
                    <div>
                      <h4 className="font-semibold">Literatura</h4>
                      <p className="text-sm text-blue-100">Busca automática</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Download className="h-5 w-5 text-blue-200 mt-1" />
                    <div>
                      <h4 className="font-semibold">Exportação</h4>
                      <p className="text-sm text-blue-100">Múltiplos formatos</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth/register">
                    <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                      Começar Agora
                    </Button>
                  </Link>
                  <Link href="/payment?plan=professional">
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                      Ver Planos
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
