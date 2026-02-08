import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DeptManagerShiftRegistrationsService } from './dept-manager-shift-registrations.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { RequireRoles } from '@common/auth-decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ReviewRegistrationDto, GetRegistrationsQueryDto } from './dto';

interface ICurrentUser {
  id: string;
  email: string;
  role: string;
}

@ApiTags('Dept Manager - Shift Registrations')
@ApiBearerAuth()
@Controller('dept-manager/shift-registrations')
@UseGuards(JwtAuthGuard, RolesGuard)

export class DeptManagerShiftRegistrationsController {
  constructor(private readonly service: DeptManagerShiftRegistrationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get shift registrations for review' })
  @ApiResponse({ status: 200, description: 'Registrations retrieved successfully' })
  getRegistrations(@CurrentUser() user: ICurrentUser, @Query() query: GetRegistrationsQueryDto) {
    return this.service.getRegistrations(user.id, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get registration statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getRegistrationStats(@CurrentUser() user: ICurrentUser) {
    return this.service.getRegistrationStats(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get registration detail' })
  @ApiResponse({ status: 200, description: 'Registration retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Registration not found' })
  getRegistrationDetail(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseUUIDPipe) registrationId: string,
  ) {
    return this.service.getRegistrationDetail(user.id, registrationId);
  }

  @Patch(':id/review')
  @ApiOperation({ summary: 'Review registration (Approve/Reject)' })
  @ApiResponse({ status: 200, description: 'Registration reviewed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your department' })
  @ApiResponse({ status: 404, description: 'Registration not found' })
  reviewRegistration(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseUUIDPipe) registrationId: string,
    @Body() dto: ReviewRegistrationDto,
  ) {
    return this.service.reviewRegistration(user.id, registrationId, dto);
  }
}
