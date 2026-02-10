import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { Prisma, RegistrationStatus } from '@prisma/client';
import { ReviewRegistrationDto, GetRegistrationsQueryDto } from './dto';

@Injectable()
export class DeptManagerShiftRegistrationsService {
  private readonly logger = new Logger(DeptManagerShiftRegistrationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get shift registrations for review (Department Manager)
   */
  async getRegistrations(userId: string, query: GetRegistrationsQueryDto) {
    // Get manager's department
    const manager = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        departmentId: true,
        managedDepartment: { select: { id: true } },
        fullName: true,
      },
    });

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    const departmentId = manager.managedDepartment?.id || manager.departmentId;
    if (!departmentId) {
      throw new BadRequestException('Manager is not assigned to any department');
    }

    const { status, date, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ShiftRegistrationWhereInput = {
      opening: {
        plan: {
          departmentId,
        },
      },
      ...(status && { status }),
      ...(date && {
        opening: {
          date: new Date(date),
        },
      }),
    };

    const [registrations, total] = await Promise.all([
      this.prisma.shiftRegistration.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              employmentType: true,
              role: {
                select: {
                  id: true,
                  name: true,
                  displayName: true,
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
          opening: {
            select: {
              id: true,
              date: true,
              shiftType: true,
              startTime: true,
              endTime: true,
              ptCapacity: true,
              notes: true,
              plan: {
                select: {
                  weekStartDate: true,
                  status: true,
                  department: { select: { name: true } },
                },
              },
              template: {
                select: { name: true, code: true },
              },
              _count: {
                select: {
                  shiftRegistrations: {
                    where: {
                      status: {
                        in: [RegistrationStatus.PENDING, RegistrationStatus.APPROVED],
                      },
                    },
                  },
                },
              },
            },
          },
          reviewedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: [
          { status: 'asc' }, // PENDING first
          { createdAt: 'asc' }, // Oldest first
        ],
        skip,
        take: limit,
      }),
      this.prisma.shiftRegistration.count({ where }),
    ]);

    // Add availability info
    const registrationsWithAvailability = registrations.map((reg) => ({
      ...reg,
      availableSlots: Math.max(
        0,
        reg.opening.ptCapacity - reg.opening._count.shiftRegistrations,
      ),
    }));

    return {
      data: registrationsWithAvailability,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get registration detail
   */
  async getRegistrationDetail(userId: string, registrationId: string) {
    const manager = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        departmentId: true,
        managedDepartment: { select: { id: true } },
      },
    });

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    const departmentId = manager.managedDepartment?.id || manager.departmentId;

    const registration = await this.prisma.shiftRegistration.findUnique({
      where: { id: registrationId },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            employmentType: true,
            department: { select: { name: true } },
          },
        },
        opening: {
          select: {
            id: true,
            date: true,
            shiftType: true,
            startTime: true,
            endTime: true,
            ptCapacity: true,
            ptRegistered: true,
            notes: true,
            plan: {
              select: {
                weekStartDate: true,
                status: true,
                department: { select: { id: true, name: true } },
              },
            },
            template: {
              select: { name: true, code: true, totalHours: true },
            },
          },
        },
        reviewedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    // Check if manager has access
    if (registration.opening.plan.department.id !== departmentId) {
      throw new ForbiddenException('You can only review registrations in your department');
    }

    return registration;
  }

  /**
   * Review registration (Approve/Reject)
   */
  async reviewRegistration(
    userId: string,
    registrationId: string,
    dto: ReviewRegistrationDto,
  ) {
    const registration = await this.prisma.shiftRegistration.findUnique({
      where: { id: registrationId },
      include: {
        employee: {
          select: {
            fullName: true,
            email: true,
            employmentType: true,
          },
        },
        opening: {
          select: {
            id: true,
            date: true,
            shiftType: true,
            ptCapacity: true,
            plan: {
              select: {
                departmentId: true,
                status: true,
              },
            },
            _count: {
              select: {
                shiftRegistrations: {
                  where: {
                    status: RegistrationStatus.APPROVED,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    // Check if registration is PENDING
    if (registration.status !== RegistrationStatus.PENDING) {
      throw new BadRequestException('Only pending registrations can be reviewed');
    }

    // Check if manager has access
    const manager = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        departmentId: true,
        managedDepartment: { select: { id: true } },
        fullName: true,
      },
    });

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    const departmentId = manager.managedDepartment?.id || manager.departmentId;
    if (registration.opening.plan.departmentId !== departmentId) {
      throw new ForbiddenException('You can only review registrations in your department');
    }

    // Validation for APPROVED status
    if (dto.status === RegistrationStatus.APPROVED) {
      // Check if shift is full
      const approvedCount = registration.opening._count.shiftRegistrations;
      if (approvedCount >= registration.opening.ptCapacity) {
        throw new BadRequestException('This shift is already full');
      }
    }

    // Validation for REJECTED status
    if (dto.status === RegistrationStatus.REJECTED && !dto.rejectionReason) {
      throw new BadRequestException('Rejection reason is required');
    }

    // Update registration
    const updated = await this.prisma.shiftRegistration.update({
      where: { id: registrationId },
      data: {
        status: dto.status,
        reviewedById: userId,
        reviewedAt: new Date(),
        rejectionReason: dto.rejectionReason,
      },
      include: {
        employee: {
          select: { fullName: true, email: true },
        },
        opening: {
          select: {
            date: true,
            shiftType: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    // Update ptRegistered count in ShiftOpening if APPROVED
    if (dto.status === RegistrationStatus.APPROVED) {
      await this.prisma.shiftOpening.update({
        where: { id: registration.opening.id },
        data: {
          ptRegistered: {
            increment: 1,
          },
        },
      });
    }

    this.logger.log(
      `Manager ${manager.fullName} ${dto.status} registration from ${updated.employee.fullName} for shift ${updated.opening.shiftType} on ${updated.opening.date}`,
    );

    return updated;
  }

  /**
   * Get registration statistics
   */
  async getRegistrationStats(userId: string) {
    const manager = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        departmentId: true,
        managedDepartment: { select: { id: true } },
      },
    });

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    const departmentId = manager.managedDepartment?.id || manager.departmentId;
    if (!departmentId) {
      throw new BadRequestException('Manager is not assigned to any department');
    }

    const where: Prisma.ShiftRegistrationWhereInput = {
      opening: {
        plan: {
          departmentId,
        },
      },
    };

    const [pending, approved, rejected, cancelled] = await Promise.all([
      this.prisma.shiftRegistration.count({
        where: { ...where, status: RegistrationStatus.PENDING },
      }),
      this.prisma.shiftRegistration.count({
        where: { ...where, status: RegistrationStatus.APPROVED },
      }),
      this.prisma.shiftRegistration.count({
        where: { ...where, status: RegistrationStatus.REJECTED },
      }),
      this.prisma.shiftRegistration.count({
        where: { ...where, status: RegistrationStatus.CANCELLED },
      }),
    ]);

    return {
      pending,
      approved,
      rejected,
      cancelled,
      total: pending + approved + rejected + cancelled,
    };
  }
}
