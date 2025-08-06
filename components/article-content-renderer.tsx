import { useEffect, useState } from 'react'
import { processImageTagsClient } from '@/lib/utils/image-processor-client'
import React from 'react'

interface AttachedImage {
  id: string
  name: string
  url: string
  description: string
  referenceId: string
}

interface AttachedChart {
  id: string
  name: string
  type: 'bar' | 'line' | 'pie' | 'scatter'
  data: any
  description: string
  referenceId: string
}

interface ArticleContentRendererProps {
  content: string
  attachedImages: AttachedImage[]
  attachedCharts: AttachedChart[]
  formatText: (text: string) => string
}

export default function ArticleContentRenderer({ 
  content, 
  attachedImages, 
  attachedCharts, 
  formatText 
}: ArticleContentRendererProps) {
  const [processedContent, setProcessedContent] = useState<React.ReactElement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const processContent = async () => {
      try {
        // Processar imagens automáticas primeiro
        let htmlContent = await processImageTagsClient(content)
        
        // Processar imagens anexadas com melhor layout
        attachedImages.forEach((image) => {
          const imageTagPattern = new RegExp(`\\[Imagem: ${image.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g')
          const imageHtml = `
            <div style="margin: 40px 0; text-align: center; padding: 20px 0;">
              <div style="display: inline-block; max-width: 100%; background: white; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); padding: 20px; margin: 0 auto;">
                <img src="${image.url}" alt="${image.name}" style="max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 0 auto;" />
                <p style="margin: 15px 0 5px 0; font-style: italic; color: #6b7280; font-size: 14px; text-align: center; line-height: 1.4;">
                  ${image.description || image.name}
                </p>
              </div>
            </div>`
          htmlContent = htmlContent.replace(imageTagPattern, imageHtml)
        })

        // Processar gráficos anexados com a API simples e robusta
        for (const chart of attachedCharts) {
          const chartRef = chart.referenceId.replace('[CHART:', '').replace(']', '')
          const chartTag = `[CHART:${chartRef}]`
          
          try {
            const response = await fetch('/api/process-charts-simple', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ charts: [chart] })
            })
            
            if (response.ok) {
              const result = await response.json()
              if (result.chartImages && result.chartImages[chart.id]) {
                htmlContent = htmlContent.replace(chartTag, result.chartImages[chart.id])
              } else {
                throw new Error('Nenhum HTML de gráfico retornado')
              }
            } else {
              throw new Error(`API retornou status ${response.status}`)
            }
          } catch (error) {
            console.error('Erro ao processar gráfico anexado:', error)
            htmlContent = htmlContent.replace(chartTag, `
              <div style="margin: 50px 0; padding: 20px 0;">
                <div style="max-width: 800px; margin: 0 auto; background: #F3F4F6; border: 2px dashed #9CA3AF; border-radius: 12px; padding: 40px; text-align: center;">
                  <h3 style="color: #374151; font-size: 18px; margin: 0 0 15px 0;">📊 Gráfico Indisponível</h3>
                  <p style="color: #6B7280; font-size: 16px; margin: 0 0 10px 0; font-weight: 500;">${chart.name}</p>
                  <p style="color: #9CA3AF; font-size: 14px; margin: 0; line-height: 1.4;">${chart.description}</p>
                </div>
              </div>`)
          }
        }

        // Processar tags de gráficos no conteúdo que não estão em attachedCharts
        const chartTags = [...htmlContent.matchAll(/\[CHART:([^\]]+)\]/g)]
        console.log('Tags de gráfico encontradas no conteúdo:', chartTags.map(match => match[0]))
        
        for (const match of chartTags) {
          const fullTag = match[0] // [CHART:distribution_xyz789]
          const chartId = match[1]  // distribution_xyz789
          
          // Verificar se já foi processado pelos gráficos anexados
          const alreadyProcessed = attachedCharts.some(chart => 
            chart.referenceId.replace('[CHART:', '').replace(']', '') === chartId
          )
          
          if (!alreadyProcessed) {
            console.log(`❌ Tag de gráfico não processada encontrada: ${fullTag}`)
            
            // Ao invés de criar gráfico com dados inválidos, mostrar mensagem explicativa
            const fallbackMessage = `
              <div style="margin: 50px 0; padding: 20px 0;">
                <div style="max-width: 800px; margin: 0 auto; background: #FEF3C7; border: 2px dashed #F59E0B; border-radius: 12px; padding: 40px; text-align: center;">
                  <h3 style="color: #92400E; font-size: 18px; margin: 0 0 15px 0;">📊 Gráfico Não Disponível</h3>
                  <p style="color: #B45309; font-size: 16px; margin: 0 0 10px 0; font-weight: 500;">Dados insuficientes para gerar visualização</p>
                  <p style="color: #D97706; font-size: 14px; margin: 0; line-height: 1.4;">
                    Para gerar gráficos, anexe arquivos de dados (CSV, Excel, JSON) ao artigo
                  </p>
                  <p style="color: #A16207; font-size: 12px; margin: 10px 0 0 0;">Referência: ${chartId}</p>
                </div>
              </div>`
            
            htmlContent = htmlContent.replace(fullTag, fallbackMessage)
            console.log(`⚠️ Tag ${fullTag} substituída por mensagem explicativa`)
          }
        }

        // Aplicar formatação de texto
        const formattedContent = formatText(htmlContent)
        
        // Debug: verificar o HTML final
        console.log('🔍 HTML final processado (últimos 500 caracteres):', formattedContent.slice(-500))
        
        // Converter para elementos React
        const elements = [<div key="content" dangerouslySetInnerHTML={{ __html: formattedContent }} />]
        setProcessedContent(elements)
        
      } catch (error) {
        console.error('Erro ao processar conteúdo:', error)
        setProcessedContent([<div key="error">Erro ao carregar conteúdo</div>])
      } finally {
        setIsLoading(false)
      }
    }

    processContent()
  }, [content, attachedImages, attachedCharts, formatText])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="article-content" style={{ lineHeight: '1.8', fontSize: '16px' }}>
      <style>{`
        .article-content p {
          margin: 20px 0 !important;
          text-align: justify;
          line-height: 1.8;
        }
        .article-content h1, .article-content h2, .article-content h3 {
          margin: 40px 0 24px 0 !important;
          line-height: 1.3;
        }
        .article-content ul, .article-content ol {
          margin: 24px 0 !important;
          padding-left: 30px;
        }
        .article-content li {
          margin: 10px 0 !important;
          line-height: 1.6;
        }
        .article-content blockquote {
          margin: 30px 0 !important;
          padding: 20px 25px;
          background: #f8fafc;
          border-left: 4px solid #3b82f6;
          border-radius: 0 8px 8px 0;
        }
        .article-content strong {
          font-weight: 600 !important;
        }
        .article-content em {
          font-style: italic !important;
        }
      `}</style>
      {processedContent}
    </div>
  )
}