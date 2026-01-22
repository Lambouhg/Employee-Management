import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { Permissions } from '../../../common/auth-decorators/permissions.decorator';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { AssignDepartmentManagerDto } from './dto/assign-manager.dto';
import { AssignEmployeesDto } from './dto/assign-employees.dto';
import { RemoveEmployeesDto } from './dto/remove-employees.dto';
import { ManagerDepartmentsService } from './manager-departments.service';

@Controller('manager/departments')
export class ManagerDepartmentsController {
  constructor(private readonly departmentsService: ManagerDepartmentsService) {}

  @Get()
  @Permissions(
    'manage_departments',
    'manage_all_employees',
    'view_all_employees',
    'view_dept_employees',
  )
  async findAll(@Query('includeEmployees') includeEmployees?: string) {
    const include = includeEmployees === 'true';
    return this.departmentsService.findAll(include);
  }

  @Get(':id')
  @Permissions('manage_departments', 'view_all_employees', 'view_dept_employees')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.departmentsService.findOne(id);
  }

  @Post()
  @Permissions('manage_departments')
  async create(@Body() dto: CreateDepartmentDto, @Request() req: any) {
    return this.departmentsService.create(dto, req.user);
  }

  @Patch(':id')
  @Permissions('manage_departments')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('manage_departments')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.departmentsService.remove(id);
  }

  @Patch(':id/assign-manager')
  @Permissions('manage_departments')
  async assignManager(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignDepartmentManagerDto,
    @Request() req: any,
  ) {
    return this.departmentsService.assignManager(id, dto, req.user);
  }

  @Post(':id/assign-employees')
  @Permissions('manage_departments')
  async assignEmployees(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignEmployeesDto,
  ) {
    return this.departmentsService.assignEmployees(id, dto);
  }

  @Post(':id/remove-employees')
  @Permissions('manage_departments')
  async removeEmployees(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RemoveEmployeesDto,
  ) {
    return this.departmentsService.removeEmployees(id, dto);
  }
}
