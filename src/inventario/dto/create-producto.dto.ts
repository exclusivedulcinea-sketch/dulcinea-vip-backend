import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Categoria, Unidad } from '@prisma/client';

export class CreateProductoDto {
  @ApiProperty({ example: 'LIC-001', description: 'Código único del producto' })
  @IsString()
  @IsNotEmpty({ message: 'El código es obligatorio' })
  @MaxLength(50)
  codigo: string;

  @ApiProperty({ example: 'Ron Bacardí Añejo' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(200)
  nombre: string;

  @ApiProperty({ enum: Categoria, example: Categoria.LICOR })
  @IsEnum(Categoria, { message: 'Categoría no válida' })
  categoria: Categoria;

  @ApiPropertyOptional({ example: 'Bacardí' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  marca?: string;

  @ApiProperty({ enum: Unidad, example: Unidad.BOTELLA })
  @IsEnum(Unidad, { message: 'Unidad no válida' })
  unidad: Unidad;

  @ApiProperty({ example: 45000, description: 'Precio de compra (mayor a 0)' })
  @IsNumber({}, { message: 'El precio de compra debe ser un número' })
  @Min(0.01, { message: 'El precio de compra debe ser mayor a cero' })
  @Type(() => Number)
  precioCompra: number;

  @ApiProperty({ example: 75000, description: 'Precio de venta (mayor a 0)' })
  @IsNumber({}, { message: 'El precio de venta debe ser un número' })
  @Min(0.01, { message: 'El precio de venta debe ser mayor a cero' })
  @Type(() => Number)
  precioVenta: number;

  @ApiPropertyOptional({ example: 0, description: 'Stock inicial (no negativo)' })
  @IsNumber()
  @Min(0, { message: 'El stock no puede ser negativo' })
  @IsOptional()
  @Type(() => Number)
  stockActual?: number;

  @ApiPropertyOptional({ example: 5, description: 'Stock mínimo para alertas' })
  @IsNumber()
  @Min(0, { message: 'El stock mínimo no puede ser negativo' })
  @IsOptional()
  @Type(() => Number)
  stockMinimo?: number;
}
