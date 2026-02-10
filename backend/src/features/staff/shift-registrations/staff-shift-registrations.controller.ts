import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StaffShiftRegistrationsService } from './staff-shift-registrations.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { RequireRoles } from '@common/auth-decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { RegisterShiftDto, GetAvailableShiftsQueryDto, MyRegistrationsQueryDto } from './dto';

interface ICurrentUser {
  id: string;
  email: string;
  role: string;
}

@ApiTags('Staff - Shift Registrations')
@ApiBearerAuth()
@Controller('staff/shift-registrations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffShiftRegistrationsController {
  constructor(private readonly service: StaffShiftRegistrationsService) {}

  @Get('available')
  @ApiOperation({ summary: 'Get available shifts to register' })
  @ApiResponse({ status: 200, description: 'Available shifts retrieved successfully' })
  getAvailableShifts(
    @CurrentUser() user: ICurrentUser,
    @Query() query: GetAvailableShiftsQueryDto,
  ) {
    return this.service.getAvailableShifts(user.id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Register for a shift' })
  @ApiResponse({ status: 201, description: 'Registration created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Shift opening not found' })
  @ApiResponse({ status: 409, description: 'Already registered for this shift' })
  registerForShift(@CurrentUser() user: ICurrentUser, @Body() dto: RegisterShiftDto) {
    return this.service.registerForShift(user.id, dto);
  }

  @Get('my-registrations')
  @ApiOperation({ summary: 'Get my shift registrations' })
  @ApiResponse({ status: 200, description: 'Registrations retrieved successfully' })
  getMyRegistrations(@CurrentUser() user: ICurrentUser, @Query() query: MyRegistrationsQueryDto) {
    return this.service.getMyRegistrations(user.id, query);
  }

  @Delete(':id/cancel')
  @ApiOperation({ summary: 'Cancel my registration (only PENDING)' })
  @ApiResponse({ status: 200, description: 'Registration cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel this registration' })
  @ApiResponse({ status: 404, description: 'Registration not found' })
  cancelRegistration(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseUUIDPipe) registrationId: string,
  ) {
    return this.service.cancelRegistration(user.id, registrationId);
  }
}
