import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Public } from '../../common/auth-decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập hệ thống' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '123',
          email: 'admin@example.com',
          fullName: 'Admin User',
          role: {
            id: '1',
            name: 'ADMIN',
            displayName: 'Administrator',
            level: 100,
          },
          employmentType: 'FULL_TIME',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Email hoặc mật khẩu không đúng',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy thông tin user hiện tại' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin user',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @Patch('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(userId, updateProfileDto);
  }

  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất hệ thống' })
  @ApiResponse({
    status: 200,
    description: 'Đăng xuất thành công',
    schema: {
      example: {
        message: 'Đăng xuất thành công',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  async logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token được làm mới thành công',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token không hợp lệ hoặc đã hết hạn',
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Patch('change-password')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đổi mật khẩu' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Đổi mật khẩu thành công',
    schema: {
      example: {
        message: 'Đổi mật khẩu thành công',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Mật khẩu cũ không đúng hoặc mật khẩu mới không hợp lệ',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, changePasswordDto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quên mật khẩu - Gửi email đặt lại' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Email đặt lại mật khẩu đã được gửi (nếu email tồn tại)',
    schema: {
      example: {
        message:
          'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Email không hợp lệ',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đặt lại mật khẩu với token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Đặt lại mật khẩu thành công',
    schema: {
      example: {
        message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token không hợp lệ hoặc đã hết hạn',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
