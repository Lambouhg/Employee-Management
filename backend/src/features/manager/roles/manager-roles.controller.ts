import { Controller, Get } from '@nestjs/common';
import { ManagerRolesService } from './manager-roles.service';
import { Permissions } from '../../../common/auth-decorators/permissions.decorator';

@Controller('manager/roles')
export class ManagerRolesController {
  constructor(private readonly rolesService: ManagerRolesService) {}

  @Get()
  @Permissions(
    'manage_all_employees',
    'manage_dept_employees',
    'manage_team_members',
    'view_all_employees',
    'view_dept_employees',
    'view_team_members',
  )
  async findAll() {
    return this.rolesService.findAll();
  }
}
