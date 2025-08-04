// Gerador de SVG para gráficos simples quando a IA não consegue gerar imagens

interface ChartData {
  categories: string[]
  values: number[]
}

export function generateChartSVG(
  type: 'bar' | 'line' | 'pie' | 'scatter',
  data: ChartData,
  title: string,
  width: number = 800,
  height: number = 600
): string {
  switch (type) {
    case 'bar':
      return generateBarChart(data, title, width, height)
    case 'line':
      return generateLineChart(data, title, width, height)
    case 'pie':
      return generatePieChart(data, title, width, height)
    case 'scatter':
      return generateScatterChart(data, title, width, height)
    default:
      return generateBarChart(data, title, width, height)
  }
}

function generateBarChart(data: ChartData, title: string, width: number, height: number): string {
  const margin = { top: 60, right: 50, bottom: 80, left: 80 }
  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom
  
  const maxValue = Math.max(...data.values)
  const barWidth = chartWidth / data.categories.length * 0.7
  const barSpacing = chartWidth / data.categories.length
  
  const colors = ['#2563EB', '#059669', '#F59E0B', '#DC2626', '#7C3AED']
  
  const bars = data.categories.map((category, index) => {
    const barHeight = (data.values[index] / maxValue) * chartHeight
    const x = margin.left + index * barSpacing + (barSpacing - barWidth) / 2
    const y = margin.top + chartHeight - barHeight
    const color = colors[index % colors.length]
    
    return `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="4"/>
      <text x="${x + barWidth/2}" y="${margin.top + chartHeight + 20}" text-anchor="middle" fill="#374151" font-size="12">${category}</text>
      <text x="${x + barWidth/2}" y="${y - 8}" text-anchor="middle" fill="#374151" font-size="11" font-weight="bold">${data.values[index]}</text>
    `
  }).join('')
  
  // Eixo Y com valores
  const yAxisTicks = Array.from({length: 6}, (_, i) => {
    const value = Math.round((maxValue / 5) * i)
    const y = margin.top + chartHeight - (i / 5) * chartHeight
    return `
      <line x1="${margin.left - 5}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="#9CA3AF" stroke-width="1"/>
      <text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" fill="#6B7280" font-size="11">${value}</text>
      <line x1="${margin.left}" y1="${y}" x2="${margin.left + chartWidth}" y2="${y}" stroke="#E5E7EB" stroke-width="0.5" opacity="0.5"/>
    `
  }).join('')
  
  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  
  <!-- Título -->
  <text x="${width/2}" y="30" text-anchor="middle" fill="#1F2937" font-size="18" font-weight="bold">${title}</text>
  
  <!-- Eixos -->
  <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartHeight}" stroke="#374151" stroke-width="2"/>
  <line x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${margin.left + chartWidth}" y2="${margin.top + chartHeight}" stroke="#374151" stroke-width="2"/>
  
  <!-- Grid e valores do eixo Y -->
  ${yAxisTicks}
  
  <!-- Barras -->
  ${bars}
  
  <!-- Labels dos eixos -->
  <text x="${margin.left + chartWidth/2}" y="${height - 20}" text-anchor="middle" fill="#374151" font-size="14" font-weight="bold">Categorias</text>
  <text x="25" y="${margin.top + chartHeight/2}" text-anchor="middle" fill="#374151" font-size="14" font-weight="bold" transform="rotate(-90, 25, ${margin.top + chartHeight/2})">Valores</text>
</svg>`
}

function generateLineChart(data: ChartData, title: string, width: number, height: number): string {
  const margin = { top: 60, right: 50, bottom: 80, left: 80 }
  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom
  
  const maxValue = Math.max(...data.values)
  const stepX = chartWidth / (data.categories.length - 1)
  
  const points = data.values.map((value, index) => {
    const x = margin.left + index * stepX
    const y = margin.top + chartHeight - (value / maxValue) * chartHeight
    return { x, y, value }
  })
  
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ')
  
  const pointElements = points.map((point, index) => `
    <circle cx="${point.x}" cy="${point.y}" r="4" fill="#2563EB" stroke="white" stroke-width="2"/>
    <text x="${point.x}" y="${margin.top + chartHeight + 20}" text-anchor="middle" fill="#374151" font-size="12">${data.categories[index]}</text>
    <text x="${point.x}" y="${point.y - 10}" text-anchor="middle" fill="#374151" font-size="11" font-weight="bold">${point.value}</text>
  `).join('')
  
  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  
  <!-- Título -->
  <text x="${width/2}" y="30" text-anchor="middle" fill="#1F2937" font-size="18" font-weight="bold">${title}</text>
  
  <!-- Grid -->
  ${Array.from({length: 6}, (_, i) => {
    const y = margin.top + (i / 5) * chartHeight
    return `<line x1="${margin.left}" y1="${y}" x2="${margin.left + chartWidth}" y2="${y}" stroke="#E5E7EB" stroke-width="0.5" opacity="0.5"/>`
  }).join('')}
  
  <!-- Eixos -->
  <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartHeight}" stroke="#374151" stroke-width="2"/>
  <line x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${margin.left + chartWidth}" y2="${margin.top + chartHeight}" stroke="#374151" stroke-width="2"/>
  
  <!-- Linha -->
  <path d="${pathData}" fill="none" stroke="#2563EB" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  
  <!-- Pontos e labels -->
  ${pointElements}
</svg>`
}

function generatePieChart(data: ChartData, title: string, width: number, height: number): string {
  const centerX = width / 2
  const centerY = height / 2 + 20
  const radius = Math.min(width, height) / 3
  
  const total = data.values.reduce((sum, value) => sum + value, 0)
  const colors = ['#2563EB', '#059669', '#F59E0B', '#DC2626', '#7C3AED']
  
  let currentAngle = -90 // Começar do topo
  
  const slices = data.categories.map((category, index) => {
    const value = data.values[index]
    const percentage = (value / total) * 100
    const sliceAngle = (value / total) * 360
    const color = colors[index % colors.length]
    
    const startAngle = currentAngle * Math.PI / 180
    const endAngle = (currentAngle + sliceAngle) * Math.PI / 180
    
    const x1 = centerX + radius * Math.cos(startAngle)
    const y1 = centerY + radius * Math.sin(startAngle)
    const x2 = centerX + radius * Math.cos(endAngle)
    const y2 = centerY + radius * Math.sin(endAngle)
    
    const largeArcFlag = sliceAngle > 180 ? 1 : 0
    
    const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
    
    // Posição do texto
    const textAngle = (currentAngle + sliceAngle / 2) * Math.PI / 180
    const textX = centerX + (radius * 0.7) * Math.cos(textAngle)
    const textY = centerY + (radius * 0.7) * Math.sin(textAngle)
    
    currentAngle += sliceAngle
    
    return `
      <path d="${pathData}" fill="${color}" stroke="white" stroke-width="2"/>
      <text x="${textX}" y="${textY}" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${percentage.toFixed(1)}%</text>
    `
  }).join('')
  
  // Legenda
  const legend = data.categories.map((category, index) => {
    const color = colors[index % colors.length]
    const y = 50 + index * 25
    return `
      <rect x="20" y="${y - 8}" width="15" height="15" fill="${color}"/>
      <text x="45" y="${y + 4}" fill="#374151" font-size="12">${category}: ${data.values[index]}</text>
    `
  }).join('')
  
  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  
  <!-- Título -->
  <text x="${width/2}" y="30" text-anchor="middle" fill="#1F2937" font-size="18" font-weight="bold">${title}</text>
  
  <!-- Fatias -->
  ${slices}
  
  <!-- Legenda -->
  ${legend}
</svg>`
}

function generateScatterChart(data: ChartData, title: string, width: number, height: number): string {
  const margin = { top: 60, right: 50, bottom: 80, left: 80 }
  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom
  
  const maxValue = Math.max(...data.values)
  
  const points = data.values.map((value, index) => {
    const x = margin.left + (index / (data.categories.length - 1)) * chartWidth
    const y = margin.top + chartHeight - (value / maxValue) * chartHeight
    return { x, y, value, category: data.categories[index] }
  })
  
  const pointElements = points.map((point, index) => `
    <circle cx="${point.x}" cy="${point.y}" r="6" fill="#2563EB" stroke="white" stroke-width="2" opacity="0.8"/>
    <text x="${point.x}" y="${margin.top + chartHeight + 20}" text-anchor="middle" fill="#374151" font-size="10">${point.category}</text>
  `).join('')
  
  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  
  <!-- Título -->
  <text x="${width/2}" y="30" text-anchor="middle" fill="#1F2937" font-size="18" font-weight="bold">${title}</text>
  
  <!-- Grid -->
  ${Array.from({length: 6}, (_, i) => {
    const y = margin.top + (i / 5) * chartHeight
    return `<line x1="${margin.left}" y1="${y}" x2="${margin.left + chartWidth}" y2="${y}" stroke="#E5E7EB" stroke-width="0.5"/>`
  }).join('')}
  
  <!-- Eixos -->
  <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartHeight}" stroke="#374151" stroke-width="2"/>
  <line x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${margin.left + chartWidth}" y2="${margin.top + chartHeight}" stroke="#374151" stroke-width="2"/>
  
  <!-- Pontos -->
  ${pointElements}
</svg>`
}

export async function saveSVGToFile(svgContent: string, filename: string): Promise<{
  success: boolean
  filePath?: string
  publicUrl?: string
  error?: string
}> {
  try {
    const fs = require('fs').promises
    const path = require('path')
    
    // Caminhos
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const finalFilename = filename.endsWith('.svg') ? filename : `${filename}.svg`
    const filePath = path.join(uploadsDir, finalFilename)
    const publicUrl = `/uploads/${finalFilename}`
    
    // Garantir que o diretório existe
    await fs.mkdir(uploadsDir, { recursive: true })
    
    // Salvar arquivo SVG
    await fs.writeFile(filePath, svgContent, 'utf8')
    
    console.log(`✅ SVG salvo: ${publicUrl}`)
    
    return {
      success: true,
      filePath,
      publicUrl
    }
    
  } catch (error) {
    console.error('❌ Erro ao salvar SVG:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao salvar SVG'
    }
  }
}
