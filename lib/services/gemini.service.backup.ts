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

  /**
   * Analisa dados fornecidos pelo usuário e gera informações para gráficos
   */
  static async analyzeDataForCharts(
    dataContent: string,
    context: string = "",
    fileName: string = ""
  ): Promise<{
    success: boolean
    charts: Array<{
      id: string
      name: string
      type: 'bar' | 'line' | 'pie' | 'scatter'
      data: any
      description: string
      analysisContext: string
    }>
    error?: string
  }> {
    console.log('📊 Iniciando análise de dados para geração de gráficos...')
    console.log(`📄 Arquivo: ${fileName}`)
    console.log(`📝 Contexto: ${context}`)
    console.log(`📋 Tamanho dos dados: ${dataContent.length} caracteres`)

    try {
      const result = await this.withRetry(async () => {
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-2.0-flash-exp',
          generationConfig: {
            temperature: 0.3,
            topP: 0.8,
            topK: 20,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
          }
        })

        const analysisPrompt = `
Você é um especialista em análise de dados e visualização científica. Analise CRITERIOSAMENTE os dados fornecidos e identifique apenas os gráficos que fazem SENTIDO CIENTÍFICO.

DADOS FORNECIDOS:
\`\`\`
${dataContent.substring(0, 3000)}${dataContent.length > 3000 ? '\n...(dados truncados)' : ''}
\`\`\`

ARQUIVO: ${fileName}
CONTEXTO: ${context || 'Artigo científico'}

CRITÉRIOS PARA ANÁLISE:
1. 🔍 Identifique dados numéricos ou categóricos nos arquivos fornecidos
2. 📊 Sugira gráficos apenas se houver dados estruturados suficientes
3. 🎯 Quantidade flexível: 1-3 gráficos conforme valor agregado aos dados
4. ✅ Use dados que estão claramente presentes no arquivo
5. 🧭 Priorize qualidade sobre quantidade - melhor poucos gráficos relevantes

QUANDO SUGERIR CADA TIPO:
- "bar": Comparar categorias/grupos (ex: experimental vs controle, por faixa etária)
- "line": Tendências temporais ou sequenciais (ex: evolução ao longo do tempo)
- "pie": Distribuições percentuais (ex: proporção por categoria, até 6 fatias)
- "scatter": Correlações entre duas variáveis contínuas (ex: idade vs pontuação)

FORMATO DE RESPOSTA (JSON válido):
{
  "charts": [
    {
      "id": "id_descritivo_especifico",
      "name": "Título Específico e Científico",
      "type": "bar|line|pie|scatter",
      "data": {
        "labels": ["categoria_específica_1", "categoria_específica_2"],
        "values": [valor_real_1, valor_real_2],
        "unit": "unidade_medida" // ex: "anos", "kg", "%", "pessoas"
      },
      "description": "O que EXATAMENTE este gráfico mostra e por que é relevante",
      "analysisContext": "Insight científico específico extraído destes dados"
    }
  ]
}

REGRAS IMPORTANTES:
❌ NÃO invente dados que não existem no arquivo
❌ NÃO use labels extremamente genéricos como "Item 1", "Categoria A"
❌ NÃO force quantidade específica - prefira qualidade
✅ EXTRAIA dados reais do conteúdo fornecido
✅ USE nomes descritivos baseados no contexto
✅ INCLUA unidades quando identificáveis
✅ SEJA específico mas realista
✅ GERE apenas gráficos que realmente agregam valor

FLEXIBILIDADE PERMITIDA:
- Pode agrupar dados similares para formar categorias
- Pode calcular médias, totais ou proporções dos dados
- Pode interpretar dados de diferentes formatos (CSV, JSON, texto)
- Pode usar sinônimos ou termos relacionados para labels

EXEMPLO DE DADOS VÁLIDOS:
{"labels": ["Grupo Controle", "Grupo Experimental"], "values": [23.5, 31.2], "unit": "média (pontos)"}

SE OS DADOS NÃO SUPORTAREM GRÁFICOS VÁLIDOS, retorne: {"charts": []}
        `

        const result = await model.generateContent(analysisPrompt)
        const response = await result.response
        const text = response.text().trim()

        // Tentar extrair JSON da resposta
        let jsonData
        try {
          // Procurar por JSON válido na resposta
          const jsonMatch = text.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            jsonData = JSON.parse(jsonMatch[0])
          } else {
            jsonData = JSON.parse(text)
          }
        } catch (parseError) {
          console.error('❌ Erro ao fazer parse do JSON:', parseError)
          console.log('📄 Resposta da IA:', text)
          throw new Error('Resposta da IA não é um JSON válido')
        }

        // Validar estrutura
        if (!jsonData.charts || !Array.isArray(jsonData.charts)) {
          throw new Error('Estrutura de resposta inválida - charts não encontrado')
        }

        // Validar cada gráfico com critérios rigorosos
        const validCharts = jsonData.charts.filter((chart: any) => {
          // Validação básica de estrutura
          if (!chart.id || !chart.name || !chart.type || !chart.data || !chart.description) {
            console.warn('⚠️ Gráfico rejeitado: estrutura incompleta:', chart)
            return false
          }

          // Validação de tipos permitidos
          const allowedTypes = ['bar', 'line', 'pie', 'scatter']
          if (!allowedTypes.includes(chart.type)) {
            console.warn('⚠️ Gráfico rejeitado: tipo inválido:', chart.type)
            return false
          }

          // Validação específica por tipo (mais flexível)
          if (chart.type === 'bar' || chart.type === 'line') {
            if (!chart.data.labels || !chart.data.values || 
                !Array.isArray(chart.data.labels) || !Array.isArray(chart.data.values) ||
                chart.data.labels.length < 2 || chart.data.values.length < 2) {
              console.warn('⚠️ Gráfico bar/line rejeitado: dados insuficientes:', chart)
              return false
            }
            // Permitir pequenas discrepâncias no tamanho dos arrays
            if (Math.abs(chart.data.labels.length - chart.data.values.length) > 1) {
              console.warn('⚠️ Gráfico bar/line rejeitado: arrays inconsistentes:', chart)
              return false
            }
          }

          if (chart.type === 'pie') {
            if (!chart.data.labels || !chart.data.values || 
                !Array.isArray(chart.data.labels) || !Array.isArray(chart.data.values) ||
                chart.data.labels.length < 2 || chart.data.values.length < 2 ||
                chart.data.labels.length > 8) { // Máximo 8 fatias
              console.warn('⚠️ Gráfico pie rejeitado: dados inadequados:', chart)
              return false
            }
          }

          // Validar que valores são numéricos
          if (chart.data.values && Array.isArray(chart.data.values)) {
            const hasValidNumbers = chart.data.values.every((val: any) => 
              typeof val === 'number' && !isNaN(val) && isFinite(val)
            )
            if (!hasValidNumbers) {
              console.warn('⚠️ Gráfico rejeitado: valores não numéricos válidos:', chart)
              return false
            }
          }

          // Validar que não tem labels extremamente genéricos (mais flexível)
          if (chart.data.labels && Array.isArray(chart.data.labels)) {
            const veryGenericLabels = chart.data.labels.filter((label: string) => 
              /^(item|categoria|elemento|grupo)\s*[0-9]+$/i.test(label?.toString() || '') ||
              /^(a|b|c|d|e|f)$/i.test(label?.toString() || '')
            )
            // Rejeitar apenas se TODOS os labels forem genéricos
            if (veryGenericLabels.length === chart.data.labels.length && chart.data.labels.length > 1) {
              console.warn('⚠️ Gráfico rejeitado: todos os labels são extremamente genéricos:', chart)
              return false
            }
          }

          // Validar que nome não é extremamente genérico (mais flexível para IDs aleatórios)
          if (/^(gráfico|chart|análise|dados?)\s*(de\s*)?dados?$/i.test(chart.name) ||
              /^(gráfico|chart)\s*[0-9]+$/i.test(chart.name)) {
            console.warn('⚠️ Gráfico rejeitado: nome muito genérico:', chart.name)
            return false
          }

          console.log('✅ Gráfico validado:', chart.id)
          return true
        })

        if (validCharts.length === 0) {
          throw new Error('Nenhum gráfico válido foi gerado pela análise')
        }

        // Aplicar validação de relevância (mais flexível)
        const contextuallyValidCharts = validCharts.filter((chart: any) => {
          const relevanceCheck = this.validateChartRelevance(chart, dataContent, context)
          if (!relevanceCheck.isValid) {
            console.warn(`ℹ️ Gráfico com baixa relevância mantido: ${chart.id} - ${relevanceCheck.reason}`)
            // Manter gráfico mesmo com baixa relevância, apenas logar o aviso
          }
          return true // Aceitar todos os gráficos que passaram na validação estrutural
        })

        if (contextuallyValidCharts.length === 0) {
          console.warn('⚠️ Todos os gráficos foram rejeitados por falta de relevância')
          return { charts: [] }
        }

        console.log(`✅ Análise concluída: ${contextuallyValidCharts.length} gráficos válidos e relevantes`)
        return { charts: contextuallyValidCharts }

      }, 2, 2000)

      return {
        success: true,
        charts: result.charts
      }

    } catch (error) {
      console.error('❌ Erro na análise de dados:', error)
      return {
        success: false,
        charts: [],
        error: error instanceof Error ? error.message : 'Erro desconhecido na análise de dados'
      }
    }
  }

  /**
   * Gera SVG baseado na análise de dados da IA
   */
  static async generateDataDrivenSVG(
    chart: {
      id: string
      name: string
      type: 'bar' | 'line' | 'pie' | 'scatter'
      data: any
      description: string
      analysisContext: string
    },
    width: number = 1200,
    height: number = 800
  ): Promise<{
    success: boolean
    svgContent?: string
    error?: string
  }> {
    console.log(`🎨 Gerando SVG baseado em dados para: ${chart.id}`)

    try {
      const result = await this.withRetry(async () => {
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-2.0-flash-exp',
          generationConfig: {
            temperature: 0.1,
            topP: 0.8,
            topK: 10,
            maxOutputTokens: 3000,
            responseMimeType: "text/plain",
          }
        })

        const svgPrompt = `
Você é um especialista em SVG e visualização científica. Gere um gráfico SVG PROFISSIONAL e PRECISO baseado EXCLUSIVAMENTE nos dados analisados.

INFORMAÇÕES DO GRÁFICO:
- ID: ${chart.id}
- Nome: ${chart.name}
- Tipo: ${chart.type}
- Descrição: ${chart.description}
- Contexto: ${chart.analysisContext}

DADOS REAIS PARA PLOTAR:
${JSON.stringify(chart.data, null, 2)}

ESPECIFICAÇÕES TÉCNICAS OBRIGATÓRIAS:
- Dimensões: ${width}x${height} pixels
- Fundo: Branco (#FFFFFF)
- Paleta: Azul científico (#2563EB), Verde (#059669), Vermelho (#DC2626), Laranja (#F59E0B), Roxo (#7C3AED)
- Fonte: "Arial", sans-serif
- Margens: 80px topo/lateral, 100px inferior para labels

INSTRUÇÕES CRÍTICAS POR TIPO:

📊 GRÁFICO DE BARRAS (bar):
- Barras verticais, largura proporcional ao espaço disponível
- Altura das barras EXATAMENTE proporcional aos valores
- Eixo Y com escala precisa (0 até valor máximo + 10%)
- Labels do eixo X rotacionados se necessário
- Valores numéricos no topo de cada barra
- Grid horizontal sutil para referência

📈 GRÁFICO DE LINHA (line):
- Linha contínua conectando pontos na sequência exata
- Pontos circulares marcados (raio 4px)
- Eixos X e Y com escalas proporcionais aos dados
- Grid discreto para melhor leitura
- Valores nos pontos quando espaço permitir

🥧 GRÁFICO DE PIZZA (pie):
- Fatias EXATAMENTE proporcionais aos valores percentuais
- Início às 12h (topo), sentido horário
- Labels externos com linhas conectoras
- Percentuais dentro das fatias (se >5%) ou na legenda
- Cores alternadas da paleta

🔷 GRÁFICO DE DISPERSÃO (scatter):
- Pontos plotados nas coordenadas X,Y exatas
- Eixos com escalas apropriadas aos dados
- Grid para facilitar leitura
- Pontos destacados (raio 5px, borda mais escura)

ELEMENTOS OBRIGATÓRIOS EM TODO SVG:
1. 📝 Título centralizado (font-size: 20px, font-weight: bold)
2. 📏 Eixos com labels descritivos e unidades
3. 📊 Escala numérica precisa e proporcional
4. 🎨 Cores consistentes da paleta definida
5. 📐 Grid de referência sutil (#F3F4F6)
6. 🏷️ Legenda quando necessário

VALIDAÇÃO FINAL OBRIGATÓRIA:
- Todos os valores dos dados estão representados?
- As proporções estão matematicamente corretas?
- Os labels são legíveis e não se sobrepõem?
- O título descreve exatamente o que é mostrado?

FORMATO DE RESPOSTA:
Retorne APENAS o código SVG válido e completo.
Inicie com <svg e termine com </svg>
NÃO adicione comentários, explicações ou markdown.

🚫 PROIBIÇÕES CRÍTICAS:
- NUNCA use elementos <script> ou JavaScript
- NUNCA use loops (for, while) ou funções
- NUNCA use document.write ou métodos DOM
- Gere TODOS os elementos SVG estaticamente
- Use apenas tags SVG válidas: <rect>, <circle>, <line>, <path>, <text>, <g>

TEMPLATE ESTRUTURAL RESPONSIVO:
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#FFFFFF"/>
  <defs>
    <style>
      .title { font: bold 20px Arial, sans-serif; fill: #1F2937; }
      .axis-label { font: 14px Arial, sans-serif; fill: #374151; }
      .data-label { font: 12px Arial, sans-serif; fill: #6B7280; }
      .grid-line { stroke: #F3F4F6; stroke-width: 1; }
    </style>
  </defs>
  
  <text x="${width/2}" y="35" text-anchor="middle" class="title">${chart.name}</text>
  
  <!-- GERE TODOS OS ELEMENTOS DIRETAMENTE - NÃO USE JAVASCRIPT -->
  <!-- Para múltiplos elementos similares, repita as tags manualmente -->
  <!-- Exemplo de barras: <rect x="10" y="20" width="30" height="40" fill="#2563EB"/> -->
  <!-- Exemplo de texto: <text x="25" y="15" text-anchor="middle" class="data-label">Valor</text> -->
  
</svg>

⚠️ OBRIGATÓRIO: 
1. SEMPRE incluir viewBox="0 0 ${width} ${height}" para responsividade
2. Verifique que TODOS os valores dos dados estão plotados corretamente
3. Use APENAS elementos SVG estáticos - NÃO use JavaScript
4. Repita manualmente elementos similares ao invés de usar loops
5. O SVG deve ser responsivo e escalar proporcionalmente
        `

        const result = await model.generateContent(svgPrompt)
        const response = await result.response
        let svgContent = response.text().trim()

        // Limpar possíveis markdown ou prefixos
        if (svgContent.includes('```')) {
          const svgMatch = svgContent.match(/```(?:svg)?\s*\n?([\s\S]*?)\n?```/)
          if (svgMatch) {
            svgContent = svgMatch[1].trim()
          }
        }

        // Verificar se é SVG válido e bem formado
        if (!svgContent.startsWith('<svg') || !svgContent.endsWith('</svg>')) {
          throw new Error('SVG gerado não é válido: deve começar com <svg e terminar com </svg>')
        }

        // Validações adicionais de qualidade do SVG
        const svgValidations = [
          { test: () => svgContent.includes('width='), error: 'SVG deve ter atributo width' },
          { test: () => svgContent.includes('height='), error: 'SVG deve ter atributo height' },
          { test: () => svgContent.includes('viewBox='), error: 'SVG deve ter atributo viewBox para responsividade' },
          { test: () => svgContent.includes('xmlns='), error: 'SVG deve ter namespace xmlns' },
          { test: () => svgContent.includes('<text'), error: 'SVG deve conter elementos de texto' },
          { test: () => !svgContent.includes('<Chart'), error: 'SVG contém tag inválida <Chart>' },
          { test: () => !svgContent.includes('[CHART'), error: 'SVG contém tag de placeholder [CHART]' },
          { test: () => !svgContent.includes('<script'), error: 'SVG não deve conter elementos <script>' },
          { test: () => !svgContent.includes('document.'), error: 'SVG não deve conter código JavaScript' },
          { test: () => !svgContent.includes('for ('), error: 'SVG não deve conter loops JavaScript' },
          { test: () => !svgContent.includes('function'), error: 'SVG não deve conter funções JavaScript' }
        ]

        for (const validation of svgValidations) {
          if (!validation.test()) {
            // Se viewBox está faltando, tentar adicionar automaticamente
            if (validation.error.includes('viewBox')) {
              console.warn('⚠️ ViewBox ausente, adicionando automaticamente...')
              const widthMatch = svgContent.match(/width="(\d+)"/)
              const heightMatch = svgContent.match(/height="(\d+)"/)
              
              if (widthMatch && heightMatch) {
                const w = widthMatch[1]
                const h = heightMatch[1]
                svgContent = svgContent.replace(
                  '<svg',
                  `<svg viewBox="0 0 ${w} ${h}"`
                )
                continue // Pular erro se conseguiu corrigir
              }
            }
            throw new Error(`SVG inválido: ${validation.error}`)
          }
        }

        // Verificar balanceamento básico de tags principais
        const mainTags = ['<svg', '<rect', '<text', '<circle', '<line', '<path', '<g']
        for (const tag of mainTags) {
          const openCount = (svgContent.match(new RegExp(tag, 'g')) || []).length
          const closeTag = tag.replace('<', '</')
          const closeCount = (svgContent.match(new RegExp(closeTag, 'g')) || []).length
          
          // Para tags auto-fechantes, permitir diferença
          if (tag !== '<rect' && tag !== '<circle' && tag !== '<line' && openCount !== closeCount && openCount > 0) {
            console.warn(`⚠️ Possível desbalanceamento em ${tag}: ${openCount} aberto(s), ${closeCount} fechado(s)`)
          }
        }

        // Verificar se o título do gráfico está presente no SVG
        if (!svgContent.includes(chart.name.substring(0, 20))) {
          console.warn('⚠️ Aviso: Título do gráfico pode não estar presente no SVG')
        }

        console.log(`✅ SVG gerado para ${chart.id}: ${svgContent.length} caracteres`)
        return { svgContent }

      }, 2, 1500)

      return {
        success: true,
        svgContent: result.svgContent
      }

    } catch (error) {
      console.error(`❌ Erro na geração de SVG para ${chart.id}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido na geração de SVG'
      }
    }
  }

  /**
   * Valida se um gráfico faz sentido científico baseado nos dados originais
   */
  static validateChartRelevance(
    chart: any,
    originalData: string,
    context: string
  ): { isValid: boolean; reason?: string } {
    try {
      // Verificar se os dados do gráfico têm correspondência no texto original
      const chartLabels = chart.data.labels || []
      const chartValues = chart.data.values || []

      // Validar se pelo menos 70% dos labels aparecem no texto original
      const labelsInText = chartLabels.filter((label: string) => 
        originalData.toLowerCase().includes(label.toLowerCase())
      )
      
      if (labelsInText.length < chartLabels.length * 0.7) {
        return { 
          isValid: false, 
          reason: `Labels do gráfico não encontrados nos dados originais: ${chartLabels.join(', ')}` 
        }
      }

      // Verificar se os valores são realistas (não muito round numbers)
      const hasOnlyRoundNumbers = chartValues.every((val: number) => val % 10 === 0)
      if (hasOnlyRoundNumbers && chartValues.length > 2) {
        return { 
          isValid: false, 
          reason: 'Valores suspeitos: todos são números redondos (possível invenção)' 
        }
      }

      // Verificar se o contexto do gráfico está relacionado ao tema
      const contextWords = context.toLowerCase().split(/\s+/)
      const chartDescription = (chart.description || '').toLowerCase()
      const hasContextRelevance = contextWords.some(word => 
        word.length > 3 && chartDescription.includes(word)
      )

      if (!hasContextRelevance && context.length > 10) {
        return { 
          isValid: false, 
          reason: 'Gráfico não parece relacionado ao contexto da pesquisa' 
        }
      }

      return { isValid: true }

    } catch (error) {
      return { 
        isValid: false, 
        reason: `Erro na validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      }
    }
  }

  /**
   * Gera imagens usando o Gemini AI com suporte a geração de imagens
   * Utiliza o modelo gemini-2.0-flash-preview-image-generation
   */
  static async generateImage(
    prompt: string,
    options: {
      width?: number
      height?: number
      format?: 'png' | 'jpg' | 'svg'
      context?: string
    } = {}
  ): Promise<{
    success: boolean
    imageUrl?: string
    base64Data?: string
    error?: string
    description?: string
  }> {
    const startTime = Date.now()
    console.log('🎨 Iniciando geração de imagem com Gemini AI...')
    console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`)

    try {
      // Verificar se a API key está configurada
      if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️ GEMINI_API_KEY não configurada')
        return {
          success: false,
          error: 'API key do Gemini não configurada',
          description: 'Configure GEMINI_API_KEY no arquivo .env'
        }
      }

      // Configurar prompt otimizado para geração de imagem
      const {
        width = 800,
        height = 600,
        format = 'png',
        context = 'artigo científico'
      } = options

      const enhancedPrompt = `
Generate a professional chart/graph image with these specifications:

DESCRIPTION: ${prompt}

TECHNICAL SPECIFICATIONS:
- Dimensions: ${width}x${height} pixels
- Format: ${format.toUpperCase()}
- Context: ${context}
- Quality: High resolution, professional

VISUAL REQUIREMENTS:
- White or neutral background
- Professional color scheme
- Clear, readable text
- Balanced composition
- Suitable for ${context}

Create the image following these exact specifications.
      `

      // NOVA ABORDAGEM: Tentar método alternativo para geração de imagem
      const result = await this.withRetry(async () => {
        try {
          console.log('🤖 Tentando gerar imagem com modelo experimental (nova abordagem)...')
          
          // Tentar método mais simples sem configuração extra
          const imageModel = genAI.getGenerativeModel({ 
            model: 'gemini-2.0-flash-preview-image-generation'
          })

          // Usar prompt mais direto
          const imageResult = await imageModel.generateContent([
            {
              text: enhancedPrompt
            }
          ])
          
          console.log('🖼️ Resultado da geração de imagem:', imageResult)
          const imageResponse = imageResult.response

          // Verificar diferentes estruturas de resposta
          if (imageResponse.candidates && imageResponse.candidates[0]) {
            const candidate = imageResponse.candidates[0]
            
            // Verificar estrutura de dados da imagem
            if (candidate.content && candidate.content.parts) {
              for (const part of candidate.content.parts) {
                // Procurar dados inline (estrutura padrão)
                if (part.inlineData && part.inlineData.data) {
                  console.log('✅ Imagem gerada com sucesso!')
                  
                  return {
                    success: true,
                    base64Data: part.inlineData.data,
                    imageUrl: `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`,
                    description: `Imagem gerada: ${prompt.substring(0, 50)}...`
                  }
                }
              }
            }
          }

          // Se chegou até aqui, não encontrou dados de imagem
          console.log('⚠️ Resposta não contém dados de imagem válidos')
          console.log('📋 Estrutura da resposta:', JSON.stringify(imageResponse, null, 2))
          
          throw new Error('Modelo não retornou dados de imagem válidos')

        } catch (experimentalError) {
          console.log('❌ Erro no modelo experimental:', experimentalError)
          console.log('⚠️ Modelo experimental falhou, usando fallback de descrição...')
          
          // Fallback: Gerar descrição detalhada para uso com SVG
          const textModel = genAI.getGenerativeModel({ 
            model: 'gemini-2.0-flash-exp',
            generationConfig: {
              temperature: 0.3,
              topP: 0.9,
              topK: 20,
              maxOutputTokens: 1024,
              responseMimeType: "text/plain",
            }
          })

          const fallbackPrompt = `
Como especialista em visualização de dados, descreva exatamente como criar um gráfico/diagrama para:

SOLICITAÇÃO: ${prompt}
DIMENSÕES: ${width}x${height}
CONTEXTO: ${context}

Forneça uma descrição TÉCNICA e ESPECÍFICA incluindo:
1. Tipo de gráfico (barra, linha, pizza, dispersão)
2. Dados específicos (valores, categorias, percentuais)
3. Cores exatas (códigos hex)
4. Layout e posicionamento
5. Texto e legendas

FORMATO DE RESPOSTA:
Descrição técnica detalhada que permita recriar o gráfico exatamente.

Exemplo: "Gráfico de barras com 4 categorias (A: 25%, B: 45%, C: 70%, D: 55%). Barras azuis #2563EB, fundo branco, eixo Y 0-100%, título 'Resultados' centralizado, grid horizontal cinza #E5E7EB."
          `

          const fallbackResult = await textModel.generateContent(fallbackPrompt)
          const fallbackResponse = await fallbackResult.response
          const description = fallbackResponse.text().trim()

          return {
            success: false,
            error: 'Geração de imagem AI não disponível - usando descrição para SVG',
            description: description
          }
        }
      }, 2, 1500)

      const duration = Date.now() - startTime
      console.log(`✅ Processamento de imagem concluído em ${duration}ms`)
      
      return result

    } catch (error) {
      const duration = Date.now() - startTime
      console.error('❌ Erro na geração de imagem:', error)
      console.log(`⏱️ Tentativa falhou após ${duration}ms`)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido na geração de imagem',
        description: 'Não foi possível gerar a imagem solicitada. Verifique a configuração da API ou tente novamente.'
      }
    }
  }

  /**
   * Salva uma imagem gerada na pasta uploads
   */
  static async saveGeneratedImage(
    base64Data: string,
    filename: string,
    mimeType: string = 'image/png'
  ): Promise<{
    success: boolean
    filePath?: string
    publicUrl?: string
    error?: string
  }> {
    try {
      const fs = require('fs').promises
      const path = require('path')
      
      // Determinar extensão baseada no mimeType
      const extension = mimeType.includes('jpeg') ? 'jpg' : 
                      mimeType.includes('svg') ? 'svg' : 'png'
      
      // Gerar nome único se não especificado
      const timestamp = Date.now()
      const finalFilename = filename.includes('.') ? filename : `${filename}_${timestamp}.${extension}`
      
      // Caminhos
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      const filePath = path.join(uploadsDir, finalFilename)
      const publicUrl = `/uploads/${finalFilename}`
      
      // Garantir que o diretório existe
      await fs.mkdir(uploadsDir, { recursive: true })
      
      // Converter base64 para buffer
      const imageBuffer = Buffer.from(base64Data, 'base64')
      
      // Salvar arquivo
      await fs.writeFile(filePath, imageBuffer)
      
      console.log(`✅ Imagem salva: ${publicUrl}`)
      
      return {
        success: true,
        filePath,
        publicUrl
      }
      
    } catch (error) {
      console.error('❌ Erro ao salvar imagem:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao salvar imagem'
      }
    }
  }

  /**
   * Gera e salva uma imagem de gráfico/diagrama
   */
  static async generateAndSaveImage(
    prompt: string,
    filename: string,
    options: {
      width?: number
      height?: number
      format?: 'png' | 'jpg' | 'svg'
      context?: string
    } = {}
  ): Promise<{
    success: boolean
    imageUrl?: string
    publicUrl?: string
    filePath?: string
    error?: string
    description?: string
  }> {
    console.log(`🎨 Gerando e salvando imagem: ${filename}`)
    
    // Gerar imagem
    const imageResult = await this.generateImage(prompt, options)
    
    if (!imageResult.success || !imageResult.base64Data) {
      return {
        success: false,
        error: imageResult.error || 'Falha na geração da imagem',
        description: imageResult.description
      }
    }
    
    // Salvar imagem
    const mimeType = imageResult.imageUrl?.split(';')[0].split(':')[1] || 'image/png'
    const saveResult = await this.saveGeneratedImage(
      imageResult.base64Data,
      filename,
      mimeType
    )
    
    if (!saveResult.success) {
      return {
        success: false,
        error: saveResult.error || 'Falha ao salvar a imagem'
      }
    }
    
    return {
      success: true,
      imageUrl: imageResult.imageUrl,
      publicUrl: saveResult.publicUrl,
      filePath: saveResult.filePath,
      description: `Imagem gerada e salva com sucesso: ${filename}`
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
    return `- DADOS ESTRUTURADOS: Use os dados fornecidos para análises nas seções de Metodologia e Resultados${file.content ? ' - Gere análises específicas baseadas no conteúdo' : ''}
    - IMPORTANTE: NÃO mencione o nome do arquivo "${file.fileName}" no texto do artigo
    - Refira-se genericamente como "dados coletados", "informações obtidas", "base de dados da pesquisa"`
  } else if (file.type === 'thesis') {
    return `- BASE TEÓRICA: Use como fundamentação na Revisão da Literatura${file.content ? ' - Incorpore as informações nas fundamentações teóricas' : ''}
    - IMPORTANTE: NÃO mencione o nome do arquivo "${file.fileName}" no texto do artigo
    - Refira-se genericamente como "literatura especializada", "estudos anteriores", "pesquisas relacionadas"`
  } else if (file.type === 'image') {
    return `- OBRIGATÓRIO: Use EXATAMENTE a referência [Imagem: ${file.fileName}] (não invente outros nomes)
  - CONTEÚDO DA IMAGEM: ${file.description || 'Imagem relacionada ao tema da pesquisa'}
  - ESPAÇAMENTO E CENTRALIZAÇÃO: Sempre use <div style="margin: 30px 0; text-align: center;">[Imagem: ${file.fileName}]</div>
  - IMPORTANTE: As tags [Imagem: nome] são apenas marcadores - NÃO são imagens reais
  - NÃO MENCIONE O NOME DO ARQUIVO no texto: Em vez de "conforme ${file.fileName}", use "conforme ilustrado na figura"
  - CONTEXTO ANTES: Inclua parágrafo explicativo antes da imagem descrevendo o que ela mostra
  - ANÁLISE DEPOIS: Inclua parágrafo de interpretação após a imagem
  - SEMPRE descreva o conteúdo da imagem no texto ao redor da tag
  - Exemplo completo:
    
    <p>O processo metodológico adotado segue etapas específicas, conforme ilustrado na figura que apresenta o fluxograma detalhado das atividades.</p>
    
    <div style="margin: 30px 0; text-align: center;">
    [Imagem: ${file.fileName}]
    </div>
    
    <p>A ilustração demonstra claramente ${file.description || 'os aspectos principais da metodologia'}, evidenciando a sequência lógica das etapas propostas.</p>
    
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
      ? `\nGRÁFICOS AUTOMÁTICOS:
- USE TAGS ESPECIAIS: Use tags [CHART:id] para marcar onde os gráficos devem aparecer
- PROCESSAMENTO AUTOMÁTICO: As tags serão automaticamente convertidas em imagens reais
- QUANTIDADE FLEXÍVEL: Inclua 1-3 gráficos conforme necessário para o conteúdo
- IDs ALEATÓRIOS: Gere IDs únicos e aleatórios (ex: chart_abc123, graph_xyz789, data_def456)
${params.chartIds ? 
  `- GRÁFICOS DISPONÍVEIS:
${params.chartIds.map((id, index) => `  * Use [CHART:${id}] onde for mais apropriado contextualmente`).join('\n')}` :
  `- EXEMPLOS DE IDs ALEATÓRIOS:
  * [CHART:analysis_rnd847] para análises gerais
  * [CHART:comparison_xyz123] para comparações
  * [CHART:distribution_abc456] para distribuições`
}

INSTRUÇÕES PARA TAGS DE GRÁFICO:
- POSICIONAMENTO: Coloque as tags [CHART:id] onde o gráfico agregue valor científico
- CONTEXTO GENÉRICO: Refira-se ao gráfico como "ilustração", "demonstração", "visualização"
- EVITE NOMES ESPECÍFICOS: NÃO mencione o ID do gráfico no texto do artigo
- ANÁLISE: Sempre inclua um parágrafo de análise DEPOIS da tag
- ESPAÇAMENTO: Use <div style="margin: 40px 0; text-align: center;">[CHART:id]</div>
- IMPORTANTE: As tags [CHART:id] serão automaticamente convertidas em imagens reais

EXEMPLO CORRETO DE REFERÊNCIA GENÉRICA:
"A metodologia adotada seguiu um processo estruturado, conforme demonstrado na visualização a seguir.

<div style="margin: 40px 0; text-align: center;">
[CHART:process_rnd847]
</div>

A ilustração evidencia a sequência lógica das atividades, demonstrando a integração entre as diferentes fases da pesquisa."

DIRETRIZES IMPORTANTES:
- NUNCA mencione o nome/ID do gráfico no texto (ex: "chart_abc123", "gráfico process_rnd847")
- USE termos genéricos: "a visualização", "o gráfico", "a ilustração", "a demonstração"
- DISTRIBUA conforme necessário - não force 3 gráficos se não fizer sentido
- CONTEXTUALIZE cada gráfico no texto ao redor sem nomear especificamente
- As imagens serão geradas automaticamente baseadas no contexto da seção
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

    🚫 PROIBIÇÃO CRÍTICA - NÃO MENCIONAR ARQUIVOS:
    • JAMAIS cite nomes de arquivos no texto do artigo (ex: "dados.csv", "pesquisa.pdf", "imagem.jpg")
    • NÃO use frases como "baseado no arquivo X", "conforme documento Y", "segundo dados.csv"
    • USE sempre referências genéricas: "dados coletados", "informações obtidas", "literatura especializada"
    • EVITE: "Os dados do arquivo dados.csv mostram..." 
    • PREFIRA: "Os dados coletados revelam..."
    • O artigo deve parecer natural, sem referências a fontes externas específicas

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
    `🔹 GRÁFICOS (QUANTIDADE FLEXÍVEL): Inclua 1-3 gráficos conforme necessário
    ${params.chartIds ? 
      `• Use SOMENTE estas TAGS: ${params.chartIds.map(id => `[CHART:${id}]`).join(', ')}
    • FORMATO CORRETO: [CHART:id] (NÃO use [Imagem: chart_id.svg])
    • REFERÊNCIAS GENÉRICAS: Use "a visualização", "o gráfico", "a ilustração" - NUNCA mencione o ID
    • ESPAÇAMENTO E CENTRALIZAÇÃO OBRIGATÓRIOS: <div style="margin: 40px 0; text-align: center;">[CHART:id]</div>
    • IMPORTANTE: As tags [CHART:id] são convertidas automaticamente em imagens SVG profissionais
    • PADRÃO: Parágrafo contexto + Tag de gráfico centralizada + Parágrafo análise descritiva
    • Distribua conforme necessário - não force se não agregar valor
    • DISTÂNCIA MÍNIMA: 3 parágrafos entre gráficos consecutivos
    • SEMPRE DESCREVA genericamente o que o gráfico mostra no texto ao redor
    • SEMPRE CENTRALIZE: Todas as tags de gráfico devem aparecer centralizadas
    • EXEMPLO DE REFERÊNCIA CORRETA: "Os dados apresentam tendências significativas, conforme demonstrado na visualização a seguir. A análise evidencia os padrões identificados na pesquisa."` :
      `• USE TAGS: [CHART:id_aleatorio] com IDs únicos gerados aleatoriamente
      • FORMATO: [CHART:analysis_rnd123], [CHART:comparison_xyz789], [CHART:results_abc456]
      • REFERÊNCIAS GENÉRICAS: "a visualização", "o gráfico", "a demonstração"
      • Sugestão de distribuição flexível:
      - [CHART:methodology_rnd123] se apropriado na Metodologia
      - [CHART:results_xyz789] se apropriado nos Resultados
      - [CHART:discussion_abc456] se apropriado na Discussão
      • SEMPRE centralize: <div style="margin: 40px 0; text-align: center;">[CHART:id]</div>
      • NUNCA mencione os IDs no texto do artigo`
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

    ❌ "Baseado no arquivo dashboard.tsx obtivemos..." 
    ✅ "A implementação do painel administrativo resultou em..."
    
    ❌ "Como observado em components/chart.tsx..."
    ✅ "O componente de visualização desenvolvido..."

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
