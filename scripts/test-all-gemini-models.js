/**
 * Teste abrangente dos modelos Gemini para geração de imagens
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testAllGeminiModels() {
  console.log('🧪 Testando todos os modelos Gemini para geração de imagens...');
  
  const apiKey = process.env.GEMINI_API_KEY;
  console.log(`🔑 API Key: ${apiKey ? `${apiKey.substring(0, 15)}...` : 'NÃO ENCONTRADA'}`);
  
  if (!apiKey) {
    console.error('❌ API Key não encontrada no .env');
    return;
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Lista de modelos para testar
  const modelsToTest = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-pro-latest', 
    'gemini-1.5-pro',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-pro-vision',
    'gemini-pro',
    'gemini-1.0-pro-vision',
    'gemini-1.0-pro'
  ];
  
  const simpleImagePrompt = `Create a simple bar chart image with 3 blue bars showing values 30, 45, 60. White background, title "Test Chart". PNG format.`;
  
  for (const modelName of modelsToTest) {
    console.log(`\n📡 Testando modelo: ${modelName}`);
    console.log('=' * 50);
    
    try {
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 2048,
        }
      });
      
      // Primeiro teste: texto simples
      console.log('🔤 Teste 1: Resposta de texto...');
      const textResult = await model.generateContent(['Responda apenas "OK"']);
      const textResponse = await textResult.response;
      console.log('✅ Texto:', textResponse.text?.() || 'Sem resposta');
      
      // Segundo teste: geração de imagem
      console.log('🎨 Teste 2: Geração de imagem...');
      const imageResult = await model.generateContent([simpleImagePrompt]);
      const imageResponse = await imageResult.response;
      
      if (imageResponse.candidates?.[0]?.content?.parts) {
        const parts = imageResponse.candidates[0].content.parts;
        console.log(`🔍 Partes na resposta: ${parts.length}`);
        
        let hasImage = false;
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          console.log(`  Parte ${i + 1}:`, {
            hasText: !!part.text,
            hasInlineData: !!part.inlineData,
            mimeType: part.inlineData?.mimeType || 'N/A',
            dataSize: part.inlineData?.data ? `${part.inlineData.data.length} chars` : 'N/A'
          });
          
          if (part.inlineData?.mimeType?.startsWith('image/')) {
            hasImage = true;
            console.log(`🎉 SUCESSO! Modelo ${modelName} consegue gerar imagens!`);
            console.log(`📏 Tamanho: ${part.inlineData.data.length} chars (base64)`);
            console.log(`🖼️ Tipo: ${part.inlineData.mimeType}`);
          }
        }
        
        if (!hasImage) {
          console.log('⚠️ Não retornou imagem');
          if (imageResponse.text) {
            const responseText = imageResponse.text();
            console.log('📝 Resposta texto:', responseText.length > 200 ? responseText.substring(0, 200) + '...' : responseText);
          }
        }
      } else {
        console.log('❌ Resposta inválida');
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`❌ Erro com ${modelName}:`, errorMsg);
      
      if (errorMsg.includes('model') || errorMsg.includes('not found')) {
        console.log('🚫 Modelo não disponível');
      } else if (errorMsg.includes('quota') || errorMsg.includes('limit')) {
        console.log('⏳ Limite de quota atingido');
      } else {
        console.log('🔧 Erro de configuração ou permissão');
      }
    }
  }
  
  console.log('\n🏁 Teste concluído!');
  console.log('💡 Modelos que funcionam para imagem aparecerão com "SUCESSO!" acima');
}

testAllGeminiModels();
