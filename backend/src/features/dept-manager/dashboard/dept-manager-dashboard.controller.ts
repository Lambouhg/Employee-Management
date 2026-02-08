import { Controller, Get, Request } from '@nestjs/common';
import { DeptManagerDashboardService } from './dept-manager-dashboard.service';
import { Permissions } from '../../../common/auth-decorators/permissions.decorator';

@Controller('dept-manager/dashboard')
export class DeptManagerDashboardController {
    constructor(private readonly dashboardService: DeptManagerDashboardService) { }

    @Get('stats')
    @Permissions('manage_dept_employees')
    async getDashboardStats(@Request() req: any) {
        return this.dashboardService.getDashboardStats(req.user);
    }

    @Get('my-department')
    @Permissions('manage_dept_employees')
    async getMyDepartment(@Request() req: any) {
        return this.dashboardService.getMyDepartment(req.user);
    }

    @Get('complete')
    @Permissions('manage_dept_employees')
    async getCompleteDashboard(@Request() req: any) {
        return this.dashboardService.getCompleteDashboard(req.user);
    }
}
