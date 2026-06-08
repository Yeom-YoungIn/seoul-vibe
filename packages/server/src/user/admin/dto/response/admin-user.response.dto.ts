import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { UserRole } from '@app/common';

export class AdminUserResponseDto {
  @ApiProperty()
  @Expose()
  id!: string;
  @ApiProperty()
  @Expose()
  email!: string;
  @ApiProperty()
  @Expose()
  nickname!: string;
  @ApiPropertyOptional()
  @Expose()
  nationality?: string | null;
  @ApiProperty({ enum: UserRole })
  @Expose()
  role!: UserRole;
  @ApiProperty()
  @Expose()
  isEmailVerified!: boolean;
  @ApiProperty()
  @Expose()
  createdAt!: Date;
}

export class AdminUserListAndCountResponseDto {
  @ApiProperty({ type: [AdminUserResponseDto], isArray: true })
  @Expose()
  @Type(() => AdminUserResponseDto)
  list!: AdminUserResponseDto[];

  @ApiProperty() @Expose() count!: number;
}
