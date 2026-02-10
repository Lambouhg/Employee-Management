import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { CheckInDto, TodayAttendanceDto, AttendanceResponseDto, GetAttendanceHistoryDto, AttendanceHistoryResponseDto } from './dto';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class StaffAttendanceService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Lấy thông tin ca làm và trạng thái điểm danh hôm nay
     */
    async getTodayAttendance(employeeId: string): Promise<TodayAttendanceDto> {
        // Lấy ngày hôm nay theo UTC
        const now = new Date();
        const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const tomorrowUTC = new Date(todayUTC);
        tomorrowUTC.setUTCDate(todayUTC.getUTCDate() + 1);

        // Tìm TẤT CẢ ca làm hôm nay
        const shifts = await this.prisma.shift.findMany({
            where: {
                employeeId,
                date: {
                    gte: todayUTC,
                    lt: tomorrowUTC,
                },
            },
            include: {
                attendance: true,
            },
            orderBy: {
                startTime: 'asc', // Sắp xếp theo thời gian bắt đầu
            },
        });

        if (!shifts || shifts.length === 0) {
            return {
                hasShift: false,
                shifts: [],
                message: 'You have no shift scheduled for today',
            };
        }

        // Process từng shift
        const processedShifts = shifts.map(shift => {
            // Kiểm tra đã điểm danh chưa
            if (shift.attendance) {
                return {
                    id: shift.id,
                    date: shift.date,
                    shiftType: shift.shiftType,
                    startTime: shift.startTime,
                    endTime: shift.endTime,
                    notes: shift.notes,
                    attendance: {
                        id: shift.attendance.id,
                        checkInTime: shift.attendance.checkInTime,
                        status: shift.attendance.status,
                        notes: shift.attendance.notes,
                    },
                    canCheckIn: false,
                    message: 'You have already checked in for this shift',
                };
            }

            // Kiểm tra có trong khung giờ cho phép điểm danh không
            const shiftStart = this.combineDateTime(shift.date, shift.startTime);
            const allowCheckInFrom = new Date(shiftStart.getTime() - 30 * 60 * 1000); // 30 phút trước
            const allowCheckInTo = new Date(shiftStart.getTime() + 60 * 60 * 1000); // 60 phút sau

            const canCheckIn = now >= allowCheckInFrom && now <= allowCheckInTo;
            let message = '';

            if (now < allowCheckInFrom) {
                const minutesUntil = Math.ceil((allowCheckInFrom.getTime() - now.getTime()) / (60 * 1000));
                message = `Check-in available in ${minutesUntil} minutes`;
            } else if (now > allowCheckInTo) {
                message = 'Check-in time has expired';
            } else {
                message = 'You can check in now';
            }

            return {
                id: shift.id,
                date: shift.date,
                shiftType: shift.shiftType,
                startTime: shift.startTime,
                endTime: shift.endTime,
                notes: shift.notes,
                canCheckIn,
                message,
            };
        });

        return {
            hasShift: true,
            shifts: processedShifts,
            message: `You have ${shifts.length} shift${shifts.length > 1 ? 's' : ''} today`,
        };
    }

    /**
     * Điểm danh ca làm việc
     */
    async checkIn(employeeId: string, dto: CheckInDto): Promise<AttendanceResponseDto> {
        const now = new Date();

        // Tìm shift cụ thể cần check-in
        const shift = await this.prisma.shift.findUnique({
            where: { id: dto.shiftId },
            include: { attendance: true },
        });

        if (!shift) {
            throw new NotFoundException('Shift not found');
        }

        // Verify shift belongs to this employee
        if (shift.employeeId !== employeeId) {
            throw new BadRequestException('This shift does not belong to you');
        }

        // Kiểm tra đã điểm danh chưa
        if (shift.attendance) {
            throw new BadRequestException('You have already checked in for this shift');
        }

        // Kiểm tra khung giờ cho phép
        const shiftStart = this.combineDateTime(shift.date, shift.startTime);
        const shiftEnd = this.combineDateTime(shift.date, shift.endTime);
        
        const allowCheckInFrom = new Date(shiftStart.getTime() - 30 * 60 * 1000); // 30 phút trước
        const allowCheckInTo = new Date(shiftStart.getTime() + 60 * 60 * 1000); // 60 phút sau

        if (now < allowCheckInFrom) {
            throw new BadRequestException('Check-in not available yet. Please try again later');
        }

        if (now > allowCheckInTo) {
            throw new BadRequestException('Check-in time has expired');
        }

        // Xác định trạng thái điểm danh
        const lateThreshold = new Date(shiftStart.getTime() + 15 * 60 * 1000); // 15 phút sau giờ bắt đầu
        const status: AttendanceStatus = now > lateThreshold ? 'LATE' : 'PRESENT';

        // Tính số phút muộn và tạo notes tự động
        let finalNotes = dto.notes || null;
        if (status === 'LATE') {
            const minutesLate = Math.floor((now.getTime() - lateThreshold.getTime()) / (60 * 1000));
            const lateNote = `Late arrival (${minutesLate} minutes)`;
            
            // Combine với notes của user nếu có
            if (dto.notes) {
                finalNotes = `${lateNote}. ${dto.notes}`;
            } else {
                finalNotes = lateNote;
            }
        }

        // Tạo bản ghi điểm danh
        const attendance = await this.prisma.attendance.create({
            data: {
                shiftId: shift.id,
                employeeId,
                checkInTime: now,
                status,
                notes: finalNotes,
            },
            include: {
                shift: true,
            },
        });

        return this.mapToAttendanceResponse(attendance);
    }

    /**
     * Lấy lịch sử điểm danh
     */
    async getHistory(
        employeeId: string,
        dto: GetAttendanceHistoryDto,
    ): Promise<AttendanceHistoryResponseDto> {
        const { startDate, endDate, page = 1, limit = 10 } = dto;
        const skip = (page - 1) * limit;

        // Tự động đánh ABSENT cho các ca đã qua mà chưa điểm danh
        await this.markAbsentForMissedShifts(employeeId);

        const where: any = {
            employeeId,
        };

        if (startDate || endDate) {
            where.shift = {
                date: {},
            };
            if (startDate) {
                where.shift.date.gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.shift.date.lte = end;
            }
        }

        const [attendances, total] = await Promise.all([
            this.prisma.attendance.findMany({
                where,
                include: {
                    shift: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.attendance.count({ where }),
        ]);

        return {
            data: attendances.map(a => this.mapToAttendanceResponse(a)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Helper: Kết hợp Date và Time
     */
    private combineDateTime(date: Date, time: Date): Date {
        const result = new Date(date);
        result.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), 0);
        return result;
    }

    /**
     * Tự động đánh ABSENT cho các ca đã qua mà chưa điểm danh
     * Gọi hàm này trước khi lấy history để cập nhật trạng thái
     */
    async markAbsentForMissedShifts(employeeId: string): Promise<void> {
        const now = new Date();

        // Tìm các ca đã qua mà chưa có attendance
        const missedShifts = await this.prisma.shift.findMany({
            where: {
                employeeId,
                attendance: null, // Chưa có attendance
                date: {
                    lt: now, // Ca đã qua
                },
            },
        });

        // Đánh ABSENT cho từng ca
        for (const shift of missedShifts) {
            const shiftEnd = this.combineDateTime(shift.date, shift.endTime);
            
            // Chỉ đánh ABSENT nếu ca đã kết thúc
            if (now > shiftEnd) {
                await this.prisma.attendance.create({
                    data: {
                        shiftId: shift.id,
                        employeeId,
                        checkInTime: null,
                        checkOutTime: null,
                        status: 'ABSENT',
                        notes: 'Automatically marked absent due to no check-in',
                    },
                });
            }
        }
    }

    /**
     * Helper: Map entity sang DTO
     */
    private mapToAttendanceResponse(attendance: any): AttendanceResponseDto {
        return {
            id: attendance.id,
            shiftId: attendance.shiftId,
            employeeId: attendance.employeeId,
            checkInTime: attendance.checkInTime,
            checkOutTime: attendance.checkOutTime,
            totalMinutes: attendance.totalMinutes,
            status: attendance.status,
            notes: attendance.notes,
            createdAt: attendance.createdAt,
            updatedAt: attendance.updatedAt,
            shift: {
                date: attendance.shift.date,
                shiftType: attendance.shift.shiftType,
                startTime: attendance.shift.startTime,
                endTime: attendance.shift.endTime,
            },
        };
    }
}
