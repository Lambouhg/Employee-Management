import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, EmploymentType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../common/database/prisma.service';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { AssignManagerDto } from './dto/assign-manager.dto';
import { TransferDepartmentDto } from './dto/transfer-department.dto';

@Injectable()
export class ManagerEmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  private employeeSelect = {
    id: true,
    email: true,
    fullName: true,
    phone: true,
    employmentType: true,
    fixedDayOff: true,
    isActive: true,
    createdAt: true,
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
    },
    subordinates: {
      select: {
        id: true,
        fullName: true,
        email: true,
        employmentType: true,
        isActive: true,
        role: {
          select: {
            name: true,
            displayName: true,
            level: true,
          },
        },
      },
    },
    _count: {
      select: {
        subordinates: true,
      },
    },
  };

  private toEmployee(user: any) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone ?? undefined,
      employmentType: user.employmentType as EmploymentType,
      fixedDayOff: user.fixedDayOff ?? undefined,
      isActive: user.isActive,
      createdAt: user.createdAt,
      role: user.role,
      department: user.department ?? undefined,
      manager: user.manager ?? undefined,
      subordinates: user.subordinates ?? [],
      subordinatesCount:
        user._count?.subordinates ?? user.subordinates?.length ?? 0,
    };
  }

  async findAll(query: EmployeeQueryDto) {
    const { page = 1, limit = 10 } = query;

    const where: Prisma.UserWhereInput = {};

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.employmentType) {
      where.employmentType = query.employmentType;
    }

    if (query.roleId) {
      where.roleId = query.roleId;
    }

    if (query.managerId) {
      where.managerId = query.managerId;
    }

    if (query.departmentId !== undefined) {
      where.departmentId = query.departmentId;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: this.employeeSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: users.map((user) => this.toEmployee(user)),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.employeeSelect,
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy nhân viên');
    }

    // Build reporting chain (manager hierarchy)
    const reportingChain: any[] = [];
    let currentManagerId = user.manager?.id;
    const visited = new Set<string>();

    while (currentManagerId && !visited.has(currentManagerId)) {
      const manager = await this.prisma.user.findUnique({
        where: { id: currentManagerId },
        select: {
          id: true,
          fullName: true,
          role: { select: { name: true, displayName: true, level: true } },
          managerId: true,
        },
      });

      if (!manager) break;

      reportingChain.push({
        id: manager.id,
        fullName: manager.fullName,
        role: manager.role,
      });

      visited.add(manager.id);
      currentManagerId = manager.managerId || undefined;
    }

    return {
      ...this.toEmployee(user),
      reportingChain,
    };
  }

  async create(dto: CreateEmployeeDto) {
    const password = await bcrypt.hash(dto.password, 10);

    let managerId: string | null | undefined = undefined;
    if (dto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
        select: { managerId: true },
      });
      managerId = department?.managerId ?? null;
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password,
        fullName: dto.fullName,
        phone: dto.phone ?? null,
        roleId: dto.roleId,
        departmentId: dto.departmentId ?? null,
        employmentType: dto.employmentType,
        fixedDayOff: dto.fixedDayOff as any ?? null,
        managerId,
      },
      select: this.employeeSelect,
    });

    return this.toEmployee(user);
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy nhân viên');
    }

    let password: string | undefined;
    if (dto.password) {
      password = await bcrypt.hash(dto.password, 10);
    }

    // Handle department change - auto-assign manager from new department
    let newManagerId: string | null | undefined = undefined;
    if (dto.departmentId !== undefined && dto.departmentId !== null && dto.departmentId !== '') {
      const department = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
        select: { managerId: true },
      });
      newManagerId = department?.managerId ?? null;
    } else if (dto.departmentId === null || dto.departmentId === '') {
      // Remove department - also remove manager
      newManagerId = null;
    }

    const data: Prisma.UserUpdateInput = {
      email: dto.email,
      fullName: dto.fullName,
      phone: dto.phone ?? undefined,
      role: dto.roleId ? { connect: { id: dto.roleId } } : undefined,
      department:
        dto.departmentId !== undefined && dto.departmentId !== null && dto.departmentId !== ''
          ? { connect: { id: dto.departmentId } }
          : dto.departmentId === null || dto.departmentId === ''
            ? { disconnect: true }
            : undefined,
      manager:
        newManagerId !== undefined
          ? newManagerId
            ? { connect: { id: newManagerId } }
            : { disconnect: true }
          : undefined,
      employmentType: dto.employmentType,
      fixedDayOff: dto.fixedDayOff as any ?? undefined,
      isActive: dto.isActive,
    };

    if (password) {
      data.password = password;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: this.employeeSelect,
    });

    return this.toEmployee(updated);
  }

  async remove(id: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy nhân viên');
    }

    // Soft delete by deactivating account to avoid FK breakages
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: this.employeeSelect,
    });

    return this.toEmployee(user);
  }

  async activate(id: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: { id: true, isActive: true },
    });
    return { message: 'Kích hoạt nhân viên thành công', user };
  }

  async deactivate(id: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });
    return { message: 'Vô hiệu hóa nhân viên thành công', user };
  }

  async resetPassword(id: string) {
    const newPassword = '123456';
    const hashed = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashed },
    });

    return { message: 'Reset mật khẩu thành công. Mật khẩu mới: 123456' };
  }

  async transferDepartment(userId: string, dto: TransferDepartmentDto) {
    const departmentId =
      dto.departmentId === undefined ? undefined : dto.departmentId;

    let managerId: string | null | undefined = undefined;

    if (departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: departmentId },
        select: { managerId: true },
      });
      managerId = department?.managerId ?? null;
    } else if (departmentId === null) {
      managerId = null;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        departmentId: departmentId ?? null,
        managerId,
      },
      select: this.employeeSelect,
    });

    return this.toEmployee(updated);
  }

  async assignManager(userId: string, dto: AssignManagerDto) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        managerId: dto.managerId ?? null,
      },
      select: this.employeeSelect,
    });

    return this.toEmployee(updated);
  }

  async getSubordinates(managerId: string) {
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });

    if (!manager) {
      throw new NotFoundException('Không tìm thấy người quản lý');
    }

    const subordinates = await this.prisma.user.findMany({
      where: { managerId },
      select: this.employeeSelect,
    });

    return {
      manager,
      subordinates: subordinates.map((u) => this.toEmployee(u)),
      count: subordinates.length,
    };
  }

  async getManagers() {
    // Get all managers (TEAM_LEAD and above) for general use
    const managers = await this.prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          level: {
            gte: 2, // TEAM_LEAD and above
          },
        },
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
      orderBy: [{ role: { level: 'desc' } }, { fullName: 'asc' }],
    });

    return managers;
  }

  async getDepartmentManagers() {
    // Get only DEPT_MANAGER for department manager assignment
    const managers = await this.prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          name: 'DEPT_MANAGER',
        },
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

    return managers;
  }
}
