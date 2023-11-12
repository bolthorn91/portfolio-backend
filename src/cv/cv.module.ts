import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CVController } from './cv.controller';
import { CVService } from './cv.service';
import { PdfService } from 'src/services/pdf.service';

@Module({
  imports: [
    ConfigModule.forRoot()
  ],
  controllers: [CVController],
  providers: [CVService, PdfService],
  exports: [CVService, PdfService]

})
export class CVModule {}
