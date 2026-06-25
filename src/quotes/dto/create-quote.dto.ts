import { IsString, IsEmail, IsOptional, IsArray, IsObject, IsNumber } from 'class-validator';

export class EstimateDto {
  @IsString()
  subcategoryId: string;

  @IsArray()
  @IsString({ each: true })
  addonIds: string[];

  @IsObject()
  fieldValues: Record<string, any>;
}

export class CreateQuoteDto {
  @IsString()
  subcategoryId: string;

  @IsArray()
  @IsString({ each: true })
  addonIds: string[];

  @IsObject()
  fieldValues: Record<string, any>;

  @IsString()
  contactName: string;

  @IsEmail()
  contactEmail: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNumber()
  estimatedTotal: number;
}
