import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { LANGUAGE, Language } from '@app/common';

export class CreateContentTranslationDto {
  @ApiProperty({ enum: LANGUAGE, description: '언어 코드' })
  @IsIn(LANGUAGE)
  locale!: Language;

  @ApiProperty({ description: '제목', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ description: 'HTML 본문' })
  @IsOptional()
  @IsString()
  bodyHtml?: string;

  @ApiPropertyOptional({ description: '텍스트 본문' })
  @IsOptional()
  @IsString()
  bodyText?: string;
}

export class ContentSourceDto {
  @ApiPropertyOptional({
    description: '원문 URL (null이면 출처 제거)',
    maxLength: 2048,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  sourceUrl?: string | null;

  @ApiPropertyOptional({ description: '원문 제목', maxLength: 300, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  sourceTitle?: string | null;

  @ApiPropertyOptional({ description: '원문 설명', maxLength: 500, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  sourceDescription?: string | null;

  @ApiPropertyOptional({ description: '원문 사이트명', maxLength: 100, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceSiteName?: string | null;

  @ApiPropertyOptional({ description: '원문 작성자', maxLength: 100, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceAuthor?: string | null;

  @ApiPropertyOptional({ description: '원문 썸네일 경로', maxLength: 500, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  sourceImagePath?: string | null;
}

export class CreateContentDto extends ContentSourceDto {
  @ApiProperty({ description: 'URL 슬러그', example: 'hidden-coffee-spots-seoul' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  slug!: string;

  @ApiProperty({ type: [CreateContentTranslationDto], description: '번역 목록 (최소 1개)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContentTranslationDto)
  translations!: CreateContentTranslationDto[];
}
