import { useEffect, useState } from 'react'
import { processImageTagsClient } from '@/lib/utils/image-processor-client'
import { Bar, Line, Pie } from 'react-chartjs-2'
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
      setIsLoading(true)
      try {
        // Primeiro, processar tags de imagens automaticamente da pasta uploads
        let htmlContent = await processImageTagsClient(content)
        
        // Depois processar imagens em anexo (se houver)
        attachedImages.forEach((image) => {
          const imageTagPattern = new RegExp(`\\[Imagem: ${image.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g');
          const imageHtml = `
<div class="image-container" style="margin: 20px 0; text-align: center;">
  <img src="${image.url}" alt="${image.name}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
  <p style="margin: 10px 0 0 0; font-style: italic; color: #666; font-size: 14px;">${image.description || image.name}</p>
</div>`;
          htmlContent = htmlContent.replace(imageTagPattern, imageHtml);
        });

        // Depois processar gráficos
        const parts = htmlContent.split(/(\[CHART:[^\]]+\])/)
        
        const renderedParts = parts.map((part, index) => {
          // Verificar se é uma referência de gráfico
          const chartMatch = part.match(/\[CHART:([^\]]+)\]/)
          if (chartMatch) {
            const chartId = chartMatch[1]
            const chart = attachedCharts.find(c => c.id === chartId)
            if (chart) {
              const ChartComponent = chart.type === 'bar' ? Bar : chart.type === 'line' ? Line : Pie
              return (
                <div key={index} className="my-6">
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold mb-2">{chart.name}</h4>
                    <div className="h-64 mb-2">
                      <ChartComponent data={chart.data} options={{
                        ...chart.data.options,
                        responsive: true,
                        maintainAspectRatio: false
                      }} />
                    </div>
                    <p className="text-sm text-gray-600">
                      {chart.description}
                    </p>
                  </div>
                </div>
              )
            }
          }

          // Retornar texto normal (incluindo HTML de imagens inline)
          return (
            <div 
              key={index} 
              style={{ whiteSpace: 'pre-wrap' }}
              dangerouslySetInnerHTML={{ __html: formatText(part) }}
            />
          )
        })

        setProcessedContent(renderedParts)
      } catch (error) {
        console.error('Erro ao processar conteúdo:', error)
        // Fallback: renderizar conteúdo original
        setProcessedContent([
          <div 
            key="fallback" 
            style={{ whiteSpace: 'pre-wrap' }}
            dangerouslySetInnerHTML={{ __html: formatText(content) }}
          />
        ])
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
          <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="text-sm text-gray-500 text-center">
          Processando imagens e conteúdo...
        </div>
      </div>
    )
  }

  return <>{processedContent}</>
}
