import { Controller, Get, Post, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { DeptManagerShiftsService } from './dept-manager-shifts.service';
import { AssignShiftDto, BulkAssignShiftDto } from './dto';
import { Permissions } from '../../../common/auth-decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('dept-manager/plans/:planId/shifts')
@UseGuards(JwtAuthGuard)
export class DeptManagerShiftsController {
    constructor(private readonly shiftsService: DeptManagerShiftsService) { }

    /**
     * Gán ca cho nhân viên
     * POST /dept-manager/plans/:planId/shifts
     */
    @Post()
    @Permissions('manage_dept_plans')
    async assignShift(
        @Request() req: any,
        @Param('planId') planId: string,
        @Body() dto: AssignShiftDto
    ) {
        return this.shiftsService.assignShift(req.user, planId, dto);
    }

    /**
     * Gán nhiều ca cùng lúc
     * POST /dept-manager/plans/:planId/shifts/bulk
     */
    @Post('bulk')
    @Permissions('manage_dept_plans')
    async bulkAssignShifts(
        @Request() req: any,
        @Param('planId') planId: string,
        @Body() dto: BulkAssignShiftDto
    ) {
        return this.shiftsService.bulkAssignShifts(req.user, planId, dto.shifts);
    }

    /**
     * Lấy danh sách ca đã gán
     * GET /dept-manager/plans/:planId/shifts
     */
    @Get()
    @Permissions('view_dept_plans')
    async getAssignedShifts(
        @Request() req: any,
        @Param('planId') planId: string
    ) {
        return this.shiftsService.getAssignedShifts(req.user, planId);
    }

    /**
     * Xóa ca đã gán
     * DELETE /dept-manager/plans/:planId/shifts/:shiftId
     */
    @Delete(':shiftId')
    @Permissions('manage_dept_plans')
    async unassignShift(
        @Request() req: any,
        @Param('planId') planId: string,
        @Param('shiftId') shiftId: string
    ) {
        return this.shiftsService.unassignShift(req.user, planId, shiftId);
    }
}
