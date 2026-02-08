import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { ApproveLeaveDto, GetDepartmentLeavesQueryDto } from './dto';

@Injectable()
export class DeptManagerLeavesService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Lấy danh sách nghỉ phép của nhân viên trong phòng ban
     */
    async getDepartmentLeaves(managerId: string, query: GetDepartmentLeavesQueryDto) {
        // Lấy phòng ban do manager quản lý
        const department = await this.prisma.department.findFirst({
            where: { managerId }
        });

        if (!department) {
            throw new ForbiddenException('Bạn không phải trưởng phòng của phòng ban nào');
        }

        const { status, startDate, endDate, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: any = {
            employee: {
                departmentId: department.id
            }
        };

        if (status) {
            where.status = status;
        }

        if (startDate || endDate) {
            where.AND = [];
            if (startDate) {
                where.AND.push({ startDate: { gte: new Date(startDate) } });
            }
            if (endDate) {
                where.AND.push({ endDate: { lte: new Date(endDate) } });
            }
        }

        const [leaveRequests, total] = await Promise.all([
            this.prisma.leaveRequest.findMany({
                where,
                include: {
                    employee: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            employmentType: true
                        }
                    },
                    approvedBy: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true
                        }
                    }
                },
                orderBy: [
                    { status: 'asc' }, // PENDING first
                    { createdAt: 'desc' }
                ],
                skip,
                take: limit
            }),
            this.prisma.leaveRequest.count({ where })
        ]);

        return {
            data: leaveRequests,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            department: {
                id: department.id,
                name: department.name,
                code: department.code
            }
        };
    }

    /**
     * Lấy chi tiết một yêu cầu nghỉ phép
     */
    async getLeaveRequestById(managerId: string, leaveId: string) {
        const department = await this.prisma.department.findFirst({
            where: { managerId }
        });

        if (!department) {
            throw new ForbiddenException('Bạn không phải trưởng phòng của phòng ban nào');
        }

        const leaveRequest = await this.prisma.leaveRequest.findFirst({
            where: {
                id: leaveId,
                employee: {
                    departmentId: department.id
                }
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        employmentType: true,
                        phone: true
                    }
                },
                approvedBy: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                }
            }
        });

        if (!leaveRequest) {
            throw new NotFoundException('Không tìm thấy yêu cầu nghỉ phép hoặc không thuộc phòng ban của bạn');
        }

        // Check for conflicting shifts
        const conflictingShifts = await this.prisma.shift.findMany({
            where: {
                employeeId: leaveRequest.employeeId,
                date: {
                    gte: leaveRequest.startDate,
                    lte: leaveRequest.endDate
                }
            },
            include: {
                schedule: {
                    select: {
                        status: true,
                        weekStartDate: true
                    }
                }
            },
            orderBy: {
                date: 'asc'
            }
        });

        return {
            ...leaveRequest,
            conflictingShifts: conflictingShifts.map(shift => ({
                id: shift.id,
                date: shift.date,
                shiftType: shift.shiftType,
                scheduleStatus: shift.schedule.status
            }))
        };
    }

    /**
     * Duyệt hoặc từ chối yêu cầu nghỉ phép
     */
    async approveOrRejectLeave(managerId: string, leaveId: string, dto: ApproveLeaveDto) {
        const department = await this.prisma.department.findFirst({
            where: { managerId }
        });

        if (!department) {
            throw new ForbiddenException('Bạn không phải trưởng phòng của phòng ban nào');
        }

        const leaveRequest = await this.prisma.leaveRequest.findFirst({
            where: {
                id: leaveId,
                employee: {
                    departmentId: department.id
                }
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                }
            }
        });

        if (!leaveRequest) {
            throw new NotFoundException('Không tìm thấy yêu cầu nghỉ phép hoặc không thuộc phòng ban của bạn');
        }

        if (leaveRequest.status !== 'PENDING') {
            throw new BadRequestException('Yêu cầu này đã được xử lý');
        }

        if (dto.action === 'REJECT' && !dto.rejectionReason) {
            throw new BadRequestException('Vui lòng nhập lý do từ chối');
        }

        // If approving, handle conflicting shifts
        if (dto.action === 'APPROVE') {
            const conflictingShifts = await this.prisma.shift.findMany({
                where: {
                    employeeId: leaveRequest.employeeId,
                    date: {
                        gte: leaveRequest.startDate,
                        lte: leaveRequest.endDate
                    }
                }
            });

            // Delete all conflicting shifts
            if (conflictingShifts.length > 0) {
                await this.prisma.shift.deleteMany({
                    where: {
                        id: {
                            in: conflictingShifts.map(s => s.id)
                        }
                    }
                });

                // Log activity
                await this.prisma.activityLog.create({
                    data: {
                        userId: managerId,
                        action: 'AUTO_DELETE_SHIFTS_ON_LEAVE_APPROVAL',
                        entity: 'Shift',
                        description: `Tự động xóa ${conflictingShifts.length} ca làm việc conflict với nghỉ phép được duyệt`,
                        metadata: {
                            leaveRequestId: leaveId,
                            employeeId: leaveRequest.employeeId,
                            employeeName: leaveRequest.employee.fullName,
                            deletedShiftIds: conflictingShifts.map(s => s.id),
                            leaveStartDate: leaveRequest.startDate,
                            leaveEndDate: leaveRequest.endDate
                        }
                    }
                });
            }
        }

        // Update leave request status
        const updated = await this.prisma.leaveRequest.update({
            where: { id: leaveId },
            data: {
                status: dto.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
                approvedById: managerId,
                approvedAt: new Date(),
                rejectionReason: dto.rejectionReason
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
                approvedBy: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                }
            }
        });

        // Log activity
        await this.prisma.activityLog.create({
            data: {
                userId: managerId,
                action: dto.action === 'APPROVE' ? 'APPROVE_LEAVE' : 'REJECT_LEAVE',
                entity: 'LeaveRequest',
                entityId: leaveId,
                description: dto.action === 'APPROVE'
                    ? `Duyệt nghỉ phép cho ${leaveRequest.employee.fullName}`
                    : `Từ chối nghỉ phép của ${leaveRequest.employee.fullName}`,
                metadata: {
                    employeeId: leaveRequest.employeeId,
                    startDate: leaveRequest.startDate,
                    endDate: leaveRequest.endDate,
                    leaveType: leaveRequest.leaveType,
                    rejectionReason: dto.rejectionReason
                }
            }
        });

        return updated;
    }

    /**
     * Lấy thống kê nghỉ phép của phòng ban
     */
    async getDepartmentLeaveStats(managerId: string) {
        const department = await this.prisma.department.findFirst({
            where: { managerId },
            include: {
                employees: {
                    where: { isActive: true },
                    select: { id: true }
                }
            }
        });

        if (!department) {
            throw new ForbiddenException('Bạn không phải trưởng phòng của phòng ban nào');
        }

        const employeeIds = department.employees.map(e => e.id);
        const currentYear = new Date().getFullYear();
        const yearStart = new Date(currentYear, 0, 1);
        const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

        const [pending, approved, rejected, thisMonth] = await Promise.all([
            this.prisma.leaveRequest.count({
                where: {
                    employeeId: { in: employeeIds },
                    status: 'PENDING'
                }
            }),
            this.prisma.leaveRequest.count({
                where: {
                    employeeId: { in: employeeIds },
                    status: 'APPROVED',
                    startDate: { gte: yearStart, lte: yearEnd }
                }
            }),
            this.prisma.leaveRequest.count({
                where: {
                    employeeId: { in: employeeIds },
                    status: 'REJECTED',
                    startDate: { gte: yearStart, lte: yearEnd }
                }
            }),
            this.prisma.leaveRequest.count({
                where: {
                    employeeId: { in: employeeIds },
                    startDate: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                        lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
                    }
                }
            })
        ]);

        return {
            department: {
                id: department.id,
                name: department.name,
                code: department.code
            },
            totalEmployees: employeeIds.length,
            leaveStats: {
                pendingRequests: pending,
                approvedThisYear: approved,
                rejectedThisYear: rejected,
                requestsThisMonth: thisMonth
            }
        };
    }
}
