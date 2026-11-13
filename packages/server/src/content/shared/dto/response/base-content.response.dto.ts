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

  @ApiPropertyOptional({ description: '원문 URL', type: String, nullable: true })
  @Expose()
  sourceUrl?: string | null;

  @ApiPropertyOptional({
    description: '원문 유형 (INSTAGRAM | LINK)',
    type: String,
    nullable: true,
  })
  @Expose()
  sourceType?: string | null;

  @ApiPropertyOptional({ description: '원문 제목', type: String, nullable: true })
  @Expose()
  sourceTitle?: string | null;

  @ApiPropertyOptional({ description: '원문 설명', type: String, nullable: true })
  @Expose()
  sourceDescription?: string | null;

  @ApiPropertyOptional({ description: '원문 사이트명', type: String, nullable: true })
  @Expose()
  sourceSiteName?: string | null;

  @ApiPropertyOptional({ description: '원문 작성자', type: String, nullable: true })
  @Expose()
  sourceAuthor?: string | null;

  @ApiPropertyOptional({ description: '원문 썸네일 경로', type: String, nullable: true })
  @Expose()
  sourceImagePath?: string | null;

  @ApiPropertyOptional({ description: '대표 이미지 URL', type: String, nullable: true })
  @Expose()
  coverImageUrl?: string | null;
}
