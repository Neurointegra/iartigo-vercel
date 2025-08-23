"use server"

import { buildApiUrl, getAuthHeaders } from "@/app/config"

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
  chartIds?: string[]
  userId?: string
}

interface ArticleGenerationRequest {
  title: string
  objective: string
  resume: string
  keywords: string
  article_type: string
  methodology: string
  conclusion: string
}

interface ArticleGenerationResponse {
  id: number
  request_id: number
  user: number
  status: string
  title: string
  objective: string
  resume: string
  keywords: string
  article_type: string
  methodology: string
  conclusion: string
  api_status: string
  created_at: string
}

export async function generateArticle(data: ArticleData, authToken: string): Promise<ArticleGenerationResponse> {
  try {
    // Converter dados para o formato esperado pela nova API Python
    const apiData: ArticleGenerationRequest = {
      title: data.title,
      objective: data.researchObjectives,
      resume: data.abstract,
      keywords: data.keywords,
      article_type: 'research', // Padrão para artigos de pesquisa
      methodology: data.methodology,
      conclusion: data.hypothesis || 'Conclusão baseada nos objetivos de pesquisa',
    }

    const response = await fetch(buildApiUrl('/article-generations/'), {
      method: 'POST',
      headers: getAuthHeaders(authToken),
      body: JSON.stringify(apiData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Falha na geração do artigo')
    }

    const result: ArticleGenerationResponse = await response.json()
    return result
  } catch (error) {
    console.error('Erro ao gerar artigo:', error)
    throw new Error('Falha na geração do artigo')
  }
}

export async function checkArticleStatus(generationId: number, authToken: string): Promise<any> {
  try {
    const response = await fetch(buildApiUrl(`/article-generations/${generationId}/check_status/`), {
      method: 'POST',
      headers: getAuthHeaders(authToken),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Falha ao verificar status')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao verificar status:', error)
    throw new Error('Falha ao verificar status do artigo')
  }
}

export async function downloadArticle(generationId: number, authToken: string): Promise<Blob> {
  try {
    const response = await fetch(buildApiUrl(`/article-generations/${generationId}/download/`), {
      method: 'GET',
      headers: getAuthHeaders(authToken),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Falha no download')
    }

    return await response.blob()
  } catch (error) {
    console.error('Erro ao fazer download:', error)
    throw new Error('Falha no download do artigo')
  }
}

export async function getMyGenerations(authToken: string): Promise<any[]> {
  try {
    const response = await fetch(buildApiUrl('/article-generations/my_generations/'), {
      method: 'GET',
      headers: getAuthHeaders(authToken),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Falha ao buscar gerações')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao buscar gerações:', error)
    throw new Error('Falha ao buscar gerações')
  }
}

export async function cancelGeneration(generationId: number, reason: string, authToken: string): Promise<any> {
  try {
    const response = await fetch(buildApiUrl(`/article-generations/${generationId}/cancel/`), {
      method: 'POST',
      headers: getAuthHeaders(authToken),
      body: JSON.stringify({ reason }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Falha ao cancelar geração')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao cancelar geração:', error)
    throw new Error('Falha ao cancelar geração')
  }
}


