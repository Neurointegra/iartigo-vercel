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
  const [chartImages, setChartImages] = useState<Record<string, string>>({})

  useEffect(() => {
    const processChartsToImages = async () => {
      if (attachedCharts.length > 0) {
        try {
          console.log('🎨 Convertendo gráficos em imagens...')
          const response = await fetch('/api/process-charts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ charts: attachedCharts })
          })
          
          if (response.ok) {
            const result = await response.json()
            setChartImages(result.chartImages)
            console.log('✅ Gráficos convertidos para imagens:', result.chartImages)
          } else {
            console.error('❌ Erro na conversão de gráficos')
          }
        } catch (error) {
          console.error('❌ Erro ao converter gráficos:', error)
        }
      }
    }

    processChartsToImages()
  }, [attachedCharts])

  useEffect(() => {
    const processContent = async () => {
      setIsLoading(true)
      try {
        console.log('🔄 Iniciando processamento de conteúdo...')
        
        // Primeiro, processar tags de imagens automaticamente da pasta uploads
        let htmlContent = await processImageTagsClient(content)
        console.log('📸 Tags de imagem processadas')
        
        // Depois processar imagens em anexo (se houver)
        if (attachedImages.length > 0) {
          console.log(`🖼️ Processando ${attachedImages.length} imagens anexadas`)
          attachedImages.forEach((image) => {
            const imageTagPattern = new RegExp(`\\[Imagem: ${image.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g');
            const imageHtml = `
<div class="image-container" style="margin: 30px 0; text-align: center;">
  <img 
    src="${image.url}" 
    alt="${image.name}" 
    style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: block; margin: 0 auto;" 
    onLoad={() => console.log('✅ Imagem anexada carregada:', '${image.url}')}
    onError={() => console.error('❌ Erro ao carregar imagem anexada:', '${image.url}')}
  />
  <p style="margin: 10px 0 0 0; font-style: italic; color: #666; font-size: 14px;">
    ${image.description || image.name}
  </p>
</div>`;
            htmlContent = htmlContent.replace(imageTagPattern, imageHtml);
            console.log(`✅ Imagem anexada processada: ${image.name}`)
          });
        }

        // Processar tags de gráficos convertidos em imagens
        console.log('📊 Processando tags de gráficos como imagens...')
        attachedCharts.forEach((chart) => {
          const chartImageName = chartImages[chart.id]
          if (chartImageName) {
            // Substituir tags [CHART:id] por tags [Imagem: chart_id.svg]
            const chartTagPattern = new RegExp(`\\[CHART:${chart.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g')
            const imageTagReplacement = `[Imagem: ${chartImageName}]`
            htmlContent = htmlContent.replace(chartTagPattern, imageTagReplacement)
            console.log(`🔄 Convertido [CHART:${chart.id}] para [Imagem: ${chartImageName}]`)
          }
        })

        // Processar novamente as imagens para incluir os gráficos convertidos
        htmlContent = await processImageTagsClient(htmlContent)
        console.log('📸 Tags de gráfico-imagem processadas')

        // Dividir conteúdo para renderização
        const parts = htmlContent.split(/(\[CHART:[^\]]+\])/)
        
        const renderedParts = parts.map((part, index) => {
          // Verificar se ainda há referências de gráfico não processadas
          const chartMatch = part.match(/\[CHART:([^\]]+)\]/)
          if (chartMatch) {
            const chartId = chartMatch[1]
            const chart = attachedCharts.find(c => c.id === chartId)
            if (chart) {
              console.log(`⚠️ Gráfico não convertido encontrado: ${chartId} - Será exibido como placeholder`)
              return (
                <div key={index} className="my-6 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50">
                  <div className="text-gray-600">
                    <div className="text-lg font-semibold mb-2">📊 {chart.name}</div>
                    <div className="text-sm">{chart.description}</div>
                    <div className="text-xs mt-2 text-gray-400">
                      Gráfico {chart.type} será convertido em imagem
                    </div>
                  </div>
                </div>
              )
            } else {
              console.warn(`⚠️ Gráfico não encontrado: ${chartId}`)
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

        console.log('✅ Processamento de conteúdo concluído')
        setProcessedContent(renderedParts)
      } catch (error) {
        console.error('❌ Erro ao processar conteúdo:', error)
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
