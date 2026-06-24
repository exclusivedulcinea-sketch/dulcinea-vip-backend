import { IsArray, IsNumber, IsOptional, IsString, ValidateNested, Min, ArrayMinSize, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ItemCompraDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'El productoId es obligatorio' })
  productoId: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  cantidad: number;

  @ApiProperty({ example: 15000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  costoUnitario: number;
}

export class CreateCompraDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'El proveedorId es obligatorio' })
  proveedorId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  observacion?: string;

  @ApiProperty({ type: [ItemCompraDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'La compra debe tener al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => ItemCompraDto)
  items: ItemCompraDto[];
}

export class AnularCompraDto {
  @ApiProperty({ example: 'Error en cantidades' })
  @IsString()
  @IsNotEmpty({ message: 'El motivo es obligatorio' })
  motivo: string;
}

export class QueryCompraDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fechaDesde?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fechaHasta?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  proveedorId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  estado?: string;

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
