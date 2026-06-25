import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuoteStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async listQuotes(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { contactName: { contains: params.search, mode: 'insensitive' } },
        { contactEmail: { contains: params.search, mode: 'insensitive' } },
        { reference: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.quote.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [params.sortBy || 'createdAt']: params.sortOrder || 'desc' },
        include: {
          items: { include: { subcategory: true } },
          consulting: true,
        },
      }),
      this.prisma.quote.count({ where }),
    ]);

    return {
      data: data.map((q) => ({
        id: q.id,
        reference: q.reference,
        status: q.status,
        contactName: q.contactName,
        contactEmail: q.contactEmail,
        totalEstimate: q.totalEstimate,
        createdAt: q.createdAt,
        subcategoryName: q.items[0]?.subcategory?.name || 'N/A',
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getQuoteDetail(id: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        items: { include: { subcategory: true, addons: { include: { addon: true } } } },
        addons: { include: { addon: true } },
        fieldValues: { include: { field: true } },
        consulting: true,
        payments: true,
        user: true,
      },
    });
    if (!quote) throw new NotFoundException('Quote not found');

    const statusLogs = await this.prisma.quoteStatusLog.findMany({
      where: { quoteId: quote.id },
      orderBy: { timestamp: 'asc' },
    });

    return { ...quote, statusHistory: statusLogs };
  }

  async updateQuoteStatus(id: string, status: QuoteStatus, adminNotes?: string) {
    const quote = await this.prisma.quote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Quote not found');

    await this.prisma.quote.update({
      where: { id },
      data: { status, consultantNotes: adminNotes || quote.consultantNotes },
    });

    await this.prisma.quoteStatusLog.create({
      data: { quoteId: id, status },
    });

    return { success: true, status };
  }

  async setFinalPrice(id: string, totalPrice: number, depositAmount?: number, adminNotes?: string) {
    const quote = await this.prisma.quote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Quote not found');

    await this.prisma.quote.update({
      where: { id },
      data: {
        totalEstimate: totalPrice,
        depositAmount: depositAmount || Math.round(totalPrice * 0.5 * 100) / 100,
        consultantNotes: adminNotes || quote.consultantNotes,
        status: 'QUOTED',
      },
    });

    await this.prisma.quoteStatusLog.create({
      data: { quoteId: id, status: 'QUOTED' },
    });

    return { success: true, totalPrice, status: 'QUOTED' };
  }

  async updateConsulting(id: string, data: { hours?: number; adminNotes?: string; reportUrl?: string }) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: { consulting: true },
    });
    if (!quote) throw new NotFoundException('Quote not found');
    if (!quote.consulting) throw new NotFoundException('No consulting for this quote');

    const updateData: any = {};
    if (data.hours) {
      updateData.hours = data.hours;
      updateData.totalPrice = data.hours * 100;
    }
    if (data.adminNotes) updateData.adminNotes = data.adminNotes;
    if (data.reportUrl) updateData.reportUrl = data.reportUrl;

    if (Object.keys(updateData).length > 0) {
      await this.prisma.preConsulting.update({
        where: { quoteId: id },
        data: { ...updateData, status: 'COMPLETED' },
      });
    }

    return { success: true };
  }

  async getStats() {
    const [totalQuotes, byStatus, paidQuotes] = await Promise.all([
      this.prisma.quote.count(),
      this.prisma.quote.groupBy({ by: ['status'], _count: true }),
      this.prisma.payment.findMany({
        where: { status: 'COMPLETED' },
        select: { amount: true, createdAt: true },
      }),
    ]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const revenueThisMonth = paidQuotes
      .filter((p) => p.createdAt >= startOfMonth)
      .reduce((sum, p) => sum + p.amount, 0);

    const revenueTotal = paidQuotes.reduce((sum, p) => sum + p.amount, 0);

    const byService = await this.prisma.quoteItem.groupBy({
      by: ['subcategoryId'],
      _count: true,
    });

    const subcategories = await this.prisma.serviceSubcategory.findMany({
      include: { category: true },
    });
    const byServiceMap: Record<string, number> = {};
    for (const item of byService) {
      const sub = subcategories.find((s) => s.id === item.subcategoryId);
      if (sub) {
        const key = sub.category.slug;
        byServiceMap[key] = (byServiceMap[key] || 0) + item._count;
      }
    }

    const byStatusMap: Record<string, number> = {};
    for (const item of byStatus) {
      byStatusMap[item.status] = item._count;
    }

    return {
      totalQuotes,
      pendingQuotes: byStatusMap['PENDING'] || 0,
      consultingRequired: byStatusMap['CONSULTING_REQUIRED'] || 0,
      inProgress: byStatusMap['IN_PROGRESS'] || 0,
      completed: byStatusMap['COMPLETED'] || 0,
      revenueThisMonth,
      revenueTotal,
      byService: byServiceMap,
      byStatus: byStatusMap,
    };
  }
}
