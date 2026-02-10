import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { 
  GetEmployeesQueryDto, 
  EmployeeListItemDto, 
  EmployeeDetailDto,
  EmployeeSelectionDto,
  PaginatedResponseDto 
} from './dto';
import { ICurrentUser, IEmployeeQueryOptions } from './interfaces';
import { dayOfWeekToNumber } from '../../../common/utils/date.util';

@Injectable()
export class DeptManagerEmployeesService {
    private readonly logger = new Logger(DeptManagerEmployeesService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get paginated list of employees in the department manager's department
     */
    async getEmployees(
        currentUser: ICurrentUser, 
        query: GetEmployeesQueryDto
    ): Promise<PaginatedResponseDto<EmployeeListItemDto>> {
        const { page = 1, limit = 10, search = '' } = query;
        const skip = (page - 1) * limit;

        // Get department managed by current user
        const department = await this.getDepartmentByManager(currentUser.id);

        if (!department) {
            this.logger.warn(`User ${currentUser.id} is not a department manager`);
            return {
                data: [],
                meta: { total: 0, page, limit, totalPages: 0 }
            };
        }

        // Build where clause with search
        const where: any = {
            departmentId: department.id,
            isActive: true,
        };

        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Execute query with pagination
        const [employees, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                    employmentType: true,
                    fixedDayOff: true,
                    role: { select: { displayName: true } },
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.user.count({ where })
        ]);

        return {
            data: employees.map(emp => ({
                ...emp,
                fixedDayOff: dayOfWeekToNumber(emp.fixedDayOff),
            })) as EmployeeListItemDto[],
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get detailed information of a specific employee
     */
    async getEmployeeDetail(
        currentUser: ICurrentUser, 
        employeeId: string
    ): Promise<EmployeeDetailDto> {
        // Verify department manager
        const department = await this.getDepartmentByManager(currentUser.id);

        if (!department) {
            throw new ForbiddenException('You are not a department manager');
        }

        // Find employee in the same department
        const employee = await this.prisma.user.findFirst({
            where: {
                id: employeeId,
                departmentId: department.id,
                isActive: true
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                employmentType: true,
                fixedDayOff: true,
                department: {
                    select: { name: true, code: true }
                },
                role: {
                    select: { displayName: true, name: true }
                },
                createdAt: true,
                updatedAt: true,
                isActive: true
            }
        });

        if (!employee) {
            throw new NotFoundException('Employee not found in your department');
        }

        return {
            ...employee,
            fixedDayOff: dayOfWeekToNumber(employee.fixedDayOff),
        } as EmployeeDetailDto;
    }

    /**
     * Get simplified list of employees for selection dropdowns with weekly statistics
     * @param weekStartDate Optional week start date to calculate statistics
     */
    async getSelectionList(
        currentUser: ICurrentUser,
        weekStartDate?: Date
    ): Promise<EmployeeSelectionDto[]> {
        const department = await this.getDepartmentByManager(currentUser.id);

        if (!department) {
            this.logger.warn(`User ${currentUser.id} is not a department manager`);
            return [];
        }

        const employees = await this.prisma.user.findMany({
            where: {
                departmentId: department.id,
                isActive: true
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                employmentType: true,
                fixedDayOff: true,
            },
            orderBy: { fullName: 'asc' }
        });

        // If weekStartDate is provided, calculate weekly statistics
        if (weekStartDate) {
            // Ensure weekStartDate is at 00:00:00 local time
            const weekStart = new Date(weekStartDate);
            weekStart.setHours(0, 0, 0, 0);
            
            // Calculate end of week (7 days later at 00:00:00)
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);
            weekEnd.setHours(0, 0, 0, 0);

            this.logger.debug(`Calculating shifts for week: ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);

            // Get all shifts for this week for all employees
            const shiftsInWeek = await this.prisma.shift.groupBy({
                by: ['employeeId'],
                where: {
                    employeeId: { in: employees.map(e => e.id) },
                    date: {
                        gte: weekStart,
                        lt: weekEnd
                    }
                },
                _count: {
                    id: true
                }
            });
            
            this.logger.debug(`Found ${shiftsInWeek.length} employees with shifts`);

            const shiftsMap = new Map(
                shiftsInWeek.map(s => [s.employeeId, s._count.id])
            );

            return employees.map(emp => {
                const totalShifts = shiftsMap.get(emp.id) || 0;
                const maxShifts = emp.employmentType === 'FULL_TIME' ? 6 : 5;
                const remainingSlots = Math.max(0, maxShifts - totalShifts);

                // Log if totalShifts exceeds maxShifts (should not happen)
                if (totalShifts > maxShifts) {
                    this.logger.warn(
                        `Employee ${emp.fullName} (${emp.employmentType}) has ${totalShifts} shifts ` +
                        `in week ${weekStart.toISOString().split('T')[0]}, exceeds max ${maxShifts}`
                    );
                }

                return {
                    id: emp.id,
                    fullName: emp.fullName,
                    email: emp.email,
                    employmentType: emp.employmentType,
                    fixedDayOff: emp.fixedDayOff ?? undefined,
                    fixedDayOffNumber: dayOfWeekToNumber(emp.fixedDayOff) ?? undefined,
                    weeklyStats: {
                        totalShiftsAssigned: totalShifts,
                        maxShiftsPerWeek: maxShifts,
                        canAssignMore: totalShifts < maxShifts,
                        remainingSlots
                    }
                };
            });
        }

        // Without weekStartDate, return basic info
        return employees.map(emp => ({
            id: emp.id,
            fullName: emp.fullName,
            email: emp.email,
            employmentType: emp.employmentType,
            fixedDayOff: emp.fixedDayOff ?? undefined,
            fixedDayOffNumber: dayOfWeekToNumber(emp.fixedDayOff) ?? undefined,
        }));
    }

    /**
     * Helper: Get department managed by user
     */
    private async getDepartmentByManager(managerId: string) {
        return this.prisma.department.findUnique({
            where: { managerId },
            select: { id: true }
        });
    }
}
