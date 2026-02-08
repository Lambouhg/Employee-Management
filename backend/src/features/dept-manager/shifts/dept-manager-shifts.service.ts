import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { AssignShiftDto, EmployeeAssignmentInfoDto } from './dto';
import { getDayOfWeekEnum, dayOfWeekToNumber, getStartOfWeek } from '../../../common/utils/date.util';
import { EmploymentType } from '@prisma/client';

@Injectable()
export class DeptManagerShiftsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Gán ca làm việc cho nhân viên
     * Business Rules:
     * - Chỉ gán cho nhân viên trong phòng ban của mình
     * - Không gán trùng ca (employeeId + date + shiftType)
     * - Opening phải thuộc plan của phòng ban
     * - Nhân viên không nghỉ phép ngày đó
     * - Full-time: không gán vào fixedDayOff, tối đa 6 ca/tuần
     * - Part-time: tối đa 5 ca/tuần, kiểm tra capacity của opening
     */
    async assignShift(currentUser: any, planId: string, dto: AssignShiftDto) {
        const department = await this.getManagedDepartment(currentUser.id);

        // 1. Validate plan thuộc phòng ban
        const plan = await this.prisma.deptWeeklyPlan.findFirst({
            where: {
                id: planId,
                departmentId: department.id
            }
        });

        if (!plan) {
            throw new NotFoundException('Plan không tồn tại hoặc không thuộc phòng ban của bạn');
        }

        // 2. Validate opening thuộc plan
        const opening = await this.prisma.shiftOpening.findFirst({
            where: {
                id: dto.openingId,
                planId: planId
            }
        });

        if (!opening) {
            throw new NotFoundException('Shift opening không tồn tại trong plan này');
        }

        // 3. Validate employee thuộc phòng ban
        const employee = await this.prisma.user.findFirst({
            where: {
                id: dto.employeeId,
                departmentId: department.id,
                isActive: true
            }
        });

        if (!employee) {
            throw new NotFoundException('Nhân viên không tồn tại hoặc không thuộc phòng ban của bạn');
        }

        // 3.1. Validate Full-time: không gán vào fixedDayOff
        if (employee.employmentType === 'FULL_TIME' && employee.fixedDayOff) {
            const shiftDayOfWeek = getDayOfWeekEnum(new Date(dto.date));
            if (shiftDayOfWeek === employee.fixedDayOff) {
                const dayNumber = dayOfWeekToNumber(employee.fixedDayOff);
                const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                throw new BadRequestException(
                    `${employee.fullName} nghỉ cố định vào ${dayNames[dayNumber! % 7]}. Không thể gán ca vào ngày này.`
                );
            }
        }

        // 3.2. Validate Part-time: kiểm tra capacity của opening
        if (employee.employmentType === 'PART_TIME') {
            if (!opening.isPTEnabled) {
                throw new BadRequestException('Ca này không mở cho nhân viên Part-time');
            }

            if (opening.ptRegistered >= opening.ptCapacity) {
                throw new BadRequestException(
                    `Ca này đã đủ Part-time (${opening.ptRegistered}/${opening.ptCapacity})`
                );
            }
        }

        // 3.3. Validate Full-time: kiểm tra opening có mở cho FT không
        if (employee.employmentType === 'FULL_TIME' && !opening.isFTEnabled) {
            throw new BadRequestException('Ca này không mở cho nhân viên Full-time');
        }

        // 4. Kiểm tra số ca đã gán trong tuần
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

        // Full-time: tối đa 6 ca/tuần (nghỉ 1 ngày)
        // Part-time: tối đa 5 ca/tuần
        const maxShiftsPerWeek = employee.employmentType === 'FULL_TIME' ? 6 : 5;
        if (existingShiftsInWeek >= maxShiftsPerWeek) {
            throw new BadRequestException(
                `${employee.fullName} đã đủ ${maxShiftsPerWeek} ca trong tuần (${employee.employmentType === 'FULL_TIME' ? 'Full-time' : 'Part-time'})`
            );
        }

        // 5. Kiểm tra nhân viên có nghỉ phép ngày đó không
        const shiftDate = new Date(dto.date);
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
                `${employee.fullName} đã được duyệt nghỉ phép từ ${new Date(approvedLeave.startDate).toLocaleDateString('vi-VN')} ` +
                `đến ${new Date(approvedLeave.endDate).toLocaleDateString('vi-VN')}`
            );
        }

        // Cảnh báo nếu có nghỉ phép đang chờ duyệt (không block nhưng log warning)
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
                `[LEAVE WARNING] ${employee.fullName} có yêu cầu nghỉ phép đang chờ duyệt ` +
                `từ ${new Date(pendingLeave.startDate).toLocaleDateString('vi-VN')} ` +
                `đến ${new Date(pendingLeave.endDate).toLocaleDateString('vi-VN')}. ` +
                `Ca làm vẫn được gán nhưng có thể conflict sau khi duyệt.`
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
