import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnularVentaDto {
  @ApiProperty({ example: 'Error en el cobro al cliente' })
  @IsString()
  @IsNotEmpty({ message: 'El motivo de anulación es obligatorio' })
  @MaxLength(500)
  motivo: string;
}
