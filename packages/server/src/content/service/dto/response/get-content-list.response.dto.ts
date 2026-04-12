import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BaseContentResponseDto } from '../../../shared/dto/response/base-content.response.dto';

export class GetContentListItemResponseDto extends BaseContentResponseDto {
  @ApiProperty({ description: '콘텐츠 제목' })
  @Expose()
  title!: string;
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
