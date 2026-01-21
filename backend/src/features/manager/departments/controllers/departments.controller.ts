import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { DepartmentsService } from '../services/departments.service';
import { CreateDepartmentDto } from '../dto/create-department.dto';
import { UpdateDepartmentDto } from '../dto/update-department.dto';
import { AssignManagerDto } from '../dto/assign-manager.dto';
import { AssignEmployeesDto } from '../dto/assign-employees.dto';
import { RemoveEmployeesDto } from '../dto/remove-employees.dto';
import { Permissions } from '../../../../common/auth-decorators/permissions.decorator';

@ApiTags('Manager - Departments')
@ApiBearerAuth('JWT-auth')
@Controller('manager/departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @Permissions('manage_all_employees')
  @ApiOperation({ summary: 'Lấy danh sách phòng ban (có thể bao gồm nhân viên)' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách phòng ban',
  })
  async getDepartments(@Query('includeEmployees') includeEmployees?: string) {
    const shouldIncludeEmployees = includeEmployees === 'true';
    return this.departmentsService.getDepartments(shouldIncludeEmployees);
  }

  @Get(':id')
  @Permissions('manage_all_employees')
  @ApiOperation({ summary: 'Lấy chi tiết phòng ban (bao gồm tất cả nhân viên)' })
  @ApiParam({ name: 'id', description: 'ID của phòng ban' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết phòng ban',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phòng ban' })
  async getDepartmentDetail(@Param('id') id: string) {
    return this.departmentsService.getDepartmentDetail(id);
  }

  @Post()
  @Permissions('manage_all_employees')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo phòng ban mới' })
  @ApiBody({ type: CreateDepartmentDto })
  @ApiResponse({
    status: 201,
    description: 'Tạo phòng ban thành công',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 409, description: 'Mã phòng ban đã tồn tại' })
  async create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Patch(':id')
  @Permissions('manage_all_employees')
  @ApiOperation({ summary: 'Cập nhật thông tin phòng ban' })
  @ApiParam({ name: 'id', description: 'ID của phòng ban' })
  @ApiBody({ type: UpdateDepartmentDto })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật phòng ban thành công',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phòng ban' })
  @ApiResponse({ status: 409, description: 'Mã phòng ban đã tồn tại' })
  async update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @Delete(':id')
  @Permissions('manage_all_employees')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa phòng ban' })
  @ApiParam({ name: 'id', description: 'ID của phòng ban' })
  @ApiResponse({
    status: 200,
    description: 'Xóa phòng ban thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Không thể xóa phòng ban vì còn nhân viên',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phòng ban' })
  async remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }

  @Patch(':id/assign-manager')
  @Permissions('manage_all_employees')
  @ApiOperation({ summary: 'Gán/thay đổi trưởng phòng' })
  @ApiParam({ name: 'id', description: 'ID của phòng ban' })
  @ApiBody({ type: AssignManagerDto })
  @ApiResponse({
    status: 200,
    description: 'Gán trưởng phòng thành công',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy phòng ban hoặc người quản lý',
  })
  @ApiResponse({
    status: 409,
    description: 'Người quản lý đã quản lý phòng ban khác',
  })
  async assignManager(
    @Param('id') id: string,
    @Body() assignManagerDto: AssignManagerDto,
  ) {
    return this.departmentsService.assignManager(id, assignManagerDto.managerId);
  }

  @Post(':id/assign-employees')
  @Permissions('manage_all_employees')
  @ApiOperation({
    summary: 'Gán nhiều nhân viên vào phòng ban',
    description:
      'Gán danh sách nhân viên vào phòng ban. Có thể tự động gán trưởng phòng làm manager trực tiếp.',
  })
  @ApiParam({ name: 'id', description: 'ID của phòng ban' })
  @ApiBody({ type: AssignEmployeesDto })
  @ApiResponse({
    status: 200,
    description: 'Gán nhân viên thành công',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc không thể gán Manager' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phòng ban hoặc nhân viên' })
  async assignEmployees(
    @Param('id') id: string,
    @Body() assignEmployeesDto: AssignEmployeesDto,
  ) {
    return this.departmentsService.assignEmployees(
      id,
      assignEmployeesDto.employeeIds,
      assignEmployeesDto.autoAssignManager ?? true,
    );
  }

  @Post(':id/remove-employees')
  @Permissions('manage_all_employees')
  @ApiOperation({
    summary: 'Bỏ gán nhiều nhân viên khỏi phòng ban',
    description:
      'Bỏ gán danh sách nhân viên khỏi phòng ban. Tự động clear managerId của nhân viên.',
  })
  @ApiParam({ name: 'id', description: 'ID của phòng ban' })
  @ApiBody({ type: RemoveEmployeesDto })
  @ApiResponse({
    status: 200,
    description: 'Bỏ gán nhân viên thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ, nhân viên không thuộc phòng ban, hoặc không thể bỏ gán Manager',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phòng ban' })
  async removeEmployees(
    @Param('id') id: string,
    @Body() removeEmployeesDto: RemoveEmployeesDto,
  ) {
    return this.departmentsService.removeEmployees(id, removeEmployeesDto.employeeIds);
  }
}


