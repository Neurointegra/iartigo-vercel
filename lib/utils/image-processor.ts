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
<div style="text-align: center; margin: 20px 0;">
  <img src="${imageUrl}" alt="${cleanImageName}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
  <p style="font-style: italic; color: #666; font-size: 14px; margin-top: 8px;">Figura: ${cleanImageName}</p>
</div>`
        
        processedContent = processedContent.replace(fullMatch, imageHtml)
        console.log(`✅ Imagem processada: ${cleanImageName} -> ${imageUrl}`)
      } else {
        console.log(`⚠️ Imagem não encontrada: ${cleanImageName}`)
        console.log(`   Arquivos disponíveis: ${imageFiles.join(', ')}`)
        // Manter a tag original se não encontrar a imagem
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
  
  // Estratégias de busca (em ordem de prioridade):
  
  // 1. Nome exato (removendo timestamp)
  let match = imageFiles.find(file => {
    const originalName = file.replace(/^\d+_/, '').toLowerCase()
    return originalName === cleanName
  })
  if (match) return match

  // 2. Nome contido no arquivo (removendo timestamp)
  match = imageFiles.find(file => {
    const originalName = file.replace(/^\d+_/, '').toLowerCase()
    return originalName.includes(cleanName.replace(/\.[^/.]+$/, ""))
  })
  if (match) return match

  // 3. Arquivo contém o nome procurado
  match = imageFiles.find(file => {
    return file.toLowerCase().includes(cleanName.replace(/\.[^/.]+$/, ""))
  })
  if (match) return match

  // 4. Busca mais flexível (sem extensão em ambos os lados)
  const nameWithoutExt = cleanName.replace(/\.[^/.]+$/, "")
  match = imageFiles.find(file => {
    const fileWithoutExt = file.replace(/^\d+_/, '').replace(/\.[^/.]+$/, "").toLowerCase()
    return fileWithoutExt === nameWithoutExt || 
           fileWithoutExt.includes(nameWithoutExt) ||
           nameWithoutExt.includes(fileWithoutExt)
  })
  
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
