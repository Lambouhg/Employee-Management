import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
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
    schema: {
      example: {
        id: '123',
        email: 'admin@example.com',
        fullName: 'Admin User',
        phone: '0123456789',
        role: {
          id: '1',
          name: 'ADMIN',
          displayName: 'Administrator',
          level: 100,
        },
        employmentType: 'FULL_TIME',
        permissions: ['manage_all_employees', 'approve_all_schedules'],
        manager: null,
        subordinates: [],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  async getMe(@CurrentUser() user: any) {
    return user;
  }
}
