import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { EstimateDto, CreateQuoteDto } from './dto/create-quote.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';

@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post('estimate')
  async estimate(@Body() dto: EstimateDto) {
    return this.quotesService.estimate(dto);
  }

  @Post()
  @UseGuards(OptionalAuthGuard)
  async create(@Body() dto: CreateQuoteDto, @Req() req: any) {
    return this.quotesService.create(dto, req.user?.id);
  }

  @Get(':token')
  async findByToken(@Param('token') token: string) {
    return this.quotesService.findByToken(token);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  async findMine(@Req() req: any) {
    return this.quotesService.findMine(req.user.id);
  }
}
