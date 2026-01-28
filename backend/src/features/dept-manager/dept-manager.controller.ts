import { Controller, Get, Request, UseGuards, Query, Patch, Param, Body } from '@nestjs/common';
import { DeptManagerService } from './dept-manager.service';
import { Permissions } from '../../common/auth-decorators/permissions.decorator';

@Controller('dept-manager')
export class DeptManagerController {
    constructor(private readonly deptManagerService: DeptManagerService) { }

    @Get('my-department')
    @Permissions('manage_dept_employees') // Permission for DEPT_MANAGER
    async getMyDepartment(@Request() req: any) {
        return this.deptManagerService.getMyDepartment(req.user);
    }

    @Get('dashboard')
    @Permissions('manage_dept_employees') // Permission for DEPT_MANAGER
    async getDashboard(@Request() req: any) {
        return this.deptManagerService.getDashboardStats(req.user);
    }

    @Get('employees')
    @Permissions('manage_dept_employees')
    async getEmployees(@Request() req: any, @Query() query: any) {
        return this.deptManagerService.getEmployees(req.user, query);
    }

    @Get('schedules')
    @Permissions('manage_dept_schedules')
    async getSchedules(@Request() req: any, @Query() query: any) {
        return this.deptManagerService.getSchedules(req.user, query);
    }

    @Patch('schedules/:id/status')
    @Permissions('approve_schedule')
    async reviewSchedule(
        @Request() req: any,
        @Param('id') id: string,
        @Body() body: { status: 'APPROVED' | 'REJECTED' }
    ) {
        return this.deptManagerService.reviewSchedule(req.user, id, body.status);
    }
}
