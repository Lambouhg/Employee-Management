import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class DeptManagerService {
    constructor(private readonly prisma: PrismaService) { }

    async getMyDepartment(currentUser: any) {
        // Find departments where this user is the manager
        const department = await this.prisma.department.findFirst({
            where: {
                managerId: currentUser.id,
                isActive: true,
            },
            include: {
                // Include minimal manager info (redundant but good for UI consistency)
                manager: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
                // Include employees list
                employees: {
                    where: {
                        isActive: true,
                    },
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        employmentType: true,
                        role: {
                            select: {
                                name: true,
                                displayName: true,
                            },
                        },
                    },
                },
                // Count employees
                _count: {
                    select: {
                        employees: true,
                    },
                },
            },
        });

        if (!department) {
            // It's possible a DEPT_MANAGER hasn't been assigned a department yet
            return null;
        }

        // Calculate basic statistics
        const statistics = {
            totalEmployees: department.employees.length,
            fullTimeEmployees: department.employees.filter(
                (e) => e.employmentType === 'FULL_TIME',
            ).length,
            partTimeEmployees: department.employees.filter(
                (e) => e.employmentType === 'PART_TIME',
            ).length,
        };

        return {
            ...department,
            statistics,
        };
    }

    async getDashboardStats(currentUser: any) {
        // 1. Get Manager's Department
        const department = await this.prisma.department.findUnique({
            where: { managerId: currentUser.id },
            select: { id: true, name: true }
        });

        if (!department) {
            return {
                department: null,
                stats: {
                    totalEmployees: 0,
                    pendingLeaves: 0,
                    pendingSchedules: 0,
                    attendanceToday: { present: 0, absent: 0, late: 0, onLeave: 0 }
                }
            };
        }

        // 2. Parallel Queries for Stats
        const [
            totalEmployees,
            pendingLeaves,
            pendingSchedules,
            attendanceStats
        ] = await Promise.all([
            // Total Active Employees
            this.prisma.user.count({
                where: {
                    departmentId: department.id,
                    isActive: true
                }
            }),

            // Pending Leave Requests (from employees in this dept)
            this.prisma.leaveRequest.count({
                where: {
                    employee: { departmentId: department.id },
                    status: 'PENDING'
                }
            }),

            // Pending Schedule Approvals (future weeks)
            this.prisma.workSchedule.count({
                where: {
                    employee: { departmentId: department.id },
                    status: 'PENDING'
                }
            }),

            // Today's Attendance
            this.getAttendanceStatsToday(department.id)
        ]);

        return {
            department,
            stats: {
                totalEmployees,
                pendingLeaves,
                pendingSchedules,
                attendanceToday: attendanceStats
            }
        };
    }

    private async getAttendanceStatsToday(departmentId: string) {
        const todayStartIndex = new Date();
        todayStartIndex.setHours(0, 0, 0, 0);

        const todayEndIndex = new Date();
        todayEndIndex.setHours(23, 59, 59, 999);

        // Get all shifts for today for this department
        const todayShifts = await this.prisma.shift.findMany({
            where: {
                employee: { departmentId: departmentId },
                date: {
                    gte: todayStartIndex,
                    lte: todayEndIndex
                }
            },
            include: {
                attendance: true
            }
        });

        const stats = {
            present: 0,
            absent: 0,
            late: 0,
            onLeave: 0
        };

        todayShifts.forEach(shift => {
            if (shift.attendance) {
                if (shift.attendance.status === 'PRESENT') stats.present++;
                if (shift.attendance.status === 'LATE') stats.late++;
                if (shift.attendance.status === 'ABSENT') stats.absent++;
                if (shift.attendance.status === 'ON_LEAVE') stats.onLeave++;
            }
        });

        return stats;
    }

    async getEmployees(currentUser: any, query: any) {
        const { page = 1, limit = 10, search = '' } = query;
        const skip = (page - 1) * limit;

        // 1. Get Manager's Department ID
        const department = await this.prisma.department.findUnique({
            where: { managerId: currentUser.id },
            select: { id: true }
        });

        if (!department) {
            return {
                data: [],
                meta: {
                    total: 0,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: 0
                }
            };
        }

        // 2. Build Filter
        const where: any = {
            departmentId: department.id,
            isActive: true, // Only show active employees
            OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } }
            ]
        };

        // 3. Get Data & Count
        const [employees, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip: Number(skip),
                take: Number(limit),
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                    employmentType: true,
                    fixedDayOff: true,
                    role: {
                        select: {
                            displayName: true
                        }
                    },
                    createdAt: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.user.count({ where })
        ]);

        return {
            data: employees,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        };
    }

    async getSchedules(currentUser: any, query: any) {
        const { weekStartDate, status } = query;

        // 1. Get Manager's Department
        const department = await this.prisma.department.findUnique({
            where: { managerId: currentUser.id },
            select: { id: true }
        });

        if (!department) return [];

        // 2. Build Query
        const where: any = {
            employee: { departmentId: department.id }
        };

        if (weekStartDate) where.weekStartDate = new Date(weekStartDate);
        if (status) where.status = status;

        // 3. Get Schedules
        return this.prisma.workSchedule.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                },
                shifts: {
                    orderBy: { date: 'asc' }
                }
            },
            orderBy: { weekStartDate: 'desc' }
        });
    }

    async reviewSchedule(currentUser: any, scheduleId: string, status: 'APPROVED' | 'REJECTED') {
        // 1. Get Manager's Department
        const department = await this.prisma.department.findUnique({
            where: { managerId: currentUser.id },
            select: { id: true }
        });

        if (!department) throw new NotFoundException('Department not found');

        // 2. Find Schedule & Verify Ownership
        const schedule = await this.prisma.workSchedule.findUnique({
            where: { id: scheduleId },
            include: { employee: true }
        });

        if (!schedule) throw new NotFoundException('Schedule not found');

        // Security Check: Ensure employee belongs to manager's department
        if (schedule.employee.departmentId !== department.id) {
            throw new NotFoundException('Schedule not found or not in your department');
        }

        // 3. Update Status
        return this.prisma.workSchedule.update({
            where: { id: scheduleId },
            data: {
                status: status as any, // Cast to any to avoid strict enum check conflicts
                approvedById: currentUser.id,
                approvedAt: new Date()
            }
        });
    }
}
