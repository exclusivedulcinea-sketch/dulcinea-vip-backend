import { IsOptional, IsEnum, IsString, IsNumber, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MetodoPago, EstadoVenta } from '@prisma/client';

export class QueryVentaDto {
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  fechaDesde?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  fechaHasta?: string;

  @ApiPropertyOptional({ enum: MetodoPago })
  @IsEnum(MetodoPago)
  @IsOptional()
  metodoPago?: MetodoPago;

  @ApiPropertyOptional({ enum: EstadoVenta })
  @IsEnum(EstadoVenta)
  @IsOptional()
  estado?: EstadoVenta;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  usuarioId?: string;

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
