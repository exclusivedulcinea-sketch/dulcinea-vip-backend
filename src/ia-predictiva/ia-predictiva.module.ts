import { Module } from '@nestjs/common';
import { IaPredictivaService } from './ia-predictiva.service';
import { IaPredictivaController } from './ia-predictiva.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IaPredictivaController],
  providers: [IaPredictivaService],
})
export class IaPredictivaModule {}
