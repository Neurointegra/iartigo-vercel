import { readdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * Processa tags [Imagem: nome] no conteúdo e as substitui por HTML com URLs da pasta uploads
 */
export async function processImageTags(content: string): Promise<string> {
  try {
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    
    if (!existsSync(uploadsDir)) {
      console.log('📁 Pasta uploads não encontrada')
      return content
    }

    // Buscar todas as imagens na pasta uploads
    const files = await readdir(uploadsDir)
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(file)
    )

    console.log(`📸 Encontradas ${imageFiles.length} imagens na pasta uploads:`, imageFiles)

    // Processar todas as tags [Imagem: nome]
    let processedContent = content
    const imageTagRegex = /\[Imagem:\s*([^\]]+)\]/g
    const matches = [...content.matchAll(imageTagRegex)]

    console.log(`🔍 Encontradas ${matches.length} tags de imagem no conteúdo`)

    for (const match of matches) {
      const [fullMatch, imageName] = match
      const cleanImageName = imageName.trim()

      // Procurar arquivo correspondente na pasta uploads
      const matchingFile = findMatchingImage(cleanImageName, imageFiles)

      if (matchingFile) {
        const imageUrl = `/uploads/${matchingFile}`
        const imageHtml = `
<div style="margin: 40px 0; text-align: center; padding: 20px 0; width: 100%; display: flex; flex-direction: column; align-items: center;">
  <div style="max-width: 800px; width: 100%; text-align: center;">
    <img src="${imageUrl}" alt="${cleanImageName}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); display: block; margin: 0 auto;" />
    <p style="margin: 15px 0 0 0; font-style: italic; color: #666; font-size: 14px; text-align: center; line-height: 1.4;">
      Figura: ${cleanImageName}
    </p>
  </div>
</div>`
        
        processedContent = processedContent.replace(fullMatch, imageHtml)
        console.log(`✅ Imagem processada: ${cleanImageName} -> ${imageUrl}`)
      } else {
        // Se a imagem não for encontrada, substituir por uma mensagem de erro mais discreta
        const errorHtml = `
<div style="margin: 40px 0; text-align: center; padding: 20px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
  <p style="color: #dc2626; font-style: italic; margin: 0;">
    ⚠️ Imagem não encontrada: "${cleanImageName}"
  </p>
  <p style="color: #6b7280; font-size: 12px; margin: 5px 0 0 0;">
    Verifique se o arquivo foi enviado corretamente.
  </p>
</div>`
        
        processedContent = processedContent.replace(fullMatch, errorHtml)
        console.log(`⚠️ Imagem não encontrada: ${cleanImageName}`)
        console.log(`   Arquivos disponíveis: ${imageFiles.join(', ')}`)
      }
    }

    return processedContent
  } catch (error) {
    console.error('❌ Erro ao processar tags de imagem:', error)
    return content
  }
}

/**
 * Encontra uma imagem correspondente na lista de arquivos
 */
function findMatchingImage(imageName: string, imageFiles: string[]): string | undefined {
  const cleanName = imageName.toLowerCase()
  
  // Função para normalizar texto (remover acentos e caracteres especiais)
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais
  }
  
  const normalizedSearchName = normalizeText(cleanName)
  
  console.log(`🔍 Procurando por: "${imageName}" (normalizado: "${normalizedSearchName}")`)
  console.log(`📁 Arquivos disponíveis:`, imageFiles)
  
  // Estratégias de busca (em ordem de prioridade):
  
  // 1. Nome exato (removendo timestamp)
  let match = imageFiles.find(file => {
    const originalName = file.replace(/^\d+_/, '').toLowerCase()
    return originalName === cleanName
  })
  if (match) {
    console.log(`✅ Encontrado por nome exato: ${match}`)
    return match
  }

  // 2. Nome normalizado exato
  match = imageFiles.find(file => {
    const originalName = file.replace(/^\d+_/, '')
    const normalizedFileName = normalizeText(originalName)
    return normalizedFileName === normalizedSearchName
  })
  if (match) {
    console.log(`✅ Encontrado por nome normalizado: ${match}`)
    return match
  }

  // 3. Nome contido no arquivo (removendo timestamp)
  match = imageFiles.find(file => {
    const originalName = file.replace(/^\d+_/, '').toLowerCase()
    return originalName.includes(cleanName.replace(/\.[^/.]+$/, ""))
  })
  if (match) {
    console.log(`✅ Encontrado por conteúdo: ${match}`)
    return match
  }

  // 4. Nome normalizado contido
  match = imageFiles.find(file => {
    const originalName = file.replace(/^\d+_/, '')
    const normalizedFileName = normalizeText(originalName)
    const searchNameWithoutExt = normalizeText(cleanName.replace(/\.[^/.]+$/, ""))
    return normalizedFileName.includes(searchNameWithoutExt)
  })
  if (match) {
    console.log(`✅ Encontrado por conteúdo normalizado: ${match}`)
    return match
  }

  // 5. Arquivo contém o nome procurado
  match = imageFiles.find(file => {
    return file.toLowerCase().includes(cleanName.replace(/\.[^/.]+$/, ""))
  })
  if (match) {
    console.log(`✅ Encontrado por busca flexível: ${match}`)
    return match
  }

  // 6. Busca mais flexível (sem extensão em ambos os lados)
  const nameWithoutExt = cleanName.replace(/\.[^/.]+$/, "")
  match = imageFiles.find(file => {
    const fileWithoutExt = file.replace(/^\d+_/, '').replace(/\.[^/.]+$/, "").toLowerCase()
    return fileWithoutExt === nameWithoutExt || 
           fileWithoutExt.includes(nameWithoutExt) ||
           nameWithoutExt.includes(fileWithoutExt)
  })
  if (match) {
    console.log(`✅ Encontrado por busca sem extensão: ${match}`)
    return match
  }
  
  console.log(`❌ Nenhuma correspondência encontrada para: ${imageName}`)
  return match
}

/**
 * Lista todas as imagens disponíveis na pasta uploads
 */
export async function listUploadedImages(): Promise<string[]> {
  try {
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    
    if (!existsSync(uploadsDir)) {
      return []
    }

    const files = await readdir(uploadsDir)
    return files.filter(file => 
      /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(file)
    )
  } catch (error) {
    console.error('Erro ao listar imagens:', error)
    return []
  }
}
