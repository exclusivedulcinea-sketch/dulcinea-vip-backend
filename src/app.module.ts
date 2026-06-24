import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { InventarioModule } from './inventario/inventario.module';
import { PosModule } from './pos/pos.module';
import { ComprasModule } from './compras/compras.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { IaPredictivaModule } from './ia-predictiva/ia-predictiva.module';
import { ReportesModule } from './reportes/reportes.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { NegociosModule } from './negocios/negocios.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupModule } from './backup/backup.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    InventarioModule,
    PosModule,
    ComprasModule,
    DashboardModule,
    IaPredictivaModule,
    ReportesModule,
    UsuariosModule,
    NegociosModule,
    BackupModule,
  ],
})
export class AppModule {}

