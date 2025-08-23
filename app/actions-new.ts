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

  userId?: string
}

export async function generateArticle(data: ArticleData): Promise<string> {
  try {
    // Converter dados para o formato esperado pela API Python
    const apiData = {
      title: data.title,
      objective: data.researchObjectives,
      resume: data.abstract,
      keywords: data.keywords,
      article_type: 'research', // Padrão para artigos de pesquisa
      methodology: data.methodology,
      conclusion: data.hypothesis || 'Conclusão baseada nos objetivos de pesquisa',
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/article-generations/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.NEXT_PUBLIC_API_TOKEN || '',
      },
      body: JSON.stringify(apiData),
    })

    if (!response.ok) {
      throw new Error('Falha na geração do artigo')
    }

    const result = await response.json()
    return result.content || 'Artigo gerado com sucesso'
  } catch (error) {
    console.error('Erro ao gerar artigo:', error)
    throw new Error('Falha na geração do artigo')
  }
}


