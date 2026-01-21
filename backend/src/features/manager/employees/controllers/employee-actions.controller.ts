import { Controller, Patch, Param, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { EmployeeActionsService } from '../services/employee-actions.service';
import { Permissions } from '../../../../common/auth-decorators/permissions.decorator';

@ApiTags('Manager - Employee Actions')
@ApiBearerAuth('JWT-auth')
@Controller('manager/employees')
export class EmployeeActionsController {
  constructor(
    private readonly employeeActionsService: EmployeeActionsService,
  ) {}

  @Patch(':id/activate')
  @Permissions('manage_all_employees')
  @ApiOperation({ summary: 'Kích hoạt lại nhân viên' })
  @ApiParam({ name: 'id', description: 'ID của nhân viên' })
  @ApiResponse({ status: 200, description: 'Kích hoạt thành công' })
  async activate(@Param('id') id: string) {
    return this.employeeActionsService.activate(id);
  }

  @Patch(':id/deactivate')
  @Permissions('manage_all_employees')
  @ApiOperation({ summary: 'Vô hiệu hóa nhân viên' })
  @ApiParam({ name: 'id', description: 'ID của nhân viên' })
  @ApiResponse({ status: 200, description: 'Vô hiệu hóa thành công' })
  async deactivate(@Param('id') id: string) {
    return this.employeeActionsService.deactivate(id);
  }

  @Patch(':id/transfer-department')
  @Permissions('manage_all_employees')
  @ApiOperation({ summary: 'Chuyển nhân viên sang phòng ban khác' })
  @ApiParam({ name: 'id', description: 'ID của nhân viên' })
  @ApiResponse({ status: 200, description: 'Chuyển phòng ban thành công' })
  async transferDepartment(
    @Param('id') id: string,
    @Body() body: { departmentId: string | null },
  ) {
    return this.employeeActionsService.transferDepartment(id, body.departmentId);
  }

  @Patch(':id/assign-manager')
  @Permissions('manage_all_employees')
  @ApiOperation({ summary: 'Gán/thay đổi quản lý trực tiếp' })
  @ApiParam({ name: 'id', description: 'ID của nhân viên' })
  @ApiResponse({ status: 200, description: 'Gán quản lý thành công' })
  async assignManager(
    @Param('id') id: string,
    @Body() body: { managerId: string | null },
  ) {
    return this.employeeActionsService.assignManager(id, body.managerId);
  }

  @Patch(':id/reset-password')
  @Permissions('manage_all_employees')
  @ApiOperation({ summary: 'Reset mật khẩu nhân viên về mặc định (123456)' })
  @ApiParam({ name: 'id', description: 'ID của nhân viên' })
  @ApiResponse({ status: 200, description: 'Reset mật khẩu thành công' })
  async resetPassword(@Param('id') id: string) {
    return this.employeeActionsService.resetPassword(id);
  }
}


