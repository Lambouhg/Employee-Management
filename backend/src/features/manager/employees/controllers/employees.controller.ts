import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
import { EmployeesService } from '../services/employees.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Permissions } from '../../../../common/auth-decorators/permissions.decorator';

@ApiTags('Manager - Employees')
@ApiBearerAuth('JWT-auth')
@Controller('manager/employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @Permissions('manage_all_employees')
  @ApiOperation({ summary: 'Lấy danh sách nhân viên (có phân trang và filter)' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách nhân viên',
  })
  async findAll() {
    return this.employeesService.findAll();
  }

  @Get('managers')
  @Permissions('manage_all_employees')
  @ApiOperation({ summary: 'Lấy danh sách quản lý (để gán quản lý trực tiếp)' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách người có thể làm quản lý',
  })
  async getManagers() {
    return this.employeesService.getManagers();
  }

  @Get(':id')
  @Permissions('manage_all_employees')
  @ApiOperation({ summary: 'Xem chi tiết thông tin nhân viên' })
  @ApiParam({ name: 'id', description: 'ID của nhân viên' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết nhân viên',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhân viên' })
  async findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Post()
  @Permissions('manage_all_employees')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo nhân viên mới' })
  @ApiResponse({
    status: 201,
    description: 'Tạo nhân viên thành công',
  })
  @ApiResponse({ status: 409, description: 'Email đã được sử dụng' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.employeesService.create(createUserDto);
  }

  @Patch(':id')
  @Permissions('manage_all_employees')
  @ApiOperation({
    summary: 'Cập nhật thông tin nhân viên (gồm gán vai trò, quản lý)',
  })
  @ApiParam({ name: 'id', description: 'ID của nhân viên' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhân viên' })
  @ApiResponse({ status: 409, description: 'Email đã được sử dụng' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.employeesService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Permissions('manage_all_employees')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa nhân viên (soft delete - chuyển isActive = false)' })
  @ApiParam({ name: 'id', description: 'ID của nhân viên' })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhân viên' })
  async remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }

  @Get(':id/subordinates')
  @Permissions('manage_all_employees')
  @ApiOperation({ summary: 'Lấy danh sách nhân viên dưới quyền' })
  @ApiParam({ name: 'id', description: 'ID của quản lý' })
  @ApiResponse({ status: 200, description: 'Danh sách nhân viên dưới quyền' })
  async getSubordinates(@Param('id') id: string) {
    return this.employeesService.getSubordinates(id);
  }
}


