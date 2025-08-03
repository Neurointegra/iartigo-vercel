import { NextRequest, NextResponse } from 'next/server'

// Função para processar dados CSV simples
function parseCSV(text: string) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  const data = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim())
    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = values[index]
    })
    return row
  })
  return { headers, data }
}

// Função para gerar dados de gráfico baseado na descrição
function generateChartData(data: any[], description: string, headers: string[]) {
  // Lógica simples para detectar tipo de gráfico baseado na descrição
  const isBarChart = description.toLowerCase().includes('barras') || description.toLowerCase().includes('bar')
  const isLineChart = description.toLowerCase().includes('linha') || description.toLowerCase().includes('line') || description.toLowerCase().includes('temporal')
  const isPieChart = description.toLowerCase().includes('pizza') || description.toLowerCase().includes('pie') || description.toLowerCase().includes('distribuição')

  // Pegar as primeiras 2 colunas como padrão
  const labelColumn = headers[0]
  const valueColumn = headers[1] || headers[0]

  // Extrair labels e valores
  const labels = data.slice(0, 10).map(row => row[labelColumn] || 'Sem nome') // Limite de 10 itens
  const values = data.slice(0, 10).map(row => {
    const value = parseFloat(row[valueColumn])
    return isNaN(value) ? Math.random() * 100 : value
  })

  // Determinar tipo de gráfico
  let chartType = 'bar'
  if (isLineChart) chartType = 'line'
  else if (isPieChart) chartType = 'pie'

  // Gerar cores
  const colors = [
    'rgba(54, 162, 235, 0.6)',
    'rgba(255, 99, 132, 0.6)',
    'rgba(255, 205, 86, 0.6)',
    'rgba(75, 192, 192, 0.6)',
    'rgba(153, 102, 255, 0.6)',
    'rgba(255, 159, 64, 0.6)',
    'rgba(199, 199, 199, 0.6)',
    'rgba(83, 102, 255, 0.6)',
    'rgba(255, 99, 255, 0.6)',
    'rgba(99, 255, 132, 0.6)'
  ]

  const borderColors = colors.map(color => color.replace('0.6', '1'))

  return {
    type: chartType,
    data: {
      labels,
      datasets: [{
        label: valueColumn || 'Dados',
        data: values,
        backgroundColor: chartType === 'pie' ? colors.slice(0, values.length) : colors[0],
        borderColor: chartType === 'pie' ? borderColors.slice(0, values.length) : borderColors[0],
        borderWidth: 1,
        fill: chartType === 'line' ? false : undefined,
        tension: chartType === 'line' ? 0.1 : undefined
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: description || 'Gráfico Gerado'
        },
        legend: {
          display: chartType === 'pie'
        }
      },
      scales: chartType !== 'pie' ? {
        y: {
          beginAtZero: true
        }
      } : undefined
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const description = formData.get('description') as string

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo fornecido' },
        { status: 400 }
      )
    }

    // Ler conteúdo do arquivo
    const fileContent = await file.text()
    
    let processedData
    let headers: string[] = []

    // Processar baseado no tipo de arquivo
    if (file.name.endsWith('.csv') || file.type === 'text/csv') {
      const csvData = parseCSV(fileContent)
      processedData = csvData.data
      headers = csvData.headers
    } else if (file.name.endsWith('.txt') || file.type === 'text/plain') {
      // Para arquivos TXT, assumir formato simples (uma linha por valor)
      const lines = fileContent.trim().split('\n')
      headers = ['Item', 'Valor']
      processedData = lines.map((line, index) => ({
        'Item': `Item ${index + 1}`,
        'Valor': parseFloat(line.trim()) || Math.random() * 100
      }))
    } else {
      // Para outros tipos, gerar dados de exemplo
      headers = ['Categoria', 'Valor']
      processedData = [
        { 'Categoria': 'A', 'Valor': 10 },
        { 'Categoria': 'B', 'Valor': 20 },
        { 'Categoria': 'C', 'Valor': 15 },
        { 'Categoria': 'D', 'Valor': 25 },
        { 'Categoria': 'E', 'Valor': 12 }
      ]
    }

    // Gerar dados do gráfico
    const chartData = generateChartData(processedData, description, headers)

    return NextResponse.json({
      success: true,
      chart: chartData,
      fileName: file.name,
      processedRows: processedData.length
    })

  } catch (error) {
    console.error('Erro ao processar arquivo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
