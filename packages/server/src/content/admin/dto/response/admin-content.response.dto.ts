import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { BaseContentResponseDto } from '../../../shared/dto/response/base-content.response.dto';
import { BaseContentTranslationResponseDto } from '../../../shared/dto/response/base-content-translation.response.dto';

export class AdminContentDetailResponseDto extends BaseContentResponseDto {
  @ApiProperty({ type: String, format: 'date-time' })
  @Expose()
  updatedAt!: Date;

  @ApiProperty({ type: [BaseContentTranslationResponseDto] })
  @Expose()
  @Type(() => BaseContentTranslationResponseDto)
  translations!: BaseContentTranslationResponseDto[];
}

export class AdminContentListItemResponseDto extends BaseContentResponseDto {
  @ApiProperty({ type: String, format: 'date-time' })
  @Expose()
  updatedAt!: Date;
}

export class AdminContentListAndCountResponseDto {
  @ApiProperty({ type: [AdminContentListItemResponseDto], isArray: true })
  @Expose()
  @Type(() => AdminContentListItemResponseDto)
  list!: AdminContentListItemResponseDto[];

  @ApiProperty()
  @Expose()
  count!: number;
}
