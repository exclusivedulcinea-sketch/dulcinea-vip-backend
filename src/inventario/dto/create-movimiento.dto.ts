import {
  IsString,
  IsEnum,
  IsNumber,
  Min,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoMovimiento } from '@prisma/client';

export class CreateMovimientoDto {
  @ApiProperty({ description: 'ID del producto' })
  @IsString()
  @IsNotEmpty({ message: 'El producto es obligatorio' })
  productoId: string;

  @ApiProperty({ enum: TipoMovimiento, example: TipoMovimiento.ENTRADA })
  @IsEnum(TipoMovimiento, { message: 'Tipo de movimiento no válido' })
  tipoMovimiento: TipoMovimiento;

  @ApiProperty({ example: 10, description: 'Cantidad del movimiento (mayor a 0)' })
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(0.001, { message: 'La cantidad debe ser mayor a cero' })
  @Type(() => Number)
  cantidad: number;

  @ApiPropertyOptional({ example: 'Compra a proveedor XYZ' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  observacion?: string;
}
