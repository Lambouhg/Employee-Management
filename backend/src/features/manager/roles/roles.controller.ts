import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { Permissions } from '../../../common/auth-decorators/permissions.decorator';

@ApiTags('Manager - Roles')
@ApiBearerAuth('JWT-auth')
@Controller('manager/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions('manage_all_employees')
  @ApiOperation({ summary: 'Lấy danh sách vai trò (để gán cho nhân viên)' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách vai trò',
  })
  async getRoles() {
    return this.rolesService.getRoles();
  }
}


