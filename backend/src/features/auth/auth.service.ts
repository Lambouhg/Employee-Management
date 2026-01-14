import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtPayload, LoginResponse } from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;

    // 1. Tìm user theo email
    const user = await this.prisma.user.findUnique({
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
      },
    }) as any;

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
    };

    // 5. Tạo access token
    const accessToken = this.jwtService.sign(payload);

    // 6. Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'Auth',
        description: `User ${user.email} logged in`,
      },
    });

    // 7. Return response
    return {
      accessToken,
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
        employmentType: user.employmentType,
      },
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
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
        manager: true,
        subordinates: true,
      },
    }) as any;

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
}
