import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { PostCategory } from '../../../shared/entities/post.entity';

export class PostAuthorResponseDto {
  @ApiProperty() @Expose() id!: string;
  @ApiProperty() @Expose() nickname!: string;
  @ApiPropertyOptional() @Expose() profileImage?: string | null;
}

export class PostResponseDto {
  @ApiProperty() @Expose() id!: string;

  @ApiProperty({ type: PostAuthorResponseDto })
  @Expose()
  @Type(() => PostAuthorResponseDto)
  author!: PostAuthorResponseDto;

  @ApiProperty() @Expose() content!: string;

  @ApiProperty({ type: [String] }) @Expose() images!: string[];

  @ApiProperty({ enum: PostCategory }) @Expose() category!: PostCategory;

  @ApiPropertyOptional() @Expose() locationName?: string | null;
  @ApiPropertyOptional() @Expose() locationLat?: number | null;
  @ApiPropertyOptional() @Expose() locationLng?: number | null;

  @ApiProperty() @Expose() likeCount!: number;

  @ApiProperty() @Expose() createdAt!: Date;
  @ApiProperty() @Expose() updatedAt!: Date;
}

export class PostFeedResponseDto {
  @ApiProperty({ type: [PostResponseDto], isArray: true })
  @Expose()
  @Type(() => PostResponseDto)
  list!: PostResponseDto[];

  @ApiProperty() @Expose() count!: number;
}
