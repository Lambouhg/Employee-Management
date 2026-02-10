import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import {
    CompleteDashboardDto,
    OverviewMetricsDto,
    WeeklyMetricsDto,
    TodayMetricsDto,
    PendingActionsDto,
    ShiftCoverageDto,
    AttendanceTrendDto,
    EmployeeWorkloadDto,
    RecentActivityDto,
    AlertDto,
} from './dto/dashboard-response.dto';

@Injectable()
export class DeptManagerDashboardService {
    constructor(private readonly prisma: PrismaService) { }

    async getMyDepartment(currentUser: any) {
        const department = await this.prisma.department.findFirst({
            where: {
                managerId: currentUser.id,
                isActive: true,
            },
            include: {
                manager: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
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
                _count: {
                    select: {
                        employees: true,
                    },
                },
            },
        });

        if (!department) return null;

        const statistics = {
            totalEmployees: department.employees.length,
            fullTimeEmployees: department.employees.filter((e) => e.employmentType === 'FULL_TIME').length,
            partTimeEmployees: department.employees.filter((e) => e.employmentType === 'PART_TIME').length,
        };

        return { ...department, statistics };
    }

    async getDashboardStats(currentUser: any) {
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

        const [totalEmployees, pendingLeaves, pendingSchedules, attendanceStats] = await Promise.all([
            this.prisma.user.count({ where: { departmentId: department.id, isActive: true } }),
            this.prisma.leaveRequest.count({ where: { employee: { departmentId: department.id }, status: 'PENDING' } }),
            this.prisma.workSchedule.count({ where: { employee: { departmentId: department.id }, status: 'PENDING' } }),
            this.getAttendanceStatsToday(department.id)
        ]);

        return {
            department,
            stats: { totalEmployees, pendingLeaves, pendingSchedules, attendanceToday: attendanceStats }
        };
    }

    private async getAttendanceStatsToday(departmentId: string) {
        const todayStartIndex = new Date();
        todayStartIndex.setHours(0, 0, 0, 0);

        const todayEndIndex = new Date();
        todayEndIndex.setHours(23, 59, 59, 999);

        const todayShifts = await this.prisma.shift.findMany({
            where: {
                employee: { departmentId: departmentId },
                date: { gte: todayStartIndex, lte: todayEndIndex }
            },
            include: { attendance: true }
        });

        const stats = { present: 0, absent: 0, late: 0, onLeave: 0 };

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

    /**
     * Get complete dashboard data
     */
    async getCompleteDashboard(currentUser: any): Promise<CompleteDashboardDto> {
        const department = await this.prisma.department.findUnique({
            where: { managerId: currentUser.id },
            include: {
                manager: {
                    select: { id: true, fullName: true, email: true },
                },
                _count: { select: { employees: true } },
            },
        });

        if (!department) {
            throw new NotFoundException('Không tìm thấy phòng ban được quản lý');
        }

        const [
            overview,
            weekly,
            today,
            pendingActions,
            weeklyShiftCoverage,
            attendanceTrend,
            employeeWorkload,
            recentActivities,
            alerts,
        ] = await Promise.all([
            this.getOverviewMetrics(department.id),
            this.getWeeklyMetrics(department.id),
            this.getTodayMetrics(department.id),
            this.getPendingActions(department.id),
            this.getWeeklyShiftCoverage(department.id),
            this.getAttendanceTrend(department.id),
            this.getEmployeeWorkload(department.id),
            this.getRecentActivities(department.id),
            this.getAlerts(department.id),
        ]);

        return {
            department: {
                ...department,
                manager: department.manager || undefined,
            },
            overview,
            weekly,
            today,
            pendingActions,
            weeklyShiftCoverage,
            attendanceTrend,
            employeeWorkload,
            recentActivities,
            alerts,
        };
    }

    /**
     * Overview Metrics
     */
    private async getOverviewMetrics(departmentId: string): Promise<OverviewMetricsDto> {
        const employees = await this.prisma.user.findMany({
            where: { departmentId, role: { name: { not: 'DEPT_MANAGER' } } },
            select: { employmentType: true, isActive: true },
        });

        return {
            totalEmployees: employees.length,
            fullTimeEmployees: employees.filter((e) => e.employmentType === 'FULL_TIME').length,
            partTimeEmployees: employees.filter((e) => e.employmentType === 'PART_TIME').length,
            activeEmployees: employees.filter((e) => e.isActive).length,
        };
    }

    /**
     * Weekly Metrics - Current week plan status and shift stats
     */
    private async getWeeklyMetrics(departmentId: string): Promise<WeeklyMetricsDto> {
        const now = new Date();
        const weekStartDate = this.getMonday(now);
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);

        // Get current week plan
        const currentPlan = await this.prisma.deptWeeklyPlan.findFirst({
            where: {
                departmentId,
                weekStartDate: {
                    gte: weekStartDate,
                    lt: new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000),
                },
            },
            include: {
                shiftOpenings: {
                    include: {
                        shifts: true,
                        template: true,
                    },
                },
            },
        });

        if (!currentPlan) {
            return {
                currentWeekPlanStatus: 'NONE',
                totalShiftsThisWeek: 0,
                assignedShifts: 0,
                vacantShifts: 0,
                totalHoursScheduled: 0,
                weekStartDate: weekStartDate.toISOString(),
            };
        }

        const totalShifts = currentPlan.shiftOpenings.length;
        const assignedShifts = currentPlan.shiftOpenings.filter(
            (opening) => opening.shifts && opening.shifts.length > 0
        ).length;

        // Calculate total hours scheduled
        let totalHours = 0;
        currentPlan.shiftOpenings.forEach((opening) => {
            if (opening.shifts && opening.shifts.length > 0 && opening.template) {
                totalHours += opening.template.totalHours * opening.shifts.length;
            }
        });

        return {
            currentWeekPlanStatus: currentPlan.status,
            totalShiftsThisWeek: totalShifts,
            assignedShifts,
            vacantShifts: totalShifts - assignedShifts,
            totalHoursScheduled: totalHours,
            weekStartDate: weekStartDate.toISOString(),
        };
    }

    /**
     * Today Metrics - Current shifts and attendance
     */
    private async getTodayMetrics(departmentId: string): Promise<TodayMetricsDto> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const currentHour = new Date().getHours();

        // Get all shifts today
        const todayShifts = await this.prisma.shift.findMany({
            where: {
                employee: { departmentId },
                date: { gte: today, lt: tomorrow },
            },
            include: {
                attendance: true,
                opening: {
                    include: { template: true },
                },
            },
        });

        // Count active shifts (currently happening)
        let currentActiveShifts = 0;
        todayShifts.forEach((shift) => {
            if (shift.opening?.template) {
                const startHour = new Date(shift.opening.startTime).getHours();
                const endHour = new Date(shift.opening.endTime).getHours();
                if (currentHour >= startHour && currentHour < endHour) {
                    currentActiveShifts++;
                }
            }
        });

        // Attendance stats
        const stats = { present: 0, absent: 0, late: 0, onLeave: 0 };
        todayShifts.forEach((shift) => {
            if (shift.attendance) {
                if (shift.attendance.status === 'PRESENT') stats.present++;
                if (shift.attendance.status === 'ABSENT') stats.absent++;
                if (shift.attendance.status === 'LATE') stats.late++;
                if (shift.attendance.status === 'ON_LEAVE') stats.onLeave++;
            }
        });

        return {
            currentActiveShifts,
            present: stats.present,
            absent: stats.absent,
            late: stats.late,
            onLeave: stats.onLeave,
            totalShiftsToday: todayShifts.length,
        };
    }

    /**
     * Pending Actions - Items needing attention
     */
    private async getPendingActions(departmentId: string): Promise<PendingActionsDto> {
        const weekStartDate = this.getMonday(new Date());
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 7);

        const [pendingRegistrations, pendingLeaves, pendingSchedules, currentPlan] =
            await Promise.all([
                this.prisma.shiftRegistration.count({
                    where: {
                        employee: { departmentId },
                        status: 'PENDING',
                    },
                }),
                this.prisma.leaveRequest.count({
                    where: {
                        employee: { departmentId },
                        status: 'PENDING',
                    },
                }),
                this.prisma.workSchedule.count({
                    where: {
                        employee: { departmentId },
                        status: 'PENDING',
                    },
                }),
                this.prisma.deptWeeklyPlan.findFirst({
                    where: {
                        departmentId,
                        weekStartDate: { gte: weekStartDate, lt: weekEndDate },
                    },
                    include: {
                        shiftOpenings: {
                            include: { shifts: true },
                        },
                    },
                }),
            ]);

        // Count understaffed shifts (openings with no shifts assigned)
        let understaffed = 0;
        if (currentPlan && currentPlan.shiftOpenings) {
            currentPlan.shiftOpenings.forEach((opening) => {
                if (!opening.shifts || opening.shifts.length === 0) {
                    understaffed++;
                }
            });
        }

        return {
            pendingShiftRegistrations: pendingRegistrations,
            pendingLeaveRequests: pendingLeaves,
            pendingSchedules,
            understaffedShifts: understaffed,
        };
    }

    /**
     * Weekly Shift Coverage - Day by day breakdown
     */
    private async getWeeklyShiftCoverage(departmentId: string): Promise<ShiftCoverageDto[]> {
        const weekStartDate = this.getMonday(new Date());
        const coverage: ShiftCoverageDto[] = [];

        const currentPlan = await this.prisma.deptWeeklyPlan.findFirst({
            where: {
                departmentId,
                weekStartDate: {
                    gte: weekStartDate,
                    lt: new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000),
                },
            },
            include: {
                shiftOpenings: {
                    include: { shifts: true },
                },
            },
        });

        if (!currentPlan) {
            // Return 7 days with no shifts
            for (let i = 0; i < 7; i++) {
                const date = new Date(weekStartDate);
                date.setDate(date.getDate() + i);
                coverage.push({
                    date: date.toISOString().split('T')[0],
                    dayOfWeek: this.getDayName(date.getDay()),
                    totalShifts: 0,
                    assignedShifts: 0,
                    vacantShifts: 0,
                    status: 'EMPTY',
                });
            }
            return coverage;
        }

        // Group openings by date
        const openingsByDate = new Map<string, any[]>();
        currentPlan.shiftOpenings.forEach((opening) => {
            const dateStr = new Date(opening.date).toISOString().split('T')[0];
            if (!openingsByDate.has(dateStr)) {
                openingsByDate.set(dateStr, []);
            }
            openingsByDate.get(dateStr)!.push(opening);
        });

        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStartDate);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];

            const dayOpenings = openingsByDate.get(dateStr) || [];
            const totalShifts = dayOpenings.length;
            const assignedShifts = dayOpenings.filter(
                (o) => o.shifts && o.shifts.length > 0
            ).length;
            const vacantShifts = totalShifts - assignedShifts;

            let status: 'FULL' | 'PARTIAL' | 'EMPTY' = 'EMPTY';
            if (totalShifts > 0) {
                if (vacantShifts === 0) status = 'FULL';
                else if (assignedShifts > 0) status = 'PARTIAL';
            }

            coverage.push({
                date: dateStr,
                dayOfWeek: this.getDayName(date.getDay()),
                totalShifts,
                assignedShifts,
                vacantShifts,
                status,
            });
        }

        return coverage;
    }

    /**
     * Attendance Trend - Last 7 days
     */
    private async getAttendanceTrend(departmentId: string): Promise<AttendanceTrendDto[]> {
        const trend: AttendanceTrendDto[] = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);

            const shifts = await this.prisma.shift.findMany({
                where: {
                    employee: { departmentId },
                    date: { gte: date, lt: nextDay },
                },
                include: { attendance: true },
            });

            let present = 0,
                absent = 0,
                late = 0;
            shifts.forEach((shift) => {
                if (shift.attendance) {
                    if (shift.attendance.status === 'PRESENT') present++;
                    if (shift.attendance.status === 'ABSENT') absent++;
                    if (shift.attendance.status === 'LATE') late++;
                }
            });

            const presentRate =
                shifts.length > 0 ? Math.round((present / shifts.length) * 100) : 0;

            trend.push({
                date: date.toISOString().split('T')[0],
                totalShifts: shifts.length,
                present,
                absent,
                late,
                presentRate,
            });
        }

        return trend;
    }

    /**
     * Employee Workload - Current week distribution
     */
    private async getEmployeeWorkload(departmentId: string): Promise<EmployeeWorkloadDto[]> {
        const weekStartDate = this.getMonday(new Date());
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 7);

        const employees = await this.prisma.user.findMany({
            where: {
                departmentId,
                isActive: true,
                role: { name: { not: 'DEPT_MANAGER' } },
            },
            select: {
                id: true,
                fullName: true,
                employmentType: true,
            },
        });

        const workload: EmployeeWorkloadDto[] = [];

        for (const employee of employees) {
            const shiftsCount = await this.prisma.shift.count({
                where: {
                    employeeId: employee.id,
                    date: { gte: weekStartDate, lt: weekEndDate },
                },
            });

            const maxShifts = employee.employmentType === 'FULL_TIME' ? 6 : 5;
            const isOverloaded = shiftsCount > maxShifts;
            const isUnderloaded = shiftsCount < (maxShifts - 2);

            workload.push({
                employeeId: employee.id,
                fullName: employee.fullName,
                employmentType: employee.employmentType,
                shiftsThisWeek: shiftsCount,
                maxShiftsAllowed: maxShifts,
                isOverloaded,
                isUnderloaded,
            });
        }

        // Sort by overloaded first, then by shift count
        workload.sort((a, b) => {
            if (a.isOverloaded && !b.isOverloaded) return -1;
            if (!a.isOverloaded && b.isOverloaded) return 1;
            return b.shiftsThisWeek - a.shiftsThisWeek;
        });

        return workload.slice(0, 10); // Top 10
    }

    /**
     * Recent Activities - Last 10 activities
     */
    private async getRecentActivities(departmentId: string): Promise<RecentActivityDto[]> {
        const activities: RecentActivityDto[] = [];

        // Get recent shift registrations
        const recentRegistrations = await this.prisma.shiftRegistration.findMany({
            where: { employee: { departmentId } },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                employee: { select: { fullName: true } },
                opening: {
                    select: { date: true, shiftType: true },
                },
            },
        });

        recentRegistrations.forEach((reg) => {
            activities.push({
                id: reg.id,
                type: 'SHIFT_REGISTRATION',
                message: `${reg.employee.fullName} đăng ký ca ${reg.opening.shiftType} ngày ${new Date(reg.opening.date).toLocaleDateString('vi-VN')}`,
                timestamp: reg.createdAt,
                employeeName: reg.employee.fullName,
            });
        });

        // Get recent leave requests
        const recentLeaves = await this.prisma.leaveRequest.findMany({
            where: { employee: { departmentId } },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                employee: { select: { fullName: true } },
            },
        });

        recentLeaves.forEach((leave) => {
            activities.push({
                id: leave.id,
                type: 'LEAVE_REQUEST',
                message: `${leave.employee.fullName} xin nghỉ từ ${new Date(leave.startDate).toLocaleDateString('vi-VN')}`,
                timestamp: leave.createdAt,
                employeeName: leave.employee.fullName,
            });
        });

        // Sort by timestamp and return top 10
        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return activities.slice(0, 10);
    }

    /**
     * Alerts - Important warnings
     */
    private async getAlerts(departmentId: string): Promise<AlertDto[]> {
        const alerts: AlertDto[] = [];
        const now = new Date();

        // Check if next week has a plan
        const nextWeekStart = this.getMonday(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));
        const nextWeekPlan = await this.prisma.deptWeeklyPlan.findFirst({
            where: {
                departmentId,
                weekStartDate: {
                    gte: nextWeekStart,
                    lt: new Date(nextWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
                },
            },
        });

        const daysUntilNextWeek = Math.ceil(
            (nextWeekStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (!nextWeekPlan && daysUntilNextWeek <= 3) {
            alerts.push({
                id: 'no-next-week-plan',
                severity: 'ERROR',
                message: `Tuần tới chưa có lịch làm việc! Còn ${daysUntilNextWeek} ngày.`,
                actionRequired: true,
                actionUrl: '/dept-manager/plans/create',
            });
        }

        // Check for understaffed shifts in next 24 hours
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const upcomingOpenings = await this.prisma.shiftOpening.findMany({
            where: {
                plan: { departmentId },
                date: { gte: now, lt: tomorrow },
            },
            include: {
                shifts: true,
            },
        });

        const emptyOpenings = upcomingOpenings.filter(
            (o) => !o.shifts || o.shifts.length === 0
        );

        if (emptyOpenings.length > 0) {
            alerts.push({
                id: 'empty-shifts-24h',
                severity: 'WARNING',
                message: `${emptyOpenings.length} ca trong 24h tới chưa có người đăng ký!`,
                actionRequired: true,
                actionUrl: '/dept-manager/shift-assignment',
            });
        }

        // Check for pending registrations
        const pendingCount = await this.prisma.shiftRegistration.count({
            where: {
                employee: { departmentId },
                status: 'PENDING',
            },
        });

        if (pendingCount > 5) {
            alerts.push({
                id: 'many-pending-registrations',
                severity: 'WARNING',
                message: `${pendingCount} đăng ký ca đang chờ duyệt`,
                actionRequired: true,
                actionUrl: '/dept-manager/shift-registrations',
            });
        }

        return alerts;
    }

    /**
     * Helper: Get Monday of the week
     */
    private getMonday(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    }

    /**
     * Helper: Get day name
     */
    private getDayName(dayIndex: number): string {
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        return days[dayIndex];
    }
}
