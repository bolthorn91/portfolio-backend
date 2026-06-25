import { Controller, Get, Patch, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('quotes')
  async listQuotes(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.adminService.listQuotes({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      status,
      search,
      sortBy,
      sortOrder,
    });
  }

  @Get('quotes/:id')
  async getQuoteDetail(@Param('id') id: string) {
    return this.adminService.getQuoteDetail(id);
  }

  @Patch('quotes/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('adminNotes') adminNotes?: string,
  ) {
    return this.adminService.updateQuoteStatus(id, status as any, adminNotes);
  }

  @Patch('quotes/:id/price')
  async setFinalPrice(
    @Param('id') id: string,
    @Body('totalPrice') totalPrice: number,
    @Body('depositAmount') depositAmount?: number,
    @Body('adminNotes') adminNotes?: string,
  ) {
    return this.adminService.setFinalPrice(id, totalPrice, depositAmount, adminNotes);
  }

  @Patch('quotes/:id/consulting')
  async updateConsulting(
    @Param('id') id: string,
    @Body() data: { hours?: number; adminNotes?: string; reportUrl?: string },
  ) {
    return this.adminService.updateConsulting(id, data);
  }

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }
}
