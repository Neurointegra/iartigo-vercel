/**
 * Processador para converter tags [CHART:] em tags [Imagem:] e gerar SVGs
 */

import { ChartToImageService } from './chart-to-image'

export async function processChartTags(content: string): Promise<string> {
  console.log('🔄 Processando tags de gráficos...')
  
  // Encontrar todas as tags [CHART:id]
  const chartTagRegex = /\[CHART:([^\]]+)\]/g
  const chartMatches = Array.from(content.matchAll(chartTagRegex))
  
  if (chartMatches.length === 0) {
    console.log('📊 Nenhuma tag [CHART:] encontrada')
    return content
  }
  
  console.log(`📊 Encontradas ${chartMatches.length} tags de gráfico`)
  
  let processedContent = content
  
  for (const match of chartMatches) {
    const fullTag = match[0] // [CHART:id]
    const chartId = match[1] // id
    
    try {
      console.log(`🎨 Gerando SVG para: ${chartId}`)
      
      // Gerar dados de exemplo baseados no ID
      const chartType = getChartTypeFromId(chartId)
      const sampleData = generateSampleData(chartType)
      
      const chartData = {
        id: chartId,
        name: `Gráfico ${chartId}`,
        type: chartType,
        data: sampleData,
        description: `Visualização de dados para ${chartId}`,
        context: 'Artigo científico'
      }
      
      // Gerar arquivo SVG
      const fileName = await ChartToImageService.generateChartAsImage(chartData)
      
      // Substituir tag [CHART:id] por [Imagem: filename]
      const imageTag = `[Imagem: ${fileName}]`
      processedContent = processedContent.replace(fullTag, imageTag)
      
      console.log(`✅ Convertido ${fullTag} → ${imageTag}`)
      
    } catch (error) {
      console.error(`❌ Erro ao processar ${fullTag}:`, error)
      // Manter a tag original se houver erro
    }
  }
  
  return processedContent
}

function getChartTypeFromId(id: string): 'bar' | 'line' | 'pie' | 'scatter' {
  const lowerId = id.toLowerCase()
  
  if (lowerId.includes('bar') || lowerId.includes('barra') || lowerId.includes('comparativ')) {
    return 'bar'
  } else if (lowerId.includes('line') || lowerId.includes('linha') || lowerId.includes('temporal') || lowerId.includes('tendencia')) {
    return 'line'
  } else if (lowerId.includes('pie') || lowerId.includes('pizza') || lowerId.includes('distribuicao') || lowerId.includes('percentual')) {
    return 'pie'
  } else if (lowerId.includes('scatter') || lowerId.includes('dispersao') || lowerId.includes('correlacao')) {
    return 'scatter'
  }
  
  // Default para gráfico de barras
  return 'bar'
}

function generateSampleData(chartType: 'bar' | 'line' | 'pie' | 'scatter') {
  switch (chartType) {
    case 'bar':
      return {
        labels: ['Categoria A', 'Categoria B', 'Categoria C', 'Categoria D'],
        datasets: [{
          data: [Math.floor(Math.random() * 100), Math.floor(Math.random() * 100), Math.floor(Math.random() * 100), Math.floor(Math.random() * 100)]
        }]
      }
    
    case 'line':
      return {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai'],
        datasets: [{
          data: [Math.floor(Math.random() * 100), Math.floor(Math.random() * 100), Math.floor(Math.random() * 100), Math.floor(Math.random() * 100), Math.floor(Math.random() * 100)]
        }]
      }
    
    case 'pie':
      return {
        labels: ['Opção 1', 'Opção 2', 'Opção 3'],
        datasets: [{
          data: [Math.floor(Math.random() * 50) + 20, Math.floor(Math.random() * 30) + 15, Math.floor(Math.random() * 40) + 10]
        }]
      }
    
    case 'scatter':
      return {
        datasets: [{
          data: Array.from({ length: 8 }, () => ({
            x: Math.floor(Math.random() * 100),
            y: Math.floor(Math.random() * 100)
          }))
        }]
      }
    
    default:
      return {
        labels: ['A', 'B', 'C'],
        datasets: [{ data: [30, 40, 50] }]
      }
  }
}
