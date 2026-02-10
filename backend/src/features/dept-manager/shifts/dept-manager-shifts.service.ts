import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { AssignShiftDto, EmployeeAssignmentInfoDto } from './dto';
import { getDayOfWeekEnum, dayOfWeekToNumber, getStartOfWeek } from '../../../common/utils/date.util';
import { EmploymentType } from '@prisma/client';
import { parseISO } from 'date-fns';

@Injectable()
export class DeptManagerShiftsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Assign shift to employee
     * Business Rules:
     * - Only assign to employees in own department
     * - No duplicate shifts (employeeId + date + shiftType)
     * - Opening must belong to department plan
     * - Employee not on leave that day
     * - Full-time: no assignment on fixedDayOff, max 6 shifts/week
     * - Part-time: max 5 shifts/week, check opening capacity
     */
    async assignShift(currentUser: any, planId: string, dto: AssignShiftDto) {
        const department = await this.getManagedDepartment(currentUser.id);

        // 1. Validate plan belongs to department
        const plan = await this.prisma.deptWeeklyPlan.findFirst({
            where: {
                id: planId,
                departmentId: department.id
            }
        });

        if (!plan) {
            throw new NotFoundException('Plan not found or does not belong to your department');
        }

        // 2. Validate opening belongs to plan
        const opening = await this.prisma.shiftOpening.findFirst({
            where: {
                id: dto.openingId,
                planId: planId
            }
        });

        if (!opening) {
            throw new NotFoundException('Shift opening not found in this plan');
        }

        // 3. Validate employee belongs to department
        const employee = await this.prisma.user.findFirst({
            where: {
                id: dto.employeeId,
                departmentId: department.id,
                isActive: true
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                employmentType: true,
                fixedDayOff: true  // IMPORTANT: Must explicitly select this field
            }
        });

        if (!employee) {
            throw new NotFoundException('Employee not found or does not belong to your department');
        }

        // 3.1. Validate Full-time: no assignment on fixedDayOff
        if (employee.employmentType === 'FULL_TIME' && employee.fixedDayOff) {
            // Parse date properly to avoid timezone issues
            const dateStr = dto.date.split('T')[0]; // Extract YYYY-MM-DD only
            const [year, month, day] = dateStr.split('-').map(Number);
            const localDate = new Date(year, month - 1, day);
            const shiftDayOfWeek = getDayOfWeekEnum(localDate);
            
            // Detailed logging for debugging
            console.log('='.repeat(80));
            console.log('[FIXED DAY OFF VALIDATION]');
            console.log(`  Employee: ${employee.fullName}`);
            console.log(`  Fixed Day Off: ${employee.fixedDayOff}`);
            console.log(`  Shift Date: ${dateStr} (${shiftDayOfWeek})`);
            console.log(`  Date Object: ${localDate.toDateString()}`);
            console.log(`  Match: ${shiftDayOfWeek === employee.fixedDayOff ? 'YES - BLOCKING' : 'NO - ALLOWED'}`);
            console.log('='.repeat(80));
            
            if (shiftDayOfWeek === employee.fixedDayOff) {
                const dayNumber = dayOfWeekToNumber(employee.fixedDayOff);
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                throw new BadRequestException(
                    `${employee.fullName} has fixed day off on ${dayNames[dayNumber! % 7]}. Cannot assign shift on this day.`
                );
            }
        }

        // 3.2. Validate Part-time: check opening capacity
        if (employee.employmentType === 'PART_TIME') {
            if (!opening.isPTEnabled) {
                throw new BadRequestException('This shift is not open for Part-time employees');
            }

            if (opening.ptRegistered >= opening.ptCapacity) {
                throw new BadRequestException(
                    `This shift is full for Part-time (${opening.ptRegistered}/${opening.ptCapacity})`
                );
            }
        }

        // 3.3. Validate Full-time: check if opening is enabled for FT
        if (employee.employmentType === 'FULL_TIME' && !opening.isFTEnabled) {
            throw new BadRequestException('This shift is not open for Full-time employees');
        }

        // 4. Check number of assigned shifts in the week
        const weekStart = getStartOfWeek(new Date(dto.date));
        const existingShiftsInWeek = await this.prisma.shift.count({
            where: {
                employeeId: dto.employeeId,
                date: {
                    gte: weekStart,
                    lt: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
                }
            }
        });

        // Full-time: max 6 shifts/week (1 day off)
        // Part-time: max 5 shifts/week
        const maxShiftsPerWeek = employee.employmentType === 'FULL_TIME' ? 6 : 5;
        if (existingShiftsInWeek >= maxShiftsPerWeek) {
            throw new BadRequestException(
                `${employee.fullName} already has ${maxShiftsPerWeek} shifts this week (${employee.employmentType === 'FULL_TIME' ? 'Full-time' : 'Part-time'})`
            );
        }

        // 5. Check if employee has approved leave on that day
        // Use parseISO to avoid timezone issues when comparing dates
        const shiftDate = parseISO(dto.date);
        const approvedLeave = await this.prisma.leaveRequest.findFirst({
            where: {
                employeeId: dto.employeeId,
                status: 'APPROVED',
                startDate: { lte: shiftDate },
                endDate: { gte: shiftDate }
            }
        });

        if (approvedLeave) {
            throw new BadRequestException(
                `${employee.fullName} has approved leave from ${new Date(approvedLeave.startDate).toLocaleDateString('en-US')} ` +
                `to ${new Date(approvedLeave.endDate).toLocaleDateString('en-US')}`
            );
        }

        // Warning if pending leave exists (not blocking but log warning)
        const pendingLeave = await this.prisma.leaveRequest.findFirst({
            where: {
                employeeId: dto.employeeId,
                status: 'PENDING',
                startDate: { lte: shiftDate },
                endDate: { gte: shiftDate }
            }
        });

        if (pendingLeave) {
            console.warn(
                `[LEAVE WARNING] ${employee.fullName} has pending leave request ` +
                `from ${new Date(pendingLeave.startDate).toLocaleDateString('en-US')} ` +
                `to ${new Date(pendingLeave.endDate).toLocaleDateString('en-US')}. ` +
                `Shift assigned but may conflict if leave is approved.`
            );
        }

        // 6. Đảm bảo WorkSchedule tồn tại
        const schedule = await this.prisma.workSchedule.upsert({
            where: {
                employeeId_weekStartDate: {
                    employeeId: dto.employeeId,
                    weekStartDate: plan.weekStartDate
                }
            },
            update: {},
            create: {
                employeeId: dto.employeeId,
                weekStartDate: plan.weekStartDate,
                status: 'APPROVED'
            }
        });

        // 7. Kiểm tra trùng ca
        const existingShift = await this.prisma.shift.findFirst({
            where: {
                scheduleId: schedule.id,
                date: shiftDate,
                shiftType: dto.shiftType
            }
        });

        if (existingShift) {
            throw new BadRequestException(
                `Nhân viên đã được gán ca ${dto.shiftType} vào ngày ${dto.date}`
            );
        }

        // 8. Tạo shift và cập nhật PT count
        const shift = await this.prisma.shift.create({
            data: {
                scheduleId: schedule.id,
                employeeId: dto.employeeId,
                openingId: dto.openingId,
                date: shiftDate,
                shiftType: dto.shiftType,
                startTime: opening.startTime,
                endTime: opening.endTime,
                isAutoGenerated: false,
                notes: dto.notes || 'Manually assigned by dept manager'
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        employmentType: true
                    }
                },
                opening: {
                    select: {
                        id: true,
                        date: true,
                        shiftType: true,
                        startTime: true,
                        endTime: true
                    }
                }
            }
        });

        // 9. Cập nhật ptRegistered count nếu là Part-time
        if (employee.employmentType === 'PART_TIME') {
            await this.prisma.shiftOpening.update({
                where: { id: dto.openingId },
                data: {
                    ptRegistered: {
                        increment: 1
                    }
                }
            });
        }

        return shift;
    }

    /**
     * Gán nhiều ca cùng lúc (bulk assign)
     */
    async bulkAssignShifts(currentUser: any, planId: string, shifts: AssignShiftDto[]) {
        const results = {
            success: [] as any[],
            failed: [] as any[]
        };

        for (const shiftDto of shifts) {
            try {
                const shift = await this.assignShift(currentUser, planId, shiftDto);
                results.success.push({
                    employeeId: shiftDto.employeeId,
                    date: shiftDto.date,
                    shiftType: shiftDto.shiftType,
                    shift
                });
            } catch (error) {
                results.failed.push({
                    employeeId: shiftDto.employeeId,
                    date: shiftDto.date,
                    shiftType: shiftDto.shiftType,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Xóa ca đã gán
     */
    async unassignShift(currentUser: any, planId: string, shiftId: string) {
        const department = await this.getManagedDepartment(currentUser.id);

        // Validate plan
        const plan = await this.prisma.deptWeeklyPlan.findFirst({
            where: {
                id: planId,
                departmentId: department.id
            }
        });

        if (!plan) {
            throw new NotFoundException('Plan không tồn tại');
        }

        // Validate shift
        const shift = await this.prisma.shift.findFirst({
            where: {
                id: shiftId,
                schedule: {
                    weekStartDate: plan.weekStartDate,
                    employee: {
                        departmentId: department.id
                    }
                }
            },
            include: {
                attendance: true,
                employee: {
                    select: {
                        employmentType: true
                    }
                },
                opening: {
                    select: {
                        id: true
                    }
                }
            }
        });

        if (!shift) {
            throw new NotFoundException('Shift không tồn tại');
        }

        // Không cho xóa nếu đã chấm công
        if (shift.attendance) {
            throw new BadRequestException('Không thể xóa ca đã có chấm công');
        }

        // Xóa shift
        await this.prisma.shift.delete({
            where: { id: shiftId }
        });

        // Giảm ptRegistered count nếu là Part-time
        if (shift.employee.employmentType === 'PART_TIME' && shift.opening) {
            await this.prisma.shiftOpening.update({
                where: { id: shift.opening.id },
                data: {
                    ptRegistered: {
                        decrement: 1
                    }
                }
            });
        }

        return { message: 'Đã xóa ca làm việc' };
    }

    /**
     * Lấy danh sách ca đã gán cho một plan
     */
    async getAssignedShifts(currentUser: any, planId: string) {
        const department = await this.getManagedDepartment(currentUser.id);

        const plan = await this.prisma.deptWeeklyPlan.findFirst({
            where: {
                id: planId,
                departmentId: department.id
            },
            include: {
                shiftOpenings: {
                    include: {
                        shifts: {
                            include: {
                                employee: {
                                    select: {
                                        id: true,
                                        fullName: true,
                                        email: true,
                                        employmentType: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!plan) {
            throw new NotFoundException('Plan không tồn tại');
        }

        return plan;
    }

    private async getManagedDepartment(managerId: string) {
        const department = await this.prisma.department.findUnique({
            where: { managerId },
            select: { id: true, name: true, code: true }
        });

        if (!department) {
            throw new ForbiddenException('Bạn không phải là trưởng phòng của phòng ban nào');
        }

        return department;
    }
}
