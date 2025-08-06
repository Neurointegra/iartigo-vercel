const testChart = {
  id: 'debug-chart-2',
  name: 'Debug Canvas Chart',
  type: 'bar',
  data: {
    labels: ['Janeiro', 'Fevereiro', 'Março', 'Abril'],
    values: [120, 190, 300, 170]
  },
  description: 'Teste de debug para canvas vazio',
  referenceId: '[CHART:debug-canvas]'
};

console.log('🧪 Testando API com debug melhorado...');

fetch('http://localhost:3002/api/process-charts-test', {
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
    console.log('📊 HTML do gráfico (primeiros 500 chars):');
    console.log(data.chartHtml[0].substring(0, 500) + '...');
    
    // Salvar HTML completo em arquivo
    const fs = require('fs');
    const testHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Debug Canvas API</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <h2>🔍 Debug Canvas API Output</h2>
        <p>HTML gerado pela API process-charts-test:</p>
        ${data.chartHtml[0]}
        
        <div style="margin-top: 40px; padding: 20px; background: white; border-radius: 8px;">
            <h3>📋 Debug Console</h3>
            <div id="console" style="background: #f8f9fa; padding: 15px; border-radius: 4px; font-family: monospace; max-height: 300px; overflow-y: auto;"></div>
        </div>
    </div>
    
    <script>
        // Capturar logs do console
        const originalLog = console.log;
        const originalError = console.error;
        const consoleDiv = document.getElementById('console');
        
        function addToConsole(message, type = 'log') {
            const entry = document.createElement('div');
            entry.style.color = type === 'error' ? '#dc3545' : '#495057';
            entry.style.marginBottom = '5px';
            entry.textContent = '[' + new Date().toLocaleTimeString() + '] ' + message;
            consoleDiv.appendChild(entry);
            consoleDiv.scrollTop = consoleDiv.scrollHeight;
        }
        
        console.log = function(...args) {
            originalLog.apply(console, args);
            addToConsole(args.join(' '), 'log');
        };
        
        console.error = function(...args) {
            originalError.apply(console, args);
            addToConsole(args.join(' '), 'error');
        };
        
        console.log('🚀 Debug console ativo');
    </script>
</body>
</html>`;
    
    fs.writeFileSync('debug-canvas-api.html', testHtml);
    console.log('📄 Arquivo debug-canvas-api.html criado');
  } else {
    console.log('❌ Nenhum HTML de gráfico retornado');
  }
})
.catch(error => {
  console.error('❌ Erro ao testar API:', error);
});
