import {
  IsEnum, IsArray, IsNumber, IsOptional, IsString,
  ValidateNested, Min, ArrayMinSize, IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetodoPago } from '@prisma/client';

export class ItemCarritoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'El productoId es obligatorio' })
  productoId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(0.001, { message: 'La cantidad debe ser mayor a cero' })
  @Type(() => Number)
  cantidad: number;
}

export class CrearVentaDto {
  @ApiProperty({ type: [ItemCarritoDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'La venta debe tener al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => ItemCarritoDto)
  items: ItemCarritoDto[];

  @ApiProperty({ enum: MetodoPago })
  @IsEnum(MetodoPago, { message: 'Método de pago no válido' })
  metodoPago: MetodoPago;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  descuento?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  observacion?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cajaId?: string;
}
