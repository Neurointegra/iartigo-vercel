import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

interface ArticleGenerationParams {
  title: string
  abstract?: string
  keywords?: string
  fieldOfStudy?: string
  methodology?: string
  targetJournal?: string
  authors?: Array<{
    name: string
    institution: string
  }>
  literatureSuggestions?: Array<{
    title: string
    authors: string
    journal: string
    year: number
    abstract: string
  }>
}

export class GeminiService {
  static async generateArticle(params: ArticleGenerationParams): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      
      const prompt = this.buildArticlePrompt(params)
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      return text
    } catch (error) {
      console.error('Erro ao gerar artigo com Gemini:', error)
      throw new Error('Falha na geração do artigo')
    }
  }

  static async generateSection(
    sectionType: 'introduction' | 'methodology' | 'results' | 'discussion' | 'conclusion',
    context: string,
    additionalInfo?: string
  ): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      
      const prompt = this.buildSectionPrompt(sectionType, context, additionalInfo)
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      return text
    } catch (error) {
      console.error(`Erro ao gerar seção ${sectionType} com Gemini:`, error)
      throw new Error(`Falha na geração da seção ${sectionType}`)
    }
  }

  static async suggestLiterature(
    topic: string,
    keywords: string,
    fieldOfStudy: string
  ): Promise<Array<{
    title: string
    authors: string
    journal: string
    year: number
    doi: string
    abstract: string
    relevance: string
    citation: string
  }>> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      
      const prompt = `
Como um especialista em pesquisa acadêmica, sugira 5-8 referências bibliográficas relevantes para um artigo científico sobre:

Tópico: ${topic}
Palavras-chave: ${keywords}
Área de estudo: ${fieldOfStudy}

Para cada referência, forneça no formato JSON:
- title: título do artigo/livro
- authors: autores principais
- journal: journal ou editora
- year: ano de publicação (entre 2018-2024)
- doi: DOI fictício mas realista
- abstract: resumo de 2-3 frases
- relevance: por que é relevante (1 frase)
- citation: citação no formato ABNT

Responda APENAS com um array JSON válido, sem texto adicional.
      `
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Tentar extrair JSON da resposta
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
      } catch (parseError) {
        console.error('Erro ao parsear JSON de literatura:', parseError)
      }
      
      // Fallback: retornar array vazio se não conseguir parsear
      return []
    } catch (error) {
      console.error('Erro ao sugerir literatura com Gemini:', error)
      return []
    }
  }

  private static buildArticlePrompt(params: ArticleGenerationParams): string {
    const authorsText = params.authors?.map(a => `${a.name} (${a.institution})`).join(', ') || 'Autor Principal'
    const literatureText = params.literatureSuggestions?.map(lit => 
      `- ${lit.title} (${lit.authors}, ${lit.year})`
    ).join('\n') || ''

    return `
Como um especialista em redação científica, gere um artigo acadêmico completo e bem estruturado com as seguintes especificações:

INFORMAÇÕES DO ARTIGO:
- Título: ${params.title}
- Área de estudo: ${params.fieldOfStudy || 'Não especificada'}
- Abstract fornecido: ${params.abstract || 'Não fornecido'}
- Palavras-chave: ${params.keywords || 'Não especificadas'}
- Metodologia: ${params.methodology || 'A ser definida'}
- Journal alvo: ${params.targetJournal || 'Journal científico geral'}
- Autores: ${authorsText}

LITERATURA DE REFERÊNCIA:
${literatureText}

ESTRUTURA OBRIGATÓRIA:
1. **Título**
2. **Abstract** (150-250 palavras em português)
3. **Keywords** (5-8 palavras-chave)
4. **1. Introdução** (contextualização, problema, objetivos)
5. **2. Revisão da Literatura** (estado da arte, trabalhos relacionados)
6. **3. Metodologia** (abordagem, materiais, procedimentos)
7. **4. Resultados** (apresentação dos dados, análises)
8. **5. Discussão** (interpretação, limitações, implicações)
9. **6. Conclusão** (síntese, contribuições, trabalhos futuros)
10. **Referências** (formato ABNT)

DIRETRIZES:
- Use linguagem científica formal e objetiva
- Inclua citações apropriadas ao longo do texto
- Mantenha coerência metodológica
- Apresente dados realistas (mas fictícios)
- Cada seção deve ter pelo menos 200-400 palavras
- Total: aproximadamente 3000-5000 palavras
- Use formatação Markdown adequada

Gere um artigo completo, rigoroso e academicamente sólido.
    `
  }

  private static buildSectionPrompt(
    sectionType: string,
    context: string,
    additionalInfo?: string
  ): string {
    const sectionInstructions = {
      introduction: 'Escreva uma introdução científica abrangente que contextualize o problema, apresente a relevância do tema e estabeleça claramente os objetivos da pesquisa.',
      methodology: 'Descreva detalhadamente a metodologia utilizada, incluindo abordagem, materiais, procedimentos e análises estatísticas quando aplicável.',
      results: 'Apresente os resultados de forma clara e objetiva, incluindo dados, análises e observações principais.',
      discussion: 'Desenvolva uma discussão crítica dos resultados, comparando com a literatura, apresentando limitações e implicações dos achados.',
      conclusion: 'Elabore uma conclusão que sintetize os principais achados, destaque as contribuições do trabalho e sugira direções futuras.'
    }

    return `
Como especialista em redação científica, ${sectionInstructions[sectionType as keyof typeof sectionInstructions]}

CONTEXTO DO ARTIGO:
${context}

INFORMAÇÕES ADICIONAIS:
${additionalInfo || 'Nenhuma informação adicional fornecida'}

DIRETRIZES:
- Use linguagem científica formal
- Inclua citações apropriadas (formato: Autor, ano)
- Mantenha coerência com o contexto fornecido
- Extensão: 300-500 palavras
- Use formatação Markdown quando necessário

Gere apenas a seção solicitada, sem títulos adicionais.
    `
  }
}
