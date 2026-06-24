import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Categoria, Unidad } from '@prisma/client';

export class UpdateProductoDto {
  @ApiPropertyOptional({ example: 'Ron Bacardí Añejo Especial' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nombre?: string;

  @ApiPropertyOptional({ enum: Categoria })
  @IsEnum(Categoria)
  @IsOptional()
  categoria?: Categoria;

  @ApiPropertyOptional({ example: 'Bacardí' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  marca?: string;

  @ApiPropertyOptional({ enum: Unidad })
  @IsEnum(Unidad)
  @IsOptional()
  unidad?: Unidad;

  @ApiPropertyOptional({ example: 48000 })
  @IsNumber()
  @Min(0.01, { message: 'El precio de compra debe ser mayor a cero' })
  @IsOptional()
  @Type(() => Number)
  precioCompra?: number;

  @ApiPropertyOptional({ example: 80000 })
  @IsNumber()
  @Min(0.01, { message: 'El precio de venta debe ser mayor a cero' })
  @IsOptional()
  @Type(() => Number)
  precioVenta?: number;

  @ApiPropertyOptional({ example: 8 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  stockMinimo?: number;
}
