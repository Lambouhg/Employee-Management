import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../common/database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeeActionsService {
  constructor(private prisma: PrismaService) {}

  async activate(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy nhân viên với ID: ${id}`);
    }

    // Prevent manager from activating other managers
    if (user.role.name === 'MANAGER') {
      throw new BadRequestException('Không thể kích hoạt Manager khác');
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
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy nhân viên với ID: ${id}`);
    }

    // Prevent manager from deactivating other managers
    if (user.role.name === 'MANAGER') {
      throw new BadRequestException('Không thể vô hiệu hóa Manager khác');
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
      include: {
        department: true,
        manager: {
          include: { department: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy nhân viên với ID: ${userId}`);
    }

    const oldDeptName = user.department?.name || 'Không có';
    const oldManagerName = user.manager?.fullName || 'Không có';

    // Validate department if provided
    let newDept: { id: string; name: string; code: string; managerId: string | null; manager: { id: string; fullName: string } | null } | null = null;
    if (departmentId) {
      const foundDept = await this.prisma.department.findUnique({
        where: { id: departmentId },
        include: { manager: { select: { id: true, fullName: true } } },
      });

      if (!foundDept) {
        throw new BadRequestException('Phòng ban không tồn tại');
      }
      newDept = {
        id: foundDept.id,
        name: foundDept.name,
        code: foundDept.code,
        managerId: foundDept.managerId,
        manager: foundDept.manager,
      };
    }

    // Business logic: Xử lý manager khi chuyển/xóa phòng ban
    let newManagerId: string | null | undefined = undefined;

    if (departmentId === null) {
      // Xóa phòng ban → tự động clear manager
      newManagerId = null;
    } else if (departmentId && newDept && newDept.managerId) {
      // Chuyển sang phòng ban mới có trưởng phòng → tự động gán trưởng phòng
      newManagerId = newDept.managerId;
    } else if (departmentId && user.managerId && user.manager?.departmentId !== departmentId) {
      // Manager cũ không thuộc phòng ban mới → clear manager
      newManagerId = null;
    }
    // Nếu manager cũ vẫn thuộc phòng ban mới → giữ nguyên (undefined = không thay đổi)

    // Update user
    const updateData: { departmentId: string | null; managerId?: string | null } = {
      departmentId,
    };

    if (newManagerId !== undefined) {
      updateData.managerId = newManagerId;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    const newDeptName = newDept ? newDept.name : 'Không có';
    const newManagerName =
      updatedUser.manager?.fullName ||
      (newDept && newDept.manager ? newDept.manager.fullName : 'Chưa có trưởng phòng');

    // Log activity với thông tin chi tiết
    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'TRANSFER_DEPARTMENT',
        entity: 'User',
        description: `Chuyển nhân viên ${user.fullName} từ phòng ban "${oldDeptName}" (QL: ${oldManagerName}) sang "${newDeptName}" (QL: ${newManagerName})`,
      },
    });

    return {
      message: 'Chuyển phòng ban thành công',
      user: {
        id: userId,
        departmentId,
        departmentName: newDeptName,
        managerId: updatedUser.managerId || null,
        managerName: updatedUser.manager?.fullName || null,
      },
      autoAssignedManager:
        newManagerId !== undefined &&
        newManagerId !== null &&
        newManagerId !== user.managerId,
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
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy nhân viên với ID: ${id}`);
    }

    // Prevent manager from resetting password of other managers
    if (user.role.name === 'MANAGER') {
      throw new BadRequestException('Không thể reset mật khẩu của Manager khác');
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
}


