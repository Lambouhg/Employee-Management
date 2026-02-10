import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { StaffAttendanceService } from './staff-attendance.service';
import { CheckInDto, TodayAttendanceDto, AttendanceResponseDto, GetAttendanceHistoryDto, AttendanceHistoryResponseDto } from './dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { RequireRoles } from '@common/auth-decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@Controller('staff/attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRoles('STAFF')
export class StaffAttendanceController {
    constructor(private readonly attendanceService: StaffAttendanceService) { }

    /**
     * GET /staff/attendance/today
     * Lấy thông tin ca làm và trạng thái điểm danh hôm nay
     */
    @Get('today')
    async getTodayAttendance(@CurrentUser() user: any): Promise<TodayAttendanceDto> {
        return this.attendanceService.getTodayAttendance(user.id);
    }

    /**
     * POST /staff/attendance/check-in
     * Điểm danh ca làm việc
     */
    @Post('check-in')
    async checkIn(
        @CurrentUser() user: any,
        @Body() dto: CheckInDto,
    ): Promise<AttendanceResponseDto> {
        return this.attendanceService.checkIn(user.id, dto);
    }

    /**
     * GET /staff/attendance/history
     * Lấy lịch sử điểm danh
     */
    @Get('history')
    async getHistory(
        @CurrentUser() user: any,
        @Query() dto: GetAttendanceHistoryDto,
    ): Promise<AttendanceHistoryResponseDto> {
        return this.attendanceService.getHistory(user.id, dto);
    }
}
