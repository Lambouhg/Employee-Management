import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import {
  EmploymentType,
  PlanStatus,
  Prisma,
  RegistrationStatus,
  ShiftType,
} from '@prisma/client';
import { RegisterShiftDto, GetAvailableShiftsQueryDto, MyRegistrationsQueryDto } from './dto';

@Injectable()
export class StaffShiftRegistrationsService {
  private readonly logger = new Logger(StaffShiftRegistrationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get available shift openings for staff to register
   * Only shows shifts from PUBLISHED plans with available capacity
   */
  async getAvailableShifts(userId: string, query: GetAvailableShiftsQueryDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, employmentType: true, departmentId: true, fullName: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.departmentId) {
      throw new BadRequestException('User is not assigned to any department');
    }

    const where: Prisma.ShiftOpeningWhereInput = {
      plan: {
        departmentId: user.departmentId,
        status: PlanStatus.PUBLISHED, // Only published plans
      },
      // Filter by employee type
      ...(user.employmentType === EmploymentType.PART_TIME
        ? { isPTEnabled: true, ptCapacity: { gt: 0 } } // PT: must have capacity
        : { isFTEnabled: true }), // FT: must be enabled for FT
    };

    // Date filters
    const dateFilter: any = {};
    if (query.startDate) {
      dateFilter.gte = new Date(query.startDate);
    }
    if (query.endDate) {
      dateFilter.lte = new Date(query.endDate);
    }
    if (Object.keys(dateFilter).length > 0) {
      where.date = dateFilter;
    }
    if (query.shiftType) {
      where.shiftType = query.shiftType;
    }

    const openings = await this.prisma.shiftOpening.findMany({
      where,
      include: {
        plan: {
          select: {
            weekStartDate: true,
            status: true,
            department: { select: { name: true, code: true } },
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
        shiftRegistrations: {
          where: {
            employeeId: userId,
            status: {
              in: [RegistrationStatus.PENDING, RegistrationStatus.APPROVED],
            },
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    // Get all existing shifts for the user in the date range
    const shiftDateFilter: Prisma.ShiftWhereInput['date'] = {};
    if (query.startDate) {
      (shiftDateFilter as any).gte = new Date(query.startDate);
    }
    if (query.endDate) {
      (shiftDateFilter as any).lte = new Date(query.endDate);
    }

    const existingShifts = await this.prisma.shift.findMany({
      where: {
        employeeId: userId,
        ...(Object.keys(shiftDateFilter).length > 0 && { date: shiftDateFilter }),
      },
      select: {
        date: true,
        shiftType: true,
      },
    });

    // Create a map for quick lookup: "date|shiftType" -> true
    const existingShiftMap = new Map(
      existingShifts.map(shift => [
        `${shift.date.toISOString().split('T')[0]}|${shift.shiftType}`,
        true,
      ]),
    );

    // Calculate availability and filter out full shifts for PT
    return openings
      .map((opening) => {
        const totalRegistrations = opening._count.shiftRegistrations;
        const availableSlots =
          user.employmentType === EmploymentType.PART_TIME
            ? Math.max(0, opening.ptCapacity - totalRegistrations)
            : null;

        const myRegistration = opening.shiftRegistrations[0] || null;

        // Check if user already has a shift assigned for this date
        const dateStr = opening.date.toISOString().split('T')[0];
        const shiftKey = `${dateStr}|${opening.shiftType}`;
        const hasExistingShift = existingShiftMap.has(shiftKey);

        return {
          id: opening.id,
          date: opening.date,
          shiftType: opening.shiftType,
          startTime: opening.startTime,
          endTime: opening.endTime,
          notes: opening.notes,
          plan: opening.plan,
          template: opening.template,
          isPTEnabled: opening.isPTEnabled,
          isFTEnabled: opening.isFTEnabled,
          ptCapacity: opening.ptCapacity,
          ptRegistered: totalRegistrations,
          availableSlots,
          canRegister:
            !myRegistration &&
            !hasExistingShift &&
            (user.employmentType === EmploymentType.FULL_TIME ||
              (availableSlots ?? 0) > 0),
          myRegistration,
          hasExistingShift,
        };
      })
      .filter((opening) => {
        // Filter out full shifts for PT
        if (user.employmentType === EmploymentType.PART_TIME) {
          return (opening.availableSlots ?? 0) > 0 || opening.myRegistration;
        }
        return true;
      });
  }

  /**
   * Register for a shift
   */
  async registerForShift(userId: string, dto: RegisterShiftDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, employmentType: true, departmentId: true, fullName: true },
    });

    // Get shift opening with plan
    const opening = await this.prisma.shiftOpening.findUnique({
      where: { id: dto.openingId },
      include: {
        plan: {
          select: {
            status: true,
            departmentId: true,
            department: { select: { managerId: true } },
          },
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
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!opening) {
      throw new NotFoundException('Shift opening not found');
    }

    // Validation: Plan must be PUBLISHED
    if (opening.plan.status !== PlanStatus.PUBLISHED) {
      throw new BadRequestException('This shift is not available for registration');
    }

    // Validation: User must be in the same department
    if (opening.plan.departmentId !== user.departmentId) {
      throw new BadRequestException('You can only register for shifts in your department');
    }

    // Validation: Check employee type eligibility
    if (user.employmentType === EmploymentType.PART_TIME && !opening.isPTEnabled) {
      throw new BadRequestException('This shift is not available for part-time employees');
    }
    if (user.employmentType === EmploymentType.FULL_TIME && !opening.isFTEnabled) {
      throw new BadRequestException('This shift is not available for full-time employees');
    }

    // Validation: Check capacity for PT
    if (user.employmentType === EmploymentType.PART_TIME) {
      const registeredCount = opening._count.shiftRegistrations;
      if (registeredCount >= opening.ptCapacity) {
        throw new BadRequestException('This shift is already full');
      }
    }

    // Check if already registered
    const existingRegistration = await this.prisma.shiftRegistration.findUnique({
      where: {
        openingId_employeeId: {
          openingId: dto.openingId,
          employeeId: userId,
        },
      },
    });

    if (existingRegistration) {
      throw new ConflictException('You have already registered for this shift');
    }

    // Check if user already has a shift assigned for this date and shift type
    const existingShift = await this.prisma.shift.findFirst({
      where: {
        employeeId: userId,
        date: opening.date,
        shiftType: opening.shiftType,
      },
    });

    if (existingShift) {
      throw new ConflictException(
        'You already have a shift assigned for this date and shift type',
      );
    }

    // Create registration
    const registration = await this.prisma.shiftRegistration.create({
      data: {
        openingId: dto.openingId,
        employeeId: userId,
        employmentType: user.employmentType,
        notes: dto.notes,
        status: RegistrationStatus.PENDING,
      },
      include: {
        opening: {
          include: {
            plan: {
              select: {
                weekStartDate: true,
                department: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    this.logger.log(
      `User ${user.fullName} registered for shift ${opening.shiftType} on ${opening.date}`,
    );

    return registration;
  }

  /**
   * Get my registrations
   */
  async getMyRegistrations(userId: string, query: MyRegistrationsQueryDto) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ShiftRegistrationWhereInput = {
      employeeId: userId,
      ...(status && { status }),
    };

    const [registrations, total] = await Promise.all([
      this.prisma.shiftRegistration.findMany({
        where,
        include: {
          opening: {
            select: {
              date: true,
              shiftType: true,
              startTime: true,
              endTime: true,
              notes: true,
              plan: {
                select: {
                  weekStartDate: true,
                  department: { select: { name: true, code: true } },
                },
              },
              template: {
                select: { name: true },
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.shiftRegistration.count({ where }),
    ]);

    return {
      data: registrations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Cancel my registration (only if PENDING)
   */
  async cancelRegistration(userId: string, registrationId: string) {
    const registration = await this.prisma.shiftRegistration.findUnique({
      where: { id: registrationId },
      select: { id: true, employeeId: true, status: true },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.employeeId !== userId) {
      throw new BadRequestException('You can only cancel your own registrations');
    }

    if (registration.status !== RegistrationStatus.PENDING) {
      throw new BadRequestException('Only pending registrations can be cancelled');
    }

    return this.prisma.shiftRegistration.update({
      where: { id: registrationId },
      data: { status: RegistrationStatus.CANCELLED },
    });
  }
}
