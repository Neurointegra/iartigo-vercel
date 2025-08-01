import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UserService } from '@/lib/services/user.service'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, institution, department, role, area, plan } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, senha e nome são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se usuário já existe
    const existingUser = await UserService.getByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'Usuário já existe com este email' },
        { status: 400 }
      )
    }

    // Validar senha
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Determinar configuração do plano
    let planConfig: {
      plan: string;
      planType: string;
      creditsRemaining: number;
      articlesLimit: number | null;
    } = {
      plan: 'Por Artigo',
      planType: 'per-article',
      creditsRemaining: 1, // 1 crédito grátis
      articlesLimit: null,
    }

    if (plan === 'professional') {
      planConfig = {
        plan: 'Profissional',
        planType: 'monthly',
        creditsRemaining: 0,
        articlesLimit: 5,
      }
    } else if (plan === 'institutional') {
      planConfig = {
        plan: 'Institucional',
        planType: 'annual',
        creditsRemaining: 0,
        articlesLimit: null, // ilimitado
      }
    }

    // Criar usuário
    const user = await UserService.create({
      email,
      password: hashedPassword,
      name,
      institution: institution || undefined,
      department: department || area || undefined,
      ...planConfig,
      isEmailVerified: false, // Em produção, seria necessário verificação por email
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
      message: 'Conta criada com sucesso'
    }, { status: 201 })

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
    console.error('Error during registration:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
