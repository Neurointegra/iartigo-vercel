"use server"

interface Author {
  id: string
  name: string
  institution: string
  email: string
  department: string
  city: string
  country: string
}

interface LiteratureSuggestion {
  title: string
  authors: string
  journal: string
  year: number
  doi: string
  abstract: string
  relevance: string
  citation: string
}

interface ArticleData {
  title: string
  abstract: string
  keywords: string
  citationStyle: string
  targetJournal: string
  fieldOfStudy: string
  methodology: string
  includeCharts: boolean
  includeTables: boolean
  researchObjectives: string
  hypothesis: string
  sampleSize: string
  dataCollection: string
  statisticalAnalysis: string
  authors: Author[]
  literatureSuggestions: LiteratureSuggestion[]
}

interface LiteratureRequest {
  fieldOfStudy: string
  keywords: string
  title: string
  abstract: string
}

export async function suggestLiterature(data: LiteratureRequest): Promise<LiteratureSuggestion[]> {
  // Simula o tempo de busca
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const keywords = data.keywords
    .toLowerCase()
    .split(",")
    .map((k) => k.trim())
  const field = data.fieldOfStudy.toLowerCase()

  // Base de dados simulada de literatura por área
  const literatureDatabase: { [key: string]: LiteratureSuggestion[] } = {
    "computer-science": [
      {
        title: "Deep Learning Approaches for Large-Scale Data Analysis: A Comprehensive Review",
        authors: "Zhang, L., Wang, M., Chen, S., Liu, H.",
        journal: "IEEE Transactions on Neural Networks and Learning Systems",
        year: 2023,
        doi: "10.1109/TNNLS.2023.3245678",
        abstract:
          "This comprehensive review examines recent advances in deep learning methodologies for processing and analyzing large-scale datasets. The paper discusses various architectures, optimization techniques, and their applications across different domains.",
        relevance: "Alta",
        citation:
          "Zhang, L., et al. (2023). Deep Learning Approaches for Large-Scale Data Analysis. IEEE Trans. Neural Netw. Learn. Syst., 34(5), 1234-1250.",
      },
      {
        title: "Machine Learning Algorithms for Predictive Analytics: Performance Comparison and Best Practices",
        authors: "Johnson, R., Smith, A., Brown, K.",
        journal: "Journal of Machine Learning Research",
        year: 2023,
        doi: "10.1007/s10994-023-6234-1",
        abstract:
          "A systematic comparison of machine learning algorithms for predictive analytics, including decision trees, neural networks, and ensemble methods. The study provides guidelines for algorithm selection based on data characteristics.",
        relevance: "Alta",
        citation:
          "Johnson, R., Smith, A., & Brown, K. (2023). Machine Learning Algorithms for Predictive Analytics. J. Mach. Learn. Res., 24, 1-28.",
      },
      {
        title: "Artificial Intelligence in Data Mining: Recent Trends and Future Directions",
        authors: "Garcia, M., Rodriguez, P., Martinez, C.",
        journal: "ACM Computing Surveys",
        year: 2022,
        doi: "10.1145/3534678.3539012",
        abstract:
          "This survey presents an overview of artificial intelligence techniques applied to data mining, covering supervised and unsupervised learning methods, feature selection, and pattern recognition algorithms.",
        relevance: "Média",
        citation:
          "Garcia, M., Rodriguez, P., & Martinez, C. (2022). Artificial Intelligence in Data Mining. ACM Comput. Surv., 55(4), 1-35.",
      },
    ],
    medicine: [
      {
        title: "Clinical Applications of Machine Learning in Medical Diagnosis: A Systematic Review",
        authors: "Thompson, D., Wilson, J., Davis, M., Anderson, L.",
        journal: "The Lancet Digital Health",
        year: 2023,
        doi: "10.1016/S2589-7500(23)00045-2",
        abstract:
          "This systematic review analyzes the current state of machine learning applications in medical diagnosis, examining accuracy, reliability, and clinical implementation challenges across various medical specialties.",
        relevance: "Alta",
        citation:
          "Thompson, D., et al. (2023). Clinical Applications of Machine Learning in Medical Diagnosis. Lancet Digit Health, 5(3), e123-e135.",
      },
      {
        title: "Precision Medicine and Personalized Treatment Approaches: Current Evidence and Future Prospects",
        authors: "Lee, S., Kim, H., Park, J., Choi, Y.",
        journal: "Nature Medicine",
        year: 2023,
        doi: "10.1038/s41591-023-02234-5",
        abstract:
          "An comprehensive analysis of precision medicine approaches, including genomic profiling, biomarker identification, and personalized treatment strategies across different disease categories.",
        relevance: "Alta",
        citation:
          "Lee, S., Kim, H., Park, J., & Choi, Y. (2023). Precision Medicine and Personalized Treatment. Nat Med, 29, 456-468.",
      },
      {
        title: "Telemedicine and Digital Health Technologies: Impact on Patient Outcomes",
        authors: "Miller, R., Taylor, S., White, K.",
        journal: "Journal of Medical Internet Research",
        year: 2022,
        doi: "10.2196/35678",
        abstract:
          "This study evaluates the effectiveness of telemedicine and digital health technologies on patient outcomes, accessibility, and healthcare delivery efficiency in various clinical settings.",
        relevance: "Média",
        citation:
          "Miller, R., Taylor, S., & White, K. (2022). Telemedicine and Digital Health Technologies. J Med Internet Res, 24(8), e35678.",
      },
    ],
    biology: [
      {
        title: "CRISPR-Cas9 Gene Editing: Recent Advances and Therapeutic Applications",
        authors: "Chen, X., Liu, Y., Wang, Z., Zhang, Q.",
        journal: "Nature Biotechnology",
        year: 2023,
        doi: "10.1038/s41587-023-01234-8",
        abstract:
          "This review discusses recent advances in CRISPR-Cas9 technology, including improved specificity, delivery methods, and therapeutic applications in treating genetic disorders.",
        relevance: "Alta",
        citation:
          "Chen, X., Liu, Y., Wang, Z., & Zhang, Q. (2023). CRISPR-Cas9 Gene Editing: Recent Advances. Nat Biotechnol, 41, 234-248.",
      },
      {
        title: "Microbiome Research: Implications for Human Health and Disease",
        authors: "Patel, N., Kumar, S., Singh, R.",
        journal: "Cell",
        year: 2023,
        doi: "10.1016/j.cell.2023.02.015",
        abstract:
          "A comprehensive review of microbiome research, exploring the relationship between microbial communities and human health, including therapeutic interventions and diagnostic applications.",
        relevance: "Alta",
        citation:
          "Patel, N., Kumar, S., & Singh, R. (2023). Microbiome Research: Implications for Human Health. Cell, 186(5), 1123-1138.",
      },
    ],
    physics: [
      {
        title: "Quantum Computing Applications in Scientific Simulations: Current State and Future Potential",
        authors: "Williams, A., Johnson, B., Davis, C.",
        journal: "Physical Review Letters",
        year: 2023,
        doi: "10.1103/PhysRevLett.130.123456",
        abstract:
          "This paper explores current applications of quantum computing in scientific simulations, discussing quantum algorithms, hardware limitations, and potential breakthroughs in computational physics.",
        relevance: "Alta",
        citation:
          "Williams, A., Johnson, B., & Davis, C. (2023). Quantum Computing Applications in Scientific Simulations. Phys Rev Lett, 130, 123456.",
      },
    ],
    chemistry: [
      {
        title: "Green Chemistry Approaches in Pharmaceutical Manufacturing: Sustainable Synthesis Methods",
        authors: "Rodriguez, M., Garcia, L., Martinez, P.",
        journal: "Chemical Reviews",
        year: 2023,
        doi: "10.1021/acs.chemrev.2c00789",
        abstract:
          "This comprehensive review examines green chemistry principles applied to pharmaceutical manufacturing, focusing on sustainable synthesis methods, waste reduction, and environmental impact.",
        relevance: "Alta",
        citation:
          "Rodriguez, M., Garcia, L., & Martinez, P. (2023). Green Chemistry Approaches in Pharmaceutical Manufacturing. Chem Rev, 123(8), 4567-4598.",
      },
    ],
    engineering: [
      {
        title: "Smart Materials and Structures: Applications in Civil Engineering",
        authors: "Thompson, K., Wilson, D., Brown, S.",
        journal: "Journal of Structural Engineering",
        year: 2023,
        doi: "10.1061/(ASCE)ST.1943-541X.0003678",
        abstract:
          "This paper reviews the application of smart materials and structures in civil engineering, including self-healing concrete, shape memory alloys, and structural health monitoring systems.",
        relevance: "Alta",
        citation:
          "Thompson, K., Wilson, D., & Brown, S. (2023). Smart Materials and Structures in Civil Engineering. J Struct Eng, 149(4), 04023012.",
      },
    ],
    psychology: [
      {
        title: "Cognitive Behavioral Therapy in the Digital Age: Effectiveness of Online Interventions",
        authors: "Anderson, J., Taylor, M., White, L.",
        journal: "Journal of Clinical Psychology",
        year: 2023,
        doi: "10.1002/jclp.23456",
        abstract:
          "This meta-analysis examines the effectiveness of digital cognitive behavioral therapy interventions, comparing outcomes with traditional face-to-face therapy across various psychological conditions.",
        relevance: "Alta",
        citation:
          "Anderson, J., Taylor, M., & White, L. (2023). Cognitive Behavioral Therapy in the Digital Age. J Clin Psychol, 79(3), 567-582.",
      },
    ],
    economics: [
      {
        title: "Behavioral Economics and Financial Decision Making: Insights from Experimental Studies",
        authors: "Smith, R., Jones, K., Davis, P.",
        journal: "American Economic Review",
        year: 2023,
        doi: "10.1257/aer.20210234",
        abstract:
          "This study presents experimental evidence on behavioral factors influencing financial decision making, including cognitive biases, risk perception, and the role of emotions in economic choices.",
        relevance: "Alta",
        citation:
          "Smith, R., Jones, K., & Davis, P. (2023). Behavioral Economics and Financial Decision Making. Am Econ Rev, 113(4), 1234-1267.",
      },
    ],
  }

  // Seleciona literatura relevante baseada na área de estudo
  let suggestions = literatureDatabase[field] || []

  // Filtra por palavras-chave se disponível
  if (keywords.length > 0) {
    suggestions = suggestions.filter((paper) => {
      const paperText = (paper.title + " " + paper.abstract + " " + paper.authors).toLowerCase()
      return keywords.some((keyword) => paperText.includes(keyword))
    })
  }

  // Se não encontrou nada específico, retorna algumas sugestões gerais da área
  if (suggestions.length === 0 && literatureDatabase[field]) {
    suggestions = literatureDatabase[field].slice(0, 3)
  }

  // Adiciona algumas referências genéricas se ainda não há sugestões
  if (suggestions.length === 0) {
    suggestions = [
      {
        title: `Recent Advances in ${field.charAt(0).toUpperCase() + field.slice(1).replace("-", " ")}: A Comprehensive Review`,
        authors: "Silva, A., Santos, B., Oliveira, C.",
        journal: "International Journal of Advanced Research",
        year: 2023,
        doi: "10.1000/ijr.2023.001",
        abstract: `This comprehensive review examines recent developments in ${field.replace("-", " ")}, providing insights into current methodologies, challenges, and future research directions.`,
        relevance: "Média",
        citation: `Silva, A., Santos, B., & Oliveira, C. (2023). Recent Advances in ${field.charAt(0).toUpperCase() + field.slice(1).replace("-", " ")}. Int J Adv Res, 15(2), 123-145.`,
      },
    ]
  }

  return suggestions.slice(0, 8) // Retorna até 8 sugestões
}

export async function generateArticle(data: ArticleData) {
  // Simula o tempo de processamento
  await new Promise((resolve) => setTimeout(resolve, 3000))

  const citationStyleMap: { [key: string]: string } = {
    apa: "APA",
    abnt: "ABNT",
    vancouver: "Vancouver",
    chicago: "Chicago",
    mla: "MLA",
  }

  const journalMap: { [key: string]: string } = {
    nature: "Nature",
    science: "Science",
    cell: "Cell",
    elsevier: "Elsevier",
    researchgate: "ResearchGate",
    plos: "PLOS ONE",
    ieee: "IEEE Transactions",
  }

  const currentDate = new Date().toLocaleDateString("pt-BR")
  const style = citationStyleMap[data.citationStyle] || "APA"
  const journal = journalMap[data.targetJournal] || "Revista Científica"

  // Gerar dados para gráficos
  const chartData = [
    { category: "Grupo A", value: 85.2, error: 12.4 },
    { category: "Grupo B", value: 78.9, error: 15.1 },
    { category: "Grupo C", value: 92.1, error: 8.7 },
    { category: "Controle", value: 65.3, error: 18.2 },
  ]

  const timeSeriesData = [
    { time: "Semana 1", value: 45.2 },
    { time: "Semana 2", value: 52.8 },
    { time: "Semana 3", value: 61.4 },
    { time: "Semana 4", value: 68.9 },
    { time: "Semana 5", value: 75.3 },
    { time: "Semana 6", value: 82.1 },
  ]

  // Formatação dos autores
  const formatAuthors = () => {
    return data.authors
      .map((author, index) => {
        const superscript = index + 1
        return `${author.name}<sup>${superscript}</sup>`
      })
      .join(", ")
  }

  const formatAffiliations = () => {
    return data.authors
      .map((author, index) => {
        const superscript = index + 1
        return `<p class="text-sm"><sup>${superscript}</sup>${author.department}, ${author.institution}, ${author.city}, ${author.country}. E-mail: ${author.email}</p>`
      })
      .join("")
  }

  const generateCharts = () => {
    if (!data.includeCharts) return ""

    return `
      <section class="mb-8">
        <h3 class="text-xl font-semibold mb-4">Figura 1: Comparação entre Grupos Experimentais</h3>
        <div class="bg-white p-6 border rounded-lg shadow-sm">
          <div class="w-full h-80 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center relative overflow-hidden">
            <svg width="100%" height="100%" viewBox="0 0 400 300" class="absolute inset-0">
              <!-- Eixos -->
              <line x1="50" y1="250" x2="350" y2="250" stroke="#374151" stroke-width="2"/>
              <line x1="50" y1="250" x2="50" y2="50" stroke="#374151" stroke-width="2"/>
              
              <!-- Barras -->
              <rect x="80" y="${250 - chartData[0].value * 2}" width="40" height="${chartData[0].value * 2}" fill="#3B82F6" opacity="0.8"/>
              <rect x="140" y="${250 - chartData[1].value * 2}" width="40" height="${chartData[1].value * 2}" fill="#10B981" opacity="0.8"/>
              <rect x="200" y="${250 - chartData[2].value * 2}" width="40" height="${chartData[2].value * 2}" fill="#F59E0B" opacity="0.8"/>
              <rect x="260" y="${250 - chartData[3].value * 2}" width="40" height="${chartData[3].value * 2}" fill="#EF4444" opacity="0.8"/>
              
              <!-- Barras de erro -->
              ${chartData
                .map((item, i) => {
                  const x = 80 + i * 60 + 20
                  const y = 250 - item.value * 2
                  const errorHeight = item.error
                  return `
                  <line x1="${x}" y1="${y - errorHeight}" x2="${x}" y2="${y + errorHeight}" stroke="#374151" stroke-width="2"/>
                  <line x1="${x - 5}" y1="${y - errorHeight}" x2="${x + 5}" y2="${y - errorHeight}" stroke="#374151" stroke-width="2"/>
                  <line x1="${x - 5}" y1="${y + errorHeight}" x2="${x + 5}" y2="${y + errorHeight}" stroke="#374151" stroke-width="2"/>
                `
                })
                .join("")}
              
              <!-- Labels -->
              <text x="100" y="270" text-anchor="middle" class="text-xs fill-gray-600">Grupo A</text>
              <text x="160" y="270" text-anchor="middle" class="text-xs fill-gray-600">Grupo B</text>
              <text x="220" y="270" text-anchor="middle" class="text-xs fill-gray-600">Grupo C</text>
              <text x="280" y="270" text-anchor="middle" class="text-xs fill-gray-600">Controle</text>
              
              <!-- Valores -->
              <text x="100" y="${250 - (chartData[0].value * 2) - 10}" text-anchor="middle" class="text-xs fill-gray-800 font-semibold">${chartData[0].value}</text>
              <text x="160" y="${250 - (chartData[1].value * 2) - 10}" text-anchor="middle" class="text-xs fill-gray-800 font-semibold">${chartData[1].value}</text>
              <text x="220" y="${250 - (chartData[2].value * 2) - 10}" text-anchor="middle" class="text-xs fill-gray-800 font-semibold">${chartData[2].value}</text>
              <text x="280" y="${250 - (chartData[3].value * 2) - 10}" text-anchor="middle" class="text-xs fill-gray-800 font-semibold">${chartData[3].value}</text>
              
              <!-- Eixo Y labels -->
              <text x="40" y="255" text-anchor="end" class="text-xs fill-gray-600">0</text>
              <text x="40" y="205" text-anchor="end" class="text-xs fill-gray-600">25</text>
              <text x="40" y="155" text-anchor="end" class="text-xs fill-gray-600">50</text>
              <text x="40" y="105" text-anchor="end" class="text-xs fill-gray-600">75</text>
              <text x="40" y="55" text-anchor="end" class="text-xs fill-gray-600">100</text>
            </svg>
          </div>
          <p class="text-sm text-gray-600 mt-4 text-center">
            Valores médios ± desvio padrão para cada grupo experimental. 
            Diferenças estatisticamente significativas (p < 0.05) foram observadas entre todos os grupos.
          </p>
        </div>
      </section>

      <section class="mb-8">
        <h3 class="text-xl font-semibold mb-4">Figura 2: Evolução Temporal dos Resultados</h3>
        <div class="bg-white p-6 border rounded-lg shadow-sm">
          <div class="w-full h-80 bg-gradient-to-br from-green-50 to-green-100 rounded-lg flex items-center justify-center relative overflow-hidden">
            <svg width="100%" height="100%" viewBox="0 0 400 300" class="absolute inset-0">
              <!-- Eixos -->
              <line x1="50" y1="250" x2="350" y2="250" stroke="#374151" stroke-width="2"/>
              <line x1="50" y1="250" x2="50" y2="50" stroke="#374151" stroke-width="2"/>
              
              <!-- Linha de tendência -->
              <polyline 
                points="${timeSeriesData.map((item, i) => `${70 + i * 45},${250 - item.value * 2.5}`).join(" ")}"
                fill="none" 
                stroke="#10B981" 
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              
              <!-- Pontos -->
              ${timeSeriesData
                .map(
                  (item, i) => `
                <circle cx="${70 + i * 45}" cy="${250 - item.value * 2.5}" r="4" fill="#059669"/>
                <text x="${70 + i * 45}" y="${250 - (item.value * 2.5) - 15}" text-anchor="middle" class="text-xs fill-gray-800 font-semibold">${item.value}</text>
              `,
                )
                .join("")}
              
              <!-- Labels X -->
              ${timeSeriesData
                .map(
                  (item, i) => `
                <text x="${70 + i * 45}" y="270" text-anchor="middle" class="text-xs fill-gray-600">${item.time}</text>
              `,
                )
                .join("")}
              
              <!-- Labels Y -->
              <text x="40" y="255" text-anchor="end" class="text-xs fill-gray-600">0</text>
              <text x="40" y="205" text-anchor="end" class="text-xs fill-gray-600">20</text>
              <text x="40" y="155" text-anchor="end" class="text-xs fill-gray-600">40</text>
              <text x="40" y="105" text-anchor="end" class="text-xs fill-gray-600">60</text>
              <text x="40" y="55" text-anchor="end" class="text-xs fill-gray-600">80</text>
            </svg>
          </div>
          <p class="text-sm text-gray-600 mt-4 text-center">
            Evolução temporal dos valores médios ao longo do período de observação. 
            Tendência crescente significativa (R² = 0.94, p < 0.001).
          </p>
        </div>
      </section>
    `
  }

  // Gerar seção de revisão da literatura baseada nas sugestões
  const generateLiteratureReview = () => {
    if (data.literatureSuggestions.length === 0) {
      return `
        <p class="text-justify leading-relaxed mb-4">
          Estudos anteriores na área de ${data.fieldOfStudy.toLowerCase()} demonstraram a importância de 
          abordagens multidisciplinares para compreender fenômenos complexos (Silva et al., 2023; 
          Johnson & Smith, 2022). A literatura existente sugere que fatores metodológicos podem 
          influenciar significativamente os resultados obtidos.
        </p>
        <p class="text-justify leading-relaxed mb-4">
          Pesquisas recentes têm enfatizado a necessidade de validação empírica de teorias estabelecidas, 
          especialmente no contexto de aplicações práticas (Brown et al., 2023; Martinez & Garcia, 2022). 
          Os trabalhos de referência na área indicam lacunas importantes que este estudo pretende abordar.
        </p>
      `
    }

    const topSuggestions = data.literatureSuggestions.slice(0, 4)
    return `
      <p class="text-justify leading-relaxed mb-4">
        A literatura científica na área de ${data.fieldOfStudy.toLowerCase()} tem demonstrado avanços significativos 
        nos últimos anos. ${topSuggestions[0]?.authors.split(",")[0]} et al. (${topSuggestions[0]?.year}) destacaram 
        a importância de ${topSuggestions[0]?.title.toLowerCase()}, fornecendo insights fundamentais para o 
        desenvolvimento de novas abordagens metodológicas.
      </p>
      ${
        topSuggestions[1]
          ? `
      <p class="text-justify leading-relaxed mb-4">
        Complementarmente, ${topSuggestions[1].authors.split(",")[0]} et al. (${topSuggestions[1].year}) 
        investigaram aspectos relacionados a ${topSuggestions[1].title.toLowerCase()}, contribuindo para 
        o entendimento dos mecanismos subjacentes aos fenômenos estudados. Estes achados são particularmente 
        relevantes para o contexto desta pesquisa.
      </p>
      `
          : ""
      }
      ${
        topSuggestions[2]
          ? `
      <p class="text-justify leading-relaxed mb-4">
        Estudos mais recentes, como o trabalho de ${topSuggestions[2].authors.split(",")[0]} et al. (${topSuggestions[2].year}), 
        têm explorado ${topSuggestions[2].title.toLowerCase()}, oferecendo perspectivas inovadoras que 
        influenciam diretamente as hipóteses e metodologias adotadas neste estudo.
      </p>
      `
          : ""
      }
      <p class="text-justify leading-relaxed mb-4">
        A revisão da literatura evidencia lacunas importantes no conhecimento atual, especialmente 
        no que se refere à aplicação prática dos conceitos teóricos estabelecidos. Este estudo 
        visa contribuir para o preenchimento dessas lacunas através de uma abordagem metodológica 
        rigorosa e inovadora.
      </p>
    `
  }

  // Gerar referências baseadas nas sugestões de literatura
  const generateReferences = () => {
    const baseReferences = [
      `Brown, A., Wilson, K., & Davis, M. (2023). Advances in ${data.fieldOfStudy.toLowerCase()} research: A comprehensive review. <em>Journal of Scientific Research</em>, 45(3), 123-145. doi:10.1000/182`,
      `Garcia, L., & Martinez, R. (2022). Methodological approaches in modern research: Statistical considerations and best practices. <em>International Review of Science</em>, 38(2), 67-89. doi:10.1000/183`,
      `Johnson, P., & Smith, J. (2022). Statistical analysis in ${data.fieldOfStudy.toLowerCase()}: Best practices and recommendations for researchers. <em>Statistical Methods Journal</em>, 29(4), 234-256. doi:10.1000/184`,
    ]

    const literatureReferences = data.literatureSuggestions.slice(0, 5).map((ref) => {
      return `${ref.authors} (${ref.year}). ${ref.title}. <em>${ref.journal}</em>. doi:${ref.doi}`
    })

    const additionalReferences = [
      `Silva, C., Santos, A., & Oliveira, B. (2023). Contemporary perspectives on ${data.fieldOfStudy.toLowerCase()} applications in clinical settings. <em>Applied Science Review</em>, 52(1), 78-102. doi:10.1000/185`,
      `Thompson, D., Lee, S., & Anderson, M. (2023). Empirical validation of theoretical frameworks in ${data.fieldOfStudy.toLowerCase()}: A meta-analytical approach. <em>Research Quarterly</em>, 41(2), 145-167. doi:10.1000/186`,
      `Williams, R., Chen, L., & Kumar, S. (2022). Longitudinal studies in ${data.fieldOfStudy.toLowerCase()}: Methodological considerations and practical implications. <em>Longitudinal Research Methods</em>, 15(3), 89-112. doi:10.1000/187`,
    ]

    const allReferences = [...literatureReferences, ...baseReferences, ...additionalReferences]

    return allReferences.map((ref) => `<p class="text-justify">${ref}</p>`).join("\n          ")
  }

  const article = `
    <div class="scientific-article">
      <header class="text-center mb-8 border-b pb-6">
        <h1 class="text-3xl font-bold mb-4">${data.title}</h1>
        
        <div class="mb-4">
          <p class="text-lg text-gray-700 mb-2">${formatAuthors()}</p>
          <div class="text-sm text-gray-600 space-y-1">
            ${formatAffiliations()}
          </div>
        </div>
        
        <div class="text-sm text-gray-500 space-y-1">
          <p>Formatação: ${style} | Revista alvo: ${journal}</p>
          <p>Data de geração: ${currentDate}</p>
          ${data.sampleSize ? `<p>Tamanho da amostra: ${data.sampleSize}</p>` : ""}
          ${data.literatureSuggestions.length > 0 ? `<p>Referências sugeridas: ${data.literatureSuggestions.length}</p>` : ""}
        </div>
      </header>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-blue-800">Resumo</h2>
        <p class="text-justify leading-relaxed mb-4">${data.abstract}</p>
        <p><strong>Palavras-chave:</strong> ${data.keywords}</p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-blue-800">1. Introdução</h2>
        <p class="text-justify leading-relaxed mb-4">
          A área de ${data.fieldOfStudy.toLowerCase()} tem experimentado avanços significativos nas últimas décadas, 
          impulsionada pelo desenvolvimento de novas tecnologias e metodologias de pesquisa. Este estudo visa 
          contribuir para o conhecimento científico através de uma análise sistemática dos aspectos relacionados 
          ao tema "${data.title}".
        </p>
        
        ${
          data.researchObjectives
            ? `
        <h3 class="text-lg font-semibold mb-2 mt-6">1.1 Objetivos</h3>
        <p class="text-justify leading-relaxed mb-4">${data.researchObjectives}</p>
        `
            : ""
        }
        
        ${
          data.hypothesis
            ? `
        <h3 class="text-lg font-semibold mb-2 mt-6">1.2 Hipóteses</h3>
        <p class="text-justify leading-relaxed mb-4">${data.hypothesis}</p>
        `
            : ""
        }
        
        <p class="text-justify leading-relaxed mb-4">
          O objetivo principal desta pesquisa é investigar os fatores que influenciam os resultados observados 
          no contexto específico do estudo, utilizando uma abordagem metodológica rigorosa que permita 
          generalizações confiáveis para a comunidade científica.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-blue-800">2. Revisão da Literatura</h2>
        ${generateLiteratureReview()}
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-blue-800">3. Metodologia</h2>
        <p class="text-justify leading-relaxed mb-4">
          ${data.methodology || "A metodologia adotada neste estudo seguiu uma abordagem quantitativa, com coleta de dados primários através de instrumentos validados."}
        </p>
        
        ${
          data.sampleSize
            ? `
        <h3 class="text-lg font-semibold mb-2 mt-6">3.1 Amostra</h3>
        <p class="text-justify leading-relaxed mb-4">
          A amostra foi composta por ${data.sampleSize}, selecionados através de amostragem probabilística, 
          garantindo representatividade estatística adequada para os objetivos do estudo.
        </p>
        `
            : ""
        }
        
        ${
          data.dataCollection
            ? `
        <h3 class="text-lg font-semibold mb-2 mt-6">3.2 Coleta de Dados</h3>
        <p class="text-justify leading-relaxed mb-4">${data.dataCollection}</p>
        `
            : ""
        }
        
        ${
          data.statisticalAnalysis
            ? `
        <h3 class="text-lg font-semibold mb-2 mt-6">3.3 Análise Estatística</h3>
        <p class="text-justify leading-relaxed mb-4">
          Para análise dos dados, foram empregadas as seguintes técnicas estatísticas: ${data.statisticalAnalysis}. 
          O nível de significância foi estabelecido em p < 0,05 para todos os testes realizados.
        </p>
        `
            : ""
        }
        
        <p class="text-justify leading-relaxed mb-4">
          Os dados foram coletados durante um período de 6 meses, utilizando protocolos padronizados 
          para assegurar a confiabilidade dos resultados. Todos os procedimentos seguiram as diretrizes 
          éticas estabelecidas para pesquisas na área.
        </p>
      </section>

      ${
        data.includeTables
          ? `
      <section class="mb-8">
        <h3 class="text-xl font-semibold mb-4">Tabela 1: Características Demográficas da Amostra</h3>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse border border-gray-300">
            <thead class="bg-gray-100">
              <tr>
                <th class="border border-gray-300 px-4 py-2 text-left">Característica</th>
                <th class="border border-gray-300 px-4 py-2 text-left">n</th>
                <th class="border border-gray-300 px-4 py-2 text-left">%</th>
                <th class="border border-gray-300 px-4 py-2 text-left">Média ± DP</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 px-4 py-2">Idade (anos)</td>
                <td class="border border-gray-300 px-4 py-2">-</td>
                <td class="border border-gray-300 px-4 py-2">-</td>
                <td class="border border-gray-300 px-4 py-2">32.5 ± 8.2</td>
              </tr>
              <tr>
                <td class="border border-gray-300 px-4 py-2">Sexo Masculino</td>
                <td class="border border-gray-300 px-4 py-2">78</td>
                <td class="border border-gray-300 px-4 py-2">52.0</td>
                <td class="border border-gray-300 px-4 py-2">-</td>
              </tr>
              <tr>
                <td class="border border-gray-300 px-4 py-2">Sexo Feminino</td>
                <td class="border border-gray-300 px-4 py-2">72</td>
                <td class="border border-gray-300 px-4 py-2">48.0</td>
                <td class="border border-gray-300 px-4 py-2">-</td>
              </tr>
              <tr>
                <td class="border border-gray-300 px-4 py-2">Escolaridade Superior</td>
                <td class="border border-gray-300 px-4 py-2">124</td>
                <td class="border border-gray-300 px-4 py-2">82.7</td>
                <td class="border border-gray-300 px-4 py-2">-</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-sm text-gray-600 mt-2">DP = Desvio Padrão</p>
      </section>

      <section class="mb-8">
        <h3 class="text-xl font-semibold mb-4">Tabela 2: Resultados Principais por Grupo</h3>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse border border-gray-300">
            <thead class="bg-gray-100">
              <tr>
                <th class="border border-gray-300 px-4 py-2 text-left">Grupo</th>
                <th class="border border-gray-300 px-4 py-2 text-left">n</th>
                <th class="border border-gray-300 px-4 py-2 text-left">Média ± DP</th>
                <th class="border border-gray-300 px-4 py-2 text-left">IC 95%</th>
                <th class="border border-gray-300 px-4 py-2 text-left">p-valor</th>
              </tr>
            </thead>
            <tbody>
              ${chartData
                .map(
                  (item) => `
              <tr>
                <td class="border border-gray-300 px-4 py-2">${item.category}</td>
                <td class="border border-gray-300 px-4 py-2">${Math.floor(Math.random() * 20) + 30}</td>
                <td class="border border-gray-300 px-4 py-2">${item.value} ± ${item.error}</td>
                <td class="border border-gray-300 px-4 py-2">${(item.value - item.error).toFixed(1)} - ${(item.value + item.error).toFixed(1)}</td>
                <td class="border border-gray-300 px-4 py-2">${item.value > 80 ? "0.001**" : item.value > 70 ? "0.032*" : "0.156"}</td>
              </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
        <p class="text-sm text-gray-600 mt-2">*p < 0.05; **p < 0.01; IC = Intervalo de Confiança</p>
      </section>
      `
          : ""
      }

      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-blue-800">4. Resultados e Discussão</h2>
        <p class="text-justify leading-relaxed mb-4">
          Os resultados obtidos demonstram uma correlação significativa entre as variáveis estudadas, 
          confirmando as hipóteses iniciais da pesquisa. A análise estatística revelou diferenças 
          significativas entre os grupos experimentais (p < 0.001), indicando a eficácia da 
          intervenção proposta.
        </p>
        <p class="text-justify leading-relaxed mb-4">
          Os dados coletados mostram que o Grupo C apresentou os melhores resultados (92.1 ± 8.7), 
          seguido pelo Grupo A (85.2 ± 12.4) e Grupo B (78.9 ± 15.1). O grupo controle apresentou 
          valores significativamente menores (65.3 ± 18.2), confirmando a efetividade das intervenções testadas.
        </p>
        
        ${generateCharts()}
        
        <p class="text-justify leading-relaxed mb-4">
          Estes achados são consistentes com estudos anteriores na área, reforçando a validade 
          externa dos resultados. As implicações práticas destes resultados sugerem aplicações 
          potenciais em contextos similares, contribuindo para o avanço do conhecimento na área.
        </p>
        <p class="text-justify leading-relaxed mb-4">
          A análise temporal dos dados (Figura 2) revela uma tendência crescente consistente ao longo 
          do período de observação, com coeficiente de determinação R² = 0.94, indicando alta 
          correlação temporal e validando a metodologia longitudinal empregada.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-blue-800">5. Conclusão</h2>
        <p class="text-justify leading-relaxed mb-4">
          Este estudo contribui significativamente para o entendimento dos fenômenos investigados, 
          fornecendo evidências empíricas robustas que suportam as conclusões apresentadas. 
          Os resultados obtidos têm implicações importantes tanto do ponto de vista teórico 
          quanto prático, especialmente no contexto de ${data.fieldOfStudy.toLowerCase()}.
        </p>
        <p class="text-justify leading-relaxed mb-4">
          As principais contribuições desta pesquisa incluem: (1) validação empírica das hipóteses propostas, 
          (2) demonstração da eficácia das metodologias empregadas, e (3) fornecimento de base sólida 
          para futuras investigações na área.
        </p>
        <p class="text-justify leading-relaxed mb-4">
          Recomenda-se que futuras pesquisas explorem aspectos complementares do tema, 
          utilizando amostras mais amplas e metodologias longitudinais para validar 
          e expandir os achados apresentados neste trabalho. Estudos multicêntricos 
          poderiam fortalecer ainda mais a generalização dos resultados.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-blue-800">Agradecimentos</h2>
        <p class="text-justify leading-relaxed mb-4">
          Os autores agradecem às instituições participantes pelo apoio na realização desta pesquisa, 
          bem como aos participantes que voluntariamente contribuíram para a coleta de dados. 
          Agradecimentos especiais aos revisores anônimos cujas sugestões contribuíram 
          significativamente para a qualidade final deste trabalho.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-blue-800">Referências</h2>
        <div class="space-y-3 text-sm">
          ${generateReferences()}
        </div>
      </section>

      <footer class="mt-12 pt-6 border-t text-center text-sm text-gray-500">
        <p>Artigo gerado pelo iArtigo - Sistema Inteligente de Geração de Artigos Científicos</p>
        <p>Formatação: ${style} | Revista: ${journal} | ${currentDate}</p>
        <p>Correspondência: ${data.authors[0]?.email || "autor@instituicao.edu.br"}</p>
        ${data.literatureSuggestions.length > 0 ? `<p>Literatura sugerida integrada: ${data.literatureSuggestions.length} referências</p>` : ""}
      </footer>
    </div>
  `

  return article
}
