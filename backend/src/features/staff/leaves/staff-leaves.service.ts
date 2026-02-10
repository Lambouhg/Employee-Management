import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import {
    CreateLeaveRequestDto,
    UpdateLeaveRequestDto,
    GetLeaveRequestsDto,
    LeaveRequestResponseDto,
    LeaveRequestListDto,
    LeaveBalanceDto
} from './dto';
import { LeaveStatus } from '@prisma/client';

@Injectable()
export class StaffLeavesService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Create leave request (auto-detect emergency based on date)
     */
    async createLeaveRequest(employeeId: string, dto: CreateLeaveRequestDto): Promise<LeaveRequestResponseDto> {
        // Validate dates
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate < today) {
            throw new BadRequestException('Start date cannot be in the past');
        }

        if (endDate < startDate) {
            throw new BadRequestException('End date must be after start date');
        }

        // Auto-detect emergency: if requesting for today or next 2 days
        const emergencyThreshold = new Date(today);
        emergencyThreshold.setDate(emergencyThreshold.getDate() + 2);
        const isEmergencyLeave = startDate <= emergencyThreshold;

        // Check for overlapping leave requests
        const overlapping = await this.prisma.leaveRequest.findFirst({
            where: {
                employeeId,
                status: {
                    in: ['PENDING', 'APPROVED']
                },
                OR: [
                    {
                        AND: [
                            { startDate: { lte: startDate } },
                            { endDate: { gte: startDate } }
                        ]
                    },
                    {
                        AND: [
                            { startDate: { lte: endDate } },
                            { endDate: { gte: endDate } }
                        ]
                    },
                    {
                        AND: [
                            { startDate: { gte: startDate } },
                            { endDate: { lte: endDate } }
                        ]
                    }
                ]
            }
        });

        if (overlapping) {
            throw new BadRequestException('You already have a leave request during this period');
        }

        // Check for assigned shifts during leave period (for information only, not blocking)
        const conflictingShifts = await this.prisma.shift.findMany({
            where: {
                employeeId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                schedule: {
                    select: {
                        status: true,
                        weekStartDate: true
                    }
                }
            }
        });

        // Log conflict information but DO NOT BLOCK - let manager decide
        if (conflictingShifts.length > 0) {
            const conflictInfo = conflictingShifts.map(s => ({
                date: s.date,
                type: s.shiftType,
                scheduleStatus: s.schedule.status
            }));
            
        }

        // Check leave balance
        const leaveBalance = await this.getLeaveBalance(employeeId);
        const requestedDays = this.calculateDayCount(startDate, endDate);

        // Check if employee has enough leave days (all leave types count against balance)
        const availableLeave = leaveBalance.remainingLeave - leaveBalance.pendingLeave;
        if (requestedDays > availableLeave) {
            throw new BadRequestException(
                `Insufficient leave balance. ` +
                `You requested ${requestedDays} days but only have ${availableLeave} days available ` +
                `(Total: ${leaveBalance.totalAnnualLeave}, Used: ${leaveBalance.usedLeave}, ` +
                `Pending: ${leaveBalance.pendingLeave}).`
            );
        }

        // Create leave request
        const leaveRequest = await this.prisma.leaveRequest.create({
            data: {
                employeeId,
                leaveType: dto.leaveType,
                startDate,
                endDate,
                reason: dto.reason,
                status: 'PENDING'
            },
            include: {
                approvedBy: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                }
            }
        });

        return this.mapToResponse(leaveRequest);
    }

    /**
     * Lấy danh sách yêu cầu nghỉ phép của nhân viên
     */
    async getMyLeaveRequests(employeeId: string, dto: GetLeaveRequestsDto): Promise<LeaveRequestListDto> {
        const { status, startDate, endDate, page = 1, limit = 10 } = dto;
        const skip = (page - 1) * limit;

        const where: any = {
            employeeId
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
                    approvedBy: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: limit
            }),
            this.prisma.leaveRequest.count({ where })
        ]);

        return {
            data: leaveRequests.map(lr => this.mapToResponse(lr)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * Get leave request details
     */
    async getLeaveRequestById(employeeId: string, id: string): Promise<LeaveRequestResponseDto> {
        const leaveRequest = await this.prisma.leaveRequest.findFirst({
            where: {
                id,
                employeeId // Only get own leave requests
            },
            include: {
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
            throw new NotFoundException('Leave request not found');
        }

        return this.mapToResponse(leaveRequest);
    }

    /**
     * Update leave request (only when PENDING)
     */
    async updateLeaveRequest(
        employeeId: string,
        id: string,
        dto: UpdateLeaveRequestDto
    ): Promise<LeaveRequestResponseDto> {
        const leaveRequest = await this.prisma.leaveRequest.findFirst({
            where: {
                id,
                employeeId
            }
        });

        if (!leaveRequest) {
            throw new NotFoundException('Leave request not found');
        }

        if (leaveRequest.status !== 'PENDING') {
            throw new ForbiddenException('Can only edit pending leave requests');
        }

        // Validate dates if updated
        if (dto.startDate || dto.endDate) {
            const startDate = dto.startDate ? new Date(dto.startDate) : leaveRequest.startDate;
            const endDate = dto.endDate ? new Date(dto.endDate) : leaveRequest.endDate;

            if (endDate < startDate) {
                throw new BadRequestException('End date must be after start date');
            }
        }

        const updated = await this.prisma.leaveRequest.update({
            where: { id },
            data: {
                ...(dto.leaveType && { leaveType: dto.leaveType }),
                ...(dto.startDate && { startDate: new Date(dto.startDate) }),
                ...(dto.endDate && { endDate: new Date(dto.endDate) }),
                ...(dto.reason && { reason: dto.reason })
            },
            include: {
                approvedBy: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                }
            }
        });

        return this.mapToResponse(updated);
    }

    /**
     * Delete/Cancel leave request (only when PENDING)
     */
    async deleteLeaveRequest(employeeId: string, id: string): Promise<void> {
        const leaveRequest = await this.prisma.leaveRequest.findFirst({
            where: {
                id,
                employeeId
            }
        });

        if (!leaveRequest) {
            throw new NotFoundException('Leave request not found');
        }

        if (leaveRequest.status !== 'PENDING') {
            throw new ForbiddenException('Can only delete pending leave requests');
        }

        await this.prisma.leaveRequest.delete({
            where: { id }
        });
    }

    /**
     * Get leave balance for the year
     */
    async getLeaveBalance(employeeId: string): Promise<LeaveBalanceDto> {
        // Get employee info
        const employee = await this.prisma.user.findUnique({
            where: { id: employeeId }
        });

        if (!employee) {
            throw new NotFoundException('Employee not found');
        }

        // Calculate annual leave (Full-time: 12 days/year, Part-time: 8 days/year)
        const totalAnnualLeave = employee.employmentType === 'FULL_TIME' ? 12 : 8;

        // Đếm số ngày đã nghỉ trong năm nay (status = APPROVED)
        const currentYear = new Date().getFullYear();
        const yearStart = new Date(currentYear, 0, 1);
        const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

        const approvedLeaves = await this.prisma.leaveRequest.findMany({
            where: {
                employeeId,
                status: 'APPROVED',
                startDate: {
                    gte: yearStart,
                    lte: yearEnd
                }
            }
        });

        const usedLeave = approvedLeaves.reduce((sum, leave) => {
            return sum + this.calculateDayCount(leave.startDate, leave.endDate);
        }, 0);

        // Đếm số ngày đang chờ duyệt
        const pendingLeaves = await this.prisma.leaveRequest.findMany({
            where: {
                employeeId,
                status: 'PENDING',
                startDate: {
                    gte: yearStart,
                    lte: yearEnd
                }
            }
        });

        const pendingLeave = pendingLeaves.reduce((sum, leave) => {
            return sum + this.calculateDayCount(leave.startDate, leave.endDate);
        }, 0);

        return {
            totalAnnualLeave,
            usedLeave,
            remainingLeave: totalAnnualLeave - usedLeave,
            pendingLeave
        };
    }

    /**
     * Helper: Tính số ngày giữa 2 ngày (bao gồm cả 2 ngày)
     */
    private calculateDayCount(startDate: Date, endDate: Date): number {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1; // +1 để bao gồm cả ngày cuối
    }

    /**
     * Helper: Map entity to response DTO
     */
    private mapToResponse(leaveRequest: any): LeaveRequestResponseDto {
        return {
            id: leaveRequest.id,
            employeeId: leaveRequest.employeeId,
            leaveType: leaveRequest.leaveType,
            startDate: leaveRequest.startDate,
            endDate: leaveRequest.endDate,
            reason: leaveRequest.reason,
            status: leaveRequest.status,
            approvedById: leaveRequest.approvedById,
            approvedBy: leaveRequest.approvedBy,
            approvedAt: leaveRequest.approvedAt,
            rejectionReason: leaveRequest.rejectionReason,
            createdAt: leaveRequest.createdAt,
            updatedAt: leaveRequest.updatedAt,
            dayCount: this.calculateDayCount(leaveRequest.startDate, leaveRequest.endDate)
        };
    }
}
