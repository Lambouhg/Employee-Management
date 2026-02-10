import { Controller, Get, Post, Request, Query, Patch, Param, Body } from '@nestjs/common';
import { DeptManagerPlansService } from './dept-manager-plans.service';
import { CreateWeeklyPlanDto } from '../dto/create-plan.dto';
import { Permissions } from '../../../common/auth-decorators/permissions.decorator';

@Controller('dept-manager/weekly-plans')
export class DeptManagerPlansController {
    constructor(private readonly plansService: DeptManagerPlansService) { }

    @Post()
    @Permissions('manage_dept_plans')
    async createWeeklyPlan(@Request() req: any, @Body() dto: CreateWeeklyPlanDto) {
        return this.plansService.createWeeklyPlan(req.user, dto);
    }

    @Get()
    @Permissions('view_dept_plans')
    async getWeeklyPlans(@Request() req: any) {
        return this.plansService.getWeeklyPlans(req.user);
    }

    @Patch(':id/publish')
    @Permissions('manage_dept_plans')
    async publishPlan(@Request() req: any, @Param('id') id: string) {
        return this.plansService.publishPlan(req.user, id);
    }

    @Patch(':id/openings')
    @Permissions('manage_dept_plans')
    async updateOpenings(@Request() req: any, @Param('id') id: string, @Body() body: { shiftOpenings: any[] }) {
        return this.plansService.updateOpenings(req.user, id, body.shiftOpenings);
    }

    @Patch(':id/lock')
    @Permissions('manage_dept_plans')
    async lockPlan(@Request() req: any, @Param('id') id: string) {
        return this.plansService.lockPlan(req.user, id);
    }
}
