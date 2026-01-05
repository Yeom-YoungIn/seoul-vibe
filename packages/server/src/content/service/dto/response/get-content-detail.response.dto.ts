import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BaseContentResponseDto } from '../../../shared/dto/response/base-content.response.dto';
import { BaseContentTranslationResponseDto } from '../../../shared/dto/response/base-content-translation.response.dto';

export class GetContentDetailResponseDto extends BaseContentResponseDto {
  @ApiProperty({ description: '수정 일시', type: 'string', format: 'date-time' })
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
