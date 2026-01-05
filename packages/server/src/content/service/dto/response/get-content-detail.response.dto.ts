import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseContentTranslationResponseDto } from '../../../shared/dto/response/base-content-translation.response.dto';

export class GetContentDetailResponseDto {
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

  @ApiProperty({ description: '수정 일시', type: String, format: 'date-time' })
  @Expose()
  updatedAt!: Date;

  @ApiProperty({
    description: '번역 데이터',
    isArray: true,
    type: BaseContentTranslationResponseDto,
  })
  @Expose()
  @Type(() => BaseContentTranslationResponseDto)
  translations!: BaseContentTranslationResponseDto[];
}
