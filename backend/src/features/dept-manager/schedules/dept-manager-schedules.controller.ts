import { Controller, Get, Request, Query, Patch, Param, Body, Post, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { DeptManagerSchedulesService } from './dept-manager-schedules.service';
import { Permissions } from '../../../common/auth-decorators/permissions.decorator';
import { 
    CreateScheduleDto, 
    UpdateScheduleStatusDto, 
    CreateShiftDto, 
    UpdateShiftDto 
} from './dto';

@Controller('dept-manager/schedules')
export class DeptManagerSchedulesController {
    constructor(private readonly schedulesService: DeptManagerSchedulesService) { }

    /**
     * Lấy danh sách schedules của phòng ban
     * Query params: weekStartDate, status
     */
    @Get()
    @Permissions('manage_dept_schedules')
    async getSchedules(@Request() req: any, @Query() query: any) {
        return this.schedulesService.getSchedules(req.user, query);
    }

    /**
     * Lấy chi tiết một schedule
     */
    @Get(':id')
    @Permissions('manage_dept_schedules')
    async getScheduleById(@Request() req: any, @Param('id') id: string) {
        return this.schedulesService.getScheduleById(req.user, id);
    }

    /**
     * Tạo schedule mới (status = DRAFT)
     * B1-B3: Chọn tuần, kiểm tra hợp lệ, tạo schedule
     */
    @Post()
    @Permissions('manage_dept_schedules')
    async createSchedule(@Request() req: any, @Body() dto: CreateScheduleDto) {
        return this.schedulesService.createSchedule(req.user, dto);
    }

    /**
     * Chuyển trạng thái schedule
     * - DRAFT -> PUBLISHED (công bố lịch)
     * - PUBLISHED -> LOCKED (chốt lịch)
     */
    @Patch(':id/status')
    @Permissions('manage_dept_schedules')
    async updateScheduleStatus(
        @Request() req: any,
        @Param('id') id: string,
        @Body() dto: UpdateScheduleStatusDto
    ) {
        return this.schedulesService.updateScheduleStatus(req.user, id, dto);
    }

    /**
     * Tạo shift trong schedule
     * Chỉ cho phép khi schedule = DRAFT
     */
    @Post(':scheduleId/shifts')
    @Permissions('manage_dept_schedules')
    async createShift(
        @Request() req: any,
        @Param('scheduleId') scheduleId: string,
        @Body() dto: CreateShiftDto
    ) {
        return this.schedulesService.createShift(req.user, scheduleId, dto);
    }

    /**
     * Cập nhật shift
     * Chỉ cho phép khi schedule = DRAFT và chưa có nhân viên đăng ký
     */
    @Patch(':scheduleId/shifts/:shiftId')
    @Permissions('manage_dept_schedules')
    async updateShift(
        @Request() req: any,
        @Param('scheduleId') scheduleId: string,
        @Param('shiftId') shiftId: string,
        @Body() dto: UpdateShiftDto
    ) {
        return this.schedulesService.updateShift(req.user, scheduleId, shiftId, dto);
    }

    /**
     * Xóa shift
     * Chỉ cho phép khi chưa có nhân viên đăng ký
     */
    @Delete(':scheduleId/shifts/:shiftId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Permissions('manage_dept_schedules')
    async deleteShift(
        @Request() req: any,
        @Param('scheduleId') scheduleId: string,
        @Param('shiftId') shiftId: string
    ) {
        return this.schedulesService.deleteShift(req.user, scheduleId, shiftId);
    }

    /**
     * Xóa schedule (chỉ khi DRAFT và chưa có shift)
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Permissions('manage_dept_schedules')
    async deleteSchedule(@Request() req: any, @Param('id') id: string) {
        return this.schedulesService.deleteSchedule(req.user, id);
    }
}
