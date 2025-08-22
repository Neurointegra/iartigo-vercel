import nodemailer from 'nodemailer'

// Configuração do transporter de email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true para 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendPasswordResetEmail(
  email: string, 
  name: string, 
  resetUrl: string
): Promise<void> {
  const mailOptions = {
    from: `"iArtigo" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Redefinição de Senha - iArtigo',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Redefinição de Senha</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">Olá, ${name}!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            Você solicitou a redefinição da sua senha no iArtigo. 
            Clique no botão abaixo para criar uma nova senha:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      display: inline-block; 
                      font-weight: bold;
                      font-size: 16px;">
              🔑 Redefinir Senha
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Se o botão não funcionar, copie e cole este link no seu navegador:
          </p>
          
          <p style="background: #f5f5f5; padding: 15px; border-radius: 5px; word-break: break-all; color: #333; font-family: monospace;">
            ${resetUrl}
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 14px; margin-bottom: 10px;">
              ⚠️ <strong>Importante:</strong>
            </p>
            <ul style="color: #666; font-size: 14px; line-height: 1.5; margin: 0; padding-left: 20px;">
              <li>Este link expira em 1 hora</li>
              <li>Se você não solicitou esta redefinição, ignore este email</li>
              <li>Nunca compartilhe este link com outras pessoas</li>
            </ul>
          </div>
          
          <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
            <p>Este é um email automático, não responda a esta mensagem.</p>
            <p>© 2024 iArtigo. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('✅ Email de redefinição enviado para:', email)
  } catch (error) {
    console.error('❌ Erro ao enviar email de redefinição:', error)
    throw new Error('Falha ao enviar email de redefinição')
  }
}

export async function sendWelcomeEmail(
  email: string, 
  name: string
): Promise<void> {
  const mailOptions = {
    from: `"iArtigo" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Bem-vindo ao iArtigo! 🚀',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Bem-vindo ao iArtigo!</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">Olá, ${name}!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            Seja bem-vindo ao iArtigo! Sua conta foi criada com sucesso e você já pode começar 
            a usar nossa plataforma para gerar artigos científicos com inteligência artificial.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      display: inline-block; 
                      font-weight: bold;
                      font-size: 16px;">
              🚀 Acessar Dashboard
            </a>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #333; margin-top: 0;">✨ O que você pode fazer agora:</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li>Gerar artigos científicos com IA</li>
              <li>Escolher entre diferentes planos de assinatura</li>
              <li>Acessar recursos exclusivos para pesquisadores</li>
              <li>Personalizar suas preferências de pesquisa</li>
            </ul>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Se você tiver alguma dúvida ou precisar de ajuda, nossa equipe de suporte 
            está sempre disponível para ajudar.
          </p>
          
          <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
            <p>© 2024 iArtigo. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('✅ Email de boas-vindas enviado para:', email)
  } catch (error) {
    console.error('❌ Erro ao enviar email de boas-vindas:', error)
    // Não vamos falhar o registro por causa do email de boas-vindas
  }
}
