import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ManagerEmployeesService } from './manager-employees.service';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { AssignManagerDto } from './dto/assign-manager.dto';
import { TransferDepartmentDto } from './dto/transfer-department.dto';
import { Permissions } from '../../../common/auth-decorators/permissions.decorator';

@Controller('manager/employees')
export class ManagerEmployeesController {
  constructor(private readonly employeesService: ManagerEmployeesService) {}

  @Get('managers/department')
  @Permissions('manage_departments', 'manage_all_employees', 'manage_dept_employees')
  getDepartmentManagers() {
    return this.employeesService.getDepartmentManagers();
  }

  @Get('managers')
  @Permissions('manage_all_employees', 'manage_dept_employees', 'manage_team_members')
  getManagers() {
    return this.employeesService.getManagers();
  }

  @Get()
  @Permissions(
    'view_all_employees',
    'view_dept_employees',
    'view_team_members',
    'manage_all_employees',
    'manage_dept_employees',
    'manage_team_members',
  )
  findAll(@Query() query: EmployeeQueryDto) {
    return this.employeesService.findAll(query);
  }

  @Get(':managerId/subordinates')
  @Permissions(
    'view_all_employees',
    'view_dept_employees',
    'view_team_members',
    'manage_all_employees',
    'manage_dept_employees',
    'manage_team_members',
  )
  getSubordinates(@Param('managerId', ParseUUIDPipe) managerId: string) {
    return this.employeesService.getSubordinates(managerId);
  }

  @Get(':id')
  @Permissions(
    'view_all_employees',
    'view_dept_employees',
    'view_team_members',
    'manage_all_employees',
    'manage_dept_employees',
    'manage_team_members',
  )
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeesService.findById(id);
  }

  @Post()
  @Permissions('manage_all_employees', 'manage_dept_employees', 'manage_team_members')
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @Patch(':id')
  @Permissions('manage_all_employees', 'manage_dept_employees', 'manage_team_members')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('manage_all_employees', 'manage_dept_employees', 'manage_team_members')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeesService.remove(id);
  }

  @Patch(':id/activate')
  @Permissions('manage_all_employees', 'manage_dept_employees', 'manage_team_members')
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeesService.activate(id);
  }

  @Patch(':id/deactivate')
  @Permissions('manage_all_employees', 'manage_dept_employees', 'manage_team_members')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeesService.deactivate(id);
  }

  @Patch(':id/reset-password')
  @Permissions('manage_all_employees', 'manage_dept_employees', 'manage_team_members')
  resetPassword(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeesService.resetPassword(id);
  }

  @Patch(':id/transfer-department')
  @Permissions('manage_all_employees', 'manage_dept_employees')
  transferDepartment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransferDepartmentDto,
  ) {
    return this.employeesService.transferDepartment(id, dto);
  }

  @Patch(':id/assign-manager')
  @Permissions('manage_all_employees', 'manage_dept_employees', 'manage_team_members')
  assignManager(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignManagerDto,
  ) {
    return this.employeesService.assignManager(id, dto);
  }
}
