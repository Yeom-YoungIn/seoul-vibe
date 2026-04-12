import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PostCategory } from '../../../shared/entities/post.entity';

export class ListAdminPostDto {
  @ApiPropertyOptional({ description: '숨김 여부 필터' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isHidden?: boolean;

  @ApiPropertyOptional({ enum: PostCategory })
  @IsOptional()
  @IsEnum(PostCategory)
  category?: PostCategory;

  @ApiPropertyOptional({ type: Number, minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({ type: Number, minimum: 1, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number;
}
