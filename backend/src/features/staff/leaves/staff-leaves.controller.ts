import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { StaffLeavesService } from './staff-leaves.service';
import {
    CreateLeaveRequestDto,
    UpdateLeaveRequestDto,
    GetLeaveRequestsDto,
    LeaveRequestResponseDto,
    LeaveRequestListDto,
    LeaveBalanceDto
} from './dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { RequireRoles } from '@common/auth-decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@Controller('staff/leaves')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRoles('STAFF')
export class StaffLeavesController {
    constructor(private readonly leavesService: StaffLeavesService) { }

    /**
     * POST /staff/leaves
     * Tạo yêu cầu nghỉ phép mới
     */
    @Post()
    async createLeaveRequest(
        @CurrentUser() user: any,
        @Body() dto: CreateLeaveRequestDto
    ): Promise<LeaveRequestResponseDto> {
        return this.leavesService.createLeaveRequest(user.id, dto);
    }

    /**
     * GET /staff/leaves
     * Lấy danh sách yêu cầu nghỉ phép của mình
     */
    @Get()
    async getMyLeaveRequests(
        @CurrentUser() user: any,
        @Query() dto: GetLeaveRequestsDto
    ): Promise<LeaveRequestListDto> {
        return this.leavesService.getMyLeaveRequests(user.id, dto);
    }

    /**
     * GET /staff/leaves/balance
     * Lấy số dư phép năm
     */
    @Get('balance')
    async getLeaveBalance(@CurrentUser() user: any): Promise<LeaveBalanceDto> {
        return this.leavesService.getLeaveBalance(user.id);
    }

    /**
     * GET /staff/leaves/:id
     * Lấy chi tiết một yêu cầu nghỉ phép
     */
    @Get(':id')
    async getLeaveRequestById(
        @CurrentUser() user: any,
        @Param('id', ParseUUIDPipe) id: string
    ): Promise<LeaveRequestResponseDto> {
        return this.leavesService.getLeaveRequestById(user.id, id);
    }

    /**
     * PUT /staff/leaves/:id
     * Cập nhật yêu cầu nghỉ phép (chỉ khi còn PENDING)
     */
    @Put(':id')
    async updateLeaveRequest(
        @CurrentUser() user: any,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateLeaveRequestDto
    ): Promise<LeaveRequestResponseDto> {
        return this.leavesService.updateLeaveRequest(user.id, id, dto);
    }

    /**
     * DELETE /staff/leaves/:id
     * Xóa/Hủy yêu cầu nghỉ phép (chỉ khi còn PENDING)
     */
    @Delete(':id')
    async deleteLeaveRequest(
        @CurrentUser() user: any,
        @Param('id', ParseUUIDPipe) id: string
    ): Promise<{ message: string }> {
        await this.leavesService.deleteLeaveRequest(user.id, id);
        return { message: 'Đã hủy yêu cầu nghỉ phép thành công' };
    }
}
