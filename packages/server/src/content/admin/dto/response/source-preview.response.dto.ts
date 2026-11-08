import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { SOURCE_TYPE, SourceType } from '../../../shared/types/source-type';

export class SourcePreviewResponseDto {
  @ApiProperty({ description: '정규화된 원문 URL' })
  @Expose()
  sourceUrl!: string;

  @ApiProperty({ enum: SOURCE_TYPE })
  @Expose()
  sourceType!: SourceType;

  @ApiPropertyOptional({ type: String, nullable: true })
  @Expose()
  sourceTitle!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @Expose()
  sourceDescription!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @Expose()
  sourceSiteName!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @Expose()
  sourceAuthor!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @Expose()
  sourceImagePath!: string | null;
}
