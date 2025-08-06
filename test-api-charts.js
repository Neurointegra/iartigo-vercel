const testChart = {
  id: 'test-chart-1',
  name: 'Teste de Vendas',
  type: 'bar',
  data: {
    labels: ['Janeiro', 'Fevereiro', 'Março', 'Abril'],
    values: [120, 190, 300, 170]
  },
  description: 'Gráfico de teste para verificar Chart.js',
  referenceId: '[CHART:vendas-teste]'
};

console.log('🧪 Testando API process-charts-new...');

fetch('http://localhost:3000/api/process-charts-new', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    charts: [testChart]
  })
})
.then(response => response.json())
.then(data => {
  console.log('✅ Resposta da API:', data);
  
  if (data.chartHtml && data.chartHtml.length > 0) {
    console.log('📊 HTML do gráfico gerado:');
    console.log(data.chartHtml[0]);
    
    // Salvar HTML em arquivo para teste
    const fs = require('fs');
    const testHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Teste Chart API</title>
</head>
<body>
    <h2>Teste HTML da API</h2>
    ${data.chartHtml[0]}
</body>
</html>`;
    
    fs.writeFileSync('test-api-output.html', testHtml);
    console.log('📄 Arquivo test-api-output.html criado');
  } else {
    console.log('❌ Nenhum HTML de gráfico retornado');
  }
})
.catch(error => {
  console.error('❌ Erro ao testar API:', error);
});
