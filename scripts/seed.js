const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function seed() {
  try {
    console.log('🌱 Seeding database...')

    // Hash passwords
    const hashedPassword = await bcrypt.hash('123456', 10)

    // Create users
    const user1 = await prisma.user.create({
      data: {
        email: 'maria.silva@universidade.edu.br',
        password: hashedPassword,
        name: 'Dr. Maria Silva',
        institution: 'Universidade Federal do Brasil',
        department: 'Ciência da Computação',
        city: 'São Paulo',
        country: 'Brasil',
        plan: 'Profissional',
        planType: 'monthly',
        articlesLimit: 5,
        articlesUsed: 3,
        creditsRemaining: 0,
        isEmailVerified: true,
      },
    })

    const user2 = await prisma.user.create({
      data: {
        email: 'joao.santos@pesquisa.org',
        password: hashedPassword,
        name: 'Dr. João Santos',
        institution: 'Instituto de Pesquisa Avançada',
        department: 'Engenharia Biomédica',
        city: 'Rio de Janeiro',
        country: 'Brasil',
        plan: 'Por Artigo',
        planType: 'per-article',
        articlesLimit: null,
        articlesUsed: 0,
        creditsRemaining: 5,
        isEmailVerified: true,
      },
    })

    // Create articles
    const article1 = await prisma.article.create({
      data: {
        title: 'Análise Comparativa de Algoritmos de Machine Learning para Classificação de Dados Médicos',
        abstract: 'Este estudo apresenta uma análise comparativa de diferentes algoritmos de machine learning aplicados à classificação de dados médicos.',
        keywords: 'machine learning, classificação, dados médicos, algoritmos',
        citationStyle: 'ABNT',
        targetJournal: 'Nature Medicine',
        fieldOfStudy: 'Ciência da Computação',
        methodology: 'Experimental',
        includeCharts: true,
        includeTables: true,
        researchObjectives: 'Comparar eficiência de algoritmos',
        hypothesis: 'SVM supera outros algoritmos',
        sampleSize: '1000 pacientes',
        dataCollection: 'Dados hospitalares',
        statisticalAnalysis: 'Análise estatística descritiva',
        status: 'completed',
        content: 'Conteúdo completo do artigo...',
        wordCount: 4500,
        qualityScore: 9.2,
        timeSpent: 180,
        userId: user1.id,
      },
    })

    const article2 = await prisma.article.create({
      data: {
        title: 'Impacto da Inteligência Artificial na Educação Superior',
        abstract: 'Investigação sobre como a IA está transformando o ensino superior.',
        keywords: 'inteligência artificial, educação, ensino superior',
        citationStyle: 'IEEE',
        targetJournal: 'IEEE Transactions',
        fieldOfStudy: 'Educação',
        methodology: 'Revisão Sistemática',
        includeCharts: false,
        includeTables: true,
        status: 'generating',
        userId: user1.id,
      },
    })

    const article3 = await prisma.article.create({
      data: {
        title: 'Metodologias Ágeis em Projetos de Pesquisa Científica',
        abstract: 'Aplicação de metodologias ágeis em projetos de pesquisa.',
        keywords: 'metodologias ágeis, pesquisa científica, gestão de projetos',
        citationStyle: 'APA',
        targetJournal: 'Science',
        fieldOfStudy: 'Gestão de Projetos',
        methodology: 'Estudo de Caso',
        status: 'draft',
        wordCount: 2300,
        userId: user1.id,
      },
    })

    // Create authors for articles
    await prisma.author.createMany({
      data: [
        {
          name: 'Dr. Maria Silva',
          institution: 'Universidade Federal do Brasil',
          email: 'maria.silva@universidade.edu.br',
          department: 'Ciência da Computação',
          city: 'São Paulo',
          country: 'Brasil',
          order: 1,
          articleId: article1.id,
        },
        {
          name: 'Dr. Pedro Costa',
          institution: 'Hospital das Clínicas',
          email: 'pedro.costa@hospital.br',
          department: 'Medicina',
          city: 'São Paulo',
          country: 'Brasil',
          order: 2,
          articleId: article1.id,
        },
      ],
    })

    // Create literature suggestions
    await prisma.literatureSuggestion.createMany({
      data: [
        {
          title: 'Machine Learning in Healthcare: A Review',
          authors: 'Smith, J.; Brown, A.',
          journal: 'Nature Medicine',
          year: 2023,
          doi: '10.1038/s41591-023-01234-5',
          abstract: 'Comprehensive review of ML applications in healthcare.',
          relevance: 'Highly relevant for theoretical foundation',
          citation: 'Smith, J., & Brown, A. (2023). Machine Learning in Healthcare: A Review. Nature Medicine, 30(4), 123-135.',
          isSelected: true,
          articleId: article1.id,
        },
        {
          title: 'Deep Learning for Medical Image Analysis',
          authors: 'Johnson, K.; Wilson, M.',
          journal: 'IEEE TMI',
          year: 2022,
          doi: '10.1109/TMI.2022.3167890',
          abstract: 'Deep learning techniques for medical imaging.',
          relevance: 'Relevant for methodology section',
          citation: 'Johnson, K., & Wilson, M. (2022). Deep Learning for Medical Image Analysis. IEEE TMI, 41(8), 2045-2058.',
          isSelected: false,
          articleId: article1.id,
        },
      ],
    })

    // Create payments
    await prisma.payment.create({
      data: {
        amount: 49.90,
        currency: 'BRL',
        status: 'completed',
        planType: 'monthly',
        transactionId: 'htmt_123456789',
        processedAt: new Date(),
        userId: user1.id,
      },
    })

    await prisma.payment.create({
      data: {
        amount: 19.90,
        currency: 'BRL',
        status: 'completed',
        planType: 'per-article',
        creditsAmount: 3,
        transactionId: 'htmt_987654321',
        processedAt: new Date(),
        userId: user2.id,
      },
    })

    // Create templates
    await prisma.template.createMany({
      data: [
        {
          name: 'Artigo Científico - Ciências Exatas',
          description: 'Template padrão para artigos de ciências exatas',
          category: 'scientific',
          fieldOfStudy: 'Ciências Exatas',
          structure: JSON.stringify({
            sections: [
              'Título',
              'Resumo',
              'Palavras-chave',
              'Introdução',
              'Metodologia',
              'Resultados',
              'Discussão',
              'Conclusão',
              'Referências'
            ],
            requirements: {
              minWords: 3000,
              maxWords: 8000,
              citationStyle: ['ABNT', 'IEEE', 'APA'],
            }
          }),
          isPublic: true,
          usageCount: 45,
        },
        {
          name: 'Artigo Médico - Estudo Clínico',
          description: 'Template para estudos clínicos na área médica',
          category: 'medical',
          fieldOfStudy: 'Medicina',
          structure: JSON.stringify({
            sections: [
              'Título',
              'Resumo Estruturado',
              'Palavras-chave',
              'Introdução',
              'Métodos',
              'Pacientes e Critérios',
              'Resultados',
              'Discussão',
              'Limitações',
              'Conclusão',
              'Conflitos de Interesse',
              'Referências'
            ],
            requirements: {
              minWords: 2500,
              maxWords: 6000,
              citationStyle: ['Vancouver', 'AMA'],
            }
          }),
          isPublic: true,
          usageCount: 32,
        },
        {
          name: 'Paper de Engenharia',
          description: 'Template para papers de engenharia e tecnologia',
          category: 'engineering',
          fieldOfStudy: 'Engenharia',
          structure: JSON.stringify({
            sections: [
              'Abstract',
              'Keywords',
              'Introduction',
              'Background',
              'Methodology',
              'Implementation',
              'Experimental Results',
              'Analysis',
              'Conclusion',
              'Future Work',
              'References'
            ],
            requirements: {
              minWords: 4000,
              maxWords: 10000,
              citationStyle: ['IEEE', 'ACM'],
            }
          }),
          isPublic: true,
          usageCount: 28,
        },
      ],
    })

    // Create statistics entry
    await prisma.statistics.create({
      data: {
        totalArticles: 3,
        totalUsers: 2,
        totalPayments: 69.80,
        averageQuality: 9.2,
        averageWordCount: 3400,
        popularKeywords: JSON.stringify([
          'machine learning',
          'inteligência artificial',
          'metodologias ágeis',
          'dados médicos',
          'educação'
        ]),
        popularJournals: JSON.stringify([
          'Nature Medicine',
          'IEEE Transactions',
          'Science'
        ]),
      },
    })

    console.log('✅ Database seeded successfully!')
    console.log(`👤 Created ${2} users`)
    console.log(`📄 Created ${3} articles`)
    console.log(`💳 Created ${2} payments`)
    console.log(`📋 Created ${3} templates`)
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
seed()
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
