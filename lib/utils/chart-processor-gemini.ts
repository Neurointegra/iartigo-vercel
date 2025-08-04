/**
 * Processador para converter tags [CHART:] em imagens geradas por IA usando Gemini
 */

import { GoogleGenAI, Modality } from '@google/genai'
import path from 'path'
import fs from 'fs/promises'

// Configurar o cliente do Gemini com o novo SDK
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || ''
})

export async function processChartTags(content: string, articleContext?: { title?: string, fieldOfStudy?: string }): Promise<string> {
  console.log('🎨 Processando tags de gráficos com Gemini AI...')
  
  // Buscar por tags [CHART:] e converter para [Imagem:]
  const chartTagRegex = /\[CHART:([^\]]+)\]/gi
  const matches = content.match(chartTagRegex)
  
  if (!matches) {
    console.log('ℹ️ Nenhuma tag [CHART:] encontrada')
    return content
  }
  
  console.log(`📊 Encontradas ${matches.length} tags [CHART:] para processar`)
  
  let processedContent = content
  
  for (const match of matches) {
    const chartId = match.replace(/\[CHART:([^\]]+)\]/, '$1').trim()
    console.log(`🔄 Processando gráfico com Gemini AI: ${chartId}`)
    
    try {
      // Gerar a imagem do gráfico usando IA
      const fileName = await generateChartImageWithGemini(chartId, articleContext)
      
      // Substituir a tag [CHART:] pela tag [Imagem:]
      const imageTag = `[Imagem: ${fileName}]`
      processedContent = processedContent.replace(match, imageTag)
      
      console.log(`✅ Gráfico ${chartId} convertido para imagem: ${fileName}`)
      
    } catch (error) {
      console.error(`❌ Erro ao processar gráfico ${chartId}:`, error)
      
      // Em caso de erro, criar um placeholder
      const fallbackTag = `[Imagem: chart_${chartId.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png]`
      processedContent = processedContent.replace(match, fallbackTag)
    }
  }
  
  return processedContent
}

async function generateChartImageWithGemini(chartId: string, context?: { title?: string, fieldOfStudy?: string }): Promise<string> {
  console.log(`🤖 Gerando imagem de gráfico com Gemini AI: ${chartId}`)
  
  // Determinar o tipo de gráfico baseado no ID
  const chartType = getChartTypeFromId(chartId)
  console.log(`📊 Tipo de gráfico detectado: ${chartType}`)
  
  // Verificar se a API key está configurada
  if (!process.env.GEMINI_API_KEY) {
    console.log('⚠️ API key do Gemini não configurada, usando placeholder...')
    const fileName = await createPlaceholderChart(chartId, chartType)
    return fileName
  }
  
  console.log('✅ API key encontrada, usando Gemini AI para gerar imagem...')
  
  // Criar prompt específico para gerar a imagem
  const prompt = createChartPrompt(chartId, chartType, context)
  console.log('📝 Prompt criado para IA')
  
  try {
    console.log('🤖 Usando Gemini 2.0 Flash com suporte a geração de imagens...')
    
    // Usar o modelo específico para geração de imagens
    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-preview-image-generation',
      contents: [prompt],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      }
    })
    
    console.log('📨 Resposta recebida da IA')
    
    // Verificar se foi gerada uma imagem
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.mimeType?.startsWith('image/') && part.inlineData?.data) {
          // Salvar a imagem gerada
          const fileName = `chart_${chartId.toLowerCase().replace(/[^a-z0-9]/g, '_')}_gemini_${Date.now()}.png`
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
          
          // Garantir que o diretório existe
          await fs.mkdir(uploadsDir, { recursive: true })
          
          const filePath = path.join(uploadsDir, fileName)
          const imageBuffer = Buffer.from(part.inlineData.data, 'base64')
          
          await fs.writeFile(filePath, imageBuffer)
          
          console.log(`✅ Imagem de gráfico gerada por Gemini AI salva: ${fileName}`)
          return fileName
        }
      }
    }
    
    // Se não conseguir gerar imagem, criar um placeholder
    console.log('⚠️ Gemini não retornou imagem, criando placeholder SVG...')
    const fileName = await createPlaceholderChart(chartId, chartType)
    return fileName
    
  } catch (error) {
    console.error('❌ Erro ao gerar imagem com Gemini AI:', error)
    console.log('🔄 Usando placeholder SVG como fallback...')
    
    // Fallback: criar uma imagem placeholder
    const fileName = await createPlaceholderChart(chartId, chartType)
    return fileName
  }
}

function createChartPrompt(chartId: string, chartType: string, context?: { title?: string, fieldOfStudy?: string }): string {
  const baseContext = context?.title || 'pesquisa acadêmica'
  const field = context?.fieldOfStudy || 'ciências'
  
  return `Generate a professional ${chartType} chart image for a scientific paper about "${baseContext}" in the field of ${field}.

CHART SPECIFICATIONS:
- Chart ID: ${chartId}
- Chart Type: ${chartType}
- Style: Academic, professional, clean design
- Dimensions: 800x600 pixels
- Background: White (#FFFFFF)
- Colors: Academic palette (Blue #2563EB, Green #059669, Orange #F59E0B, Gray #374151)
- Format: PNG image

REQUIRED ELEMENTS:
- Descriptive title related to "${chartId}"
- Well-defined axes with labels
- Clear data values
- Professional typography (minimum 12pt)
- Subtle grid for readability
- Legend when necessary

${getChartSpecificInstructions(chartType, chartId)}

DATA CONTEXT:
- Base the data on the theme: "${baseContext}"
- Field of study: ${field}
- Values should be realistic and coherent with academic research
- Use appropriate nomenclature for the field of study

QUALITY:
- Appearance identical to charts in published scientific papers
- Organized and professional layout
- Data that makes sense in the research context
- Ready for inclusion in academic publication

Please generate ONLY the chart image, no code or additional text.`
}

function getChartSpecificInstructions(chartType: string, chartId: string): string {
  switch (chartType.toLowerCase()) {
    case 'bar':
    case 'barra':
      return `
BAR CHART REQUIREMENTS:
- 4-6 categories on X-axis
- Values between 10-100 on Y-axis
- Uniform bar width
- Adequate spacing between bars
- Distinct colors for each bar
- Data labels on top of bars
`
    
    case 'line':
    case 'linha':
      return `
LINE CHART REQUIREMENTS:
- 5-8 data points
- Smooth line connecting points
- Markers on data points
- Clear trend (increasing, decreasing, or variable)
- Regular intervals on X-axis
- Trend line if applicable
`
    
    case 'pie':
    case 'pizza':
      return `
PIE CHART REQUIREMENTS:
- 3-5 slices
- Percentages totaling 100%
- Distinct colors for each slice
- Labels with percentages
- Side legend or direct labels
- Clear slice separation
`
    
    case 'scatter':
    case 'dispersao':
      return `
SCATTER PLOT REQUIREMENTS:
- 15-25 data points
- Distribution suggesting correlation
- Visible data points
- Possible trend line
- Well-defined X and Y axes
- Clear axis ranges
`
    
    default:
      return `
GENERIC CHART REQUIREMENTS:
- Data relevant to research theme
- Professional and clean layout
- Clear visual elements
- Well-organized information
`
  }
}

async function createPlaceholderChart(chartId: string, chartType: string): Promise<string> {
  console.log(`📝 Criando placeholder ${chartType} para gráfico: ${chartId}`)
  
  let svgContent = ''
  
  // Gerar SVG específico baseado no tipo de gráfico
  switch (chartType.toLowerCase()) {
    case 'bar':
    case 'barra':
      svgContent = createBarChartSVG(chartId)
      break
    case 'line':
    case 'linha':
      svgContent = createLineChartSVG(chartId)
      break
    case 'pie':
    case 'pizza':
      svgContent = createPieChartSVG(chartId)
      break
    case 'scatter':
    case 'dispersao':
      svgContent = createScatterChartSVG(chartId)
      break
    default:
      svgContent = createBarChartSVG(chartId)
  }
  
  const fileName = `chart_${chartId.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.svg`
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  
  // Garantir que o diretório existe
  await fs.mkdir(uploadsDir, { recursive: true })
  
  const filePath = path.join(uploadsDir, fileName)
  await fs.writeFile(filePath, svgContent)
  
  console.log(`✅ Placeholder SVG criado: ${fileName}`)
  return fileName
}

function createBarChartSVG(chartId: string): string {
  const data = [
    { label: 'Categoria A', value: 65, color: '#2563eb' },
    { label: 'Categoria B', value: 59, color: '#059669' },
    { label: 'Categoria C', value: 80, color: '#f59e0b' },
    { label: 'Categoria D', value: 81, color: '#ef4444' },
    { label: 'Categoria E', value: 56, color: '#8b5cf6' }
  ]
  
  const maxValue = Math.max(...data.map(d => d.value))
  const chartHeight = 300
  const chartWidth = 500
  const barWidth = 60
  const spacing = 20
  
  return `
<svg width="800" height="500" xmlns="http://www.w3.org/2000/svg">
  <!-- Fundo -->
  <rect width="800" height="500" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>
  
  <!-- Título -->
  <text x="400" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#1f2937">
    Gráfico de Barras - ${chartId}
  </text>
  
  <!-- Grid horizontal -->
  ${[0, 25, 50, 75, 100].map(val => `
    <line x1="100" y1="${450 - (val / 100) * chartHeight}" x2="700" y2="${450 - (val / 100) * chartHeight}" stroke="#f3f4f6" stroke-width="1"/>
    <text x="90" y="${455 - (val / 100) * chartHeight}" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">${val}</text>
  `).join('')}
  
  <!-- Barras -->
  ${data.map((item, index) => {
    const x = 120 + index * (barWidth + spacing)
    const height = (item.value / maxValue) * chartHeight
    const y = 450 - height
    
    return `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${height}" fill="${item.color}" opacity="0.8"/>
      <text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#374151">${item.value}</text>
      <text x="${x + barWidth/2}" y="470" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#6b7280">${item.label}</text>
    `
  }).join('')}
  
  <!-- Eixos -->
  <line x1="100" y1="450" x2="700" y2="450" stroke="#374151" stroke-width="2"/>
  <line x1="100" y1="450" x2="100" y2="120" stroke="#374151" stroke-width="2"/>
  
  <!-- Labels dos eixos -->
  <text x="400" y="495" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#374151">Categorias</text>
  <text x="50" y="285" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#374151" transform="rotate(-90 50 285)">Valores</text>
</svg>`
}

function createLineChartSVG(chartId: string): string {
  const data = [
    { x: 'Jan', y: 30 },
    { x: 'Fev', y: 45 },
    { x: 'Mar', y: 35 },
    { x: 'Abr', y: 60 },
    { x: 'Mai', y: 55 },
    { x: 'Jun', y: 70 },
    { x: 'Jul', y: 65 }
  ]
  
  const maxValue = Math.max(...data.map(d => d.y))
  const chartHeight = 300
  const chartWidth = 500
  const stepX = chartWidth / (data.length - 1)
  
  return `
<svg width="800" height="500" xmlns="http://www.w3.org/2000/svg">
  <!-- Fundo -->
  <rect width="800" height="500" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>
  
  <!-- Título -->
  <text x="400" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#1f2937">
    Gráfico de Linha - ${chartId}
  </text>
  
  <!-- Grid -->
  ${[0, 25, 50, 75, 100].map(val => `
    <line x1="100" y1="${450 - (val / 100) * chartHeight}" x2="600" y2="${450 - (val / 100) * chartHeight}" stroke="#f3f4f6" stroke-width="1"/>
    <text x="90" y="${455 - (val / 100) * chartHeight}" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">${val}</text>
  `).join('')}
  
  <!-- Linha -->
  <polyline fill="none" stroke="#2563eb" stroke-width="3" points="${data.map((point, index) => {
    const x = 100 + index * stepX
    const y = 450 - (point.y / maxValue) * chartHeight
    return `${x},${y}`
  }).join(' ')}"/>
  
  <!-- Pontos -->
  ${data.map((point, index) => {
    const x = 100 + index * stepX
    const y = 450 - (point.y / maxValue) * chartHeight
    return `
      <circle cx="${x}" cy="${y}" r="4" fill="#1d4ed8"/>
      <text x="${x}" y="${y - 10}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#374151">${point.y}</text>
      <text x="${x}" y="470" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#6b7280">${point.x}</text>
    `
  }).join('')}
  
  <!-- Eixos -->
  <line x1="100" y1="450" x2="600" y2="450" stroke="#374151" stroke-width="2"/>
  <line x1="100" y1="450" x2="100" y2="120" stroke="#374151" stroke-width="2"/>
  
  <!-- Labels dos eixos -->
  <text x="350" y="495" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#374151">Período</text>
  <text x="50" y="285" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#374151" transform="rotate(-90 50 285)">Valores</text>
</svg>`
}

function createPieChartSVG(chartId: string): string {
  const data = [
    { label: 'Categoria A', value: 35, color: '#2563eb' },
    { label: 'Categoria B', value: 25, color: '#059669' },
    { label: 'Categoria C', value: 20, color: '#f59e0b' },
    { label: 'Categoria D', value: 20, color: '#ef4444' }
  ]
  
  const centerX = 300
  const centerY = 250
  const radius = 120
  let currentAngle = 0
  
  return `
<svg width="800" height="500" xmlns="http://www.w3.org/2000/svg">
  <!-- Fundo -->
  <rect width="800" height="500" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>
  
  <!-- Título -->
  <text x="400" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#1f2937">
    Gráfico de Pizza - ${chartId}
  </text>
  
  <!-- Fatias -->
  ${data.map((slice, index) => {
    const angle = (slice.value / 100) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle += angle
    
    const startAngleRad = (startAngle * Math.PI) / 180
    const endAngleRad = (endAngle * Math.PI) / 180
    
    const x1 = centerX + radius * Math.cos(startAngleRad)
    const y1 = centerY + radius * Math.sin(startAngleRad)
    const x2 = centerX + radius * Math.cos(endAngleRad)
    const y2 = centerY + radius * Math.sin(endAngleRad)
    
    const largeArcFlag = angle > 180 ? 1 : 0
    
    // Posição do texto
    const midAngle = (startAngle + endAngle) / 2
    const midAngleRad = (midAngle * Math.PI) / 180
    const textX = centerX + (radius * 0.7) * Math.cos(midAngleRad)
    const textY = centerY + (radius * 0.7) * Math.sin(midAngleRad)
    
    return `
      <path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z" 
            fill="${slice.color}" stroke="#ffffff" stroke-width="2" opacity="0.8"/>
      <text x="${textX}" y="${textY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#ffffff" font-weight="bold">
        ${slice.value}%
      </text>
    `
  }).join('')}
  
  <!-- Legenda -->
  ${data.map((item, index) => `
    <rect x="550" y="${80 + index * 30}" width="15" height="15" fill="${item.color}"/>
    <text x="575" y="${92 + index * 30}" font-family="Arial, sans-serif" font-size="12" fill="#374151">${item.label} (${item.value}%)</text>
  `).join('')}
</svg>`
}

function createScatterChartSVG(chartId: string): string {
  const data = Array.from({ length: 20 }, () => ({
    x: Math.random() * 80 + 10,
    y: Math.random() * 80 + 10
  }))
  
  return `
<svg width="800" height="500" xmlns="http://www.w3.org/2000/svg">
  <!-- Fundo -->
  <rect width="800" height="500" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>
  
  <!-- Título -->
  <text x="400" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#1f2937">
    Gráfico de Dispersão - ${chartId}
  </text>
  
  <!-- Grid -->
  ${[0, 25, 50, 75, 100].map(val => `
    <line x1="100" y1="${450 - (val / 100) * 300}" x2="600" y2="${450 - (val / 100) * 300}" stroke="#f3f4f6" stroke-width="1"/>
    <line x1="${100 + (val / 100) * 500}" y1="450" x2="${100 + (val / 100) * 500}" y2="150" stroke="#f3f4f6" stroke-width="1"/>
    <text x="90" y="${455 - (val / 100) * 300}" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">${val}</text>
    <text x="${100 + (val / 100) * 500}" y="470" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">${val}</text>
  `).join('')}
  
  <!-- Pontos -->
  ${data.map(point => {
    const x = 100 + (point.x / 100) * 500
    const y = 450 - (point.y / 100) * 300
    return `<circle cx="${x}" cy="${y}" r="4" fill="#2563eb" opacity="0.7"/>`
  }).join('')}
  
  <!-- Eixos -->
  <line x1="100" y1="450" x2="600" y2="450" stroke="#374151" stroke-width="2"/>
  <line x1="100" y1="450" x2="100" y2="150" stroke="#374151" stroke-width="2"/>
  
  <!-- Labels dos eixos -->
  <text x="350" y="495" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#374151">Variável X</text>
  <text x="50" y="300" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#374151" transform="rotate(-90 50 300)">Variável Y</text>
</svg>`
}

function getChartTypeFromId(chartId: string): string {
  const id = chartId.toLowerCase()
  
  if (id.includes('bar') || id.includes('barra') || id.includes('coluna')) {
    return 'bar'
  } else if (id.includes('line') || id.includes('linha') || id.includes('temporal')) {
    return 'line'
  } else if (id.includes('pie') || id.includes('pizza') || id.includes('torta')) {
    return 'pie'
  } else if (id.includes('scatter') || id.includes('dispersao') || id.includes('pontos')) {
    return 'scatter'
  } else if (id.includes('metodologia') || id.includes('fluxo') || id.includes('processo')) {
    return 'line'
  } else if (id.includes('resultado') || id.includes('comparativo') || id.includes('analise')) {
    return 'bar'
  } else if (id.includes('distribuicao') || id.includes('proporcao')) {
    return 'pie'
  }
  
  // Padrão
  return 'bar'
}
