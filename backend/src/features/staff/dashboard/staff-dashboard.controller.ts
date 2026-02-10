import { Controller, Get, UseGuards } from '@nestjs/common';
import { StaffDashboardService } from './staff-dashboard.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { RequireRoles } from '@common/auth-decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@Controller('staff/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRoles('STAFF')
export class StaffDashboardController {
  constructor(private readonly dashboardService: StaffDashboardService) {}

  @Get()
  async getDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getDashboardData(user.id);
  }
}
