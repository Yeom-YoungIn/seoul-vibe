import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetContentListItemResponseDto {
  @ApiProperty({ description: '콘텐츠 ID' })
  @Expose()
  id!: string;

  @ApiProperty({ description: '콘텐츠 슬러그' })
  @Expose()
  slug!: string;

  @ApiProperty({ description: '콘텐츠 제목' })
  @Expose()
  title!: string;

  @ApiProperty({ description: '게시 여부' })
  @Expose()
  isPublished!: boolean;

  @ApiProperty({ description: '게시 일시', type: String, format: 'date-time', nullable: true })
  @Expose()
  publishedAt?: Date | null;

  @ApiProperty({ description: '생성 일시', type: String, format: 'date-time' })
  @Expose()
  createdAt!: Date;
}

export class GetContentListAndCountResponseDto {
  @ApiProperty({ type: GetContentListItemResponseDto, isArray: true })
  @Expose()
  @Type(() => GetContentListItemResponseDto)
  list!: GetContentListItemResponseDto[];

  @ApiProperty({ description: '전체 건수' })
  @Expose()
  count!: number;
}
