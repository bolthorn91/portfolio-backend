import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EstimateDto, CreateQuoteDto } from './dto/create-quote.dto';
import { QuoteStatus, ConsultingStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService) {}

  async estimate(dto: EstimateDto) {
    const subcategory = await this.prisma.serviceSubcategory.findUnique({
      where: { id: dto.subcategoryId },
      include: { addons: true, formFields: true },
    });
    if (!subcategory) throw new NotFoundException('Subcategory not found');

    let basePrice = subcategory.minPrice || subcategory.basePrice || 0;
    if (subcategory.priceType === 'RANGE') {
      basePrice = subcategory.minPrice || 0;
    }

    let addonsPrice = 0;
    for (const addonId of dto.addonIds) {
      const addon = subcategory.addons.find((a) => a.id === addonId);
      if (addon) {
        addonsPrice += addon.priceType === 'PERCENTAGE'
          ? basePrice * (addon.price / 100)
          : addon.price;
      }
    }

    let fieldModifiers = 0;
    for (const field of subcategory.formFields) {
      if (field.fieldType === 'SELECT' || field.fieldType === 'MULTISELECT') {
        const value = dto.fieldValues[field.id];
        if (value && field.options) {
          const options = JSON.parse(field.options);
          if (Array.isArray(value)) {
            for (const v of value) {
              const opt = options.find((o) => o.value === v);
              if (opt?.priceModifier) fieldModifiers += opt.priceModifier;
            }
          } else {
            const opt = options.find((o) => o.value === value);
            if (opt?.priceModifier) fieldModifiers += opt.priceModifier;
          }
        }
      }
    }

    const total = basePrice + addonsPrice + fieldModifiers;
    const requiresConsulting = subcategory.requiresConsulting;
    const consultingHours = requiresConsulting
      ? Math.round((subcategory.consultingHoursMin + subcategory.consultingHoursMax) / 2)
      : null;
    const consultingPrice = requiresConsulting
      ? consultingHours * 100
      : null;

    return {
      basePrice,
      addonsPrice,
      fieldModifiers,
      total,
      requiresConsulting,
      consultingPrice,
      consultingHours,
      depositAmount: Math.round(total * 0.5 * 100) / 100,
    };
  }

  async create(dto: CreateQuoteDto, userId?: string) {
    const subcategory = await this.prisma.serviceSubcategory.findUnique({
      where: { id: dto.subcategoryId },
      include: { addons: true, formFields: true },
    });
    if (!subcategory) throw new NotFoundException('Subcategory not found');

    const estimate = await this.estimate({
      subcategoryId: dto.subcategoryId,
      addonIds: dto.addonIds,
      fieldValues: dto.fieldValues,
    });

    const requiresConsulting = subcategory.requiresConsulting;
    const consultingHours = requiresConsulting
      ? Math.round((subcategory.consultingHoursMin + subcategory.consultingHoursMax) / 2)
      : 0;
    const consultingPrice = requiresConsulting ? consultingHours * 100 : 0;

    const quoteCount = await this.prisma.quote.count();
    const reference = `BUD-${new Date().getFullYear()}-${String(quoteCount + 1).padStart(4, '0')}`;
    const token = crypto.randomBytes(16).toString('hex');

    const status: QuoteStatus = requiresConsulting ? 'CONSULTING_REQUIRED' : 'APPROVED';

    const quote = await this.prisma.quote.create({
      data: {
        reference,
        token,
        status,
        contactName: dto.contactName,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        company: dto.company,
        notes: dto.notes,
        totalEstimate: estimate.total,
        depositAmount: estimate.depositAmount,
        userId,
        items: {
          create: {
            subcategoryId: dto.subcategoryId,
            quantity: 1,
            unitPrice: estimate.basePrice,
            totalPrice: estimate.basePrice,
          },
        },
        addons: {
          create: dto.addonIds.map((addonId) => {
            const addon = subcategory.addons.find((a) => a.id === addonId);
            return { addonId, price: addon?.price || 0 };
          }),
        },
        fieldValues: {
          create: Object.entries(dto.fieldValues).map(([fieldId, value]) => {
            const field = subcategory.formFields.find((f) => f.id === fieldId);
            return {
              fieldId,
              value: String(value),
            };
          }),
        },
        consulting: requiresConsulting
          ? {
              create: {
                hours: consultingHours,
                totalPrice: consultingPrice,
                status: 'PENDING' as ConsultingStatus,
              },
            }
          : undefined,
      },
      include: {
        items: { include: { subcategory: true } },
        addons: { include: { addon: true } },
        fieldValues: { include: { field: true } },
        consulting: true,
      },
    });

    await this.prisma.quoteStatusLog.create({
      data: { quoteId: quote.id, status },
    });

    return {
      id: quote.id,
      reference: quote.reference,
      status: quote.status,
      token: quote.token,
      totalEstimate: quote.totalEstimate,
      depositAmount: quote.depositAmount,
      requiresConsulting,
      consulting: quote.consulting
        ? { hours: quote.consulting.hours, price: quote.consulting.totalPrice, status: quote.consulting.status }
        : null,
      createdAt: quote.createdAt,
      statusUrl: `/presupuesto/${quote.token}`,
    };
  }

  async findByToken(token: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { token },
      include: {
        items: { include: { subcategory: true, addons: { include: { addon: true } } } },
        addons: { include: { addon: true } },
        fieldValues: { include: { field: true } },
        consulting: true,
        payments: true,
      },
    });
    if (!quote) throw new NotFoundException('Quote not found');

    const statusLogs = await this.prisma.quoteStatusLog.findMany({
      where: { quoteId: quote.id },
      orderBy: { timestamp: 'asc' },
    });

    return {
      id: quote.id,
      reference: quote.reference,
      status: quote.status,
      totalEstimate: quote.totalEstimate,
      depositAmount: quote.depositAmount,
      paidAmount: quote.paidAmount,
      requiresConsulting: !!quote.consulting,
      consulting: quote.consulting
        ? { hours: quote.consulting.hours, price: quote.consulting.totalPrice, status: quote.consulting.status }
        : null,
      contactName: quote.contactName,
      contactEmail: quote.contactEmail,
      items: quote.items.map((i) => ({
        subcategoryName: i.subcategory.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
      })),
      addons: quote.addons.map((a) => ({ name: a.addon.name, price: a.price })),
      fieldValues: quote.fieldValues.map((fv) => {
        const field = quote.fieldValues.find((f) => f.fieldId === fv.fieldId);
        return {
          label: fv.field?.label || fv.fieldId,
          value: fv.value,
        };
      }),
      statusHistory: statusLogs.map((log) => ({
        status: log.status,
        timestamp: log.timestamp,
      })),
      createdAt: quote.createdAt,
    };
  }

  async findMine(userId: string) {
    return this.prisma.quote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        reference: true,
        status: true,
        totalEstimate: true,
        createdAt: true,
      },
    });
  }
}
