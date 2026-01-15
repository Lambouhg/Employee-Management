import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ManagerService } from './manager.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { Permissions } from '../../common/auth-decorators/permissions.decorator';

@ApiTags('Manager - Employee Management')
@ApiBearerAuth('JWT-auth')
@Controller('manager/employees')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  @Get()
  @Permissions('manage_all_employees')
  @ApiOperation({ summary: 'Lấy danh sách nhân viên (có phân trang và filter)' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách nhân viên',
    schema: {
      example: {
        data: [
          {
            id: 'uuid',
            email: 'user@example.com',
            fullName: 'User Name',
            phone: '0123456789',
            employmentType: 'FULL_TIME',
            isActive: true,
            role: { id: 'uuid', name: 'STAFF', displayName: 'Nhân viên', level: 1 },
            manager: { id: 'uuid', fullName: 'Manager Name', email: 'manager@example.com' },
            subordinates: [],
          },
        ],
        meta: {
          total: 100,
          page: 1,
          limit: 10,
          totalPages: 10,
        },
      },
    },
  })
  async findAll(@Query() query: QueryUserDto) {
    return this.managerService.findAll(query);
  }

  @Get('roles')
  @Permissions('manage_all_employees')
  @ApiOperation({ summary: 'Lấy danh sách vai trò (để gán cho nhân viên)' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách vai trò',
    schema: {
      example: [
        { id: 'uuid', name: 'MANAGER', displayName: 'Quản lý', level: 3 },
        { id: 'uuid', name: 'STAFF', displayName: 'Nhân viên', level: 1 },
      ],
    },
  })
  async getRoles() {
    return this.managerService.getRoles();
  }

  @Get('managers')
  @Permissions('manage_all_employees')
  @ApiOperation({ summary: 'Lấy danh sách quản lý (để gán quản lý trực tiếp)' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách người có thể làm quản lý',
    schema: {
      example: [
        {
          id: 'uuid',
          fullName: 'Manager Name',
          email: 'manager@example.com',
          role: { name: 'MANAGER', displayName: 'Quản lý', level: 3 },
          department: { id: 'uuid', name: 'Kinh doanh', code: 'SALES' },
        },
      ],
    },
  })
  async getManagers() {
    return this.managerService.getManagers();
  }

  @Get('departments')
  @Permissions('manage_all_employees')
  @ApiOperation({ summary: 'Lấy danh sách phòng ban (có thể bao gồm nhân viên)' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách phòng ban',
    schema: {
      example: [
        {
          id: 'uuid',
          name: 'Kinh doanh',
          code: 'SALES',
          description: 'Phòng kinh doanh',
          parentId: null,
          manager: {
            id: 'uuid',
            fullName: 'Manager Name',
            email: 'manager@example.com',
            phone: '0901234567',
            role: { name: 'DEPT_MANAGER', displayName: 'Trưởng phòng' },
          },
          employees: [
            {
              id: 'uuid',
              fullName: 'Employee 1',
              email: 'emp1@example.com',
              role: { name: 'STAFF', displayName: 'Nhân viên' },
              employmentType: 'FULL_TIME',
              isActive: true,
            },
          ],
          _count: { employees: 5, subDepartments: 2 },
        },
      ],
    },
  })
  async getDepartments(@Query('includeEmployees') includeEmployees?: string) {
    const shouldIncludeEmployees = includeEmployees === 'true';
    return this.managerService.getDepartments(shouldIncludeEmployees);
  }

  @Get('departments/:id')
  @Permissions('manage_all_employees')
  @ApiOperation({ summary: 'Lấy chi tiết phòng ban (bao gồm tất cả nhân viên)' })
  @ApiParam({ name: 'id', description: 'ID của phòng ban' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết phòng ban',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phòng ban' })
  async getDepartmentDetail(@Param('id') id: string) {
    return this.managerService.getDepartmentDetail(id);
  }

  @Get(':id')
  @Permissions('manage_all_employees')
  @ApiOperation({ summary: 'Xem chi tiết thông tin nhân viên' })
  @ApiParam({ name: 'id', description: 'ID của nhân viên' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết nhân viên',
    schema: {
      example: {
        id: 'uuid',
        email: 'user@example.com',
        fullName: 'User Name',
        phone: '0123456789',
        employmentType: 'FULL_TIME',
        fixedDayOff: 'SUNDAY',
        isActive: true,
        role: { id: 'uuid', name: 'STAFF', displayName: 'Nhân viên', level: 1 },
        manager: { id: 'uuid', fullName: 'Manager Name', email: 'manager@example.com' },
        subordinates: [],
        permissions: ['view_own_schedule', 'submit_schedule'],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhân viên' })
  async findOne(@Param('id') id: string) {
    return this.managerService.findOne(id);
  }

  @Post()
  @Permissions('manage_all_employees')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo nhân viên mới' })
  @ApiResponse({
    status: 201,
    description: 'Tạo nhân viên thành công',
    schema: {
      example: {
        id: 'uuid',
        email: 'newuser@example.com',
        fullName: 'New User',
        phone: '0123456789',
        employmentType: 'FULL_TIME',
        isActive: true,
        role: { id: 'uuid', name: 'STAFF', displayName: 'Nhân viên', level: 1 },
        manager: { id: 'uuid', fullName: 'Manager Name', email: 'manager@example.com' },
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email đã được sử dụng' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.managerService.create(createUserDto);
  }

  @Patch(':id')
  @Permissions('manage_all_employees')
  @ApiOperation({ summary: 'Cập nhật thông tin nhân viên (gồm gán vai trò, quản lý)' })
  @ApiParam({ name: 'id', description: 'ID của nhân viên' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
    schema: {
      example: {
        id: 'uuid',
        email: 'updated@example.com',
        fullName: 'Updated Name',
        phone: '0987654321',
        employmentType: 'PART_TIME',
        isActive: true,
        role: { id: 'uuid', name: 'DEPT_MANAGER', displayName: 'Trưởng phòng', level: 2 },
        manager: { id: 'uuid', fullName: 'New Manager', email: 'newmanager@example.com' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhân viên' })
  @ApiResponse({ status: 409, description: 'Email đã được sử dụng' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.managerService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Permissions('manage_all_employees')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa nhân viên (soft delete - chuyển isActive = false)' })
  @ApiParam({ name: 'id', description: 'ID của nhân viên' })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhân viên' })
  async remove(@Param('id') id: string) {
    return this.managerService.remove(id);
  }

  @Patch(':id/activate')
  @Permissions('manage_all_employees')
  @ApiOperation({ summary: 'Kích hoạt lại nhân viên' })
  @ApiParam({ name: 'id', description: 'ID của nhân viên' })
  @ApiResponse({ status: 200, description: 'Kích hoạt thành công' })
  async activate(@Param('id') id: string) {
    return this.managerService.activate(id);
  }

  @Patch(':id/deactivate')
  @Permissions('manage_all_employees')
  @ApiOperation({ summary: 'Vô hiệu hóa nhân viên' })
  @ApiParam({ name: 'id', description: 'ID của nhân viên' })
  @ApiResponse({ status: 200, description: 'Vô hiệu hóa thành công' })
  async deactivate(@Param('id') id: string) {
    return this.managerService.deactivate(id);
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
    return this.managerService.transferDepartment(id, body.departmentId);
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
    return this.managerService.assignManager(id, body.managerId);
  }

  @Patch(':id/reset-password')
  @Permissions('manage_all_employees')
  @ApiOperation({ summary: 'Reset mật khẩu nhân viên về mặc định (123456)' })
  @ApiParam({ name: 'id', description: 'ID của nhân viên' })
  @ApiResponse({ status: 200, description: 'Reset mật khẩu thành công' })
  async resetPassword(@Param('id') id: string) {
    return this.managerService.resetPassword(id);
  }

  @Get(':id/subordinates')
  @Permissions('manage_all_employees')
  @ApiOperation({ summary: 'Lấy danh sách nhân viên dưới quyền' })
  @ApiParam({ name: 'id', description: 'ID của quản lý' })
  @ApiResponse({ status: 200, description: 'Danh sách nhân viên dưới quyền' })
  async getSubordinates(@Param('id') id: string) {
    return this.managerService.getSubordinates(id);
  }
}
