import { DEFAULT_LANGUAGE, LANGUAGE, Language } from '@app/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class GetContentListDto {
  @ApiPropertyOptional({ enum: LANGUAGE, default: DEFAULT_LANGUAGE })
  @IsOptional()
  @IsIn(LANGUAGE)
  language?: Language;

  @ApiPropertyOptional({ type: Number, minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({ type: Number, minimum: 1, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number;
}
