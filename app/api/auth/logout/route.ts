import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({
      message: 'Logout realizado com sucesso'
    })

    // Remover cookie do token
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expira imediatamente
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Error during logout:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
