import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdatePostDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @ApiPropertyOptional({ enum: PostCategory })
  @IsOptional()
  @IsEnum(PostCategory)
  category?: PostCategory;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  locationName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  locationLat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  locationLng?: number;
}
