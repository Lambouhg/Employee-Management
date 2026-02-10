import { Controller, Get, Patch, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DeptManagerLeavesService } from './dept-manager-leaves.service';
import { RequireRoles } from '@common/auth-decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ApproveLeaveDto, GetDepartmentLeavesQueryDto } from './dto';

@ApiTags('Dept Manager - Leaves')
@ApiBearerAuth('JWT-auth')
@RequireRoles('DEPT_MANAGER')
@Controller('dept-manager/leaves')
export class DeptManagerLeavesController {
    constructor(private readonly leavesService: DeptManagerLeavesService) { }

    @Get()
    @ApiOperation({ summary: 'Lấy danh sách nghỉ phép của nhân viên trong phòng ban' })
    @ApiResponse({ status: 200, description: 'Danh sách nghỉ phép' })
    async getDepartmentLeaves(
        @CurrentUser('id') managerId: string,
        @Query() query: GetDepartmentLeavesQueryDto
    ) {
        return this.leavesService.getDepartmentLeaves(managerId, query);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Thống kê nghỉ phép của phòng ban' })
    @ApiResponse({ status: 200, description: 'Thống kê nghỉ phép' })
    async getDepartmentLeaveStats(@CurrentUser('id') managerId: string) {
        return this.leavesService.getDepartmentLeaveStats(managerId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Lấy chi tiết yêu cầu nghỉ phép' })
    @ApiResponse({ status: 200, description: 'Chi tiết nghỉ phép với conflicting shifts' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy yêu cầu' })
    async getLeaveRequestById(
        @CurrentUser('id') managerId: string,
        @Param('id') leaveId: string
    ) {
        return this.leavesService.getLeaveRequestById(managerId, leaveId);
    }

    @Patch(':id/approve')
    @ApiOperation({ summary: 'Duyệt hoặc từ chối nghỉ phép (tự động xóa shifts conflict)' })
    @ApiResponse({ status: 200, description: 'Đã xử lý yêu cầu nghỉ phép' })
    @ApiResponse({ status: 400, description: 'Yêu cầu không hợp lệ' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy yêu cầu' })
    async approveOrRejectLeave(
        @CurrentUser('id') managerId: string,
        @Param('id') leaveId: string,
        @Body() dto: ApproveLeaveDto
    ) {
        return this.leavesService.approveOrRejectLeave(managerId, leaveId, dto);
    }
}
