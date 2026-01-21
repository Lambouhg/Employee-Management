import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../../common/database/prisma.service';
import { CreateDepartmentDto } from '../dto/create-department.dto';
import { UpdateDepartmentDto } from '../dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async getDepartments(includeEmployees = false) {
    const departments = await this.prisma.department.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
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
        _count: {
          select: {
            employees: true,
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
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException(`Không tìm thấy phòng ban với ID: ${id}`);
    }

    const employeesWithoutPassword = department.employees.map(({ ...emp }) => emp);

    return {
      ...department,
      employees: employeesWithoutPassword,
      statistics: {
        totalEmployees: department._count.employees,
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

  async create(createDepartmentDto: CreateDepartmentDto) {
    const { name, code, description, managerId } = createDepartmentDto;

    const existingDepartment = await this.prisma.department.findFirst({
      where: { code },
    });

    if (existingDepartment) {
      throw new ConflictException(`Mã phòng ban "${code}" đã tồn tại`);
    }

    if (managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: managerId },
        include: { role: true },
      });

      if (!manager) {
        throw new NotFoundException('Người quản lý không tồn tại');
      }

      if (!manager.isActive) {
        throw new BadRequestException('Người quản lý không còn hoạt động');
      }

      const existingManagedDept = await this.prisma.department.findFirst({
        where: { managerId },
      });

      if (existingManagedDept) {
        throw new ConflictException(
          `${manager.fullName} đã quản lý phòng ban "${existingManagedDept.name}"`,
        );
      }
    }

    const department = await this.prisma.department.create({
      data: {
        name,
        code: code.toUpperCase(),
        description: description || null,
        managerId: managerId || null,
      },
      include: {
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
              },
            },
          },
        },
      },
    });

    if (managerId) {
      await this.prisma.activityLog.create({
        data: {
          userId: managerId,
          action: 'CREATE',
          entity: 'Department',
          description: `Tạo phòng ban mới: ${name} (${code})`,
        },
      });
    }

    return department;
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException(`Không tìm thấy phòng ban với ID: ${id}`);
    }

    const { name, code, description, managerId } = updateDepartmentDto;

    if (code && code !== department.code) {
      const existingDepartment = await this.prisma.department.findFirst({
        where: {
          code: code.toUpperCase(),
          id: { not: id },
        },
      });

      if (existingDepartment) {
        throw new ConflictException(`Mã phòng ban "${code}" đã tồn tại`);
      }
    }

    if (managerId !== undefined && managerId !== null) {
      const manager = await this.prisma.user.findUnique({
        where: { id: managerId },
        include: { role: true },
      });

      if (!manager) {
        throw new NotFoundException('Người quản lý không tồn tại');
      }

      if (!manager.isActive) {
        throw new BadRequestException('Người quản lý không còn hoạt động');
      }

      if (managerId !== department.managerId) {
        const existingManagedDept = await this.prisma.department.findFirst({
          where: {
            managerId,
            id: { not: id },
          },
        });

        if (existingManagedDept) {
          throw new ConflictException(
            `${manager.fullName} đã quản lý phòng ban "${existingManagedDept.name}"`,
          );
        }
      }
    }

    const updatedDepartment = await this.prisma.department.update({
      where: { id },
      data: {
        name,
        code: code ? code.toUpperCase() : undefined,
        description: description === null ? null : description,
        managerId: managerId === null ? null : managerId,
      },
      include: {
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
              },
            },
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    if (managerId) {
      await this.prisma.activityLog.create({
        data: {
          userId: managerId,
          action: 'UPDATE',
          entity: 'Department',
          description: `Cập nhật phòng ban: ${updatedDepartment.name}`,
        },
      });
    }

    return updatedDepartment;
  }

  async remove(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        employees: {
          where: { isActive: true },
        },
      },
    });

    if (!department) {
      throw new NotFoundException(`Không tìm thấy phòng ban với ID: ${id}`);
    }

    if (department.employees.length > 0) {
      throw new BadRequestException(
        `Không thể xóa phòng ban "${department.name}" vì còn ${department.employees.length} nhân viên hoạt động. Vui lòng chuyển nhân viên sang phòng ban khác trước.`,
      );
    }

    await this.prisma.department.delete({
      where: { id },
    });

    if (department.managerId) {
      await this.prisma.activityLog.create({
        data: {
          userId: department.managerId,
          action: 'DELETE',
          entity: 'Department',
          description: `Xóa phòng ban: ${department.name} (${department.code})`,
        },
      });
    }

    return {
      message: 'Xóa phòng ban thành công',
      deletedDepartment: {
        id: department.id,
        name: department.name,
        code: department.code,
      },
    };
  }

  async assignManager(departmentId: string, managerId: string | null) {
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        manager: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException(
        `Không tìm thấy phòng ban với ID: ${departmentId}`,
      );
    }

    if (managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: managerId },
        include: { role: true },
      });

      if (!manager) {
        throw new NotFoundException('Người quản lý không tồn tại');
      }

      if (!manager.isActive) {
        throw new BadRequestException('Người quản lý không còn hoạt động');
      }

      if (managerId !== department.managerId) {
        const existingManagedDept = await this.prisma.department.findFirst({
          where: {
            managerId,
            id: { not: departmentId },
          },
        });

        if (existingManagedDept) {
          throw new ConflictException(
            `${manager.fullName} đã quản lý phòng ban "${existingManagedDept.name}"`,
          );
        }
      }
    }

    const oldManagerName = department.manager?.fullName || 'Không có';
    const newManager = managerId
      ? await this.prisma.user.findUnique({
          where: { id: managerId },
          select: { fullName: true },
        })
      : null;

    await this.prisma.department.update({
      where: { id: departmentId },
      data: { managerId },
    });

    if (managerId) {
      await this.prisma.activityLog.create({
        data: {
          userId: managerId,
          action: 'ASSIGN_MANAGER',
          entity: 'Department',
          description: `Gán trưởng phòng cho "${department.name}": ${oldManagerName} → ${newManager?.fullName || 'Không có'}`,
        },
      });
    }

    return {
      message: 'Gán trưởng phòng thành công',
      department: {
        id: departmentId,
        name: department.name,
        managerId,
        managerName: newManager?.fullName || null,
      },
    };
  }

  /**
   * Gán nhiều nhân viên vào phòng ban
   * @param departmentId - ID phòng ban
   * @param employeeIds - Danh sách ID nhân viên
   * @param autoAssignManager - Tự động gán trưởng phòng làm manager trực tiếp (mặc định: true)
   */
  async assignEmployees(
    departmentId: string,
    employeeIds: string[],
    autoAssignManager: boolean = true,
  ) {
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
      include: { manager: true },
    });

    if (!department) {
      throw new NotFoundException(`Không tìm thấy phòng ban với ID: ${departmentId}`);
    }

    // Validate tất cả nhân viên tồn tại
    const employees = await this.prisma.user.findMany({
      where: {
        id: { in: employeeIds },
      },
      include: {
        role: true,
        department: true,
      },
    });

    if (employees.length !== employeeIds.length) {
      const foundIds = employees.map((e) => e.id);
      const notFoundIds = employeeIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Không tìm thấy nhân viên với ID: ${notFoundIds.join(', ')}`,
      );
    }

    // Validate không có manager trong danh sách
    const managersInList = employees.filter((e) => e.role.name === 'MANAGER');
    if (managersInList.length > 0) {
      throw new BadRequestException(
        `Không thể gán Manager vào phòng ban. Các nhân viên: ${managersInList.map((e) => e.fullName).join(', ')}`,
      );
    }

    // Update tất cả nhân viên
    const updateData: { departmentId: string; managerId?: string } = {
      departmentId,
    };

    // Nếu autoAssignManager = true và phòng ban có trưởng phòng
    if (autoAssignManager && department.managerId) {
      updateData.managerId = department.managerId;
    }

    const updateResults = await Promise.all(
      employees.map((employee) =>
        this.prisma.user.update({
          where: { id: employee.id },
          data: updateData,
        }),
      ),
    );

    // Log activity cho mỗi nhân viên
    await Promise.all(
      employees.map((employee) =>
        this.prisma.activityLog.create({
          data: {
            userId: employee.id,
            action: 'ASSIGN_TO_DEPARTMENT',
            entity: 'User',
            description: `Gán nhân viên "${employee.fullName}" vào phòng ban "${department.name}"${
              autoAssignManager && department.manager
                ? ` (Manager: ${department.manager.fullName})`
                : ''
            }`,
          },
        }),
      ),
    );

    return {
      message: `Đã gán ${employees.length} nhân viên vào phòng ban "${department.name}"`,
      department: {
        id: departmentId,
        name: department.name,
      },
      assignedEmployees: employees.map((e) => ({
        id: e.id,
        fullName: e.fullName,
        email: e.email,
      })),
      autoAssignedManager: autoAssignManager && department.managerId ? department.manager : null,
    };
  }

  /**
   * Bỏ gán nhiều nhân viên khỏi phòng ban
   * @param departmentId - ID phòng ban
   * @param employeeIds - Danh sách ID nhân viên
   */
  async removeEmployees(departmentId: string, employeeIds: string[]) {
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw new NotFoundException(`Không tìm thấy phòng ban với ID: ${departmentId}`);
    }

    // Validate tất cả nhân viên tồn tại và thuộc phòng ban này
    const employees = await this.prisma.user.findMany({
      where: {
        id: { in: employeeIds },
        departmentId,
      },
      include: {
        role: true,
      },
    });

    if (employees.length !== employeeIds.length) {
      const foundIds = employees.map((e) => e.id);
      const notInDepartmentIds = employeeIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(
        `Một số nhân viên không thuộc phòng ban này hoặc không tồn tại: ${notInDepartmentIds.join(', ')}`,
      );
    }

    // Validate không có manager trong danh sách
    const managersInList = employees.filter((e) => e.role.name === 'MANAGER');
    if (managersInList.length > 0) {
      throw new BadRequestException(
        `Không thể bỏ gán Manager khỏi phòng ban. Các nhân viên: ${managersInList.map((e) => e.fullName).join(', ')}`,
      );
    }

    // Update tất cả nhân viên: clear departmentId và managerId
    const updateResults = await Promise.all(
      employees.map((employee) =>
        this.prisma.user.update({
          where: { id: employee.id },
          data: {
            departmentId: null,
            managerId: null, // Clear manager khi bỏ gán khỏi phòng ban
          },
        }),
      ),
    );

    // Log activity cho mỗi nhân viên
    await Promise.all(
      employees.map((employee) =>
        this.prisma.activityLog.create({
          data: {
            userId: employee.id,
            action: 'REMOVE_FROM_DEPARTMENT',
            entity: 'User',
            description: `Bỏ gán nhân viên "${employee.fullName}" khỏi phòng ban "${department.name}"`,
          },
        }),
      ),
    );

    return {
      message: `Đã bỏ gán ${employees.length} nhân viên khỏi phòng ban "${department.name}"`,
      department: {
        id: departmentId,
        name: department.name,
      },
      removedEmployees: employees.map((e) => ({
        id: e.id,
        fullName: e.fullName,
        email: e.email,
      })),
    };
  }
}


