import { NextRequest, NextResponse } from 'next/server'

interface ChartData {
  id: string
  name: string
  type: 'bar' | 'line' | 'pie' | 'scatter'
  data: any
  description: string
  referenceId: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { charts }: { charts: ChartData[] } = body

    if (!charts || !Array.isArray(charts) || charts.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum gráfico fornecido' },
        { status: 400 }
      )
    }

    const chartImages: Record<string, string> = {}

    for (const chart of charts) {
      try {
        const chartHtml = createSimpleChartHTML(chart)
        chartImages[chart.id] = chartHtml
      } catch (error) {
        console.error(`❌ Erro no gráfico ${chart.id}:`, error)
        if (error instanceof Error) {
          console.error(`❌ Stack trace:`, error.stack)
        }
        chartImages[chart.id] = createErrorChart(chart)
      }
    }

    return NextResponse.json({
      success: true,
      chartImages,
      totalCharts: charts.length,
      message: 'Gráficos gerados com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro na API process-charts-simple:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function createSimpleChartHTML(chart: ChartData): string {
  const chartId = `chart_${chart.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
  
  // Preparar dados para Chart.js com validação
  let labels: string[] = ['Item 1', 'Item 2', 'Item 3', 'Item 4']
  let values: number[] = [10, 20, 15, 25]
  
  try {
    if (chart.data?.labels && Array.isArray(chart.data.labels)) {
      labels = chart.data.labels.map(String)
    }
    
    if (chart.data?.values && Array.isArray(chart.data.values)) {
      values = chart.data.values.map(Number).filter((n: number) => !isNaN(n))
    } else if (chart.data?.data && Array.isArray(chart.data.data)) {
      values = chart.data.data.map(Number).filter((n: number) => !isNaN(n))
    }
    
    // Garantir que temos dados válidos
    if (values.length === 0) {
      console.warn('⚠️ Nenhum valor numérico válido encontrado, usando dados padrão')
      values = [10, 20, 15, 25]
    }
    
    // Garantir que labels e values têm o mesmo tamanho
    while (labels.length < values.length) {
      labels.push(`Item ${labels.length + 1}`)
    }
    while (values.length < labels.length) {
      values.push(0)
    }
    
    
  } catch (error) {
    console.warn('⚠️ Erro ao processar dados do gráfico, usando dados padrão:', error)
  }
  
  const chartConfig = {
    type: chart.type,
    data: {
      labels: labels,
      datasets: [{
        label: chart.name,
        data: values,
        backgroundColor: [
          '#3B82F6', '#10B981', '#EF4444', '#F59E0B', 
          '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'
        ],
        borderColor: '#374151',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: chart.name,
          font: { size: 18, weight: 'bold' },
          color: '#1F2937',
          padding: 20
        },
        legend: {
          display: chart.type === 'pie',
          position: 'bottom',
          labels: { padding: 20 }
        }
      },
      scales: chart.type !== 'pie' ? {
        y: { 
          beginAtZero: true,
          grid: { color: '#E5E7EB' },
          ticks: { color: '#6B7280', font: { size: 12 } }
        },
        x: { 
          grid: { color: '#E5E7EB' },
          ticks: { color: '#6B7280', font: { size: 12 } }
        }
      } : undefined
    }
  }

  return `
    <div style="margin: 50px 0; padding: 20px 0;">
      <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 30px;">
        <div style="position: relative; height: 400px; width: 100%;">
          <canvas id="${chartId}"></canvas>
        </div>
        <p style="margin: 25px 0 10px 0; font-style: italic; color: #6B7280; font-size: 14px; text-align: center; line-height: 1.5; max-width: 700px; margin-left: auto; margin-right: auto;">
          ${chart.description}
        </p>
      </div>
    </div>
    
    <script>
      (function() {
        let chartInstance_${chartId} = null;
        let retryCount_${chartId} = 0;
        const maxRetries_${chartId} = 5;
        
        function createChart_${chartId}() {
          
          // Verificar se Chart.js está disponível
          if (typeof Chart === 'undefined' && typeof window.Chart === 'undefined') {
            retryCount_${chartId}++;
            if (retryCount_${chartId} < maxRetries_${chartId}) {
              setTimeout(createChart_${chartId}, 200);
            } else {
              console.error('❌ Chart.js não carregou após múltiplas tentativas');
            }
            return;
          }
          
          const canvas = document.getElementById('${chartId}');
          if (!canvas) {
            console.error('Canvas ${chartId} não encontrado');
            retryCount_${chartId}++;
            if (retryCount_${chartId} < maxRetries_${chartId}) {
              setTimeout(createChart_${chartId}, 200);
            }
            return;
          }
          
          // Destruir instância anterior se existir
          if (chartInstance_${chartId}) {
            chartInstance_${chartId}.destroy();
          }
          
          // Configurar canvas
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.error('Contexto 2D não disponível');
            return;
          }
          
          try {
            const config = {
              type: '${chart.type}',
              data: {
                labels: ${JSON.stringify(labels)},
                datasets: [{
                  label: '${chart.name.replace(/'/g, "\\'")}',
                  data: ${JSON.stringify(values)},
                  backgroundColor: [
                    '#3B82F6', '#10B981', '#EF4444', '#F59E0B', 
                    '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'
                  ],
                  borderColor: '#374151',
                  borderWidth: 2
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                  duration: 1000
                },
                plugins: {
                  title: {
                    display: true,
                    text: '${chart.name.replace(/'/g, "\\'")}',
                    font: { size: 18, weight: 'bold' },
                    color: '#1F2937',
                    padding: 20
                  },
                  legend: {
                    display: ${chart.type === 'pie'},
                    position: 'bottom',
                    labels: { padding: 20 }
                  }
                }${chart.type !== 'pie' ? `,
                scales: {
                  y: { 
                    beginAtZero: true,
                    grid: { color: '#E5E7EB' },
                    ticks: { color: '#6B7280', font: { size: 12 } }
                  },
                  x: { 
                    grid: { color: '#E5E7EB' },
                    ticks: { color: '#6B7280', font: { size: 12 } }
                  }
                }` : ''}
              }
            };
            
            // Usar window.Chart se Chart global não estiver disponível
            const ChartConstructor = window.Chart || Chart;
            chartInstance_${chartId} = new ChartConstructor(ctx, config);
            
            // Verificar renderização após um tempo
            setTimeout(() => {
              if (canvas.toDataURL && canvas.toDataURL().length > 5000) {
                // Gráfico renderizado corretamente
              } else {
                console.warn('⚠️ Gráfico ${chartId} pode não ter renderizado');
                // Tentar novamente se não renderizou
                if (chartInstance_${chartId}) {
                  chartInstance_${chartId}.update();
                }
              }
            }, 1500);
            
          } catch (error) {
            console.error('❌ Erro ao criar gráfico ${chartId}:', error);
            // Tentar novamente em caso de erro
            retryCount_${chartId}++;
            if (retryCount_${chartId} < maxRetries_${chartId}) {
              setTimeout(createChart_${chartId}, 1000);
            } else {
              console.error('❌ Falha definitiva na criação do gráfico ${chartId}');
            }
          }
        }
        
        // Aguardar DOM e executar
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
            setTimeout(createChart_${chartId}, 500);
          });
        } else {
          setTimeout(createChart_${chartId}, 500);
        }
      })();
    </script>
  `
}

function createErrorChart(chart: ChartData): string {
  return `
    <div style="margin: 50px 0; padding: 20px 0;">
      <div style="max-width: 800px; margin: 0 auto; background: #FEF2F2; border: 2px dashed #F87171; border-radius: 12px; padding: 40px; text-align: center;">
        <h3 style="color: #DC2626; font-size: 18px; margin: 0 0 15px 0;">⚠️ Erro ao carregar gráfico</h3>
        <p style="color: #7F1D1D; font-size: 16px; margin: 0 0 10px 0; font-weight: 500;">${chart.name}</p>
        <p style="color: #991B1B; font-size: 14px; margin: 0; line-height: 1.4;">${chart.description}</p>
      </div>
    </div>
  `
}
