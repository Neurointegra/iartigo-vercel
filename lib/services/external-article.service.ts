const ARTICLE_API_URL = process.env.ARTICLE_API_URL || 'http://72.60.50.133:7111/api/article'
const ARTICLE_API_TOKEN = process.env.ARTICLE_API_TOKEN || 'cs3HVimPABUXjFHAIgM8rZqqT4E57px4SdA8YkCwXz0KDUckPlWj90mlchOJHsLm'

interface ArticleCreationData {
  author: string
  institution: string
  authorSSN: string
  title: string
  resume?: string
  keywords?: string
  introduction?: string
  articleType?: string
  justification?: string
  objective: string
  literatureReview?: string
  methodology?: string
  discussion?: string
  conclusion?: string
  files?: File[]
}

interface ArticleCreationResponse {
  success: boolean
  data: {
    requestId: number
    status: string
  }
}

interface ArticleStatusResponse {
  success: boolean
  data: {
    status: string
  }
}

export class ExternalArticleService {
  // Criar artigo na API externa
  static async createArticle(data: ArticleCreationData): Promise<ArticleCreationResponse> {
    const formData = new FormData()
    
    // Adicionar campos obrigatórios
    formData.append('author', data.author)
    formData.append('institution', data.institution)
    formData.append('authorSSN', data.authorSSN)
    formData.append('title', data.title)
    formData.append('objective', data.objective)
    
    // Adicionar campos opcionais
    if (data.resume) formData.append('resume', data.resume)
    if (data.keywords) formData.append('keywords', data.keywords)
    if (data.introduction) formData.append('introduction', data.introduction)
    if (data.articleType) formData.append('articleType', data.articleType)
    if (data.justification) formData.append('justification', data.justification)
    if (data.literatureReview) formData.append('literatureReview', data.literatureReview)
    if (data.methodology) formData.append('methodology', data.methodology)
    if (data.discussion) formData.append('discussion', data.discussion)
    if (data.conclusion) formData.append('conclusion', data.conclusion)
    
    // Adicionar arquivos se houver
    if (data.files && data.files.length > 0) {
      data.files.forEach((file) => {
        formData.append('files', file)
      })
    }

    const response = await fetch(ARTICLE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ARTICLE_API_TOKEN}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }

    return await response.json()
  }

  // Verificar status do artigo
  static async getArticleStatus(requestId: number): Promise<ArticleStatusResponse | Blob> {
    const response = await fetch(`${ARTICLE_API_URL}/${requestId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ARTICLE_API_TOKEN}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }

    // Verificar se a resposta é um arquivo (artigo pronto)
    const contentType = response.headers.get('content-type')
    if (contentType && !contentType.includes('application/json')) {
      // É um arquivo para download
      return await response.blob()
    }

    // É uma resposta JSON com status
    return await response.json()
  }

  // Verificar se a resposta é um arquivo
  static isFileResponse(response: ArticleStatusResponse | Blob): response is Blob {
    return response instanceof Blob
  }

  // Verificar se a resposta é JSON de status
  static isStatusResponse(response: ArticleStatusResponse | Blob): response is ArticleStatusResponse {
    return !this.isFileResponse(response)
  }

  // Converter Blob para URL de download
  static createDownloadUrl(blob: Blob, filename: string = 'artigo.pdf'): string {
    const url = URL.createObjectURL(blob)
    return url
  }

  // Fazer download do arquivo
  static downloadFile(blob: Blob, filename: string = 'artigo.pdf') {
    const url = this.createDownloadUrl(blob, filename)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}
