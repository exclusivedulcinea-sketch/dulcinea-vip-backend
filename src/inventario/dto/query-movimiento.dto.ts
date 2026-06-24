import { IsOptional, IsEnum, IsString, IsNumber, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TipoMovimiento } from '@prisma/client';

export class QueryMovimientoDto {
  @ApiPropertyOptional({ description: 'Filtrar por ID de producto' })
  @IsString()
  @IsOptional()
  productoId?: string;

  @ApiPropertyOptional({ enum: TipoMovimiento })
  @IsEnum(TipoMovimiento)
  @IsOptional()
  tipoMovimiento?: TipoMovimiento;

  @ApiPropertyOptional({ description: 'Fecha inicio (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  fechaDesde?: string;

  @ApiPropertyOptional({ description: 'Fecha fin (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  fechaHasta?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
