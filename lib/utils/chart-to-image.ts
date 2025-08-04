import { GoogleGenerativeAI } from '@google/generative-ai'
import { promises as fs } from 'fs'
import path from 'path'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

interface ChartData {
  id: string
  name: string
  type: 'bar' | 'line' | 'pie' | 'scatter'
  data: any
  description: string
  context?: string
}

export class ChartToImageService {
  private static uploadsPath = path.join(process.cwd(), 'public', 'uploads')

  static async generateChartAsImage(chartData: ChartData): Promise<string> {
    try {
      console.log(`🎨 Gerando imagem para gráfico: ${chartData.name}`)

      // Garantir que o diretório uploads existe
      await fs.mkdir(this.uploadsPath, { recursive: true })

      // Gerar SVG do gráfico usando dados
      const svgContent = await this.generateSVGFromData(chartData)
      
      // Salvar SVG como arquivo de imagem com nome mais simples
      const fileName = `chart_${chartData.id}.svg`
      const filePath = path.join(this.uploadsPath, fileName)
      
      await fs.writeFile(filePath, svgContent, 'utf8')
      
      console.log(`✅ Gráfico salvo como: ${fileName}`)
      return fileName
    } catch (error) {
      console.error('❌ Erro ao gerar imagem do gráfico:', error)
      throw error
    }
  }

  private static async generateSVGFromData(chartData: ChartData): Promise<string> {
    const { type, data, name, description } = chartData

    switch (type) {
      case 'bar':
        return this.generateBarChartSVG(data, name, description)
      case 'line':
        return this.generateLineChartSVG(data, name, description)
      case 'pie':
        return this.generatePieChartSVG(data, name, description)
      case 'scatter':
        return this.generateScatterChartSVG(data, name, description)
      default:
        throw new Error(`Tipo de gráfico não suportado: ${type}`)
    }
  }

  private static generateBarChartSVG(data: any, title: string, description: string): string {
    const width = 600
    const height = 400
    const margin = { top: 60, right: 30, bottom: 80, left: 80 }
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    // Extrair dados (assumindo formato chart.js)
    const labels = data.labels || []
    const values = data.datasets?.[0]?.data || []
    const maxValue = Math.max(...values)
    const barWidth = chartWidth / labels.length * 0.8

    let bars = ''
    labels.forEach((label: string, index: number) => {
      const value = values[index] || 0
      const barHeight = (value / maxValue) * chartHeight
      const x = margin.left + (index * chartWidth / labels.length) + (chartWidth / labels.length - barWidth) / 2
      const y = margin.top + chartHeight - barHeight

      bars += `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" 
              fill="#3b82f6" stroke="#1e40af" stroke-width="1" opacity="0.8"/>
        <text x="${x + barWidth/2}" y="${margin.top + chartHeight + 20}" 
              text-anchor="middle" font-size="12" fill="#374151">${label}</text>
        <text x="${x + barWidth/2}" y="${y - 5}" 
              text-anchor="middle" font-size="11" fill="#1f2937" font-weight="bold">${value}</text>
      `
    })

    // Gerar linhas do grid
    const gridLines = Array.from({ length: 6 }, (_, i) => {
      const y = margin.top + (chartHeight / 5) * i
      const value = Math.round(maxValue * (5 - i) / 5)
      return `
        <line x1="${margin.left}" y1="${y}" x2="${margin.left + chartWidth}" y2="${y}" 
              stroke="#e5e7eb" stroke-width="1"/>
        <text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6b7280">${value}</text>
      `
    }).join('')

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .chart-title { font-family: system-ui, -apple-system, sans-serif; font-weight: 600; }
            .chart-text { font-family: system-ui, -apple-system, sans-serif; }
          </style>
        </defs>
        
        <!-- Fundo -->
        <rect width="100%" height="100%" fill="white"/>
        
        <!-- Título -->
        <text x="${width/2}" y="30" text-anchor="middle" font-size="16" class="chart-title" fill="#1f2937">
          ${title}
        </text>
        
        <!-- Grid -->
        ${gridLines}
        
        <!-- Eixos -->
        <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartHeight}" 
              stroke="#374151" stroke-width="2"/>
        <line x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${margin.left + chartWidth}" y2="${margin.top + chartHeight}" 
              stroke="#374151" stroke-width="2"/>
        
        <!-- Barras -->
        ${bars}
        
        <!-- Descrição -->
        <text x="${width/2}" y="${height - 10}" text-anchor="middle" font-size="12" class="chart-text" fill="#6b7280">
          ${description}
        </text>
      </svg>
    `
  }

  private static generateLineChartSVG(data: any, title: string, description: string): string {
    const width = 600
    const height = 400
    const margin = { top: 60, right: 30, bottom: 80, left: 80 }
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    const labels = data.labels || []
    const values = data.datasets?.[0]?.data || []
    const maxValue = Math.max(...values)
    const minValue = Math.min(...values)
    const valueRange = maxValue - minValue || 1

    // Gerar pontos da linha
    let pathData = ''
    let points = ''
    labels.forEach((label: string, index: number) => {
      const value = values[index] || 0
      const x = margin.left + (index * chartWidth / (labels.length - 1))
      const y = margin.top + chartHeight - ((value - minValue) / valueRange) * chartHeight

      if (index === 0) {
        pathData = `M ${x} ${y}`
      } else {
        pathData += ` L ${x} ${y}`
      }

      points += `
        <circle cx="${x}" cy="${y}" r="4" fill="#3b82f6" stroke="white" stroke-width="2"/>
        <text x="${x}" y="${margin.top + chartHeight + 20}" text-anchor="middle" font-size="12" fill="#374151">${label}</text>
      `
    })

    // Grid
    const gridLines = Array.from({ length: 6 }, (_, i) => {
      const y = margin.top + (chartHeight / 5) * i
      const value = Math.round(maxValue - (valueRange / 5) * i)
      return `
        <line x1="${margin.left}" y1="${y}" x2="${margin.left + chartWidth}" y2="${y}" 
              stroke="#e5e7eb" stroke-width="1"/>
        <text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6b7280">${value}</text>
      `
    }).join('')

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .chart-title { font-family: system-ui, -apple-system, sans-serif; font-weight: 600; }
            .chart-text { font-family: system-ui, -apple-system, sans-serif; }
          </style>
        </defs>
        
        <rect width="100%" height="100%" fill="white"/>
        
        <text x="${width/2}" y="30" text-anchor="middle" font-size="16" class="chart-title" fill="#1f2937">
          ${title}
        </text>
        
        ${gridLines}
        
        <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartHeight}" 
              stroke="#374151" stroke-width="2"/>
        <line x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${margin.left + chartWidth}" y2="${margin.top + chartHeight}" 
              stroke="#374151" stroke-width="2"/>
        
        <path d="${pathData}" fill="none" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"/>
        
        ${points}
        
        <text x="${width/2}" y="${height - 10}" text-anchor="middle" font-size="12" class="chart-text" fill="#6b7280">
          ${description}
        </text>
      </svg>
    `
  }

  private static generatePieChartSVG(data: any, title: string, description: string): string {
    const width = 600
    const height = 400
    const centerX = width / 2
    const centerY = height / 2 + 10
    const radius = 120

    const labels = data.labels || []
    const values = data.datasets?.[0]?.data || []
    const total = values.reduce((sum: number, val: number) => sum + val, 0)
    
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16']

    let slices = ''
    let legends = ''
    let currentAngle = -90 // Começar do topo

    values.forEach((value: number, index: number) => {
      const percentage = (value / total) * 100
      const sliceAngle = (value / total) * 360
      const endAngle = currentAngle + sliceAngle
      
      const x1 = centerX + radius * Math.cos(currentAngle * Math.PI / 180)
      const y1 = centerY + radius * Math.sin(currentAngle * Math.PI / 180)
      const x2 = centerX + radius * Math.cos(endAngle * Math.PI / 180)
      const y2 = centerY + radius * Math.sin(endAngle * Math.PI / 180)
      
      const largeArcFlag = sliceAngle > 180 ? 1 : 0
      const color = colors[index % colors.length]

      slices += `
        <path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z"
              fill="${color}" stroke="white" stroke-width="2" opacity="0.9"/>
      `

      // Legenda
      const legendY = 80 + index * 25
      legends += `
        <rect x="450" y="${legendY - 8}" width="12" height="12" fill="${color}"/>
        <text x="470" y="${legendY + 2}" font-size="12" fill="#374151">${labels[index]} (${percentage.toFixed(1)}%)</text>
      `

      currentAngle = endAngle
    })

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .chart-title { font-family: system-ui, -apple-system, sans-serif; font-weight: 600; }
            .chart-text { font-family: system-ui, -apple-system, sans-serif; }
          </style>
        </defs>
        
        <rect width="100%" height="100%" fill="white"/>
        
        <text x="${width/2}" y="30" text-anchor="middle" font-size="16" class="chart-title" fill="#1f2937">
          ${title}
        </text>
        
        ${slices}
        ${legends}
        
        <text x="${width/2}" y="${height - 10}" text-anchor="middle" font-size="12" class="chart-text" fill="#6b7280">
          ${description}
        </text>
      </svg>
    `
  }

  private static generateScatterChartSVG(data: any, title: string, description: string): string {
    const width = 600
    const height = 400
    const margin = { top: 60, right: 30, bottom: 80, left: 80 }
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    // Assumir dados no formato [{x: number, y: number}]
    const points = data.datasets?.[0]?.data || []
    const maxX = Math.max(...points.map((p: any) => p.x || 0))
    const maxY = Math.max(...points.map((p: any) => p.y || 0))
    const minX = Math.min(...points.map((p: any) => p.x || 0))
    const minY = Math.min(...points.map((p: any) => p.y || 0))

    const xRange = maxX - minX || 1
    const yRange = maxY - minY || 1

    let scatterPoints = ''
    points.forEach((point: any, index: number) => {
      const x = margin.left + ((point.x - minX) / xRange) * chartWidth
      const y = margin.top + chartHeight - ((point.y - minY) / yRange) * chartHeight
      
      scatterPoints += `
        <circle cx="${x}" cy="${y}" r="4" fill="#3b82f6" stroke="#1e40af" stroke-width="1" opacity="0.7"/>
      `
    })

    // Grid
    const gridLines = Array.from({ length: 6 }, (_, i) => {
      const y = margin.top + (chartHeight / 5) * i
      const value = Math.round(maxY - (yRange / 5) * i)
      return `
        <line x1="${margin.left}" y1="${y}" x2="${margin.left + chartWidth}" y2="${y}" 
              stroke="#e5e7eb" stroke-width="1"/>
        <text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6b7280">${value}</text>
      `
    }).join('')

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .chart-title { font-family: system-ui, -apple-system, sans-serif; font-weight: 600; }
            .chart-text { font-family: system-ui, -apple-system, sans-serif; }
          </style>
        </defs>
        
        <rect width="100%" height="100%" fill="white"/>
        
        <text x="${width/2}" y="30" text-anchor="middle" font-size="16" class="chart-title" fill="#1f2937">
          ${title}
        </text>
        
        ${gridLines}
        
        <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartHeight}" 
              stroke="#374151" stroke-width="2"/>
        <line x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${margin.left + chartWidth}" y2="${margin.top + chartHeight}" 
              stroke="#374151" stroke-width="2"/>
        
        ${scatterPoints}
        
        <text x="${width/2}" y="${height - 10}" text-anchor="middle" font-size="12" class="chart-text" fill="#6b7280">
          ${description}
        </text>
      </svg>
    `
  }

  // Função para processar múltiplos gráficos
  static async processChartsToImages(charts: ChartData[]): Promise<Map<string, string>> {
    const chartImages = new Map<string, string>()
    
    for (const chart of charts) {
      try {
        const imageFileName = await this.generateChartAsImage(chart)
        chartImages.set(chart.id, imageFileName)
      } catch (error) {
        console.error(`❌ Erro ao processar gráfico ${chart.id}:`, error)
      }
    }
    
    return chartImages
  }
}
