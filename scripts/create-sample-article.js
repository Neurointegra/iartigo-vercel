const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createSampleArticle() {
  try {
    // Primeiro, verificar se existe um usuário
    let user = await prisma.user.findFirst()
    
    if (!user) {
      // Criar um usuário de exemplo
      user = await prisma.user.create({
        data: {
          email: 'usuario@exemplo.com',
          name: 'Usuário Exemplo',
          hashedPassword: 'hash_exemplo', // Senha hash seria aqui
          plan: 'FREE',
          articlesUsed: 0,
          articlesLimit: 5,
        }
      })
      console.log('Usuário criado:', user.email)
    }

    // Criar artigo de exemplo
    const article = await prisma.article.create({
      data: {
        title: 'Inteligência Artificial na Educação: Uma Análise Sistemática',
        abstract: 'Este artigo apresenta uma análise sistemática sobre o uso da inteligência artificial na educação, explorando as principais tecnologias, benefícios e desafios. A pesquisa examina como ferramentas de IA podem transformar o processo de ensino-aprendizagem e melhorar os resultados educacionais.',
        keywords: 'inteligência artificial, educação, tecnologia educacional, aprendizagem automatizada',
        content: `1. INTRODUÇÃO

A inteligência artificial (IA) tem se tornado uma tecnologia transformadora em diversos setores, incluindo a educação. Este artigo examina como a IA está sendo aplicada no contexto educacional e quais são os impactos dessa integração.

2. METODOLOGIA

Foi realizada uma revisão sistemática da literatura, analisando artigos publicados entre 2019 e 2024 sobre IA na educação. Os critérios de inclusão incluíram estudos empíricos e revisões teóricas sobre aplicações práticas de IA em ambientes educacionais.

3. RESULTADOS E DISCUSSÃO

3.1 Personalização do Aprendizado

A IA permite a criação de sistemas de aprendizado personalizado, adaptando o conteúdo e o ritmo às necessidades individuais dos estudantes. Plataformas como sistemas tutores inteligentes demonstraram eficácia na melhoria do desempenho acadêmico.

3.2 Automatização de Tarefas Administrativas

Ferramentas de IA podem automatizar tarefas como correção de provas, agendamento e análise de dados de desempenho, liberando tempo dos educadores para atividades mais estratégicas.

3.3 Desafios e Limitações

Apesar dos benefícios, a implementação de IA na educação enfrenta desafios como questões de privacidade, necessidade de treinamento docente e custos de implementação.

4. CONCLUSÃO

A inteligência artificial apresenta um potencial significativo para transformar a educação, oferecendo oportunidades para personalização, eficiência e melhoria dos resultados de aprendizagem. No entanto, sua implementação deve ser cuidadosamente planejada para superar os desafios identificados.

REFERÊNCIAS

Silva, A. B. (2023). Tecnologias educacionais e IA. Revista de Educação Digital, 15(2), 45-62.

Santos, C. D. (2024). Personalização do aprendizado com inteligência artificial. Jornal de Inovação Educacional, 8(1), 23-41.`,
        status: 'completed',
        citationStyle: 'ABNT',
        targetJournal: 'Revista Brasileira de Educação',
        fieldOfStudy: 'Educação e Tecnologia',
        methodology: 'Revisão Sistemática',
        wordCount: 1250,
        userId: user.id,
      },
      include: {
        user: true,
        authors: true,
        literatureSuggestions: true,
      }
    })

    // Adicionar alguns autores
    await prisma.author.createMany({
      data: [
        {
          name: 'Dr. João Silva',
          institution: 'Universidade Federal do Rio de Janeiro',
          email: 'joao.silva@ufrj.br',
          department: 'Departamento de Educação',
          city: 'Rio de Janeiro',
          country: 'Brasil',
          order: 1,
          articleId: article.id,
        },
        {
          name: 'Dra. Maria Santos',
          institution: 'Universidade de São Paulo',
          email: 'maria.santos@usp.br',
          department: 'Instituto de Ciências da Computação',
          city: 'São Paulo',
          country: 'Brasil',
          order: 2,
          articleId: article.id,
        }
      ]
    })

    console.log('Artigo de exemplo criado com sucesso!')
    console.log('ID do artigo:', article.id)
    console.log('Título:', article.title)
    console.log('URL para testar:', `http://localhost:3001/article/${article.id}`)

  } catch (error) {
    console.error('Erro ao criar artigo:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleArticle()
