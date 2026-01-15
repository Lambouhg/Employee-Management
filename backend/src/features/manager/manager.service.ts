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
      const { search, employmentType, roleId, managerId, departmentId, isActive, page = 1, limit = 10 } = query;

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

      if (departmentId) {
        where.departmentId = departmentId;
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

    // Validate department exists (if provided)
    if (createUserDto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: createUserDto.departmentId },
      });

      if (!department) {
        throw new BadRequestException('Phòng ban không tồn tại');
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

    // Validate department if updating
    if (updateUserDto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: updateUserDto.departmentId },
      });

      if (!department) {
        throw new BadRequestException('Phòng ban không tồn tại');
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
          name: { in: ['MANAGER', 'DEPT_MANAGER'] },
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
            level: true,
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
      orderBy: { fullName: 'asc' },
    });
  }

  async getDepartments(includeEmployees: boolean = false) {
    const departments = await this.prisma.department.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        parentId: true,
        isActive: true,
        createdAt: true,
        manager: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
                level: true,
              },
            },
            employmentType: true,
          },
        },
        employees: includeEmployees
          ? {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                role: {
                  select: {
                    id: true,
                    name: true,
                    displayName: true,
                    level: true,
                  },
                },
                employmentType: true,
                isActive: true,
                createdAt: true,
              },
              where: {
                isActive: true,
              },
            }
          : false,
        subDepartments: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            employees: true,
            subDepartments: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return departments;
  }

  async getDepartmentDetail(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
                level: true,
              },
            },
            employmentType: true,
            isActive: true,
            createdAt: true,
          },
        },
        employees: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
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
            employmentType: true,
            fixedDayOff: true,
            isActive: true,
            createdAt: true,
          },
          where: {
            isActive: true,
          },
          orderBy: {
            fullName: 'asc',
          },
        },
        subDepartments: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            _count: {
              select: {
                employees: true,
              },
            },
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            employees: true,
            subDepartments: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException(`Không tìm thấy phòng ban với ID: ${id}`);
    }

    // Remove passwords if any
    const employeesWithoutPassword = department.employees.map(({ ...emp }) => emp);

    return {
      ...department,
      employees: employeesWithoutPassword,
      statistics: {
        totalEmployees: department._count.employees,
        totalSubDepartments: department._count.subDepartments,
        activeEmployees: employeesWithoutPassword.filter((e) => e.isActive).length,
        fullTimeEmployees: employeesWithoutPassword.filter(
          (e) => e.employmentType === 'FULL_TIME',
        ).length,
        partTimeEmployees: employeesWithoutPassword.filter(
          (e) => e.employmentType === 'PART_TIME',
        ).length,
      },
    };
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy nhân viên với ID: ${id}`);
    }

    // Soft delete - set isActive to false
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: id,
        action: 'DELETE',
        entity: 'User',
        description: `Xóa nhân viên: ${user.fullName}`,
      },
    });

    return { message: 'Xóa nhân viên thành công' };
  }

  async activate(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy nhân viên với ID: ${id}`);
    }

    await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: id,
        action: 'ACTIVATE',
        entity: 'User',
        description: `Kích hoạt nhân viên: ${user.fullName}`,
      },
    });

    return { message: 'Kích hoạt nhân viên thành công', user: { id, isActive: true } };
  }

  async deactivate(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy nhân viên với ID: ${id}`);
    }

    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: id,
        action: 'DEACTIVATE',
        entity: 'User',
        description: `Vô hiệu hóa nhân viên: ${user.fullName}`,
      },
    });

    return { message: 'Vô hiệu hóa nhân viên thành công', user: { id, isActive: false } };
  }

  async transferDepartment(userId: string, departmentId: string | null) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { department: true },
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy nhân viên với ID: ${userId}`);
    }

    // Validate department if provided
    if (departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: departmentId },
      });

      if (!department) {
        throw new BadRequestException('Phòng ban không tồn tại');
      }
    }

    const oldDeptName = user.department?.name || 'Không có';
    const newDept = departmentId
      ? await this.prisma.department.findUnique({ where: { id: departmentId } })
      : null;

    await this.prisma.user.update({
      where: { id: userId },
      data: { departmentId },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'TRANSFER_DEPARTMENT',
        entity: 'User',
        description: `Chuyển nhân viên ${user.fullName} từ ${oldDeptName} sang ${newDept?.name || 'Không có'}`,
      },
    });

    return {
      message: 'Chuyển phòng ban thành công',
      user: {
        id: userId,
        departmentId,
        departmentName: newDept?.name,
      },
    };
  }

  async assignManager(userId: string, managerId: string | null) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { manager: true },
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy nhân viên với ID: ${userId}`);
    }

    // Validate manager if provided
    if (managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: managerId },
      });

      if (!manager) {
        throw new BadRequestException('Quản lý không tồn tại');
      }

      // Prevent self-assignment
      if (managerId === userId) {
        throw new BadRequestException('Không thể tự gán mình làm người quản lý');
      }
    }

    const oldManagerName = user.manager?.fullName || 'Không có';
    const newManager = managerId
      ? await this.prisma.user.findUnique({ where: { id: managerId } })
      : null;

    await this.prisma.user.update({
      where: { id: userId },
      data: { managerId },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'ASSIGN_MANAGER',
        entity: 'User',
        description: `Gán quản lý cho ${user.fullName}: ${oldManagerName} → ${newManager?.fullName || 'Không có'}`,
      },
    });

    return {
      message: 'Gán quản lý thành công',
      user: {
        id: userId,
        managerId,
        managerName: newManager?.fullName,
      },
    };
  }

  async resetPassword(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy nhân viên với ID: ${id}`);
    }

    // Reset to default password: 123456
    const hashedPassword = await bcrypt.hash('123456', 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: id,
        action: 'RESET_PASSWORD',
        entity: 'User',
        description: `Reset mật khẩu cho nhân viên: ${user.fullName}`,
      },
    });

    return { message: 'Reset mật khẩu thành công. Mật khẩu mới: 123456' };
  }

  async getSubordinates(managerId: string) {
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
    });

    if (!manager) {
      throw new NotFoundException(`Không tìm thấy quản lý với ID: ${managerId}`);
    }

    const subordinates = await this.prisma.user.findMany({
      where: { managerId },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
            level: true,
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
      orderBy: { fullName: 'asc' },
    });

    // Remove passwords from response
    const subordinatesWithoutPassword = subordinates.map(({ password, ...sub }) => sub);

    return {
      manager: {
        id: manager.id,
        fullName: manager.fullName,
        email: manager.email,
      },
      subordinates: subordinatesWithoutPassword,
      count: subordinates.length,
    };
  }
}

