import { IsString, IsNotEmpty, IsOptional, IsEmail, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProveedorDto {
  @ApiProperty({ example: 'Distribuidora Licores SA' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @ApiProperty({ example: '900123456-1' })
  @IsString()
  @IsNotEmpty({ message: 'El NIT es obligatorio' })
  nit: string;

  @ApiProperty({ example: '3001234567' })
  @IsString()
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  telefono: string;

  @ApiPropertyOptional({ example: 'contacto@distrilicores.com' })
  @IsEmail({}, { message: 'Debe ser un correo válido' })
  @IsOptional()
  correo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contacto?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class UpdateProveedorDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nombre?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nit?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional()
  @IsEmail({}, { message: 'Debe ser un correo válido' })
  @IsOptional()
  correo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contacto?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
