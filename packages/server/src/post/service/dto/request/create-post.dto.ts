import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PostCategory } from '../../../shared/entities/post.entity';

export class CreatePostDto {
  @ApiProperty({ description: '게시글 본문', minLength: 1, maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;

  @ApiPropertyOptional({ type: [String], description: '이미지 URL 배열' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @ApiPropertyOptional({ enum: PostCategory, default: PostCategory.ETC })
  @IsOptional()
  @IsEnum(PostCategory)
  category?: PostCategory;

  @ApiPropertyOptional({ description: '장소명', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  locationName?: string;

  @ApiPropertyOptional({ description: '위도', example: 37.5665 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  locationLat?: number;

  @ApiPropertyOptional({ description: '경도', example: 126.9780 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  locationLng?: number;
}
