import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { randomBytes } from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      // Por segurança, não revelar se o email existe ou não
      return NextResponse.json(
        { success: true, message: 'Se o email existir, você receberá um link de redefinição.' },
        { status: 200 }
      )
    }

    // Gerar token único e seguro
    const resetToken = randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    // Salvar token no banco de dados
    await prisma.passwordReset.create({
      data: {
        email: user.email,
        token: resetToken,
        expiresAt: resetTokenExpiry,
      }
    })

    // Enviar email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`
    
    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl)
      
      return NextResponse.json({
        success: true,
        message: 'Email de redefinição enviado com sucesso!'
      })
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError)
      
      // Remover token se falhar ao enviar email
      await prisma.passwordReset.delete({
        where: { token: resetToken }
      })
      
      return NextResponse.json(
        { error: 'Erro ao enviar email. Tente novamente.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erro na API forgot-password:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
