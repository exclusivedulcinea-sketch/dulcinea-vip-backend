import { Module } from '@nestjs/common';
import { NegociosController } from './negocios.controller';

@Module({
  controllers: [NegociosController],
})
export class NegociosModule {}
