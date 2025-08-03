import { prisma } from '@/lib/database'

export type CreateTemplateData = {
  name: string
  description?: string
  category: string
  fieldOfStudy?: string
  structure: string // JSON string
  isPublic?: boolean
}

export type UpdateTemplateData = Partial<CreateTemplateData>

export class TemplateService {
  // Create template
  static async create(data: CreateTemplateData) {
    return await prisma.template.create({
      data,
    })
  }

  // Get template by ID
  static async getById(id: string) {
    return await prisma.template.findUnique({
      where: { id },
    })
  }

  // Update template
  static async update(id: string, data: UpdateTemplateData) {
    return await prisma.template.update({
      where: { id },
      data,
    })
  }

  // Delete template
  static async delete(id: string) {
    return await prisma.template.delete({
      where: { id },
    })
  }

  // Get all public templates
  static async getPublic(page = 1, limit = 10, category?: string, fieldOfStudy?: string) {
    const skip = (page - 1) * limit
    
    const where: any = { isPublic: true }
    if (category) where.category = category
    if (fieldOfStudy) where.fieldOfStudy = fieldOfStudy
    
    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { usageCount: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.template.count({ where }),
    ])

    return {
      templates,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  // Get all templates with pagination
  static async getAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit
    
    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.template.count(),
    ])

    return {
      templates,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  // Search templates
  static async search(query: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit
    
    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
            { category: { contains: query } },
            { 
              AND: [
                { fieldOfStudy: { not: null } },
                { fieldOfStudy: { contains: query } }
              ]
            },
          ],
        },
        skip,
        take: limit,
        orderBy: { usageCount: 'desc' },
      }),
      prisma.template.count({
        where: {
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
            { category: { contains: query } },
            { 
              AND: [
                { fieldOfStudy: { not: null } },
                { fieldOfStudy: { contains: query } }
              ]
            },
          ],
        },
      }),
    ])

    return {
      templates,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      query,
    }
  }

  // Get templates by category
  static async getByCategory(category: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit
    
    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where: { 
          category,
          isPublic: true,
        },
        skip,
        take: limit,
        orderBy: { usageCount: 'desc' },
      }),
      prisma.template.count({
        where: { 
          category,
          isPublic: true,
        },
      }),
    ])

    return {
      templates,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  // Get popular templates
  static async getPopular(limit = 10) {
    return await prisma.template.findMany({
      where: { isPublic: true },
      take: limit,
      orderBy: { usageCount: 'desc' },
    })
  }

  // Increment usage count
  static async incrementUsage(id: string) {
    return await prisma.template.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    })
  }

  // Get categories with counts
  static async getCategories() {
    const templates = await prisma.template.findMany({
      where: { isPublic: true },
      select: {
        category: true,
        fieldOfStudy: true,
      },
    })

    const categoryCount: Record<string, number> = {}
    const fieldCount: Record<string, number> = {}

    templates.forEach((template: any) => {
      categoryCount[template.category] = (categoryCount[template.category] || 0) + 1
      
      if (template.fieldOfStudy) {
        fieldCount[template.fieldOfStudy] = (fieldCount[template.fieldOfStudy] || 0) + 1
      }
    })

    return {
      categories: Object.entries(categoryCount).map(([category, count]) => ({
        category,
        count,
      })),
      fields: Object.entries(fieldCount).map(([field, count]) => ({
        field,
        count,
      })),
    }
  }

  // Get template statistics
  static async getStatistics() {
    const [
      total,
      publicTemplates,
      privateTemplates,
      totalUsage,
      categories,
    ] = await Promise.all([
      prisma.template.count(),
      prisma.template.count({ where: { isPublic: true } }),
      prisma.template.count({ where: { isPublic: false } }),
      prisma.template.aggregate({
        _sum: { usageCount: true },
      }),
      prisma.template.groupBy({
        by: ['category'],
        _count: {
          _all: true,
        },
      }),
    ])

    return {
      total,
      publicTemplates,
      privateTemplates,
      totalUsage: totalUsage._sum.usageCount || 0,
      categoriesBreakdown: categories.map((cat: any) => ({
        category: cat.category,
        count: cat._count._all,
      })),
    }
  }
}
