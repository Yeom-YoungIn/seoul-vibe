import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;

  @ApiProperty({ example: 'seoulvibe_user' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  nickname!: string;
}
