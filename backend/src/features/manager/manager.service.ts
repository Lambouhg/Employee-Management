import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ManagerService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryUserDto) {
    try {
      const { search, employmentType, roleId, managerId, isActive, page = 1, limit = 10 } = query;

      const where: any = {};

      if (search) {
        where.OR = [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (employmentType) {
        where.employmentType = employmentType;
      }

      if (roleId) {
        where.roleId = roleId;
      }

      if (managerId) {
        where.managerId = managerId;
      }

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
                level: true,
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
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where }),
      ]);

      // Remove password from response
      const usersWithoutPassword = users.map(({ password, ...user }) => user);

      return {
        data: usersWithoutPassword,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
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
            employmentType: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy nhân viên với ID: ${id}`);
    }

    // Extract permissions
    const permissions = (user.role as any).rolePermissions.map(
      (rp: any) => rp.permission.name,
    );

    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      permissions,
    };
  }

  async create(createUserDto: CreateUserDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Validate role exists
    const role = await this.prisma.role.findUnique({
      where: { id: createUserDto.roleId },
    });

    if (!role) {
      throw new BadRequestException('Vai trò không tồn tại');
    }

    // Validate manager exists (if provided)
    if (createUserDto.managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: createUserDto.managerId },
      });

      if (!manager) {
        throw new BadRequestException('Người quản lý không tồn tại');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
            level: true,
          },
        },
        manager: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entity: 'User',
        description: `Tạo nhân viên mới: ${user.fullName}`,
      },
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`Không tìm thấy nhân viên với ID: ${id}`);
    }

    // Check email uniqueness if updating email
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (emailExists) {
        throw new ConflictException('Email đã được sử dụng');
      }
    }

    // Validate role if updating
    if (updateUserDto.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: updateUserDto.roleId },
      });

      if (!role) {
        throw new BadRequestException('Vai trò không tồn tại');
      }
    }

    // Validate manager if updating
    if (updateUserDto.managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: updateUserDto.managerId },
      });

      if (!manager) {
        throw new BadRequestException('Người quản lý không tồn tại');
      }

      // Prevent self-assignment
      if (updateUserDto.managerId === id) {
        throw new BadRequestException('Không thể tự gán mình làm người quản lý');
      }
    }

    // Hash password if updating
    const dataToUpdate: any = { ...updateUserDto };
    if (updateUserDto.password) {
      dataToUpdate.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Update user
    const user = await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
            level: true,
          },
        },
        manager: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entity: 'User',
        description: `Cập nhật thông tin nhân viên: ${user.fullName}`,
      },
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getRoles() {
    return this.prisma.role.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        level: true,
      },
      orderBy: { level: 'desc' },
    });
  }

  async getManagers() {
    return this.prisma.user.findMany({
      where: {
        role: {
          name: { in: ['ADMIN', 'MANAGER', 'SUPER_STAFF'] },
        },
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: {
          select: {
            name: true,
            displayName: true,
          },
        },
      },
      orderBy: { fullName: 'asc' },
    });
  }
}
