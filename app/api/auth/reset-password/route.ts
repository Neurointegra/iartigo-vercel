import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token e nova senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Buscar o token de redefinição
    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token }
    })

    if (!passwordReset) {
      return NextResponse.json(
        { error: 'Token de redefinição inválido' },
        { status: 400 }
      )
    }

    // Verificar se o token expirou
    if (passwordReset.expiresAt < new Date()) {
      // Remover token expirado
      await prisma.passwordReset.delete({
        where: { id: passwordReset.id }
      })
      
      return NextResponse.json(
        { error: 'Token de redefinição expirado' },
        { status: 400 }
      )
    }

    // Verificar se o token já foi usado
    if (passwordReset.used) {
      return NextResponse.json(
        { error: 'Token de redefinição já foi usado' },
        { status: 400 }
      )
    }

    // Buscar o usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: passwordReset.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Criptografar a nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Atualizar a senha do usuário
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    // Marcar o token como usado
    await prisma.passwordReset.update({
      where: { id: passwordReset.id },
      data: { used: true }
    })

    // Remover todos os outros tokens de redefinição para este usuário
    await prisma.passwordReset.deleteMany({
      where: { 
        email: passwordReset.email,
        id: { not: passwordReset.id }
      }
    })

    console.log('✅ Senha redefinida com sucesso para:', user.email)

    return NextResponse.json({
      success: true,
      message: 'Senha redefinida com sucesso!'
    })

  } catch (error) {
    console.error('Erro na API reset-password:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
