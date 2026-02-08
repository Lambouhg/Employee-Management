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
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Tìm ca làm hôm nay
        const shift = await this.prisma.shift.findFirst({
            where: {
                employeeId,
                date: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            include: {
                attendance: true,
            },
        });

        if (!shift) {
            return {
                hasShift: false,
                canCheckIn: false,
                message: 'Bạn không có ca làm việc hôm nay',
            };
        }

        // Kiểm tra đã điểm danh chưa
        if (shift.attendance) {
            return {
                hasShift: true,
                shift: {
                    id: shift.id,
                    date: shift.date,
                    shiftType: shift.shiftType,
                    startTime: shift.startTime,
                    endTime: shift.endTime,
                    notes: shift.notes,
                },
                attendance: {
                    id: shift.attendance.id,
                    checkInTime: shift.attendance.checkInTime,
                    status: shift.attendance.status,
                    notes: shift.attendance.notes,
                    canCheckIn: false,
                    message: 'Bạn đã điểm danh cho ca làm này',
                },
                canCheckIn: false,
                message: 'Bạn đã điểm danh cho ca làm này',
            };
        }

        // Kiểm tra có trong khung giờ cho phép điểm danh không
        const now = new Date();
        const shiftStart = this.combineDateTime(shift.date, shift.startTime);
        const allowCheckInFrom = new Date(shiftStart.getTime() - 30 * 60 * 1000); // 30 phút trước
        const allowCheckInTo = new Date(shiftStart.getTime() + 60 * 60 * 1000); // 60 phút sau

        const canCheckIn = now >= allowCheckInFrom && now <= allowCheckInTo;
        let message = '';

        if (now < allowCheckInFrom) {
            const minutesUntil = Math.ceil((allowCheckInFrom.getTime() - now.getTime()) / (60 * 1000));
            message = `Chưa đến giờ điểm danh. Vui lòng quay lại sau ${minutesUntil} phút`;
        } else if (now > allowCheckInTo) {
            message = 'Đã quá thời gian cho phép điểm danh';
        } else {
            message = 'Bạn có thể điểm danh ngay bây giờ';
        }

        return {
            hasShift: true,
            shift: {
                id: shift.id,
                date: shift.date,
                shiftType: shift.shiftType,
                startTime: shift.startTime,
                endTime: shift.endTime,
                notes: shift.notes,
            },
            canCheckIn,
            message,
        };
    }

    /**
     * Điểm danh ca làm việc
     */
    async checkIn(employeeId: string, dto: CheckInDto): Promise<AttendanceResponseDto> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Tìm ca làm hôm nay
        const shift = await this.prisma.shift.findFirst({
            where: {
                employeeId,
                date: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            include: {
                attendance: true,
            },
        });

        if (!shift) {
            throw new NotFoundException('Không tìm thấy ca làm việc hôm nay');
        }

        // Kiểm tra đã điểm danh chưa
        if (shift.attendance) {
            throw new BadRequestException('Bạn đã điểm danh cho ca làm này rồi');
        }

        // Kiểm tra khung giờ cho phép
        const now = new Date();
        const shiftStart = this.combineDateTime(shift.date, shift.startTime);
        const shiftEnd = this.combineDateTime(shift.date, shift.endTime);
        
        const allowCheckInFrom = new Date(shiftStart.getTime() - 30 * 60 * 1000); // 30 phút trước
        const allowCheckInTo = new Date(shiftStart.getTime() + 60 * 60 * 1000); // 60 phút sau

        if (now < allowCheckInFrom) {
            throw new BadRequestException('Chưa đến giờ điểm danh. Vui lòng quay lại sau');
        }

        if (now > allowCheckInTo) {
            throw new BadRequestException('Đã quá thời gian cho phép điểm danh');
        }

        // Xác định trạng thái điểm danh
        const lateThreshold = new Date(shiftStart.getTime() + 15 * 60 * 1000); // 15 phút sau giờ bắt đầu
        const status: AttendanceStatus = now > lateThreshold ? 'LATE' : 'PRESENT';

        // Tạo bản ghi điểm danh
        const attendance = await this.prisma.attendance.create({
            data: {
                shiftId: shift.id,
                employeeId,
                checkInTime: now,
                status,
                notes: dto.notes,
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
