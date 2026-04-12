import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AuthTokenResponseDto {
  @ApiProperty()
  @Expose()
  accessToken!: string;

  @ApiProperty()
  @Expose()
  refreshToken!: string;
}
