/**
 * Teste completo de geração de SVG
 */

const fs = require('fs/promises')
const path = require('path')

async function createTestChart() {
  console.log('🧪 Testando geração de SVG...')
  
  // Simular dados para gráfico de barras
  const data = [
    { label: 'Categoria A', value: 65, color: '#3b82f6' },
    { label: 'Categoria B', value: 59, color: '#10b981' },
    { label: 'Categoria C', value: 80, color: '#f59e0b' },
    { label: 'Categoria D', value: 81, color: '#ef4444' },
    { label: 'Categoria E', value: 56, color: '#8b5cf6' }
  ]
  
  const maxValue = Math.max(...data.map(d => d.value))
  const chartHeight = 300
  const barWidth = 60
  const spacing = 20
  
  const svgContent = `
<svg width="800" height="500" xmlns="http://www.w3.org/2000/svg">
  <!-- Fundo -->
  <rect width="800" height="500" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>
  
  <!-- Título -->
  <text x="400" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#1f2937">
    Teste - Gráfico de Barras
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

  // Salvar arquivo
  const fileName = `test_chart_${Date.now()}.svg`
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  
  try {
    await fs.mkdir(uploadsDir, { recursive: true })
    const filePath = path.join(uploadsDir, fileName)
    await fs.writeFile(filePath, svgContent)
    
    console.log(`✅ Arquivo SVG criado com sucesso: ${fileName}`)
    console.log(`📁 Caminho: ${filePath}`)
    
    // Verificar se o arquivo existe
    const stats = await fs.stat(filePath)
    console.log(`📏 Tamanho do arquivo: ${stats.size} bytes`)
    
  } catch (error) {
    console.error('❌ Erro ao criar arquivo:', error)
  }
}

createTestChart()
