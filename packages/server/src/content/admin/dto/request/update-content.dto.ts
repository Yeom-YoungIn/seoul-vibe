import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { LANGUAGE, Language } from '@app/common';
import { COVER_IMAGE_URL, ContentSourceDto } from './create-content.dto';

export class UpdateContentTranslationDto {
  @ApiPropertyOptional({ enum: LANGUAGE })
  @IsOptional()
  @IsIn(LANGUAGE)
  locale?: Language;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bodyHtml?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bodyText?: string;
}

export class UpdateContentDto extends ContentSourceDto {
  @ApiPropertyOptional({ minLength: 2, maxLength: 255 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  slug?: string;

  @ApiPropertyOptional({ type: [UpdateContentTranslationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateContentTranslationDto)
  translations?: UpdateContentTranslationDto[];

  @ApiPropertyOptional({
    description: '대표 이미지 URL (http(s) 또는 /uploads 경로, null이면 제거)',
    maxLength: 2048,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @Matches(COVER_IMAGE_URL, { message: 'coverImageUrl must be an http(s) URL or a /path' })
  coverImageUrl?: string | null;
}
