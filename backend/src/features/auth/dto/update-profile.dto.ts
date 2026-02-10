import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Họ và tên',
    example: 'Nguyễn Văn A',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Họ tên phải có ít nhất 2 ký tự' })
  @MaxLength(100, { message: 'Họ tên không được vượt quá 100 ký tự' })
  fullName?: string;

  @ApiProperty({
    description: 'Số điện thoại',
    example: '0901234567',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^(0|\+84)[0-9]{9}$/, {
    message: 'Số điện thoại không hợp lệ (VD: 0901234567 hoặc +84901234567)',
  })
  phone?: string;
}
