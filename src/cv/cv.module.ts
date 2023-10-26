import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CVController } from './cv.controller';
import { CVService } from './cv.service';

@Module({
  imports: [
    ConfigModule.forRoot()
  ],
  controllers: [CVController],
  providers: [CVService],
  exports: [CVService]

})
export class CVModule {}
