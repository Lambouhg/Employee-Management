import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../common/database/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const employees = await this.prisma.user.findMany({
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
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
                level: true,
              },
            },
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
      orderBy: { createdAt: 'desc' },
    });

    // Remove passwords from response
    const employeesWithoutPassword = employees.map(
      ({ password, subordinates, ...emp }) => ({
        ...emp,
        subordinatesCount: subordinates?.length || 0,
        subordinates: subordinates || [],
      }),
    );

    return {
      data: employeesWithoutPassword,
      meta: {
        total: employeesWithoutPassword.length,
        page: 1,
        limit: employeesWithoutPassword.length,
        totalPages: 1,
      },
    };
  }

  async getManagers() {
    const managers = await this.prisma.user.findMany({
      where: {
        role: {
          name: 'MANAGER',
        },
      },
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
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        isActive: true,
      },
      orderBy: { fullName: 'asc' },
    });

    return managers;
  }

  async findOne(id: string) {
    const employee = await this.prisma.user.findUnique({
      where: { id },
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
            phone: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Không tìm thấy nhân viên với ID: ${id}`);
    }

    const { password, ...employeeWithoutPassword } = employee;
    return employeeWithoutPassword;
  }

  async create(createEmployeeDto: CreateUserDto) {
    const {
      email,
      password,
      fullName,
      phone,
      roleId,
      departmentId,
      managerId,
      employmentType,
      fixedDayOff,
    } = createEmployeeDto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email đã tồn tại');
    }

    // Validate role exists
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new BadRequestException('Vai trò không tồn tại');
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

    // Validate manager if provided
    if (managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: managerId },
      });

      if (!manager) {
        throw new BadRequestException('Quản lý không tồn tại');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password || '123456', 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        phone,
        roleId,
        departmentId: departmentId || null,
        managerId: managerId || null,
        employmentType: employmentType || 'FULL_TIME',
        fixedDayOff: fixedDayOff || null,
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
        description: `Tạo nhân viên mới: ${fullName}`,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async update(id: string, updateEmployeeDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy nhân viên với ID: ${id}`);
    }

    // Prevent manager from updating other managers
    if (user.role.name === 'MANAGER') {
      throw new BadRequestException('Không thể cập nhật thông tin Manager khác');
    }

    const {
      email,
      fullName,
      phone,
      roleId,
      departmentId,
      managerId,
      employmentType,
      fixedDayOff,
    } = updateEmployeeDto;

    // Check email uniqueness if email is being changed
    if (email && email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new BadRequestException('Email đã tồn tại');
      }
    }

    // Validate role if provided
    if (roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        throw new BadRequestException('Vai trò không tồn tại');
      }
    }

    // Validate department if provided
    if (departmentId !== undefined) {
      if (departmentId) {
        const department = await this.prisma.department.findUnique({
          where: { id: departmentId },
        });

        if (!department) {
          throw new BadRequestException('Phòng ban không tồn tại');
        }
      }
    }

    // Business logic: Xử lý khi xóa phòng ban (departmentId = null)
    let processedManagerId: string | null | undefined = managerId;
    if (departmentId === null) {
      // Nếu FE xóa phòng ban nhưng vẫn giữ manager → không hợp lý
      // Vì manager thường thuộc một phòng ban, nên khi không có phòng ban thì cũng không nên có manager
      if (managerId !== undefined && managerId !== null) {
        throw new BadRequestException(
          'Không thể xóa phòng ban nhưng vẫn giữ quản lý. Vui lòng xóa quản lý trước khi xóa phòng ban.',
        );
      }
      // Tự động clear managerId khi xóa phòng ban
      processedManagerId = null;
    }

    // Validate manager if provided (sau khi đã xử lý logic departmentId = null)
    if (processedManagerId !== undefined) {
      if (processedManagerId) {
        const manager = await this.prisma.user.findUnique({
          where: { id: processedManagerId },
          include: {
            department: true,
          },
        });

        if (!manager) {
          throw new BadRequestException('Quản lý không tồn tại');
        }

        if (!manager.isActive) {
          throw new BadRequestException('Quản lý không còn hoạt động');
        }

        // Prevent self-assignment
        if (processedManagerId === id) {
          throw new BadRequestException('Không thể tự gán mình làm người quản lý');
        }

        // Business logic: Validate manager phù hợp với phòng ban
        // Nếu có departmentId mới, manager nên thuộc cùng phòng ban
        const targetDepartmentId = departmentId !== undefined ? departmentId : user.departmentId;
        if (targetDepartmentId && manager.departmentId !== targetDepartmentId) {
          // Cảnh báo nhưng vẫn cho phép (linh hoạt cho cross-department management)
          // Nếu muốn nghiêm ngặt hơn, có thể throw BadRequestException
        }
      }
    }

    // Xử lý logic khi chuyển phòng ban
    let finalManagerId: string | null | undefined = processedManagerId;
    if (departmentId !== undefined && departmentId !== null && departmentId !== user.departmentId) {
      // Đang chuyển sang phòng ban mới
      const newDepartment = await this.prisma.department.findUnique({
        where: { id: departmentId },
        include: { manager: true },
      });

      if (newDepartment?.managerId) {
        // Nếu phòng ban mới có trưởng phòng và managerId không được chỉ định rõ → tự động gán trưởng phòng
        if (processedManagerId === undefined) {
          finalManagerId = newDepartment.managerId;
        }
        // Nếu manager được chỉ định nhưng không thuộc phòng ban mới → tự động gán trưởng phòng
        else if (processedManagerId && user.managerId !== processedManagerId) {
          const specifiedManager = await this.prisma.user.findUnique({
            where: { id: processedManagerId },
            select: { departmentId: true },
          });

          if (specifiedManager?.departmentId !== departmentId) {
            // Manager không thuộc phòng ban mới → tự động gán trưởng phòng
            finalManagerId = newDepartment.managerId;
          }
        }
      } else if (processedManagerId === undefined && user.managerId) {
        // Phòng ban mới không có trưởng phòng và manager cũ không thuộc phòng ban mới → clear
        const oldManager = await this.prisma.user.findUnique({
          where: { id: user.managerId },
          select: { departmentId: true },
        });

        if (oldManager?.departmentId !== departmentId) {
          finalManagerId = null;
        }
      }
    } else if (departmentId === null && processedManagerId === undefined) {
      // Xóa phòng ban và không chỉ định manager → clear manager
      finalManagerId = null;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        email,
        fullName,
        phone,
        roleId,
        departmentId: departmentId === null ? null : departmentId,
        managerId:
          finalManagerId === null
            ? null
            : finalManagerId === undefined
              ? undefined
              : finalManagerId,
        employmentType,
        fixedDayOff,
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
        userId: id,
        action: 'UPDATE',
        entity: 'User',
        description: `Cập nhật thông tin nhân viên: ${updatedUser.fullName}`,
      },
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy nhân viên với ID: ${id}`);
    }

    // Prevent manager from deleting other managers
    if (user.role.name === 'MANAGER') {
      throw new BadRequestException('Không thể xóa Manager khác');
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
    const subordinatesWithoutPassword = subordinates.map(
      ({ password, ...sub }) => sub,
    );

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


