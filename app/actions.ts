"use server"

interface Author {
  id: string
  name: string
  institution: string
  email: string
  department: string
  city: string
  country: string
}

interface LiteratureSuggestion {
  title: string
  authors: string
  journal: string
  year: number
  doi: string
  abstract: string
  relevance: string
  citation: string
}

interface ArticleData {
  title: string
  abstract: string
  keywords: string
  citationStyle: string
  targetJournal: string
  fieldOfStudy: string
  methodology: string
  includeCharts: boolean
  includeTables: boolean
  researchObjectives: string
  hypothesis: string
  sampleSize: string
  dataCollection: string
  statisticalAnalysis: string
  authors: Author[]
  literatureSuggestions: LiteratureSuggestion[]
  chartIds?: string[]
  userId?: string
}

export async function generateArticle(data: ArticleData): Promise<string> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/generate-article`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Falha na geração do artigo')
    }

    const result = await response.json()
    return result.content
  } catch (error) {
    console.error('Erro ao gerar artigo:', error)
    throw new Error('Falha na geração do artigo')
  }
}

export async function suggestLiterature(params: {
  fieldOfStudy: string
  keywords: string
  title?: string
  abstract?: string
}): Promise<LiteratureSuggestion[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/suggest-literature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: params.title || params.fieldOfStudy,
        keywords: params.keywords,
        fieldOfStudy: params.fieldOfStudy
      }),
    })

    if (!response.ok) {
      throw new Error('Falha na sugestão de literatura')
    }

    const result = await response.json()
    return result.suggestions || []
  } catch (error) {
    console.error('Erro ao sugerir literatura:', error)
    return []
  }
}
