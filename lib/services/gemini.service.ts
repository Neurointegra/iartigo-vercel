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
  }>
  includeCharts?: boolean
  chartIds?: string[] // IDs específicos dos gráficos a serem usados
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
  - Integre a imagem de forma natural no texto, explicando sua relevância
  - Exemplo: "O processo metodológico é ilustrado na [Imagem: ${file.fileName}], demonstrando..."
  - NÃO use imagens fictícias como "logo.png" ou "diagrama.jpg" - use APENAS "${file.fileName}"`
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

ORIENTAÇÕES PARA GRÁFICOS:
- Integre os gráficos naturalmente nas seções apropriadas (Metodologia, Resultados, Discussão)
- Contextualize cada gráfico explicando sua relevância
- Exemplo: "Os resultados obtidos são apresentados no [CHART:${params.chartIds?.[1] || 'resultados_comparativo'}], evidenciando..."
- Use APENAS os IDs fornecidos acima
- NUNCA invente IDs próprios como chart_123456 ou similares
- Distribua os gráficos em seções diferentes
`
      : ''

    return `Você é um redator científico profissional. Escreva um artigo acadêmico COMPLETO sem usar placeholders.

TÍTULO DO ARTIGO: ${params.title}
INFORMAÇÕES OBRIGATÓRIAS A USAR:
- Área: ${params.fieldOfStudy}
- Abstract EXATO: ${params.abstract}
- Keywords EXATAS: ${params.keywords}
- Metodologia: ${params.methodology}
- Autores: ${authorsText}

IMPORTANTE: Use EXATAMENTE o abstract e keywords fornecidos acima, não crie novos!

${attachedFilesText}
${chartsText}

INSTRUÇÕES ABSOLUTAS:
1. Escreva TUDO em português brasileiro
2. NÃO use NENHUM placeholder como [inserir algo], [descrever isso], [mencionar aquilo]
3. Crie conteúdo específico e detalhado para cada seção
4. Use dados realistas e específicos (invente se necessário)
5. Use HTML simples com estilos CSS inline (SEM DOCTYPE, html, head ou body)

REGRAS PARA TAGS MULTIMÍDIA:
- CHARTS: Use APENAS se includeCharts=true
- IMAGENS: Use APENAS se há arquivos anexados tipo 'image'
- Se não há imagens anexadas: JAMAIS crie tags [Imagem: ...]
- Se não solicitar charts: JAMAIS crie tags [CHART: ...]
- Para ilustrar sem tags: use descrições textuais detalhadas

ESTRUTURA OBRIGATÓRIA:
1. Título principal
2. Abstract (USE EXATAMENTE o abstract fornecido: "${params.abstract}")
3. Keywords (USE EXATAMENTE as keywords fornecidas: "${params.keywords}")
4. Introdução (300 palavras sobre contexto e objetivos específicos)
5. Revisão da Literatura (400 palavras com estudos relacionados)
6. Metodologia (350 palavras descrevendo processo específico)
7. Resultados (400 palavras com dados concretos)
8. Discussão (350 palavras interpretando resultados)
9. Conclusão (250 palavras com síntese e perspectivas)
10. Referências (5-8 referências em formato ABNT)

FORMATAÇÃO HTML E ESPAÇAMENTO:
- Use estilos CSS inline profissionais
- Cores: títulos em #2563eb, texto em #1f2937
- Destaque palavras importantes com background amarelo
- Crie seções bem estruturadas
- IMPORTANTE: Comece DIRETAMENTE com o conteúdo (título principal)
- Use espaçamentos moderados entre seções (margin: 20px 0)
- Evite múltiplas linhas vazias consecutivas
- NÃO use DOCTYPE, html, head, body - apenas conteúdo HTML puro

${params.includeCharts ? `
GRÁFICOS OBRIGATÓRIOS:
- Inclua exatamente ${params.chartIds?.length || 3} tags [CHART:id] usando APENAS os IDs fornecidos
${params.chartIds ? 
  `- USAR EXATAMENTE ESTES IDs:
${params.chartIds.map((id, index) => `  * [CHART:${id}] - ${index === 0 ? 'na seção Metodologia' : index === 1 ? 'na seção Resultados' : 'na seção Discussão'}`).join('\n')}` :
  `- [CHART:metodologia_processo] na seção Metodologia
- [CHART:resultados_dados] na seção Resultados  
- [CHART:analise_final] na seção Discussão`
}
- NÃO invente IDs próprios, use APENAS os fornecidos acima
` : ''}

REGRA CRÍTICA: Substitua qualquer impulso de usar [inserir algo] por texto real e específico. Exemplo:
- Em vez de "[inserir descrição]" → "Os dados demonstram um aumento de 23% na eficiência"
- Em vez de "[mencionar limitações]" → "As limitações incluem o tamanho da amostra de 150 participantes"

Tanto gráficos quanto imagens ocupam espaço no artigo, então use-os de forma equilibrada e relevante. Se não houver imagens anexadas, NÃO crie tags [Imagem: ...]. Se não houver gráficos solicitados, NÃO crie tags [CHART: ...].

ATENÇÃO ESPECIAL - ABSTRACT E KEYWORDS:
- No Abstract: Use LITERALMENTE o texto: "${params.abstract}"
- Nas Keywords: Use LITERALMENTE: "${params.keywords}"
- NÃO modifique, melhore ou reescreva estes textos
- Use exatamente como fornecido nas informações obrigatórias

Escreva o artigo completo agora. COMECE DIRETAMENTE com o título principal (h1), sem DOCTYPE, html ou body:
    `
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
- Quando incluir elementos visuais, reduza proporcionalmente o texto para equilibrar
- Integre naturalmente sem forçar se não for apropriado para a seção
- Exemplo: "A metodologia é ilustrada na [Imagem: processo.jpg], que demonstra..."
- Exemplo: "Os resultados são apresentados no [CHART:dados_principais], evidenciando..."

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
