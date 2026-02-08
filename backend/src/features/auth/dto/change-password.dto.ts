import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'oldPassword123',
    description: 'Mật khẩu cũ',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu cũ không được để trống' })
  oldPassword: string;

  @ApiProperty({
    example: 'NewPassword123!',
    description: 'Mật khẩu mới (tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số)',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Mật khẩu phải bao gồm chữ hoa, chữ thường và số',
  })
  newPassword: string;
}
