import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.serviceCategory.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
      include: {
        subcategories: {
          where: { active: true },
          include: {
            addons: { where: { active: true } },
            formFields: { orderBy: { order: 'asc' } },
          },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.serviceCategory.findUnique({
      where: { slug, active: true },
      include: {
        subcategories: {
          where: { active: true },
          include: {
            addons: { where: { active: true } },
            formFields: { orderBy: { order: 'asc' } },
          },
        },
      },
    });
  }
}
