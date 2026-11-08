import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SourcePreviewDto {
  @ApiProperty({ description: '원문 URL', example: 'https://www.instagram.com/p/DcOEG9qkwW6/' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  url!: string;
}
