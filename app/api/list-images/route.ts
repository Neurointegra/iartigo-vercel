import { NextRequest, NextResponse } from 'next/server'
import { listUploadedImages } from '@/lib/utils/image-processor'

export async function GET() {
  try {
    const images = await listUploadedImages()
    
    const response = {
      success: true,
      count: images.length,
      images: images.map(filename => ({
        filename,
        url: `/uploads/${filename}`,
        originalName: filename.replace(/^\d+_/, '') // Remove timestamp
      }))
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Erro ao listar imagens:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: errorMessage },
      { status: 500 }
    )
  }
}
