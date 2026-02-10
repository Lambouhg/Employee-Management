import { Controller, Get, Post, Request, Query, Param, Body } from '@nestjs/common';
import { StaffSchedulesService } from './staff-schedules.service';
import { Permissions } from '../../../common/auth-decorators/permissions.decorator';

@Controller('staff/schedules')
export class StaffSchedulesController {
    constructor(private readonly staffSchedulesService: StaffSchedulesService) { }

    @Get('available-openings')
    @Permissions('create_schedule')
    async getAvailableOpenings(@Request() req: any, @Query('weekStartDate') weekStartDate: string) {
        return this.staffSchedulesService.getAvailableOpenings(req.user, weekStartDate);
    }

    @Post('register')
    @Permissions('create_schedule')
    async registerShift(@Request() req: any, @Body('openingId') openingId: string) {
        return this.staffSchedulesService.registerShift(req.user, openingId);
    }

    @Get('my-schedules')
    @Permissions('view_own_schedule')
    async getMySchedules(@Request() req: any) {
        return this.staffSchedulesService.getMySchedules(req.user);
    }
}
