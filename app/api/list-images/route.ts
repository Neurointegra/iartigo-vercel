import { NextRequest, NextResponse } from 'next/server'
import { listUploadedImages } from '@/lib/utils/image-processor'

export async function GET() {
  try {
    const images = await listUploadedImages()
    
    return NextResponse.json({
      success: true,
      count: images.length,
      images: images.map(filename => ({
        filename,
        url: `/uploads/${filename}`,
        originalName: filename.replace(/^\d+_/, '') // Remove timestamp
      }))
    })
  } catch (error) {
    console.error('Erro ao listar imagens:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
