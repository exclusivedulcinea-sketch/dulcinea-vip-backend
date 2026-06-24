import { IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum RangoPeriodo {
  HOY        = 'HOY',
  SEMANA     = 'SEMANA',
  MES        = 'MES',
  ANIO       = 'ANIO',
  PERSONALIZADO = 'PERSONALIZADO',
}

export class QueryDashboardDto {
  @IsOptional()
  @IsEnum(RangoPeriodo)
  rango?: RangoPeriodo = RangoPeriodo.MES;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}
