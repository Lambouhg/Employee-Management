import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { ShiftType } from '@prisma/client';
import { 
    CreateScheduleDto, 
    UpdateScheduleStatusDto, 
    CreateShiftDto, 
    UpdateShiftDto,
    ScheduleStatusTransition 
} from './dto';

@Injectable()
export class DeptManagerSchedulesService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Lấy danh sách schedules của phòng ban
     */
    async getSchedules(currentUser: any, query: any) {
        const department = await this.getManagedDepartment(currentUser.id);
        
        const { weekStartDate, status } = query;
        const where: any = { departmentId: department.id };
        
        if (weekStartDate) {
            where.weekStartDate = new Date(weekStartDate);
        }
        if (status) {
            where.status = status;
        }

        return this.prisma.deptWeeklyPlan.findMany({
            where,
            include: {
                department: {
                    select: { id: true, name: true, code: true }
                },
                shiftOpenings: {
                    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
                    include: {
                        template: {
                            select: { name: true, code: true }
                        },
                        shifts: {
                            include: {
                                employee: {
                                    select: { id: true, fullName: true, email: true }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { weekStartDate: 'desc' }
        });
    }

    /**
     * Lấy chi tiết một schedule
     */
    async getScheduleById(currentUser: any, scheduleId: string) {
        const department = await this.getManagedDepartment(currentUser.id);
        
        const schedule = await this.prisma.deptWeeklyPlan.findFirst({
            where: { 
                id: scheduleId,
                departmentId: department.id 
            },
            include: {
                department: {
                    select: { id: true, name: true, code: true }
                },
                shiftOpenings: {
                    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
                    include: {
                        template: true,
                        shifts: {
                            include: {
                                employee: {
                                    select: { id: true, fullName: true, email: true, employmentType: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!schedule) {
            throw new NotFoundException('Schedule không tồn tại hoặc không thuộc phòng ban của bạn');
        }

        return schedule;
    }

    /**
     * Tạo schedule mới
     * Business Rules:
     * - SCH-01: Mỗi phòng ban chỉ có 1 schedule / tuần
     * - SCH-02: Không tạo schedule cho tuần đã qua
     */
    async createSchedule(currentUser: any, dto: CreateScheduleDto) {
        const department = await this.getManagedDepartment(currentUser.id);
        
        // B1: Tính weekStartDate (Monday) từ ngày bất kỳ
        const inputDate = new Date(dto.weekStartDate);
        const weekStartDate = this.getMonday(inputDate);
        const weekEndDate = this.getSunday(weekStartDate);
        
        // B2: Kiểm tra hợp lệ
        
        // SCH-02: Không được tạo schedule cho tuần đã qua
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (weekStartDate < now) {
            throw new BadRequestException('Không được tạo schedule cho tuần đã qua');
        }
        
        // SCH-01: Kiểm tra phòng ban chưa có schedule cho tuần này
        const existingSchedule = await this.prisma.deptWeeklyPlan.findUnique({
            where: {
                departmentId_weekStartDate: {
                    departmentId: department.id,
                    weekStartDate
                }
            }
        });
        
        if (existingSchedule) {
            throw new BadRequestException(
                `Phòng ban đã có schedule cho tuần ${weekStartDate.toISOString().split('T')[0]} - ${weekEndDate.toISOString().split('T')[0]}`
            );
        }
        
        // B3: Tạo Schedule với status = DRAFT
        return this.prisma.deptWeeklyPlan.create({
            data: {
                departmentId: department.id,
                weekStartDate,
                status: 'DRAFT',
                createdByUserId: currentUser.id
            },
            include: {
                department: {
                    select: { id: true, name: true, code: true }
                }
            }
        });
    }

    /**
     * Chuyển trạng thái schedule
     * - DRAFT -> PUBLISHED: Công bố lịch để nhân viên đăng ký
     * - PUBLISHED -> LOCKED: Chốt lịch làm việc
     */
    async updateScheduleStatus(currentUser: any, scheduleId: string, dto: UpdateScheduleStatusDto) {
        const department = await this.getManagedDepartment(currentUser.id);
        
        const schedule = await this.prisma.deptWeeklyPlan.findFirst({
            where: { 
                id: scheduleId,
                departmentId: department.id 
            },
            include: {
                shiftOpenings: {
                    include: {
                        shifts: true
                    }
                }
            }
        });

        if (!schedule) {
            throw new NotFoundException('Schedule không tồn tại hoặc không thuộc phòng ban của bạn');
        }

        // Validate transition
        if (dto.status === ScheduleStatusTransition.PUBLISH) {
            return this.publishSchedule(schedule);
        } else if (dto.status === ScheduleStatusTransition.LOCK) {
            return this.lockSchedule(schedule);
        }
    }

    /**
     * Publish schedule (DRAFT -> PUBLISHED)
     * Điều kiện:
     * - Có ít nhất 1 ca làm
     * - Không có ca nằm ngoài tuần
     */
    private async publishSchedule(schedule: any) {
        if (schedule.status !== 'DRAFT') {
            throw new BadRequestException('Chỉ có thể publish schedule đang ở trạng thái DRAFT');
        }

        // Kiểm tra có ít nhất 1 ca
        if (schedule.shiftOpenings.length === 0) {
            throw new BadRequestException('Schedule phải có ít nhất 1 ca làm việc trước khi publish');
        }

        // Kiểm tra tất cả ca phải nằm trong tuần
        const weekStartDate = new Date(schedule.weekStartDate);
        const weekEndDate = this.getSunday(weekStartDate);
        
        for (const opening of schedule.shiftOpenings) {
            const shiftDate = new Date(opening.date);
            if (shiftDate < weekStartDate || shiftDate > weekEndDate) {
                throw new BadRequestException(
                    `Ca làm ngày ${opening.date.toISOString().split('T')[0]} nằm ngoài tuần ${weekStartDate.toISOString().split('T')[0]} - ${weekEndDate.toISOString().split('T')[0]}`
                );
            }
        }

        return this.prisma.deptWeeklyPlan.update({
            where: { id: schedule.id },
            data: { status: 'PUBLISHED' },
            include: {
                department: true,
                shiftOpenings: true
            }
        });
        
        // TODO: Gửi thông báo cho nhân viên phòng ban
    }

    /**
     * Lock schedule (PUBLISHED -> LOCKED)
     * Điều kiện:
     * - Tất cả đăng ký đã được duyệt (không còn PENDING)
     */
    private async lockSchedule(schedule: any) {
        if (schedule.status !== 'PUBLISHED') {
            throw new BadRequestException('Chỉ có thể lock schedule đang ở trạng thái PUBLISHED');
        }

        // Kiểm tra tất cả shift assignments đã được duyệt
        // TODO: Check pending registrations when employee registration is implemented
        
        return this.prisma.deptWeeklyPlan.update({
            where: { id: schedule.id },
            data: { status: 'LOCKED' },
            include: {
                department: true,
                shiftOpenings: {
                    include: {
                        shifts: {
                            include: {
                                employee: true
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Xóa schedule (chỉ khi DRAFT và chưa có shift)
     */
    async deleteSchedule(currentUser: any, scheduleId: string) {
        const department = await this.getManagedDepartment(currentUser.id);
        
        const schedule = await this.prisma.deptWeeklyPlan.findFirst({
            where: { 
                id: scheduleId,
                departmentId: department.id 
            },
            include: {
                shiftOpenings: true
            }
        });

        if (!schedule) {
            throw new NotFoundException('Schedule không tồn tại');
        }

        if (schedule.status !== 'DRAFT') {
            throw new BadRequestException('Chỉ có thể xóa schedule ở trạng thái DRAFT');
        }

        if (schedule.shiftOpenings.length > 0) {
            throw new BadRequestException('Không thể xóa schedule đã có ca làm việc. Vui lòng xóa tất cả ca trước.');
        }

        await this.prisma.deptWeeklyPlan.delete({
            where: { id: scheduleId }
        });
    }

    // ============================================
    // SHIFT MANAGEMENT
    // ============================================

    // ============================================
    // SHIFT MANAGEMENT
    // ============================================

    /**
     * Tạo shift trong schedule
     * Business Rules:
     * - SH-01: Shift phải thuộc schedule hợp lệ
     * - SH-02: Không trùng giờ cùng ngày
     * - SH-03: Schedule Locked → không tạo shift
     * - SH-05: Shift ngoài tuần → reject
     */
    async createShift(currentUser: any, scheduleId: string, dto: CreateShiftDto) {
        const department = await this.getManagedDepartment(currentUser.id);
        
        // Lấy schedule và validate
        const schedule = await this.prisma.deptWeeklyPlan.findFirst({
            where: { 
                id: scheduleId,
                departmentId: department.id 
            },
            include: {
                shiftOpenings: {
                    where: {
                        date: new Date(dto.date)
                    }
                }
            }
        });

        if (!schedule) {
            throw new NotFoundException('Schedule không tồn tại');
        }

        // SH-03: Schedule Locked → không tạo shift
        if (schedule.status === 'LOCKED') {
            throw new BadRequestException('Không thể tạo shift cho schedule đã bị khóa');
        }

        // SH-05: Shift ngoài tuần → reject
        const shiftDate = new Date(dto.date);
        const weekStartDate = new Date(schedule.weekStartDate);
        const weekEndDate = this.getSunday(weekStartDate);
        
        if (shiftDate < weekStartDate || shiftDate > weekEndDate) {
            throw new BadRequestException(
                `Ngày ${dto.date} nằm ngoài tuần của schedule (${weekStartDate.toISOString().split('T')[0]} - ${weekEndDate.toISOString().split('T')[0]})`
            );
        }

        // Validate startTime < endTime
        const startTime = this.parseTime(dto.startTime);
        const endTime = this.parseTime(dto.endTime);
        
        if (startTime >= endTime) {
            throw new BadRequestException('Giờ bắt đầu phải nhỏ hơn giờ kết thúc');
        }

        // SH-02: Kiểm tra trùng loại ca cùng ngày (mỗi ngày chỉ có 1 ca mỗi loại)
        const duplicateShift = schedule.shiftOpenings.find(opening => 
            opening.shiftType === dto.shiftType
        );

        if (duplicateShift) {
            throw new BadRequestException(
                `Ca ${dto.shiftType} đã tồn tại trong ngày này. Mỗi ngày chỉ có thể có 1 ca mỗi loại.`
            );
        }

        // Tạo shift
        return this.prisma.shiftOpening.create({
            data: {
                planId: scheduleId,
                date: shiftDate,
                shiftType: dto.shiftType,
                startTime: startTime,
                endTime: endTime,
                // Part-time settings
                isPTEnabled: dto.isPTEnabled ?? true,
                ptCapacity: dto.ptCapacity ?? 5,
                ptRegistered: 0,
                // Full-time settings
                isFTEnabled: dto.isFTEnabled ?? false,
                ftAutoAssigned: false, // Deprecated: Không còn dùng auto-assign
                notes: dto.notes
            },
            include: {
                template: true
            }
        });
    }

    /**
     * Cập nhật shift
     * Business Rules:
     * - SH-03: Schedule Locked → không sửa shift
     * - SH-04: maxEmployee không nhỏ hơn số đã đăng ký
     */
    async updateShift(currentUser: any, scheduleId: string, shiftId: string, dto: UpdateShiftDto) {
        const department = await this.getManagedDepartment(currentUser.id);
        
        // Validate schedule và shift
        const schedule = await this.prisma.deptWeeklyPlan.findFirst({
            where: { 
                id: scheduleId,
                departmentId: department.id 
            }
        });

        if (!schedule) {
            throw new NotFoundException('Schedule không tồn tại');
        }

        // SH-03: Schedule Locked → không sửa
        if (schedule.status === 'LOCKED') {
            throw new BadRequestException('Không thể sửa shift của schedule đã bị khóa');
        }

        const shift = await this.prisma.shiftOpening.findFirst({
            where: {
                id: shiftId,
                planId: scheduleId
            },
            include: {
                shifts: true
            }
        });

        if (!shift) {
            throw new NotFoundException('Shift không tồn tại trong schedule này');
        }

        // SH-04: ptCapacity không nhỏ hơn số đã đăng ký
        if (dto.ptCapacity !== undefined && dto.ptCapacity < shift.ptRegistered) {
            throw new BadRequestException(
                `Số lượng PT tối đa (${dto.ptCapacity}) không được nhỏ hơn số PT đã đăng ký (${shift.ptRegistered})`
            );
        }

        // Nếu thay đổi ngày, validate ngày mới trong tuần
        if (dto.date) {
            const newDate = new Date(dto.date);
            const weekStartDate = new Date(schedule.weekStartDate);
            const weekEndDate = this.getSunday(weekStartDate);
            
            if (newDate < weekStartDate || newDate > weekEndDate) {
                throw new BadRequestException('Ngày mới nằm ngoài tuần của schedule');
            }
        }

        // Validate time nếu có thay đổi
        let startTime = shift.startTime;
        let endTime = shift.endTime;
        
        if (dto.startTime) {
            startTime = this.parseTime(dto.startTime);
        }
        if (dto.endTime) {
            endTime = this.parseTime(dto.endTime);
        }
        
        if (startTime >= endTime) {
            throw new BadRequestException('Giờ bắt đầu phải nhỏ hơn giờ kết thúc');
        }

        // Check duplicate shiftType nếu thay đổi shiftType hoặc date
        if (dto.shiftType || dto.date) {
            const checkDate = dto.date ? new Date(dto.date) : shift.date;
            const checkShiftType = dto.shiftType || shift.shiftType;
            
            const duplicate = await this.prisma.shiftOpening.findFirst({
                where: {
                    planId: scheduleId,
                    date: checkDate,
                    shiftType: checkShiftType,
                    id: { not: shiftId }
                }
            });

            if (duplicate) {
                throw new BadRequestException(
                    `Ca ${checkShiftType} đã tồn tại trong ngày này. Mỗi ngày chỉ có thể có 1 ca mỗi loại.`
                );
            }
        }

        // Update shift
        return this.prisma.shiftOpening.update({
            where: { id: shiftId },
            data: {
                date: dto.date ? new Date(dto.date) : undefined,
                shiftType: dto.shiftType,
                startTime: dto.startTime ? startTime : undefined,
                endTime: dto.endTime ? endTime : undefined,
                // Part-time settings
                ptCapacity: dto.ptCapacity,
                isPTEnabled: dto.isPTEnabled,
                // Full-time settings
                isFTEnabled: dto.isFTEnabled,
                // ftAutoAssigned removed - no longer used
                notes: dto.notes
            },
            include: {
                template: true,
                shifts: {
                    include: {
                        employee: true
                    }
                }
            }
        });
    }

    /**
     * Xóa shift
     * Chỉ cho phép khi chưa có nhân viên đăng ký
     */
    async deleteShift(currentUser: any, scheduleId: string, shiftId: string) {
        const department = await this.getManagedDepartment(currentUser.id);
        
        const schedule = await this.prisma.deptWeeklyPlan.findFirst({
            where: { 
                id: scheduleId,
                departmentId: department.id 
            }
        });

        if (!schedule) {
            throw new NotFoundException('Schedule không tồn tại');
        }

        if (schedule.status === 'LOCKED') {
            throw new BadRequestException('Không thể xóa shift của schedule đã bị khóa');
        }

        const shift = await this.prisma.shiftOpening.findFirst({
            where: {
                id: shiftId,
                planId: scheduleId
            },
            include: {
                shifts: true
            }
        });

        if (!shift) {
            throw new NotFoundException('Shift không tồn tại');
        }

        // Không cho phép xóa nếu có nhân viên đã đăng ký
        if (shift.shifts.length > 0 || shift.ptRegistered > 0) {
            throw new BadRequestException(
                'Không thể xóa shift đã có nhân viên đăng ký hoặc được gán'
            );
        }

        await this.prisma.shiftOpening.delete({
            where: { id: shiftId }
        });
    }

    // ============================================
    // HELPER METHODS
    // ============================================

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

    /**
     * Lấy thứ 2 (Monday) của tuần chứa ngày cho trước
     */
    private getMonday(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    }

    /**
     * Lấy chủ nhật (Sunday) của tuần chứa ngày cho trước
     */
    private getSunday(monday: Date): Date {
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        return sunday;
    }

    /**
     * Parse time string to Date object
     * Supports: "HH:mm", "HH:mm:ss", ISO time
     */
    private parseTime(timeStr: string): Date {
        // If already ISO format, parse directly
        if (timeStr.includes('T') || timeStr.includes('Z')) {
            return new Date(timeStr);
        }
        
        // Parse "HH:mm" or "HH:mm:ss" format
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    }

    /**
     * Convert Date time to minutes since midnight
     */
    private timeToMinutes(date: Date): number {
        return date.getHours() * 60 + date.getMinutes();
    }

    /**
     * Format time to "HH:mm"
     */
    private formatTime(date: Date): string {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    /**
     * Determine shift type based on start time
     */
    private determineShiftType(startTime: Date): ShiftType {
        const hour = startTime.getHours();
        
        if (hour >= 6 && hour < 12) return ShiftType.MORNING;
        if (hour >= 12 && hour < 18) return ShiftType.AFTERNOON;
        if (hour >= 18 && hour < 22) return ShiftType.EVENING;
        return ShiftType.NIGHT;
    }
}
