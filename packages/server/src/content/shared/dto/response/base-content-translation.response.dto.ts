import { LANGUAGE, Language } from '@app/common';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class BaseContentTranslationResponseDto {
  @ApiProperty({ description: '컨텐츠 번역 언어', type: 'string', enum: LANGUAGE })
  @Expose()
  locale!: Language;

  @ApiProperty({ description: '제목', type: 'string' })
  @Expose()
  title!: string;

  @ApiProperty({ description: '내용(html 포함)', type: 'string', nullable: true })
  @Expose()
  bodyHtml?: string | null;

  @ApiProperty({ description: '내용', type: 'string', nullable: true })
  @Expose()
  bodyText?: string | null;
}
