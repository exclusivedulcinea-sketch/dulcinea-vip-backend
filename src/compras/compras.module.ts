import { Module } from '@nestjs/common';
import { ProveedoresService } from './proveedores.service';
import { ProveedoresController } from './proveedores.controller';
import { ComprasService } from './compras.service';
import { ComprasController } from './compras.controller';

@Module({
  controllers: [ProveedoresController, ComprasController],
  providers: [ProveedoresService, ComprasService],
  exports: [ProveedoresService, ComprasService],
})
export class ComprasModule {}
