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

export class GeminiService {
  static async generateArticle(params: ArticleGenerationParams): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
      
      const prompt = this.buildArticlePrompt(params)
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      let text = response.text()
      
      // Limpar blocos de código markdown se presentes
      text = this.cleanMarkdownCodeBlocks(text)
      
      return text
    } catch (error) {
      console.error('Erro ao gerar artigo com Gemini:', error)
      throw new Error('Falha na geração do artigo')
    }
  }

  static async generateSection(
    sectionType: string,
    context: string,
    additionalInfo?: string
  ): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      
      const prompt = this.buildSectionPrompt(sectionType, context, additionalInfo)
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      let text = response.text()
      
      // Limpar blocos de código markdown se presentes
      text = this.cleanMarkdownCodeBlocks(text)
      
      return text
    } catch (error) {
      console.error('Erro ao gerar seção com Gemini:', error)
      throw new Error('Falha na geração da seção')
    }
  }

  static async analyzeImage(imageData: string, context: string = ""): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
      
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
    } catch (error) {
      console.error('Erro ao analisar imagem com Gemini:', error)
      return 'Imagem relacionada ao tema da pesquisa'
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
  - ESPAÇAMENTO: Sempre use <div style="margin: 30px 0;">[Imagem: ${file.fileName}]</div>
  - CONTEXTO ANTES: Inclua parágrafo explicativo antes da imagem
  - ANÁLISE DEPOIS: Inclua parágrafo de interpretação após a imagem
  - Exemplo completo:
    
    <p>O processo metodológico adotado segue etapas específicas...</p>
    
    <div style="margin: 30px 0;">
    [Imagem: ${file.fileName}]
    </div>
    
    <p>Conforme ilustrado, ${file.description || 'a imagem demonstra os aspectos principais da pesquisa'}...</p>
    
  - NÃO use imagens fictícias como "logo.png" ou "diagrama.jpg" - use APENAS "${file.fileName}"
  - Considere o conteúdo visual ao referenciar: ${file.description || 'adapte a descrição ao contexto'}
  - DISTRIBUA: Máximo 1 imagem por seção, com pelo menos 2-3 parágrafos entre imagens`
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
      ? `\nGRÁFICOS SOLICITADOS:
- OBRIGATÓRIO: Incluir exatamente ${params.chartIds?.length || 3} gráficos usando as tags EXATAS fornecidas
- IMPORTANTE: Use APENAS os IDs fornecidos - NÃO invente IDs próprios
${params.chartIds ? 
  `- IDs OBRIGATÓRIOS A USAR:
${params.chartIds.map((id, index) => `  * [CHART:${id}] - ${index === 0 ? 'na seção Metodologia' : index === 1 ? 'na seção Resultados' : 'na seção Discussão'}`).join('\n')}` :
  `- Sugestões de gráficos:
  * [CHART:metodologia_fluxo] - Fluxograma da metodologia
  * [CHART:resultados_comparativo] - Comparativo dos resultados
  * [CHART:analise_dados] - Análise dos dados coletados
  * [CHART:tendencias_observadas] - Tendências observadas no estudo`
}

${params.attachedCharts?.length ? 
  `INFORMAÇÕES DETALHADAS DOS GRÁFICOS ANEXADOS:
${params.attachedCharts.map(chart => 
  `- [CHART:${chart.id}] - ${chart.name}
  * Tipo: ${chart.type === 'bar' ? 'Gráfico de barras' : chart.type === 'line' ? 'Gráfico de linha' : chart.type === 'pie' ? 'Gráfico de pizza' : 'Gráfico de dispersão'}
  * Descrição: ${chart.description}
  * Dados principais: ${JSON.stringify(chart.data).substring(0, 100)}...
  * Como referenciar: "Os dados apresentados em [CHART:${chart.id}] demonstram ${chart.description.toLowerCase()}"
  * Contexto de uso: ${chart.type === 'bar' ? 'Ideal para comparações entre categorias' : chart.type === 'line' ? 'Ideal para mostrar tendências temporais' : chart.type === 'pie' ? 'Ideal para mostrar distribuições proporcionais' : 'Ideal para mostrar correlações entre variáveis'}`
).join('\n')}

` : ''}ORIENTAÇÕES PARA GRÁFICOS (COM ESPAÇAMENTO):
- Integre os gráficos naturalmente nas seções apropriadas (Metodologia, Resultados, Discussão)
- SEMPRE adicione contexto ANTES: parágrafo explicando o que será mostrado
- SEMPRE adicione análise DEPOIS: parágrafo interpretando os dados
- Use espaçamento adequado: <div style="margin: 40px 0;">[CHART:id]</div>
- Contextualize cada gráfico explicando sua relevância baseada nas informações fornecidas
- Exemplo completo:
  
  <p>A análise dos dados coletados revela tendências importantes...</p>
  
  <div style="margin: 40px 0;">
  [CHART:${params.chartIds?.[1] || 'resultados_comparativo'}]
  </div>
  
  <p>Os resultados demonstram claramente que...</p>

- Use APENAS os IDs fornecidos acima
- NUNCA invente IDs próprios como chart_123456 ou similares
- Distribua os gráficos em seções diferentes com pelo menos 3 parágrafos entre eles
- SEMPRE mencione o que o gráfico mostra baseado na descrição fornecida
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
    `🔹 GRÁFICOS OBRIGATÓRIOS: Inclua ${params.chartIds?.length || 3} gráficos
    ${params.chartIds ? 
      `• Use SOMENTE estes IDs: ${params.chartIds.join(', ')}
    • ESPAÇAMENTO OBRIGATÓRIO: <div style="margin: 40px 0;">[CHART:id]</div>
    • PADRÃO: Parágrafo contexto + Gráfico + Parágrafo análise
    • Distribua nas seções: ${params.chartIds.map((id, i) => `[CHART:${id}] na ${i === 0 ? 'Metodologia' : i === 1 ? 'Resultados' : 'Discussão'}`).join(', ')}
    • DISTÂNCIA MÍNIMA: 3 parágrafos entre gráficos consecutivos
    ${params.attachedCharts?.length ? 
      `• CONTEÚDO DOS GRÁFICOS: Consulte as informações detalhadas fornecidas
    • SEMPRE descreva o que cada gráfico mostra baseado na descrição fornecida
    • Exemplo: "O [CHART:${params.attachedCharts[0]?.id}] apresenta ${params.attachedCharts[0]?.description.toLowerCase()}"` : ''}` :
      `• Sugestão de distribuição:
      - [CHART:metodologia_processo] na Metodologia
      - [CHART:resultados_principal] nos Resultados
      - [CHART:discussao_comparativa] na Discussão`
    }` : 
    `🔹 GRÁFICOS: Não solicitados - NÃO criar tags [CHART:]`
    }

    ${params.attachedFiles?.some(f => f.type === 'image') ? 
    `🔹 IMAGENS: Use ${params.attachedFiles.filter(f => f.type === 'image').map(f => `[Imagem: ${f.fileName}]`).join(', ')}
    ${params.attachedFiles.filter(f => f.type === 'image').length ? 
      `• CONTEÚDO DAS IMAGENS: Integre baseado nas descrições fornecidas
    • ESPAÇAMENTO OBRIGATÓRIO: <div style="margin: 30px 0;">[Imagem: nome]</div>
    • SEMPRE contextualize o que cada imagem mostra
    • PADRÃO: Parágrafo antes + Imagem + Parágrafo depois
    • DISTRIBUIÇÃO: Máximo 1 imagem por seção de 500+ palavras
    • Exemplo: "A [Imagem: ${params.attachedFiles.filter(f => f.type === 'image')[0]?.fileName}] ilustra ${params.attachedFiles.filter(f => f.type === 'image')[0]?.description || 'aspectos relevantes da pesquisa'}"` : ''}` :
    `🔹 IMAGENS: Não anexadas - NÃO criar tags [Imagem:]`
    }

    ESTRUTURA E ESPECIFICAÇÕES:

    1️⃣ TÍTULO PRINCIPAL
    • Use <h1> estilizado em azul (#2563eb)

    2️⃣ AUTORES E AFILIAÇÕES
    • Liste com instituições específicas

    3️⃣ ABSTRACT (100-150 palavras)
    • Use LITERALMENTE: "${params.abstract}"
    • Formato em caixa destacada

    4️⃣ KEYWORDS
    • Use LITERALMENTE: "${params.keywords}"

    5️⃣ INTRODUÇÃO (400-500 palavras)
    • Contextualize o problema com dados específicos
    • Cite estatísticas reais da área
    • Estabeleça objetivos claros e mensuráveis
    • Justifique a relevância com números

    6️⃣ REVISÃO DA LITERATURA (500-600 palavras)
    • Cite 5-8 estudos com autores e anos específicos
    • Compare metodologias e resultados quantitativos
    • Identifique lacunas específicas na literatura
    • Use transições fluidas entre os tópicos

    7️⃣ METODOLOGIA (400-500 palavras)
    • Descreva população, amostra e critérios específicos
    • Detalhe instrumentos e procedimentos passo a passo
    • Especifique análises estatísticas (testes, software, p-valor)
    • Inclua aspectos éticos e temporais

    8️⃣ RESULTADOS (500-600 palavras)
    • Apresente dados quantitativos específicos (percentuais, médias)
    • Organize em subtópicos claros
    • Relacione com objetivos estabelecidos
    • Use linguagem objetiva e precisa

    9️⃣ DISCUSSÃO (450-550 palavras)
    • Compare resultados com literatura citada
    • Explique implicações práticas e teóricas
    • Reconheça limitações específicas
    • Sugira melhorias metodológicas

    🔟 CONCLUSÃO (300-350 palavras)
    • Sintetize achados principais
    • Destaque contribuições inovadoras
    • Proponha pesquisas futuras específicas
    • Termine com impacto prático

    1️⃣1️⃣ REFERÊNCIAS
    • 6-10 referências em formato ABNT
    • Inclua DOIs realistas
    • Varie tipos: artigos, livros, relatórios

    ESTILO E FORMATAÇÃO HTML:
    • Títulos principais: color: #2563eb, font-weight: bold
    • Subtítulos: color: #1f2937, border-bottom com cor azul
    • Destaques: background amarelo (#fef3c7) para termos-chave
    • Parágrafos: line-height 1.6, margin adequado
    • Listas: background cinza claro (#f8fafc), padding
    • Texto: color #374151, justificado

    ESPAÇAMENTO PARA ELEMENTOS VISUAIS:
    • IMAGENS: Adicione margin: 30px 0 antes e depois
    • GRÁFICOS: Adicione margin: 40px 0 antes e depois  
    • CONTEXTO: Sempre inclua parágrafo explicativo ANTES da imagem/gráfico
    • ANÁLISE: Sempre inclua parágrafo de análise DEPOIS da imagem/gráfico
    • DISTRIBUIÇÃO: Máximo 1 elemento visual por seção longa (500+ palavras)
    • RESPIRAÇÃO: Deixe pelo menos 2-3 parágrafos entre elementos visuais consecutivos

    EXEMPLO DE ESPACIAMENTO CORRETO:
    <p>Texto introdutório explicando o contexto...</p>
    
    <div style="margin: 30px 0;">
    [Imagem: exemplo.jpg]
    </div>
    
    <p>Análise e interpretação do elemento visual...</p>
    
    <p>Continuação do texto com mais 2-3 parágrafos...</p>

    EXEMPLO DE ESPECIFICIDADE OBRIGATÓRIA:
    ❌ "Os resultados mostraram melhoria significativa"
    ✅ "Os resultados demonstraram melhoria de 34,7% (p<0,001) na variável X, com desvio padrão de ±2,3"

    ❌ "Diversos autores concordam"
    ✅ "Silva et al. (2023), Santos (2022) e Oliveira & Costa (2024) convergem quanto à eficácia de 78-85%"

    INICIE AGORA com <h1> - sem preâmbulos ou tags estruturais:`
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
- ESPAÇO VISUAL: Imagens ocupam ~200-500px de altura, gráficos ~300-400px
- ESPAÇAMENTO OBRIGATÓRIO: 
  * Imagens: <div style="margin: 30px 0;">[Imagem: nome]</div>
  * Gráficos: <div style="margin: 40px 0;">[CHART:id]</div>
- ESTRUTURA PADRÃO:
  * Parágrafo de contexto (explicando o que será mostrado)
  * Elemento visual com espaçamento
  * Parágrafo de análise (interpretando o que foi mostrado)
- DISTRIBUIÇÃO: Máximo 1 elemento visual por seção, com 2-3 parágrafos entre elementos
- Quando incluir elementos visuais, reduza proporcionalmente o texto para equilibrar
- Integre naturalmente sem forçar se não for apropriado para a seção
- Exemplo de estrutura correta:
  
  <p>A metodologia empregada segue etapas específicas...</p>
  
  <div style="margin: 30px 0;">
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
