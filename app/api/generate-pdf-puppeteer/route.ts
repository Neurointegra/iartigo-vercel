import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

export async function POST(request: NextRequest) {
  let browser: any = null;
  
  try {
    const { title, content, createdAt, images, charts } = await request.json()

    // Processar conteúdo substituindo tags
    let processedContent = content || ''
    
    // Substituir tags de imagens
    if (images && images.length > 0) {
      images.forEach((image: any) => {
        const imageTagPattern = new RegExp(`\\[Imagem: ${image.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g')
        const imageHtml = `
          <div style="margin: 20px 0; text-align: center; page-break-inside: avoid;">
            <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #f9f9f9;">
              <p style="margin: 0; font-weight: bold; color: #333;">📷 ${image.description || image.name}</p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Imagem: ${image.name}</p>
            </div>
          </div>
        `
        processedContent = processedContent.replace(imageTagPattern, imageHtml)
      })
    }

    // Substituir tags de gráficos
    if (charts && charts.length > 0) {
      charts.forEach((chart: any) => {
        const chartRegex = new RegExp(`\\[CHART:${chart.referenceId}\\]`, 'g')
        const chartHtml = `
          <div style="margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; page-break-inside: avoid; background: #f8f9fa;">
            <h4 style="margin: 0 0 10px 0; font-weight: bold; color: #2563eb;">📊 ${chart.name}</h4>
            <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">${chart.description}</p>
            <div style="background: #e9ecef; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #495057;">
              Tipo: ${chart.type}<br/>
              Dados: ${JSON.stringify(chart.data.labels?.slice(0, 5))}...
            </div>
          </div>
        `
        processedContent = processedContent.replace(chartRegex, chartHtml)
      })
    }

    // Formatar data
    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // HTML template mais simples e robusto
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            padding: 20px;
            background: #fff;
            font-size: 14px;
            margin: 0;
          }
          
          .header {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #2563eb;
            page-break-after: avoid;
          }
          
          .title {
            font-size: 22px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
            word-wrap: break-word;
            page-break-after: avoid;
          }
          
          .date {
            font-size: 12px;
            color: #666;
            page-break-after: avoid;
          }
          
          .content {
            font-size: 14px;
            line-height: 1.7;
            text-align: justify;
            word-wrap: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
          }
          
          h1, h2, h3, h4, h5, h6 {
            margin: 15px 0 8px 0;
            color: #2563eb;
            page-break-after: avoid;
            orphans: 3;
            widows: 3;
          }
          
          p {
            margin: 8px 0;
            page-break-inside: avoid;
            orphans: 3;
            widows: 3;
          }
          
          strong, b {
            font-weight: bold;
          }
          
          em, i {
            font-style: italic;
          }
          
          ul, ol {
            margin: 8px 0;
            padding-left: 25px;
            page-break-inside: avoid;
          }
          
          li {
            margin: 3px 0;
            page-break-inside: avoid;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          .no-break {
            page-break-inside: avoid;
          }
          
          /* Melhor controle de quebras de página */
          @page {
            margin: 15mm;
            size: A4;
          }
          
          @media print {
            body {
              padding: 10px;
            }
            
            .header {
              margin-bottom: 20px;
            }
            
            .title {
              font-size: 20px;
            }
            
            p, div {
              page-break-inside: avoid;
              orphans: 3;
              widows: 3;
            }
          }
        </style>
      </head>
      <body>
        <div class="header no-break">
          <h1 class="title">${title}</h1>
          <p class="date">Criado em: ${formatDate(createdAt)}</p>
        </div>
        
        <div class="content">
          ${processedContent}
        </div>
      </body>
      </html>
    `

    console.log('Iniciando Puppeteer...');

    // Configuração mais robusta do Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ],
      timeout: 60000
    })

    console.log('Puppeteer iniciado, criando página...');

    const page = await browser.newPage()
    
    // Configurar página
    await page.setViewport({ width: 1200, height: 800 })
    
    console.log('Definindo conteúdo HTML...');
    
    // Definir conteúdo com timeout maior
    await page.setContent(htmlContent, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    })

    console.log('Gerando PDF...');

    // Gerar PDF com configuração que evita cortes
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      },
      timeout: 30000,
      // Configurações para evitar cortes
      preferCSSPageSize: false,
      displayHeaderFooter: false
    })

    console.log('PDF gerado com sucesso, fechando browser...');

    await browser.close()
    browser = null

    console.log('Retornando PDF...');

    // Retornar PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.pdf"`
      }
    })

  } catch (error) {
    console.error('Erro detalhado ao gerar PDF com Puppeteer:', error)
    
    // Garantir que o browser seja fechado em caso de erro
    if (browser) {
      try {
        await browser.close()
      } catch (closeError) {
        console.error('Erro ao fechar browser:', closeError)
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor ao gerar PDF', 
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
