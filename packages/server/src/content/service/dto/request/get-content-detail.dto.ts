import { DEFAULT_LANGUAGE, LANGUAGE, Language } from '@app/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class GetContentDetailDto {
  @ApiPropertyOptional({ enum: LANGUAGE, default: DEFAULT_LANGUAGE })
  @IsOptional()
  @IsIn(LANGUAGE)
  language?: Language;
}
