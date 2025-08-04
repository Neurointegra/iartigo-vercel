/**
 * Teste da API do Gemini com dotenv
 */

// Carregar variáveis de ambiente primeiro
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiAPI() {
  console.log('🧪 Testando conexão com Gemini AI...');
  
  const apiKey = process.env.GEMINI_API_KEY;
  console.log(`🔑 API Key: ${apiKey ? `${apiKey.substring(0, 15)}...` : 'NÃO ENCONTRADA'}`);
  
  if (!apiKey) {
    console.error('❌ API Key não encontrada no .env');
    console.log('📁 Arquivo .env deve conter: GEMINI_API_KEY=sua_chave');
    return;
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    console.log('📡 Fazendo chamada de teste para texto...');
    
    const prompt = 'Responda apenas com "OK" se você conseguir me entender.';
    const result = await model.generateContent(prompt);
    
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Resposta da IA:', text);
    console.log('🎉 Conexão com Gemini AI funcionando!');
    
    // Teste específico para geração de imagem
    console.log('\n🎨 Testando geração de imagem...');
    const imagePrompt = `
Crie uma imagem de um gráfico de barras simples.
- 3 barras azuis com valores 30, 45, 60
- Fundo branco
- Título "Teste de Gráfico"
- Dimensões 400x300 pixels
- Formato PNG
`;
    
    const imageResult = await model.generateContent([imagePrompt]);
    const imageResponse = await imageResult.response;
    
    console.log('📊 Candidatos na resposta:', imageResponse.candidates?.length || 0);
    
    if (imageResponse.candidates?.[0]?.content?.parts) {
      const parts = imageResponse.candidates[0].content.parts;
      console.log('🔍 Partes na resposta:', parts.length);
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        console.log(`  Parte ${i + 1}:`, {
          hasText: !!part.text,
          hasInlineData: !!part.inlineData,
          mimeType: part.inlineData?.mimeType || 'N/A'
        });
        
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          console.log('✅ IA consegue gerar imagens!');
          console.log(`📏 Tamanho da imagem: ${part.inlineData.data.length} chars (base64)`);
          return;
        }
      }
      
      console.log('⚠️ IA não retornou imagem neste teste');
      if (imageResponse.text) {
        console.log('📝 Resposta texto:', imageResponse.text());
      }
    } else {
      console.log('⚠️ Resposta inesperada da IA para imagem');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar Gemini AI:', error.message);
    if (error.message.includes('API_KEY')) {
      console.log('🔧 Verifique se a API key está correta no arquivo .env');
    }
  }
}

testGeminiAPI();
