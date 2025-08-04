import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Configurações otimizadas para diferentes tipos de tarefa
const GENERATION_CONFIG = {
  article: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  },
  section: {
    temperature: 0.6,
    topP: 0.8,
    topK: 35,
    maxOutputTokens: 4096,
    responseMimeType: "text/plain",
  },
  analysis: {
    temperature: 0.3,
    topP: 0.9,
    topK: 20,
    maxOutputTokens: 1024,
    responseMimeType: "text/plain",
  },
  literature: {
    temperature: 0.4,
    topP: 0.9,
    topK: 30,
    maxOutputTokens: 2048,
    responseMimeType: "text/plain",
  }
}

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
  attachedFiles?: Array<{
    name: string
    type: 'thesis' | 'data' | 'image'
    size: string
    fileName: string
    content?: string
    imageUrl?: string // URL da imagem salva
    description?: string // Descrição da imagem para a IA
  }>
  includeCharts?: boolean
  chartIds?: string[] // IDs específicos dos gráficos a serem usados
  attachedCharts?: Array<{
    id: string
    name: string
    type: 'bar' | 'line' | 'pie' | 'scatter'
    data: any
    description: string
    referenceId: string
  }>
  includeTables?: boolean
}

// Cache simples para análises de imagem
const imageAnalysisCache = new Map<string, string>()

export class GeminiService {
  // Sistema de retry para chamadas da API
  private static async withRetry<T>(
    operation: () => Promise<T>, 
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        console.log(`Tentativa ${attempt + 1} falhou:`, error)
        
        // Backoff exponencial
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)))
        }
      }
    }
    
    throw lastError
  }

  // Cache para análise de imagens (evitar reprocessamento)
  static getCachedImageAnalysis(imageHash: string): string | null {
    return imageAnalysisCache.get(imageHash) || null
  }

  static setCachedImageAnalysis(imageHash: string, analysis: string): void {
    // Limitar cache a 50 entradas
    if (imageAnalysisCache.size >= 50) {
      const firstKey = imageAnalysisCache.keys().next().value
      if (firstKey) {
        imageAnalysisCache.delete(firstKey)
      }
    }
    imageAnalysisCache.set(imageHash, analysis)
  }

  static async generateArticle(params: ArticleGenerationParams): Promise<string> {
    const startTime = Date.now()
    console.log('🚀 Iniciando geração de artigo com Gemini 2.0 Flash Experimental')
    
    const result = await this.withRetry(async () => {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: GENERATION_CONFIG.article
      })
      
      const prompt = this.buildArticlePrompt(params)
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      let text = response.text()
      
      // Limpar blocos de código markdown se presentes
      text = this.cleanMarkdownCodeBlocks(text)
      
      return text
    }, 3, 2000)
    
    const duration = Date.now() - startTime
    console.log(`✅ Artigo gerado em ${duration}ms (${Math.round(duration/1000)}s)`)
    
    return result
  }

  static async generateSection(
    sectionType: string,
    context: string,
    additionalInfo?: string
  ): Promise<string> {
    const startTime = Date.now()
    console.log(`🔧 Gerando seção: ${sectionType}`)
    
    const result = await this.withRetry(async () => {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: GENERATION_CONFIG.section
      })
      
      const prompt = this.buildSectionPrompt(sectionType, context, additionalInfo)
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      let text = response.text()
      
      // Limpar blocos de código markdown se presentes
      text = this.cleanMarkdownCodeBlocks(text)
      
      return text
    }, 3, 1500)
    
    const duration = Date.now() - startTime
    console.log(`✅ Seção '${sectionType}' gerada em ${duration}ms`)
    
    return result
  }

  static async generateChartImage(
    chartType: 'bar' | 'line' | 'pie' | 'scatter',
    data: any,
    title: string,
    description: string,
    context: string = ""
  ): Promise<string> {
    const startTime = Date.now()
    console.log(`📊 Gerando imagem de gráfico: ${title} (${chartType})`)

    try {
      const result = await this.withRetry(async () => {
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-2.0-flash-exp',
          generationConfig: {
            temperature: 0.1,
            topP: 0.8,
            topK: 20,
            maxOutputTokens: 1024,
            responseMimeType: "text/plain",
          }
        })

        // Preparar dados para visualização
        const dataString = JSON.stringify(data, null, 2)
        
        const prompt = `
Crie uma descrição detalhada de como seria um gráfico ${chartType === 'bar' ? 'de barras' : chartType === 'line' ? 'de linha' : chartType === 'pie' ? 'de pizza' : 'de dispersão'} profissional baseado nos seguintes dados:

TÍTULO: ${title}
DESCRIÇÃO: ${description}
CONTEXTO: ${context || 'Artigo científico'}

DADOS:
${dataString}

INSTRUÇÕES:
1. Analise os dados fornecidos
2. Descreva como seria o gráfico visualmente
3. Inclua cores apropriadas para um artigo científico
4. Mencione eixos, legendas e elementos visuais importantes
5. Sugira layout profissional e acadêmico
6. Limite: 3-4 frases descritivas e precisas

FORMATO DE RESPOSTA:
Forneça apenas a descrição visual do gráfico, sem comentários adicionais.

Exemplo: "Gráfico de barras com 5 categorias no eixo X (A, B, C, D, E) e valores no eixo Y variando de 0 a 100. Barras azuis com altura proporcional aos valores (25, 45, 70, 85, 60). Grid suave, título centralizado e legenda clara."
        `

        const result = await model.generateContent(prompt)
        const response = await result.response
        return response.text().trim()
      }, 2, 1000)

      const duration = Date.now() - startTime
      console.log(`✅ Descrição de gráfico gerada em ${duration}ms`)
      
      return result
    } catch (error) {
      console.error('❌ Erro ao gerar descrição do gráfico:', error)
      return `Gráfico ${chartType} mostrando ${description.toLowerCase()}`
    }
  }

  static async analyzeImage(imageData: string, context: string = ""): Promise<string> {
    // Gerar hash simples do conteúdo da imagem para cache
    const imageHash = Buffer.from(imageData.substring(0, 100)).toString('base64')
    
    // Verificar cache primeiro
    const cached = this.getCachedImageAnalysis(imageHash)
    if (cached) {
      console.log('📋 Análise de imagem encontrada no cache')
      return cached
    }

    const analysis = await this.withRetry(async () => {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: GENERATION_CONFIG.analysis
      })
      
      const prompt = `
Analise esta imagem no contexto de uma pesquisa acadêmica e forneça uma descrição detalhada e objetiva.

CONTEXTO DA PESQUISA: ${context || 'Artigo científico'}

INSTRUÇÕES:
- Descreva objetivamente o que está mostrado na imagem
- Identifique elementos relevantes para pesquisa acadêmica (gráficos, diagramas, processos, dados, etc.)
- Use linguagem científica formal
- Seja específico sobre números, percentuais, tendências se visíveis
- Limite: 2-3 frases precisas e descritivas

FORMATO DE RESPOSTA:
Forneça apenas a descrição da imagem, sem comentários adicionais.

Exemplo: "Gráfico de barras mostrando comparação de eficiência entre três métodos, com valores de 45%, 67% e 82% respectivamente"
      `
      
      const imagePart = {
        inlineData: {
          data: imageData,
          mimeType: "image/jpeg"
        }
      }
      
      const result = await model.generateContent([prompt, imagePart])
      const response = await result.response
      const text = response.text()
      
      return text.trim()
    }, 2, 1000).catch(() => 'Imagem relacionada ao tema da pesquisa')

    // Salvar no cache
    this.setCachedImageAnalysis(imageHash, analysis)
    
    return analysis
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
    return this.withRetry(async () => {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: GENERATION_CONFIG.literature
      })
      
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
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      return []
    }, 2, 1000).catch(() => [])
  }

  private static buildArticlePrompt(params: ArticleGenerationParams): string {
    const authorsText = params.authors?.map(a => `${a.name} (${a.institution})`).join(', ') || 'Autor Principal'

    const attachedFilesText = params.attachedFiles?.length 
      ? `\nARQUIVOS ANEXADOS:
${params.attachedFiles.map(file => {
  let preview = ''
  if (file.content) {
    if (file.type === 'image') {
      preview = `\n  ✓ IMAGEM SALVA: ${file.content}`
    } else {
      preview = '\n  CONTEÚDO PREVIEW: ' + file.content.substring(0, 200) + '...'
    }
  }
  return `- ${file.fileName} (Tipo: ${file.type}, Tamanho: ${file.size})${preview}`
}).join('\n')}

ORIENTAÇÕES PARA ARQUIVOS:
${params.attachedFiles.map(file => {
  if (file.type === 'data') {
    return `- Referencie dados do arquivo "${file.fileName}" nas seções de Metodologia e Resultados${file.content ? ' - Use os dados fornecidos para gerar análises específicas' : ''}`
  } else if (file.type === 'thesis') {
    return `- Use "${file.fileName}" como base teórica na Revisão da Literatura${file.content ? ' - Incorpore as informações do conteúdo nas fundamentações teóricas' : ''}`
  } else if (file.type === 'image') {
    return `- OBRIGATÓRIO: Use EXATAMENTE a referência [Imagem: ${file.fileName}] (não invente outros nomes)
  - CONTEÚDO DA IMAGEM: ${file.description || 'Imagem relacionada ao tema da pesquisa'}
  - ESPAÇAMENTO E CENTRALIZAÇÃO: Sempre use <div style="margin: 30px 0; text-align: center;">[Imagem: ${file.fileName}]</div>
  - IMPORTANTE: As tags [Imagem: nome] são apenas marcadores - NÃO são imagens reais
  - CONTEXTO ANTES: Inclua parágrafo explicativo antes da imagem descrevendo o que ela mostra
  - ANÁLISE DEPOIS: Inclua parágrafo de interpretação após a imagem
  - SEMPRE descreva o conteúdo da imagem no texto ao redor da tag
  - Exemplo completo:
    
    <p>O processo metodológico adotado segue etapas específicas, conforme ilustrado na figura que apresenta o fluxograma detalhado das atividades.</p>
    
    <div style="margin: 30px 0; text-align: center;">
    [Imagem: ${file.fileName}]
    </div>
    
    <p>A imagem demonstra claramente ${file.description || 'os aspectos principais da metodologia'}, evidenciando a sequência lógica das etapas propostas.</p>
    
  - NÃO use imagens fictícias como "logo.png" ou "diagrama.jpg" - use APENAS "${file.fileName}"
  - Considere o conteúdo visual ao referenciar: ${file.description || 'adapte a descrição ao contexto'}
  - DISTRIBUA: Máximo 1 imagem por seção, com pelo menos 2-3 parágrafos entre imagens
  - SEMPRE CENTRALIZE: Todas as imagens devem aparecer centralizadas na página
  - ESCREVA sobre a imagem, não apenas coloque a tag`
  }
  return ''
}).filter(Boolean).join('\n')}

IMPORTANTE SOBRE IMAGENS:
${params.attachedFiles?.filter(f => f.type === 'image').length ? 
  `- Use APENAS as imagens anexadas pelo usuário: ${params.attachedFiles.filter(f => f.type === 'image').map(f => f.fileName).join(', ')}
- NÃO invente nomes de imagens fictícias
- Cada imagem anexada DEVE ser referenciada pelo menos uma vez no artigo
- Use o nome EXATO do arquivo anexado` :
  `- NÃO CRIE tags [Imagem: ...] - não há imagens anexadas
- Se precisar ilustrar conceitos, use APENAS descrições textuais
- JAMAIS invente referências como [Imagem: logo.png], [Imagem: diagrama.jpg]
- Descreva visualmente os processos em texto corrido sem tags`
}
` 
      : ''

    const chartsText = params.includeCharts 
      ? `\nGRÁFICOS GERADOS POR IA:
- IMPORTANTE: Use tags [CHART:descrição] que serão automaticamente convertidas em imagens geradas por IA
- A IA criará imagens profissionais de gráficos baseadas na descrição fornecida
- OBRIGATÓRIO: Incluir exatamente ${params.chartIds?.length || 3} gráficos
${params.chartIds ? 
  `- IDS DOS GRÁFICOS PARA USAR:
${params.chartIds.map((id, index) => `  * [CHART:${id}] - ${index === 0 ? 'na seção Metodologia' : index === 1 ? 'na seção Resultados' : 'na seção Discussão'}`).join('\n')}` :
  `- Sugestões de gráficos (use estas tags exatas):
  * [CHART:metodologia_fluxo] - Fluxograma da metodologia
  * [CHART:resultados_comparativo] - Gráfico comparativo dos resultados
  * [CHART:analise_dados] - Gráfico de análise dos dados coletados`
}

ORIENTAÇÕES PARA GRÁFICOS (COM ESPAÇAMENTO):
- Integre os gráficos naturalmente nas seções apropriadas (Metodologia, Resultados, Discussão)
- SEMPRE adicione contexto ANTES: parágrafo explicando o que será mostrado
- SEMPRE adicione análise DEPOIS: parágrafo interpretando os dados visualizados
- Use espaçamento e centralização adequados: <div style="margin: 40px 0; text-align: center;">[CHART:nome]</div>
- IMPORTANTE: Os gráficos serão automaticamente gerados por IA como imagens profissionais
- Contextualize cada gráfico explicando sua relevância baseada nas informações fornecidas
- SEMPRE mencione o tipo e conteúdo esperado do gráfico no texto ao redor da tag
- SEMPRE CENTRALIZE: Todas as tags de gráfico devem aparecer centralizadas
- Exemplo completo:
  
  <p>A análise dos dados coletados revela tendências importantes, conforme demonstrado no gráfico de barras comparativo a seguir.</p>
  
  <div style="margin: 40px 0; text-align: center;">
  [CHART:${params.chartIds?.[1] || 'resultados_comparativo'}]
  </div>
  
  <p>O gráfico apresentado evidencia claramente uma evolução crescente nos indicadores analisados, com variações significativas entre as categorias observadas.</p>

- Use APENAS os IDs fornecidos acima no formato [CHART:ID]
- Distribua os gráficos em seções diferentes com pelo menos 3 parágrafos entre eles
- SEMPRE mencione que tipo de gráfico será mostrado (barras, linha, pizza, dispersão)
- ESCREVA sobre o que o gráfico mostrará baseado no contexto da pesquisa
- TODAS AS TAGS DE GRÁFICO DEVEM SER CENTRALIZADAS
- A IA gerará automaticamente o gráfico mais apropriado baseado no ID e contexto
`
      : ''

    return `Você é um redator científico profissional especializado em artigos acadêmicos de alta qualidade. Crie um artigo científico COMPLETO e DETALHADO sem usar placeholders.

    INFORMAÇÕES OBRIGATÓRIAS:
    • Título: ${params.title}
    • Área de Estudo: ${params.fieldOfStudy}
    • Metodologia: ${params.methodology}
    • Autores: ${authorsText}
    • Abstract LITERAL: "${params.abstract}"
    • Keywords LITERAIS: "${params.keywords}"

    IMPERATIVO: Use EXATAMENTE o abstract e keywords fornecidos - não modifique uma vírgula!

    ${attachedFilesText}
    ${chartsText}

    DIRETRIZES FUNDAMENTAIS:
    ✓ Idioma: Português brasileiro acadêmico formal
    ✓ Conteúdo: 100% específico e detalhado (ZERO placeholders)
    ✓ Formato: HTML puro com CSS inline (sem DOCTYPE/html/head/body)
    ✓ Dados: Realistas e quantitativos (invente números específicos se necessário)
    ✓ Extensão: Artigo completo com ~2.500 palavras distribuídas pelas seções

    PROIBIÇÕES ABSOLUTAS:
    ✗ Placeholders como [inserir], [descrever], [mencionar], [adicionar]
    ✗ Frases vagas como "diversos estudos mostram" ou "os dados indicam"
    ✗ Tags HTML estruturais (DOCTYPE, html, head, body)
    ✗ Múltiplas linhas vazias consecutivas

    REGRAS PARA ELEMENTOS VISUAIS:
    ${params.includeCharts ? 
    `🔹 GRÁFICOS COMO IMAGENS OBRIGATÓRIOS: Inclua ${params.chartIds?.length || 3} gráficos convertidos em imagens
    ${params.chartIds ? 
      `• Use SOMENTE estes nomes EXATOS: ${params.chartIds.map(id => `[Imagem: chart_${id}.svg]`).join(', ')}
    • NUNCA use tags [CHART:] - SEMPRE use [Imagem: chart_id.svg]
    • ESPAÇAMENTO E CENTRALIZAÇÃO OBRIGATÓRIOS: <div style="margin: 40px 0; text-align: center;">[Imagem: chart_id.svg]</div>
    • IMPORTANTE: Os gráficos são convertidos automaticamente em imagens SVG profissionais
    • PADRÃO: Parágrafo contexto + Imagem de gráfico centralizada + Parágrafo análise descritiva
    • Distribua nas seções: ${params.chartIds.map((id, i) => `[Imagem: chart_${id}.svg] na ${i === 0 ? 'Metodologia' : i === 1 ? 'Resultados' : 'Discussão'}`).join(', ')}
    • DISTÂNCIA MÍNIMA: 3 parágrafos entre gráficos consecutivos
    • SEMPRE DESCREVA o que o gráfico mostra no texto ao redor
    • SEMPRE CENTRALIZE: Todas as imagens de gráfico devem aparecer centralizadas` :
      `• NUNCA use tags [CHART:] - SEMPRE use [Imagem: chart_nome.svg]
      • Sugestão de distribuição:
      - [Imagem: chart_metodologia_processo.svg] na Metodologia
      - [Imagem: chart_resultados_principal.svg] nos Resultados
      - [Imagem: chart_discussao_comparativa.svg] na Discussão`
    }` : 
    `🔹 GRÁFICOS: Não solicitados - NÃO criar tags de gráfico`
    }

    ${params.attachedFiles?.some(f => f.type === 'image') ? 
    `🔹 IMAGENS: Use ${params.attachedFiles.filter(f => f.type === 'image').map(f => `[Imagem: ${f.fileName}]`).join(', ')}
    ${params.attachedFiles.filter(f => f.type === 'image').length ? 
      `• IMPORTANTE: [Imagem: nome] são MARCADORES, não imagens reais
    • CONTEÚDO DAS IMAGENS: Integre baseado nas descrições fornecidas
    • ESPAÇAMENTO E CENTRALIZAÇÃO OBRIGATÓRIOS: <div style="margin: 30px 0; text-align: center;">[Imagem: nome]</div>
    • SEMPRE contextualize e DESCREVA o que cada imagem mostra
    • PADRÃO: Parágrafo contexto + Marcador imagem + Parágrafo análise descritiva
    • DISTRIBUIÇÃO: Máximo 1 imagem por seção de 500+ palavras
    • TODAS AS IMAGENS DEVEM SER CENTRALIZADAS
    • ESCREVA sobre a imagem, não apenas coloque a tag
    • Exemplo: "A análise visual dos dados demonstra tendências significativas, conforme ilustrado na imagem a seguir [Imagem: ${params.attachedFiles.filter(f => f.type === 'image')[0]?.fileName}], que evidencia ${params.attachedFiles.filter(f => f.type === 'image')[0]?.description || 'aspectos relevantes da pesquisa'}"` : ''}` :
    `🔹 IMAGENS: Não anexadas - NÃO criar tags [Imagem:]`
    }

    ESTRUTURA E ESPECIFICAÇÕES:

    1️⃣ TÍTULO PRINCIPAL
    • Use <h1 style="color: #2563eb; font-weight: bold; text-align: center; margin-bottom: 30px; font-size: 28px; line-height: 1.3;">
    • Centralize o título com espaçamento adequado

    2️⃣ AUTORES E AFILIAÇÕES
    • Use <div style="text-align: center; margin: 20px 0; color: #374151;">
    • Formate: <strong>Nome do Autor</strong><br><em>Instituição</em>
    • Para múltiplos autores: separe com <hr style="margin: 10px 40%; border: 1px solid #e5e7eb;">

    3️⃣ RESUMO/ABSTRACT
    • Use seção destacada com <div style="background: #f8fafc; padding: 20px; border-left: 4px solid #2563eb; margin: 30px 0;">
    • Título da seção: <h2 style="color: #1f2937; margin-bottom: 15px; font-size: 18px;">Resumo</h2>
    • Conteúdo: Use LITERALMENTE "${params.abstract}"
    • Não modifique nem uma vírgula do abstract fornecido

    4️⃣ PALAVRAS-CHAVE
    • Use <div style="margin: 20px 0; padding: 15px; background: #f1f5f9;">
    • Título: <strong style="color: #374151;">Palavras-chave:</strong>
    • Conteúdo: Use LITERALMENTE "${params.keywords}"
    • Separe com vírgulas, sem modificações

    5️⃣ INTRODUÇÃO (400-500 palavras)
    • Título: <h2 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin: 40px 0 20px 0;">Introdução</h2>
    • Contextualize o problema com dados específicos
    • Cite estatísticas reais da área
    • Estabeleça objetivos claros e mensuráveis
    • Justifique a relevância com números

    6️⃣ REVISÃO DA LITERATURA (500-600 palavras)
    • Título: <h2 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin: 40px 0 20px 0;">Revisão da Literatura</h2>
    • Cite 5-8 estudos com autores e anos específicos
    • Compare metodologias e resultados quantitativos
    • Identifique lacunas específicas na literatura
    • Use transições fluidas entre os tópicos

    7️⃣ METODOLOGIA (400-500 palavras)
    • Título: <h2 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin: 40px 0 20px 0;">Metodologia</h2>
    • Descreva população, amostra e critérios específicos
    • Detalhe instrumentos e procedimentos passo a passo
    • Especifique análises estatísticas (testes, software, p-valor)
    • Inclua aspectos éticos e temporais

    8️⃣ RESULTADOS (500-600 palavras)
    • Título: <h2 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin: 40px 0 20px 0;">Resultados</h2>
    • Apresente dados quantitativos específicos (percentuais, médias)
    • Organize em subtópicos claros
    • Relacione com objetivos estabelecidos
    • Use linguagem objetiva e precisa

    9️⃣ DISCUSSÃO (450-550 palavras)
    • Título: <h2 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin: 40px 0 20px 0;">Discussão</h2>
    • Compare resultados com literatura citada
    • Explique implicações práticas e teóricas
    • Reconheça limitações específicas
    • Sugira melhorias metodológicas

    🔟 CONCLUSÃO (300-350 palavras)
    • Título: <h2 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin: 40px 0 20px 0;">Conclusão</h2>
    • Sintetize achados principais
    • Destaque contribuições inovadoras
    • Proponha pesquisas futuras específicas
    • Termine com impacto prático

    1️⃣1️⃣ REFERÊNCIAS
    • Título: <h2 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin: 40px 0 20px 0;">Referências</h2>
    • 6-10 referências em formato ABNT
    • Inclua DOIs realistas
    • Varie tipos: artigos, livros, relatórios
    • Use <ol> com espaçamento adequado

    ESTILO E FORMATAÇÃO HTML:
    • Títulos principais: color: #2563eb, font-weight: bold
    • Subtítulos: color: #1f2937, border-bottom com cor azul
    • Destaques: background amarelo (#fef3c7) para termos-chave
    • Parágrafos: line-height 1.6, margin adequado
    • Listas: background cinza claro (#f8fafc), padding
    • Texto: color #374151, justificado

    ESPAÇAMENTO PARA ELEMENTOS VISUAIS:
    • IMAGENS: Adicione margin: 30px 0 E text-align: center
    • GRÁFICOS COMO IMAGENS: Adicione margin: 40px 0 E text-align: center (centralizados)
    • CONTEXTO: Sempre inclua parágrafo explicativo ANTES da imagem/gráfico
    • ANÁLISE: Sempre inclua parágrafo de análise DEPOIS da imagem/gráfico
    • DISTRIBUIÇÃO: Máximo 1 elemento visual por seção longa (500+ palavras)
    • RESPIRAÇÃO: Deixe pelo menos 2-3 parágrafos entre elementos visuais consecutivos
    • CENTRALIZAÇÃO: Todas as imagens e gráficos devem aparecer centralizados

    EXEMPLO DE ESPACIAMENTO CORRETO:
    <h1 style="color: #2563eb; font-weight: bold; text-align: center; margin-bottom: 30px;">Título do Artigo</h1>
    
    <div style="text-align: center; margin: 20px 0; color: #374151;">
    <strong>Nome do Autor</strong><br><em>Universidade, País</em>
    </div>
    
    <div style="background: #f8fafc; padding: 20px; border-left: 4px solid #2563eb; margin: 30px 0;">
    <h2 style="color: #1f2937; margin-bottom: 15px;">Resumo</h2>
    <p>Conteúdo do abstract...</p>
    </div>
    
    <div style="margin: 20px 0; padding: 15px; background: #f1f5f9;">
    <strong>Palavras-chave:</strong> palavra1, palavra2, palavra3
    </div>
    
    <h2 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin: 40px 0 20px 0;">Introdução</h2>
    <p>Primeiro parágrafo...</p>
    
    <p>Contextualização da imagem...</p>
    
    <div style="margin: 30px 0; text-align: center;">
    [Imagem: exemplo.jpg]
    </div>
    
    <p>Análise da imagem apresentada...</p>

    EXEMPLO DE ESPECIFICIDADE OBRIGATÓRIA:
    ❌ "Os resultados mostraram melhoria significativa"
    ✅ "Os resultados demonstraram melhoria de 34,7% (p<0,001) na variável X, com desvio padrão de ±2,3"

    ❌ "Diversos autores concordam"
    ✅ "Silva et al. (2023), Santos (2022) e Oliveira & Costa (2024) convergem quanto à eficácia de 78-85%"

    FLUXO E APRESENTAÇÃO:
    • INÍCIO LIMPO: Comece com título centralizado e bem formatado
    • TRANSIÇÕES: Use conectivos entre seções para fluidez
    • ESPAÇAMENTO: Mantenha hierarquia visual clara com margins consistentes
    • LEGIBILIDADE: Use cores e estilos que facilitam a leitura
    • PROFISSIONALISMO: Cada seção deve ter identidade visual própria mas harmônica

    INICIE AGORA com <h1> centralizado e bem formatado - sem preâmbulos ou tags estruturais:`
  }

  private static cleanMarkdownCodeBlocks(text: string): string {
    // Remove blocos de código markdown no início e fim
    let cleanText = text.trim()
    
    // Remove ```html ou ``` no início
    if (cleanText.startsWith('```html')) {
      cleanText = cleanText.substring(7).trim()
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.substring(3).trim()
    }
    
    // Remove ``` no final
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.substring(0, cleanText.length - 3).trim()
    }
    
    // Remove observações após o conteúdo
    const lines = cleanText.split('\n')
    let contentEndIndex = lines.length
    
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim()
      if (line.startsWith('**Observações:**') || 
          line.startsWith('**') || 
          line.includes('esqueleto') ||
          line.includes('Lembre-se') ||
          line.includes('placeholder') ||
          line.includes('Nota:') ||
          line.includes('observação')) {
        contentEndIndex = i
        break
      }
    }
    
    // Processar linhas para remover espaçamentos excessivos
    const processedLines = lines.slice(0, contentEndIndex)
    
    // Remover linhas vazias excessivas no início
    let startIndex = 0
    while (startIndex < processedLines.length && processedLines[startIndex].trim() === '') {
      startIndex++
    }
    
    // Reduzir múltiplas linhas vazias consecutivas para no máximo 1
    const finalLines = []
    let emptyLineCount = 0
    
    for (let i = startIndex; i < processedLines.length; i++) {
      const line = processedLines[i]
      
      if (line.trim() === '') {
        emptyLineCount++
        if (emptyLineCount <= 1) {
          finalLines.push(line)
        }
      } else {
        emptyLineCount = 0
        finalLines.push(line)
      }
    }
    
    return finalLines.join('\n').trim()
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
Como especialista em redação científica e web design, ${sectionInstructions[sectionType as keyof typeof sectionInstructions]}

CONTEXTO DO ARTIGO:
${context}

INFORMAÇÕES ADICIONAIS:
${additionalInfo || 'Nenhuma informação adicional fornecida'}

FORMATAÇÃO E ESTILO AVANÇADO:
- Use HTML simples com CSS inline para formatação profissional
- Aplique estilos como: <h2 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
- Use cores e espaçamentos para melhor legibilidade
- Destaque pontos importantes com <strong style="background-color: #dbeafe; padding: 2px 4px; border-radius: 3px;">
- Crie listas estilizadas com <ul style="background: #f8fafc; padding: 16px; border-radius: 8px;">
- IMPORTANTE: Não use DOCTYPE, html, head ou body - apenas conteúdo HTML puro

SUPORTE A MULTIMÍDIA (Considere Espaço Visual):
- IMAGENS: Use APENAS se especificado no contexto: [Imagem: nome_do_arquivo]
- GRÁFICOS: Use APENAS se especificado no contexto: [CHART:id_fornecido]

IMPORTANTE: [CHART:id] e [Imagem: nome] são MARCADORES que serão processados depois
- NÃO são gráficos ou imagens reais no momento da escrita
- SEMPRE escreva texto descritivo ao redor desses marcadores
- CONTEXTUALIZE antes: "Os dados coletados revelam...", "conforme demonstrado..."
- ANALISE depois: "evidenciando que...", "demonstrando a tendência..."

- ESPAÇO VISUAL: Imagens ocupam ~200-500px de altura, gráficos ~300-400px
- ESPAÇAMENTO E CENTRALIZAÇÃO OBRIGATÓRIOS: 
  * Imagens: <div style="margin: 30px 0; text-align: center;">[Imagem: nome]</div>
  * Gráficos: <div style="margin: 40px 0;">[CHART:id]</div>
- ESTRUTURA PADRÃO:
  * Parágrafo de contexto (explicando o que será mostrado)
  * Elemento visual com espaçamento e centralização (para imagens)
  * Parágrafo de análise (interpretando o que foi mostrado)
- DISTRIBUIÇÃO: Máximo 1 elemento visual por seção, com 2-3 parágrafos entre elementos
- Quando incluir elementos visuais, reduza proporcionalmente o texto para equilibrar
- Integre naturalmente sem forçar se não for apropriado para a seção
- TODAS AS IMAGENS DEVEM SER CENTRALIZADAS
- Exemplo de estrutura correta:
  
  <p>A metodologia empregada segue etapas específicas...</p>
  
  <div style="margin: 30px 0; text-align: center;">
  [Imagem: processo.jpg]
  </div>
  
  <p>Conforme demonstrado, o processo ilustra...</p>
  
  <p>Os resultados apresentados evidenciam...</p>
  
  <div style="margin: 40px 0;">
  [CHART:dados_principais]
  </div>
  
  <p>A análise dos dados revela tendências...</p>

DIRETRIZES:
- Use linguagem científica formal
- Inclua citações apropriadas (formato: Autor, ano)
- Mantenha coerência com o contexto fornecido
- Extensão: 300-500 palavras (ajuste se incluir elementos visuais)
- Combine HTML/CSS para apresentação visual atrativa
- Seja estratégico com multimídia - qualidade sobre quantidade

Gere apenas a seção solicitada, começando diretamente com o conteúdo, sem títulos adicionais.
    `
  }
}
