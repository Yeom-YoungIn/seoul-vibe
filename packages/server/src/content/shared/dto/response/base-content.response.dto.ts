import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BaseContentResponseDto {
  @ApiProperty({ description: '콘텐츠 ID' })
  @Expose()
  id!: string;

  @ApiProperty({ description: '콘텐츠 슬러그' })
  @Expose()
  slug!: string;

  @ApiProperty({ description: '게시 여부' })
  @Expose()
  isPublished!: boolean;

  @ApiPropertyOptional({
    description: '게시 일시',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  @Expose()
  publishedAt?: Date | null;

  @ApiProperty({ description: '생성 일시', type: String, format: 'date-time' })
  @Expose()
  createdAt!: Date;
}
