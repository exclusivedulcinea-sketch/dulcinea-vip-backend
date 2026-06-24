import { IsOptional, IsEnum, IsBoolean, IsNumber, Min, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Categoria } from '@prisma/client';

export class QueryProductoDto {
  @ApiPropertyOptional({ description: 'Búsqueda por código, nombre o marca' })
  @IsString()
  @IsOptional()
  busqueda?: string;

  @ApiPropertyOptional({ enum: Categoria })
  @IsEnum(Categoria)
  @IsOptional()
  categoria?: Categoria;

  @ApiPropertyOptional({ description: 'Filtrar solo activos/inactivos' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  activo?: boolean;

  @ApiPropertyOptional({ description: 'Solo productos con stock bajo o agotado' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  stockBajo?: boolean;

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

  @ApiPropertyOptional({ default: 'nombre' })
  @IsString()
  @IsOptional()
  orderBy?: string = 'nombre';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  orderDir?: 'asc' | 'desc' = 'asc';
}
