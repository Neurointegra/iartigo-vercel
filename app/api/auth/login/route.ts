import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UserService } from '@/lib/services/user.service'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar usuário por email
    const user = await UserService.getByEmail(email)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    // Atualizar último login
    await UserService.update(user.id, {
      lastLoginAt: new Date(),
    })

    // Gerar JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Remover senha dos dados retornados
    const { password: _, ...userWithoutPassword } = user

    // Criar response com cookie
    const response = NextResponse.json({
      user: userWithoutPassword,
      token,
      message: 'Login realizado com sucesso'
    })

    // Definir cookie httpOnly para o token
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 dias
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Error during login:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
