import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/database/prisma.service';
import { EmailService } from '../../common/email/email.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  JwtPayload,
  LoginResponse,
  RefreshTokenResponse,
  UserProfile,
} from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) { }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;

    // 1. Tìm user theo email
    const user = (await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })) as any;

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // 2. Kiểm tra user có active không
    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // 4. Tạo JWT payload
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roleId: (user.role as any).id,
      roleName: (user.role as any).name,
      roleLevel: (user.role as any).level,
      type: 'access',
    };

    // 5. Tạo access token
    const accessToken = this.jwtService.sign(payload);

    // Refresh token với thời gian dài hơn (30 days) - optional
    const refreshPayload: JwtPayload = {
      ...payload,
      type: 'refresh',
    };
    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: '1d',
    });

    // 6. Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'Auth',
        description: `User ${user.email} logged in`,
      },
    });

    // Extract permissions
    const permissions = user.role.rolePermissions.map(
      (rp: any) => rp.permission.name,
    );

    // 7. Return response
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: {
          id: (user.role as any).id,
          name: (user.role as any).name,
          displayName: (user.role as any).displayName,
          level: (user.role as any).level,
        },
        department: user.department,
        employmentType: user.employmentType,
        permissions,
      },
    };
  }

  async validateUser(userId: string) {
    const user = (await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        manager: true,
        subordinates: true,
      },
    })) as any;

    if (!user || !user.isActive) {
      return null;
    }

    // Extract permissions
    const permissions = (user.role as any).rolePermissions.map(
      (rp: any) => rp.permission.name,
    );

    return {
      ...user,
      permissions,
    };
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true, email: true },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.password,
    );
    if (!isOldPasswordValid) {
      throw new BadRequestException('Mật khẩu cũ không đúng');
    }

    // Hash new password
    const hashedNewPassword = await this.hashPassword(dto.newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'CHANGE_PASSWORD',
        entity: 'Auth',
        description: `User ${user.email} changed password`,
      },
    });

    // Send notification email (optional but recommended)
    try {
      await this.emailService.sendPasswordChangedNotification(
        user.email,
        (await this.prisma.user.findUnique({
          where: { id: userId },
          select: { fullName: true },
        }))?.fullName || 'User',
      );
    } catch (error) {
      console.error('Failed to send password change notification:', error);
    }

    return { message: 'Đổi mật khẩu thành công' };
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = (await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        manager: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    })) as any;

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    // Extract permissions
    const permissions = (user.role as any).rolePermissions.map(
      (rp: any) => rp.permission.name,
    );

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: {
        id: user.role.id,
        name: user.role.name,
        displayName: user.role.displayName,
        level: user.role.level,
      },
      department: user.department,
      employmentType: user.employmentType,
      fixedDayOff: user.fixedDayOff,
      isActive: user.isActive,
      createdAt: user.createdAt,
      manager: user.manager,
      subordinates: user.subordinates,
      permissions,
    };
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfile> {
    // Verify user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Update user profile
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: updateProfileDto.fullName,
        phone: updateProfileDto.phone,
      },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'UPDATE_PROFILE',
        entity: 'User',
        entityId: userId,
        description: 'Cập nhật thông tin cá nhân',
        metadata: {
          updatedFields: Object.keys(updateProfileDto),
        },
      },
    });

    // Return updated profile
    return this.getProfile(userId);
  }

  async logout(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGOUT',
        entity: 'Auth',
        description: `User ${user.email} logged out`,
      },
    });

    return { message: 'Đăng xuất thành công' };
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify<JwtPayload>(refreshToken);

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Token không hợp lệ');
      }

      // Validate user still exists and is active
      const user = await this.validateUser(payload.sub);
      if (!user) {
        throw new UnauthorizedException(
          'Người dùng không tồn tại hoặc đã bị vô hiệu hóa',
        );
      }

      // Generate new access token
      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        roleId: (user as any).role.id,
        roleName: (user as any).role.name,
        roleLevel: (user as any).role.level,
      };

      const accessToken = this.jwtService.sign(newPayload);

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }
  }

  /**
   * Forgot Password - Send reset token via email
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = dto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, fullName: true, isActive: true },
    });

    // Always return success message for security (don't reveal if email exists)
    if (!user || !user.isActive) {
      return {
        message:
          'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu',
      };
    }

    // Generate JWT token for password reset (expires in 30 minutes)
    const resetToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        type: 'password-reset',
      },
      {
        expiresIn: '30m',
      },
    );

    // Send reset email
    try {
      await this.emailService.sendPasswordResetEmail(
        user.email,
        user.fullName,
        resetToken,
      );
    } catch (error) {
      console.error('Failed to send reset email:', error);
      throw new BadRequestException('Không thể gửi email đặt lại mật khẩu');
    }

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'FORGOT_PASSWORD',
        entity: 'Auth',
        description: `User ${user.email} requested password reset`,
      },
    });

    return {
      message:
        'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu',
    };
  }

  /**
   * Reset Password - Verify token and update password
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = dto;

    try {
      // Verify JWT token
      const payload = this.jwtService.verify(token);

      // Check if token is for password reset
      if (payload.type !== 'password-reset') {
        throw new BadRequestException('Token không hợp lệ');
      }

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub, isActive: true },
        select: { id: true, email: true, fullName: true },
      });

      if (!user) {
        throw new BadRequestException('Người dùng không tồn tại');
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update password
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      // Log activity
      await this.prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'RESET_PASSWORD',
          entity: 'Auth',
          description: `User ${user.email} reset password`,
        },
      });

      // Send confirmation email
      try {
        await this.emailService.sendPasswordChangedNotification(
          user.email,
          user.fullName,
        );
      } catch (error) {
        console.error('Failed to send password changed notification:', error);
      }

      return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập' };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException(
          'Token đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới',
        );
      }
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Token không hợp lệ');
      }
      throw error;
    }
  }
}
