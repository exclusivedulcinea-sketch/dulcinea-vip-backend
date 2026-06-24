import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin', description: 'Nombre de usuario' })
  @IsString()
  @IsNotEmpty({ message: 'El usuario es obligatorio' })
  username: string;

  @ApiProperty({ example: '1234', description: 'PIN de 4 dígitos' })
  @IsString()
  @IsNotEmpty({ message: 'El PIN es obligatorio' })
  @Length(4, 4, { message: 'El PIN debe tener exactamente 4 dígitos' })
  @Matches(/^\d{4}$/, { message: 'El PIN solo debe contener números' })
  pin: string;
}
