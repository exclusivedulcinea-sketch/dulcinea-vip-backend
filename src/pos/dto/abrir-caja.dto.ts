import { IsNumber, Min, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AbrirCajaDto {
  @ApiProperty({ example: 200000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  montoApertura: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  observacion?: string;
}

export class CerrarCajaDto {
  @ApiProperty({ example: 850000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  montoCierre: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  observacion?: string;
}
