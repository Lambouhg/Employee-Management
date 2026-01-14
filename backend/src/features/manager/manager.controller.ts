import {
  Controller,
  Get,
  Post,
  Patch,
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
          role: { name: 'MANAGER', displayName: 'Quản lý' },
        },
      ],
    },
  })
  async getManagers() {
    return this.managerService.getManagers();
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
        role: { id: 'uuid', name: 'SUPER_STAFF', displayName: 'Trưởng nhóm', level: 2 },
        manager: { id: 'uuid', fullName: 'New Manager', email: 'newmanager@example.com' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhân viên' })
  @ApiResponse({ status: 409, description: 'Email đã được sử dụng' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.managerService.update(id, updateUserDto);
  }
}
