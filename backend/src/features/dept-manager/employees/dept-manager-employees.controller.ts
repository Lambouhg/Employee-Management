import { Controller, Get, Request, Query, Param, ValidationPipe, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { DeptManagerEmployeesService } from './dept-manager-employees.service';
import { Permissions } from '../../../common/auth-decorators/permissions.decorator';
import { 
  GetEmployeesQueryDto, 
  EmployeeListItemDto, 
  EmployeeDetailDto,
  EmployeeSelectionDto,
  PaginatedResponseDto 
} from './dto';
import { ICurrentUser } from './interfaces';

@ApiTags('Dept Manager - Employees')
@ApiBearerAuth()
@Controller('dept-manager/employees')
export class DeptManagerEmployeesController {
    constructor(private readonly employeesService: DeptManagerEmployeesService) { }

    @Get()
    @Permissions('manage_dept_employees')
    @ApiOperation({ summary: 'Get all employees in department with pagination' })
    @ApiResponse({ 
      status: 200, 
      description: 'Returns paginated list of employees',
      type: PaginatedResponseDto<EmployeeListItemDto>
    })
    async getEmployees(
      @Request() req: { user: ICurrentUser },
      @Query(new ValidationPipe({ transform: true })) query: GetEmployeesQueryDto
    ): Promise<PaginatedResponseDto<EmployeeListItemDto>> {
        return this.employeesService.getEmployees(req.user, query);
    }

    @Get('selection-list')
    @Permissions('manage_dept_employees')
    @ApiOperation({ summary: 'Get simplified employee list for selection dropdowns with optional weekly statistics' })
    @ApiResponse({
      status: 200,
      description: 'Returns list of employees with minimal data and optional statistics',
      type: [EmployeeSelectionDto]
    })
    async getSelectionList(
      @Request() req: { user: ICurrentUser },
      @Query('weekStartDate') weekStartDate?: string
    ): Promise<EmployeeSelectionDto[]> {
        // Parse date properly to avoid timezone issues
        let weekStart: Date | undefined = undefined;
        if (weekStartDate) {
            // Extract YYYY-MM-DD and create local date at 00:00:00
            const dateStr = weekStartDate.split('T')[0];
            const [year, month, day] = dateStr.split('-').map(Number);
            weekStart = new Date(year, month - 1, day);
        }
        return this.employeesService.getSelectionList(req.user, weekStart);
    }

    @Get(':id')
    @Permissions('manage_dept_employees')
    @ApiOperation({ summary: 'Get detailed information of a specific employee' })
    @ApiParam({ name: 'id', description: 'Employee UUID', type: 'string' })
    @ApiResponse({ 
      status: 200, 
      description: 'Returns employee details',
      type: EmployeeDetailDto
    })
    @ApiResponse({ status: 404, description: 'Employee not found in your department' })
    async getEmployeeDetail(
      @Request() req: { user: ICurrentUser },
      @Param('id', ParseUUIDPipe) id: string
    ): Promise<EmployeeDetailDto> {
        return this.employeesService.getEmployeeDetail(req.user, id);
    }
}
