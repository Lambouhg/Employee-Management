import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/database/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { AssignDepartmentManagerDto } from './dto/assign-manager.dto';
import { AssignEmployeesDto } from './dto/assign-employees.dto';
import { RemoveEmployeesDto } from './dto/remove-employees.dto';
import { DepartmentRelationshipsHelper } from './helpers/department-relationships.helper';

@Injectable()
export class ManagerDepartmentsService {
  private relationshipsHelper: DepartmentRelationshipsHelper;

  constructor(private readonly prisma: PrismaService) {
    this.relationshipsHelper = new DepartmentRelationshipsHelper(prisma);
  }

  async findAll(includeEmployees: boolean = false) {
    return this.prisma.department.findMany({
      where: {
        isActive: true, // Only return active departments
      },
      include: {
        manager: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
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
        employees: includeEmployees
          ? {
            select: {
              id: true,
              email: true,
              fullName: true,
              phone: true,
              employmentType: true,
              isActive: true,
              role: {
                select: {
                  id: true,
                  name: true,
                  displayName: true,
                  level: true,
                },
              },
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
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
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
        employees: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            employmentType: true,
            isActive: true,
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
      },
    });

    if (!department) {
      return null;
    }

    const statistics = {
      totalEmployees: department.employees.length,
      activeEmployees: department.employees.filter((e) => e.isActive).length,
      fullTimeEmployees: department.employees.filter(
        (e) => e.employmentType === 'FULL_TIME',
      ).length,
      partTimeEmployees: department.employees.filter(
        (e) => e.employmentType === 'PART_TIME',
      ).length,
    };

    return {
      ...department,
      statistics,
    };
  }

  async create(dto: CreateDepartmentDto, currentUser: any) {
    try {
      // Check for duplicate name (including inactive departments)
      const existingByName = await this.prisma.department.findFirst({
        where: {
          name: dto.name,
        },
      });

      if (existingByName) {
        throw new ConflictException(`Tên phòng ban "${dto.name}" đã tồn tại`);
      }

      // Check for duplicate code (including inactive departments)
      const existingByCode = await this.prisma.department.findFirst({
        where: {
          code: dto.code,
        },
      });

      if (existingByCode) {
        throw new ConflictException(`Mã phòng ban "${dto.code}" đã tồn tại`);
      }

      // Create department without manager
      // Manager assignment must be done separately via AssignManagerModal
      return await this.prisma.department.create({
        data: {
          name: dto.name,
          code: dto.code,
          description: dto.description,
          managerId: null, // No manager on creation
          isActive: true, // Explicitly set to active
        },
      });
    } catch (error: any) {
      // Log full error for debugging
      console.error(
        'Error creating department - Full error:',
        JSON.stringify(error, null, 2),
      );
      console.error('Error code:', error?.code);
      console.error('Error meta:', error?.meta);

      // Handle Prisma unique constraint errors
      if (error?.code === 'P2002') {
        // Unique constraint violation
        // Check both meta.target (standard Prisma) and meta.driverAdapterError.cause.constraint.fields (adapter)
        const target = error?.meta?.target;
        const constraintFields =
          error?.meta?.driverAdapterError?.cause?.constraint?.fields ||
          error?.meta?.constraint?.fields;

        console.log('Target:', target);
        console.log('Constraint fields:', constraintFields);

        // Prioritize constraintFields from adapter, fallback to target
        const fields = Array.isArray(constraintFields)
          ? constraintFields
          : Array.isArray(target)
            ? target
            : [];

        console.log('Resolved fields:', fields);

        if (fields.includes('name')) {
          throw new ConflictException(`Tên phòng ban "${dto.name}" đã tồn tại`);
        }
        if (fields.includes('code')) {
          throw new ConflictException(`Mã phòng ban "${dto.code}" đã tồn tại`);
        }
        if (fields.includes('managerId')) {
          throw new ConflictException(
            'Người quản lý này đang quản lý phòng ban khác',
          );
        }
        throw new ConflictException('Dữ liệu đã tồn tại trong hệ thống');
      }
      if (error?.code === 'P2025') {
        throw new NotFoundException('Không tìm thấy dữ liệu liên quan');
      }

      // Re-throw known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      // Log unexpected errors with full details
      console.error('Unexpected error creating department:', {
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        meta: error?.meta,
      });
      throw new BadRequestException(
        error?.message || 'Không thể tạo phòng ban. Vui lòng thử lại.',
      );
    }
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    return this.prisma.department.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    try {
      // Hard delete: Permanently delete department and handle all related data
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Get department info before deletion
        const department = await tx.department.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            managerId: true,
          },
        });

        if (!department) {
          throw new NotFoundException('Không tìm thấy phòng ban');
        }

        // 2. Use helper to clean up all relationships automatically
        await this.relationshipsHelper.cleanupOnDelete(id, tx);

        // 3. Hard delete the department (permanently remove from database)
        const deletedDepartment = await tx.department.delete({
          where: { id },
        });
        console.log(`  ✅ Hard deleted department: ${deletedDepartment.name}`);

        return {
          message:
            'Đã xóa phòng ban thành công. Tất cả nhân viên đã được gỡ khỏi phòng ban.',
        };
      });

      return result;
    } catch (error: any) {
      // Re-throw known exceptions
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Log unexpected errors
      console.error('Error deleting department:', {
        id,
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
      });

      throw new BadRequestException(
        error?.message || 'Không thể xóa phòng ban. Vui lòng thử lại.',
      );
    }
  }

  async assignManager(
    id: string,
    dto: AssignDepartmentManagerDto,
    currentUser: any,
  ) {
    try {
      // Business rule: DEPT_MANAGER can only manage their own department
      if (currentUser.role.name === 'DEPT_MANAGER') {
        const userDepartment = await this.prisma.user.findUnique({
          where: { id: currentUser.id },
          select: { departmentId: true },
        });

        if (!userDepartment?.departmentId || userDepartment.departmentId !== id) {
          throw new ForbiddenException(
            'Bạn chỉ có thể quản lý phòng ban của mình',
          );
        }
      }

      // Validate that the manager being assigned is a DEPT_MANAGER
      if (dto.managerId) {
        const managerToAssign = await this.prisma.user.findUnique({
          where: { id: dto.managerId },
          select: { role: { select: { level: true, name: true } } },
        });

        if (!managerToAssign || managerToAssign.role.name !== 'DEPT_MANAGER') {
          throw new BadRequestException(
            'Chỉ DEPT_MANAGER mới có thể làm trưởng phòng ban',
          );
        }
      }

      return await this.prisma.$transaction(async (tx) => {
        // 1. Get current department info to handle manager removal
        const currentDepartment = await tx.department.findUnique({
          where: { id },
          select: { managerId: true },
        });

        // 2. Update department manager
        const department = await tx.department.update({
          where: { id },
          data: {
            managerId: dto.managerId ?? null,
          },
        });

        // 3. Handle manager assignment/removal
        if (dto.managerId) {
          // Assigning new manager: link manager to this department
          // Note: DEPT_MANAGER should NOT have a managerId (they are managers themselves)
          await tx.user.update({
            where: { id: dto.managerId },
            data: {
              departmentId: id,
              managerId: null, // Ensure DEPT_MANAGER doesn't have a manager
            },
          });
        } else if (currentDepartment?.managerId) {
          // Removing manager: unlink old manager from this department
          await tx.user.update({
            where: { id: currentDepartment.managerId },
            data: { departmentId: null },
          });
        }

        // 4. Automatically update all REGULAR employees' manager relationships
        //    Only regular employees (not DEPT_MANAGER) will report to the department manager
        await this.relationshipsHelper.updateEmployeeManagers(
          id,
          dto.managerId ?? null,
          tx,
        );

        return department;
      });
    } catch (error: any) {
      console.error('Error assigning manager:', error);

      // Handle Prisma unique constraint violation
      // P2002: Unique constraint failed on the fields: (`"managerId"`)
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        // Check if target contains 'managerId' (array or string depending on DB adapter)
        if (
          (Array.isArray(target) && target.includes('managerId')) ||
          (typeof target === 'string' && target.includes('managerId')) ||
          error.message?.includes('managerId')
        ) {
          throw new BadRequestException(
            'Người quản lý này đang quản lý một phòng ban khác',
          );
        }
      }

      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        error.message || 'Lỗi không xác định khi gán quản lý',
      );
    }
  }

  async assignEmployees(id: string, dto: AssignEmployeesDto) {
    await this.prisma.$transaction(async (tx) => {
      // Use helper to automatically assign employees and handle manager relationships
      await this.relationshipsHelper.assignEmployeesToDepartment(
        id,
        dto.employeeIds,
        dto.autoAssignManager !== false, // Default to true
        tx,
      );
    });

    return { message: 'Gán nhân viên vào phòng ban thành công' };
  }

  async removeEmployees(id: string, dto: RemoveEmployeesDto) {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Use helper to automatically remove employees and handle manager relationships
        await this.relationshipsHelper.removeEmployeesFromDepartment(
          id,
          dto.employeeIds,
          tx,
        );
      });

      return { message: 'Đã bỏ gán nhân viên khỏi phòng ban' };
    } catch (error: any) {
      // Re-throw known exceptions
      if (error.message?.includes('Không thể xóa quản lý phòng ban')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
