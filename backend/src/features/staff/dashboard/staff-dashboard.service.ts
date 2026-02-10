import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { AttendanceStatus, RegistrationStatus, LeaveStatus } from '@prisma/client';

@Injectable()
export class StaffDashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardData(userId: string) {
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const tomorrowUTC = new Date(todayUTC);
    tomorrowUTC.setUTCDate(todayUTC.getUTCDate() + 1);

    // Start of current week (Monday)
    const weekStart = new Date(todayUTC);
    const dayOfWeek = weekStart.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + diff);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Start and end of current month
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));

    // Next 7 days for upcoming schedule
    const next7Days = new Date(todayUTC);
    next7Days.setDate(todayUTC.getDate() + 7);

    // Parallel queries for better performance
    const [
      user,
      todayShift,
      weekShifts,
      upcomingShifts,
      pendingRegistrations,
      monthAttendance,
      approvedLeaves,
      recentActivities,
    ] = await Promise.all([
      // User info
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          fullName: true,
          email: true,
          employmentType: true,
        },
      }),

      // Today's shift
      this.prisma.shift.findFirst({
        where: {
          employeeId: userId,
          date: {
            gte: todayUTC,
            lt: tomorrowUTC,
          },
        },
        include: {
          attendance: true,
        },
      }),

      // This week's shifts count
      this.prisma.shift.count({
        where: {
          employeeId: userId,
          date: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
      }),

      // Upcoming 7 days shifts
      this.prisma.shift.findMany({
        where: {
          employeeId: userId,
          date: {
            gte: todayUTC,
            lt: next7Days,
          },
        },
        include: {
          attendance: true,
        },
        orderBy: {
          date: 'asc',
        },
        take: 10,
      }),

      // Pending shift registrations
      this.prisma.shiftRegistration.count({
        where: {
          employeeId: userId,
          status: RegistrationStatus.PENDING,
        },
      }),

      // This month's attendance data
      this.prisma.attendance.findMany({
        where: {
          employeeId: userId,
          shift: {
            date: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        },
        include: {
          shift: {
            select: {
              date: true,
              shiftType: true,
            },
          },
        },
      }),

      // Approved leaves this year
      this.prisma.leaveRequest.findMany({
        where: {
          employeeId: userId,
          status: LeaveStatus.APPROVED,
          startDate: {
            gte: new Date(now.getFullYear(), 0, 1),
          },
        },
        select: {
          startDate: true,
          endDate: true,
        },
      }),

      // Recent activities (registrations and leave requests)
      Promise.all([
        this.prisma.shiftRegistration.findMany({
          where: {
            employeeId: userId,
          },
          include: {
            opening: {
              select: {
                date: true,
                shiftType: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 5,
        }),
        this.prisma.leaveRequest.findMany({
          where: {
            employeeId: userId,
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 5,
        }),
      ]),
    ]);

    // Calculate attendance stats
    const totalWorkingDays = monthAttendance.length;
    const presentDays = monthAttendance.filter(
      (a) => a.status === AttendanceStatus.PRESENT,
    ).length;
    const lateDays = monthAttendance.filter(
      (a) => a.status === AttendanceStatus.LATE,
    ).length;
    const absentDays = monthAttendance.filter(
      (a) => a.status === AttendanceStatus.ABSENT,
    ).length;
    const attendanceRate =
      totalWorkingDays > 0
        ? Math.round(((presentDays + lateDays) / totalWorkingDays) * 100)
        : 0;

    // Calculate on-time rate
    const onTimeRate =
      totalWorkingDays > 0
        ? Math.round((presentDays / totalWorkingDays) * 100)
        : 0;

    // Check if can check in today
    let canCheckIn = false;
    let checkInWindow: { start: Date; end: Date } | null = null;
    if (todayShift && !todayShift.attendance) {
      const shiftStart = this.parseTime(todayShift.startTime);
      const windowStart = new Date(shiftStart.getTime() - 30 * 60 * 1000);
      const windowEnd = new Date(shiftStart.getTime() + 60 * 60 * 1000);
      const currentTime = new Date();

      canCheckIn = currentTime >= windowStart && currentTime <= windowEnd;
      checkInWindow = {
        start: windowStart,
        end: windowEnd,
      };
    }

    // Merge and sort recent activities
    const [registrations, leaves] = recentActivities;
    const activities = [
      ...registrations.map((r) => ({
        type: 'registration',
        date: r.updatedAt,
        status: r.status,
        details: {
          shiftDate: r.opening.date,
          shiftType: r.opening.shiftType,
        },
      })),
      ...leaves.map((l) => ({
        type: 'leave',
        date: l.updatedAt,
        status: l.status,
        details: {
          startDate: l.startDate,
          endDate: l.endDate,
          leaveType: l.leaveType,
        },
      })),
    ]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);

    // Calculate leave balance
    // Standard: 12 days/year for full-time, prorated for part-time
    const annualLeaveEntitlement = user?.employmentType === 'FULL_TIME' ? 12 : 8;
    const usedLeaveDays = approvedLeaves.reduce((total, leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return total + days;
    }, 0);

    return {
      user: {
        fullName: user?.fullName,
        email: user?.email,
        employmentType: user?.employmentType,
      },
      todayShift: todayShift
        ? {
            id: todayShift.id,
            date: todayShift.date,
            shiftType: todayShift.shiftType,
            startTime: todayShift.startTime,
            endTime: todayShift.endTime,
            attendance: todayShift.attendance,
            canCheckIn,
            checkInWindow,
          }
        : null,
      stats: {
        shiftsThisWeek: weekShifts,
        pendingRegistrations,
        leaveBalance: {
          total: annualLeaveEntitlement,
          used: usedLeaveDays,
          remaining: annualLeaveEntitlement - usedLeaveDays,
        },
        attendanceRate,
        onTimeRate,
        thisMonth: {
          totalWorkingDays,
          presentDays,
          lateDays,
          absentDays,
        },
      },
      upcomingShifts: upcomingShifts.map((shift) => ({
        id: shift.id,
        date: shift.date,
        shiftType: shift.shiftType,
        startTime: shift.startTime,
        endTime: shift.endTime,
        hasAttendance: !!shift.attendance,
      })),
      recentActivities: activities,
    };
  }

  private parseTime(timeString: string | Date): Date {
    if (timeString instanceof Date) {
      return timeString;
    }
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
}
