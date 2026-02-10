import 'dotenv/config';
import { PrismaClient, ShiftType } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

// Use DATABASE_URL from .env
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // ============================================
  // 0. CLEAR EXISTING DATA
  // ============================================
  console.log('\n🗑️  Clearing existing data...');

  // Xóa các bảng phụ thuộc User trước
  await prisma.activityLog.deleteMany();
  console.log('✅ Cleared activity logs');

  await prisma.attendance.deleteMany();
  console.log('✅ Cleared attendances');

  await prisma.shift.deleteMany();
  console.log('✅ Cleared shifts');

  await prisma.shiftOpening.deleteMany();
  console.log('✅ Cleared shift openings');

  await prisma.shiftTemplate.deleteMany();
  console.log('✅ Cleared shift templates');

  await prisma.deptWeeklyPlan.deleteMany();
  console.log('✅ Cleared dept weekly plans');

  await prisma.workSchedule.deleteMany();
  console.log('✅ Cleared work schedules');

  await prisma.leaveRequest.deleteMany();
  console.log('✅ Cleared leave requests');

  // Xóa RolePermission
  await prisma.rolePermission.deleteMany();
  console.log('✅ Cleared role permissions');

  // Xóa User
  await prisma.user.deleteMany();
  console.log('✅ Cleared users');

  // Xóa Department
  await prisma.department.deleteMany();
  console.log('✅ Cleared departments');

  // Xóa Permission và Role
  await prisma.permission.deleteMany();
  console.log('✅ Cleared permissions');

  await prisma.role.deleteMany();
  console.log('✅ Cleared roles');

  // ============================================
  // 1. SEED ROLES
  // ============================================
  console.log('\n📋 Seeding roles...');

  const roles: any[] = [
    {
      name: 'MANAGER',
      displayName: 'Quản lý',
      description: 'Quản lý cấp cao / Chủ hệ thống - Quản lý toàn bộ nhân sự, phòng ban, team. Có quyền khóa lịch tuần (LOCKED)',
      level: 3,
    },
    {
      name: 'DEPT_MANAGER',
      displayName: 'Trưởng phòng',
      description: 'Quản lý hiệu suất & nguồn lực của phòng ban. Duyệt lịch tuần cấp 2, duyệt nghỉ phép',
      level: 2,
    },
    {
      name: 'STAFF',
      displayName: 'Nhân viên',
      description: 'Nhân viên thường - Đăng ký lịch tuần, check-in/out, gửi yêu cầu nghỉ',
      level: 1,
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
    console.log(`✅ Created role: ${role.name}`);
  }

  // ============================================
  // 2. SEED PERMISSIONS
  // ============================================
  console.log('\n🔐 Seeding permissions...');

  const permissions = [
    // Employee permissions
    { name: 'manage_all_employees', displayName: 'Quản lý toàn bộ nhân viên', resource: 'employee', action: 'manage_all' },
    { name: 'manage_dept_employees', displayName: 'Quản lý nhân viên trong phòng', resource: 'employee', action: 'manage_dept' },
    { name: 'manage_team_members', displayName: 'Quản lý thành viên trong team', resource: 'employee', action: 'manage_team' },
    { name: 'view_all_employees', displayName: 'Xem toàn bộ nhân viên', resource: 'employee', action: 'read_all' },
    { name: 'view_dept_employees', displayName: 'Xem nhân viên trong phòng', resource: 'employee', action: 'read_dept' },
    { name: 'view_team_members', displayName: 'Xem thành viên trong team', resource: 'employee', action: 'read_team' },
    { name: 'view_own_profile', displayName: 'Xem hồ sơ cá nhân', resource: 'employee', action: 'read_own' },

    // Schedule permissions
    { name: 'approve_all_schedules', displayName: 'Duyệt lịch toàn công ty', resource: 'schedule', action: 'approve_all' },
    { name: 'approve_dept_schedules_level2', displayName: 'Duyệt lịch trong phòng (cấp 2)', resource: 'schedule', action: 'approve_dept_level2' },
    { name: 'approve_team_schedules_level1', displayName: 'Duyệt lịch trong team (cấp 1)', resource: 'schedule', action: 'approve_team_level1' },
    { name: 'manage_dept_schedules', displayName: 'Quản lý lịch làm việc phòng ban', resource: 'schedule', action: 'manage_dept' },
    { name: 'lock_all_schedules', displayName: 'Khóa lịch toàn công ty', resource: 'schedule', action: 'lock_all' },
    { name: 'create_schedule', displayName: 'Tạo lịch làm việc', resource: 'schedule', action: 'create' },
    { name: 'view_own_schedule', displayName: 'Xem lịch cá nhân', resource: 'schedule', action: 'read_own' },

    // Plan permissions (Dept Manager)
    { name: 'manage_dept_plans', displayName: 'Quản lý kế hoạch phòng ban', resource: 'plan', action: 'manage_dept' },
    { name: 'view_dept_plans', displayName: 'Xem kế hoạch phòng ban', resource: 'plan', action: 'read_dept' },

    // Leave permissions
    { name: 'approve_all_leaves', displayName: 'Duyệt nghỉ phép toàn công ty', resource: 'leave', action: 'approve_all' },
    { name: 'approve_dept_leaves', displayName: 'Duyệt nghỉ phép trong phòng', resource: 'leave', action: 'approve_dept' },
    { name: 'create_leave_request', displayName: 'Tạo yêu cầu nghỉ phép', resource: 'leave', action: 'create' },

    // Attendance permissions
    { name: 'view_all_attendance', displayName: 'Xem chấm công toàn công ty', resource: 'attendance', action: 'read_all' },
    { name: 'view_dept_attendance', displayName: 'Xem chấm công trong phòng', resource: 'attendance', action: 'read_dept' },
    { name: 'view_team_attendance', displayName: 'Xem chấm công trong team', resource: 'attendance', action: 'read_team' },
    { name: 'check_in_out', displayName: 'Chấm công', resource: 'attendance', action: 'checkin' },

    // Department permissions
    { name: 'manage_departments', displayName: 'Quản lý phòng ban', resource: 'department', action: 'manage' },

    // Team permissions
    // Team-related permissions removed (system no longer uses teams)
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }
  console.log(`✅ Created ${permissions.length} permissions`);

  // ============================================
  // 3. ASSIGN PERMISSIONS TO ROLES
  // ============================================
  console.log('\n🔗 Assigning permissions to roles...');

  // Get roles
  const managerRole = await prisma.role.findUnique({ where: { name: 'MANAGER' } });
  const deptManagerRole = await prisma.role.findUnique({ where: { name: 'DEPT_MANAGER' } });
  const staffRole = await prisma.role.findUnique({ where: { name: 'STAFF' } });

  // MANAGER permissions (all permissions)
  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: managerRole!.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: managerRole!.id,
        permissionId: permission.id,
      },
    });
  }
  console.log(`✅ Assigned ${allPermissions.length} permissions to MANAGER`);

  // DEPT_MANAGER permissions
  const deptManagerPermissions = await prisma.permission.findMany({
    where: {
      name: {
        in: [
          'manage_departments', // Add department management for dept managers
          'manage_dept_employees',
          'view_dept_employees',
          // team views removed
          'view_own_profile',
          'manage_dept_schedules',
          'approve_dept_schedules_level2',
          'manage_dept_plans',
          'view_dept_plans',
          // team-level approvals removed
          'create_schedule',
          'view_own_schedule',
          'approve_dept_leaves',
          'create_leave_request',
          'view_dept_attendance',
          // team attendance removed
          'check_in_out',
        ],
      },
    },
  });
  for (const permission of deptManagerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: deptManagerRole!.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: deptManagerRole!.id,
        permissionId: permission.id,
      },
    });
  }
  console.log(`✅ Assigned ${deptManagerPermissions.length} permissions to DEPT_MANAGER`);

  // No TEAM_LEAD role in this schema

  // STAFF permissions
  const staffPermissions = await prisma.permission.findMany({
    where: {
      name: {
        in: [
          'view_own_profile',
          'create_schedule',
          'view_own_schedule',
          'create_leave_request',
          'check_in_out',
        ],
      },
    },
  });
  for (const permission of staffPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: staffRole!.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: staffRole!.id,
        permissionId: permission.id,
      },
    });
  }
  console.log(`✅ Assigned ${staffPermissions.length} permissions to STAFF`);

  // ============================================
  // 4. SEED DEPARTMENTS
  // ============================================
  console.log('\n🏢 Seeding departments...');

  const departments = [
    { name: 'Kinh doanh', code: 'SALES', description: 'Phòng kinh doanh' },
    { name: 'Kỹ thuật', code: 'TECH', description: 'Phòng kỹ thuật' },
    { name: 'Nhân sự', code: 'HR', description: 'Phòng nhân sự' },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
    console.log(`✅ Created department: ${dept.name}`);
  }

  // ============================================
  // 5. SEED DEMO USERS
  // ============================================
  console.log('\n👥 Seeding demo users...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  // Get departments
  const salesDept = await prisma.department.findUnique({ where: { code: 'SALES' } });
  const techDept = await prisma.department.findUnique({ where: { code: 'TECH' } });
  const hrDept = await prisma.department.findUnique({ where: { code: 'HR' } });

  // Create Manager (HR Manager)
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@company.com' },
    update: {},
    create: {
      email: 'manager@company.com',
      password: hashedPassword,
      fullName: 'Nguyễn Văn Quản Lý',
      phone: '0901234567',
      roleId: managerRole!.id,
      departmentId: hrDept!.id,
      employmentType: 'FULL_TIME',
      fixedDayOff: 'SUNDAY',
      isActive: true,
    },
  });
  console.log('✅ Created user: manager@company.com (password: 123456)');

  // Create Dept Manager (Sales)
  const salesManagerUser = await prisma.user.upsert({
    where: { email: 'sales.manager@company.com' },
    update: {},
    create: {
      email: 'sales.manager@company.com',
      password: hashedPassword,
      fullName: 'Trần Thị Trưởng Phòng',
      phone: '0902234567',
      roleId: deptManagerRole!.id,
      departmentId: salesDept!.id,
      employmentType: 'FULL_TIME',
      fixedDayOff: 'SUNDAY',
      isActive: true,
    },
  });
  console.log('✅ Created user: sales.manager@company.com (password: 123456)');

  // Create Tech Dept Manager
  const techManagerUser = await prisma.user.upsert({
    where: { email: 'tech.manager@company.com' },
    update: {},
    create: {
      email: 'tech.manager@company.com',
      password: hashedPassword,
      fullName: 'Phạm Văn Kỹ Thuật',
      phone: '0904234567',
      roleId: deptManagerRole!.id,
      departmentId: techDept!.id,
      employmentType: 'FULL_TIME',
      fixedDayOff: 'SUNDAY',
      isActive: true,
    },
  });
  console.log('✅ Created user: tech.manager@company.com (password: 123456)');
  // Create Staff (reporting to dept manager)
  await prisma.user.upsert({
    where: { email: 'staff@company.com' },
    update: {},
    create: {
      email: 'staff@company.com',
      password: hashedPassword,
      fullName: 'Lê Văn Nhân Viên',
      phone: '0903234567',
      roleId: staffRole!.id,
      departmentId: techDept!.id,
      managerId: techManagerUser.id,
      employmentType: 'FULL_TIME',
      fixedDayOff: 'SUNDAY',
      isActive: true,
    },
  });
  console.log('✅ Created user: staff@company.com (password: 123456)');

  // ============================================
  // 6. ASSIGN DEPARTMENT MANAGERS
  // ============================================
  console.log('\n👔 Assigning department managers...');

  // Assign HR manager
  await prisma.department.update({
    where: { id: hrDept!.id },
    data: { managerId: managerUser.id },
  });
  console.log('✅ Assigned manager to HR department');

  // Assign Sales manager
  await prisma.department.update({
    where: { id: salesDept!.id },
    data: { managerId: salesManagerUser.id },
  });
  console.log('✅ Assigned manager to Sales department');

  // Assign Tech manager
  await prisma.department.update({
    where: { id: techDept!.id },
    data: { managerId: techManagerUser.id },
  });
  console.log('✅ Assigned manager to Tech department');

  // ============================================
  // 7. SEED SHIFT TEMPLATES
  // ============================================
  console.log('\n⏰ Seeding shift templates...');

  // Helper function to create time
  const createTime = (hours: number, minutes: number = 0) => {
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Shift templates for Sales Department
  const salesShiftTemplates = [
    {
      name: 'Ca sáng bán hàng',
      code: 'MORNING_8_17',
      departmentId: salesDept!.id,
      shiftType: ShiftType.MORNING,
      startTime: createTime(8, 0),
      endTime: createTime(17, 0),
      totalHours: 9.0,
      isActive: true,
      allowFullTime: true,
      allowPartTime: true,
      description: 'Ca làm việc hành chính từ 8h-17h',
    },
    {
      name: 'Ca chiều bán hàng',
      code: 'AFTERNOON_13_22',
      departmentId: salesDept!.id,
      shiftType: ShiftType.AFTERNOON,
      startTime: createTime(13, 0),
      endTime: createTime(22, 0),
      totalHours: 9.0,
      isActive: true,
      allowFullTime: true,
      allowPartTime: true,
      description: 'Ca làm việc chiều tối',
    },
    {
      name: 'Ca tối',
      code: 'EVENING_18_22',
      departmentId: salesDept!.id,
      shiftType: ShiftType.EVENING,
      startTime: createTime(18, 0),
      endTime: createTime(22, 0),
      totalHours: 4.0,
      isActive: true,
      allowFullTime: false,
      allowPartTime: true,
      description: 'Ca tối part-time',
    },
  ];

  // Shift templates for Tech Department
  const techShiftTemplates = [
    {
      name: 'Ca sáng kỹ thuật',
      code: 'MORNING_8_17',
      departmentId: techDept!.id,
      shiftType: ShiftType.MORNING,
      startTime: createTime(8, 0),
      endTime: createTime(17, 0),
      totalHours: 9.0,
      isActive: true,
      allowFullTime: true,
      allowPartTime: true,
      description: 'Ca sáng kỹ thuật',
    },
    {
      name: 'Ca chiều kỹ thuật',
      code: 'AFTERNOON_13_22',
      departmentId: techDept!.id,
      shiftType: ShiftType.AFTERNOON,
      startTime: createTime(13, 0),
      endTime: createTime(22, 0),
      totalHours: 9.0,
      isActive: true,
      allowFullTime: true,
      allowPartTime: true,
      description: 'Ca chiều kỹ thuật',
    },
  ];

  // Shift templates for HR Department
  const hrShiftTemplates = [
    {
      name: 'Ca hành chính',
      code: 'MORNING_8_17',
      departmentId: hrDept!.id,
      shiftType: ShiftType.MORNING,
      startTime: createTime(8, 0),
      endTime: createTime(17, 0),
      totalHours: 9.0,
      isActive: true,
      allowFullTime: true,
      allowPartTime: true,
      description: 'Ca hành chính nhân sự',
    },
  ];

  const allShiftTemplates = [...salesShiftTemplates, ...techShiftTemplates, ...hrShiftTemplates];

  for (const template of allShiftTemplates) {
    await prisma.shiftTemplate.create({
      data: template as any,
    });
  }
  console.log(`✅ Created ${allShiftTemplates.length} shift templates`);

  // ============================================
  // 8. SEED PART-TIME EMPLOYEES
  // ============================================
  console.log('\n👥 Seeding part-time employees...');

  // Part-time staff for Sales
  const ptStaff1 = await prisma.user.create({
    data: {
      email: 'pt.sales1@company.com',
      password: hashedPassword,
      fullName: 'Nguyễn Thị Part-time 1',
      phone: '0905234567',
      roleId: staffRole!.id,
      departmentId: salesDept!.id,
      managerId: salesManagerUser.id,
      employmentType: 'PART_TIME',
      isActive: true,
    },
  });
  console.log('✅ Created PT user: pt.sales1@company.com (password: 123456)');

  const ptStaff2 = await prisma.user.create({
    data: {
      email: 'pt.sales2@company.com',
      password: hashedPassword,
      fullName: 'Trần Văn Part-time 2',
      phone: '0906234567',
      roleId: staffRole!.id,
      departmentId: salesDept!.id,
      managerId: salesManagerUser.id,
      employmentType: 'PART_TIME',
      isActive: true,
    },
  });
  console.log('✅ Created PT user: pt.sales2@company.com (password: 123456)');

  // Part-time staff for Tech
  const ptStaff3 = await prisma.user.create({
    data: {
      email: 'pt.tech1@company.com',
      password: hashedPassword,
      fullName: 'Lê Thị Part-time Tech',
      phone: '0907234567',
      roleId: staffRole!.id,
      departmentId: techDept!.id,
      managerId: techManagerUser.id,
      employmentType: 'PART_TIME',
      isActive: true,
    },
  });
  console.log('✅ Created PT user: pt.tech1@company.com (password: 123456)');

  // ============================================
  // 9. SEED MORE FULL-TIME EMPLOYEES
  // ============================================
  console.log('\n👥 Seeding more full-time employees...');

  // More FT staff for Sales
  await prisma.user.create({
    data: {
      email: 'ft.sales1@company.com',
      password: hashedPassword,
      fullName: 'Phạm Văn Full-time Sales 1',
      phone: '0908234567',
      roleId: staffRole!.id,
      departmentId: salesDept!.id,
      managerId: salesManagerUser.id,
      employmentType: 'FULL_TIME',
      fixedDayOff: 'SUNDAY',
      isActive: true,
    },
  });
  console.log('✅ Created FT user: ft.sales1@company.com (password: 123456)');

  await prisma.user.create({
    data: {
      email: 'ft.sales2@company.com',
      password: hashedPassword,
      fullName: 'Hoàng Thị Full-time Sales 2',
      phone: '0909234567',
      roleId: staffRole!.id,
      departmentId: salesDept!.id,
      managerId: salesManagerUser.id,
      employmentType: 'FULL_TIME',
      fixedDayOff: 'MONDAY',
      isActive: true,
    },
  });
  console.log('✅ Created FT user: ft.sales2@company.com (password: 123456)');

  // More FT staff for Tech
  await prisma.user.create({
    data: {
      email: 'ft.tech1@company.com',
      password: hashedPassword,
      fullName: 'Đỗ Văn Full-time Tech 1',
      phone: '0910234567',
      roleId: staffRole!.id,
      departmentId: techDept!.id,
      managerId: techManagerUser.id,
      employmentType: 'FULL_TIME',
      fixedDayOff: 'SUNDAY',
      isActive: true,
    },
  });
  console.log('✅ Created FT user: ft.tech1@company.com (password: 123456)');

  // ============================================
  // 10. SEED COMPREHENSIVE DATA FOR 3 WEEKS
  // ============================================
  console.log('\n📅 Seeding comprehensive data for 3 weeks...');
  console.log('   - Week 1 (Past): Feb 2-8, 2026 - Complete with attendance');
  console.log('   - Week 2 (Current): Feb 9-15, 2026 - Partial attendance for testing');
  console.log('   - Week 3 (Future): Feb 16-22, 2026 - Schedules ready, no attendance yet');

  // Get all users
  const allUsers = await prisma.user.findMany({
    where: {
      roleId: { not: managerRole!.id }, // Exclude top-level manager
    },
    include: {
      department: true,
    },
  });

  // Get all shift templates by department
  const savedShiftTemplates = await prisma.shiftTemplate.findMany();

  // Helper: Create time with specific hour
  const createDateTime = (dateStr: string, hours: number, minutes: number = 0) => {
    const date = new Date(dateStr);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // ============================================
  // WEEK 1: PAST WEEK (Feb 2-8, 2026) - COMPLETED WITH FULL ATTENDANCE
  // ============================================
  console.log('\n📆 Week 1: Feb 2-8, 2026 (Past - Complete)...');
  
  const week1Start = new Date('2026-02-02');
  const week1Dates = [
    { date: '2026-02-02', day: 'Monday' },
    { date: '2026-02-03', day: 'Tuesday' },
    { date: '2026-02-04', day: 'Wednesday' },
    { date: '2026-02-05', day: 'Thursday' },
    { date: '2026-02-06', day: 'Friday' },
    { date: '2026-02-07', day: 'Saturday' },
  ];

  // Create weekly plans for each department
  const week1Plans: any = {};
  for (const dept of [salesDept, techDept, hrDept]) {
    const plan = await prisma.deptWeeklyPlan.create({
      data: {
        departmentId: dept!.id,
        weekStartDate: week1Start,
        status: 'LOCKED',
      },
    });
    week1Plans[dept!.id] = plan;
    console.log(`✅ Created Week 1 plan for ${dept!.name}`);
  }

  // Create shift openings and schedules for Week 1
  const week1Shifts: any[] = [];
  
  for (const dept of [salesDept, techDept, hrDept]) {
    const deptTemplates = savedShiftTemplates.filter(t => t.departmentId === dept!.id);
    const plan = week1Plans[dept!.id];
    
    // Create openings for each day
    for (const { date } of week1Dates) {
      for (const template of deptTemplates) {
        const opening = await prisma.shiftOpening.create({
          data: {
            planId: plan.id,
            templateId: template.id,
            date: new Date(date),
            shiftType: template.shiftType,
            startTime: template.startTime,
            endTime: template.endTime,
            isFTEnabled: true,
            ftAutoAssigned: true,
            isPTEnabled: template.allowPartTime,
            ptCapacity: 3,
          },
        });

        // Get employees in this department
        const deptEmployees = allUsers.filter(u => u.departmentId === dept!.id);
        
        for (const employee of deptEmployees) {
          // Full-time: exclude fixed day off
          if (employee.employmentType === 'FULL_TIME') {
            const dateObj = new Date(date);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
            if (employee.fixedDayOff === dayName) continue;

            // Create schedule if not exists
            let schedule = await prisma.workSchedule.findUnique({
              where: {
                employeeId_weekStartDate: {
                  employeeId: employee.id,
                  weekStartDate: week1Start,
                },
              },
            });

            if (!schedule) {
              schedule = await prisma.workSchedule.create({
                data: {
                  employeeId: employee.id,
                  weekStartDate: week1Start,
                  status: 'LOCKED',
                  submittedAt: new Date('2026-01-26'),
                  approvedAt: new Date('2026-01-28'),
                  lockedAt: new Date('2026-01-31'),
                },
              });
            }

            // Create shift
            const shift = await prisma.shift.create({
              data: {
                scheduleId: schedule.id,
                employeeId: employee.id,
                openingId: opening.id,
                date: new Date(date),
                shiftType: template.shiftType,
                startTime: template.startTime,
                endTime: template.endTime,
                isAutoGenerated: true,
              },
            });
            week1Shifts.push({ shift, employee, date, template });
          }
          // Part-time: Random 4-5 shifts per week
          else if (employee.employmentType === 'PART_TIME') {
            const shouldWork = Math.random() > 0.3; // 70% chance to work this shift
            if (!shouldWork) continue;

            let schedule = await prisma.workSchedule.findUnique({
              where: {
                employeeId_weekStartDate: {
                  employeeId: employee.id,
                  weekStartDate: week1Start,
                },
              },
            });

            if (!schedule) {
              schedule = await prisma.workSchedule.create({
                data: {
                  employeeId: employee.id,
                  weekStartDate: week1Start,
                  status: 'LOCKED',
                  submittedAt: new Date('2026-01-26'),
                  approvedAt: new Date('2026-01-28'),
                  lockedAt: new Date('2026-01-31'),
                },
              });
            }

            const shift = await prisma.shift.create({
              data: {
                scheduleId: schedule.id,
                employeeId: employee.id,
                openingId: opening.id,
                date: new Date(date),
                shiftType: template.shiftType,
                startTime: template.startTime,
                endTime: template.endTime,
                isAutoGenerated: false,
              },
            });
            week1Shifts.push({ shift, employee, date, template });
          }
        }
      }
    }
  }

  console.log(`✅ Created ${week1Shifts.length} shifts for Week 1`);

  // Create COMPLETE attendance records for Week 1 (all shifts checked in)
  let week1AttendanceCount = 0;
  for (const { shift, employee, date, template } of week1Shifts) {
    // Calculate realistic check-in time: -5 to +20 minutes from start time
    const startHour = template.startTime.getHours();
    const startMinute = template.startTime.getMinutes();
    const minutesOffset = Math.floor(Math.random() * 25) - 5; // -5 to +20
    
    const checkInTime = createDateTime(date, startHour, startMinute + minutesOffset);
    
    // Determine status: LATE if > 15 minutes late, otherwise PRESENT
    const status = minutesOffset > 15 ? 'LATE' : 'PRESENT';
    
    await prisma.attendance.create({
      data: {
        shiftId: shift.id,
        employeeId: employee.id,
        checkInTime,
        status,
        notes: status === 'LATE' ? 'Đi muộn' : undefined,
      },
    });
    week1AttendanceCount++;
  }
  console.log(`✅ Created ${week1AttendanceCount} attendance records for Week 1 (100% complete)`);

  // ============================================
  // WEEK 2: CURRENT WEEK (Feb 9-15, 2026) - PARTIAL ATTENDANCE
  // ============================================
  console.log('\n📆 Week 2: Feb 9-15, 2026 (Current - Partial for testing)...');
  
  const week2Start = new Date('2026-02-09');
  const week2Dates = [
    { date: '2026-02-09', day: 'Monday', past: true },
    { date: '2026-02-10', day: 'Tuesday', past: false }, // Today is Feb 9, so this is future
    { date: '2026-02-11', day: 'Wednesday', past: false },
    { date: '2026-02-12', day: 'Thursday', past: false },
    { date: '2026-02-13', day: 'Friday', past: false },
    { date: '2026-02-14', day: 'Saturday', past: false },
  ];

  // Create weekly plans for each department
  const week2Plans: any = {};
  for (const dept of [salesDept, techDept, hrDept]) {
    const plan = await prisma.deptWeeklyPlan.create({
      data: {
        departmentId: dept!.id,
        weekStartDate: week2Start,
        status: 'PUBLISHED',
      },
    });
    week2Plans[dept!.id] = plan;
  }

  // Create shift openings and schedules for Week 2
  const week2Shifts: any[] = [];
  
  for (const dept of [salesDept, techDept, hrDept]) {
    const deptTemplates = savedShiftTemplates.filter(t => t.departmentId === dept!.id);
    const plan = week2Plans[dept!.id];
    
    for (const { date } of week2Dates) {
      for (const template of deptTemplates) {
        const opening = await prisma.shiftOpening.create({
          data: {
            planId: plan.id,
            templateId: template.id,
            date: new Date(date),
            shiftType: template.shiftType,
            startTime: template.startTime,
            endTime: template.endTime,
            isFTEnabled: true,
            ftAutoAssigned: true,
            isPTEnabled: template.allowPartTime,
            ptCapacity: 3,
          },
        });

        const deptEmployees = allUsers.filter(u => u.departmentId === dept!.id);
        
        for (const employee of deptEmployees) {
          if (employee.employmentType === 'FULL_TIME') {
            const dateObj = new Date(date);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
            if (employee.fixedDayOff === dayName) continue;

            let schedule = await prisma.workSchedule.findUnique({
              where: {
                employeeId_weekStartDate: {
                  employeeId: employee.id,
                  weekStartDate: week2Start,
                },
              },
            });

            if (!schedule) {
              schedule = await prisma.workSchedule.create({
                data: {
                  employeeId: employee.id,
                  weekStartDate: week2Start,
                  status: 'APPROVED',
                  submittedAt: new Date('2026-02-02'),
                  approvedAt: new Date('2026-02-05'),
                },
              });
            }

            const shift = await prisma.shift.create({
              data: {
                scheduleId: schedule.id,
                employeeId: employee.id,
                openingId: opening.id,
                date: new Date(date),
                shiftType: template.shiftType,
                startTime: template.startTime,
                endTime: template.endTime,
                isAutoGenerated: true,
              },
            });
            week2Shifts.push({ shift, employee, date, template, isPast: date === '2026-02-09' });
          }
          else if (employee.employmentType === 'PART_TIME') {
            const shouldWork = Math.random() > 0.3;
            if (!shouldWork) continue;

            let schedule = await prisma.workSchedule.findUnique({
              where: {
                employeeId_weekStartDate: {
                  employeeId: employee.id,
                  weekStartDate: week2Start,
                },
              },
            });

            if (!schedule) {
              schedule = await prisma.workSchedule.create({
                data: {
                  employeeId: employee.id,
                  weekStartDate: week2Start,
                  status: 'APPROVED',
                  submittedAt: new Date('2026-02-02'),
                  approvedAt: new Date('2026-02-05'),
                },
              });
            }

            const shift = await prisma.shift.create({
              data: {
                scheduleId: schedule.id,
                employeeId: employee.id,
                openingId: opening.id,
                date: new Date(date),
                shiftType: template.shiftType,
                startTime: template.startTime,
                endTime: template.endTime,
                isAutoGenerated: false,
              },
            });
            week2Shifts.push({ shift, employee, date, template, isPast: date === '2026-02-09' });
          }
        }
      }
    }
  }

  console.log(`✅ Created ${week2Shifts.length} shifts for Week 2`);

  // Create PARTIAL attendance for Week 2 (only Monday Feb 9 - 80% checked in)
  let week2AttendanceCount = 0;
  for (const { shift, employee, date, template, isPast } of week2Shifts) {
    // Only create attendance for past days (Monday Feb 9)
    if (!isPast) continue;
    
    // 80% attendance rate (some people might not have checked in yet)
    if (Math.random() > 0.8) continue;
    
    const startHour = template.startTime.getHours();
    const startMinute = template.startTime.getMinutes();
    const minutesOffset = Math.floor(Math.random() * 25) - 5;
    
    const checkInTime = createDateTime(date, startHour, startMinute + minutesOffset);
    const status = minutesOffset > 15 ? 'LATE' : 'PRESENT';
    
    await prisma.attendance.create({
      data: {
        shiftId: shift.id,
        employeeId: employee.id,
        checkInTime,
        status,
      },
    });
    week2AttendanceCount++;
  }
  console.log(`✅ Created ${week2AttendanceCount} attendance records for Week 2 (partial - for testing)`);

  // ============================================
  // WEEK 3: FUTURE WEEK (Feb 16-22, 2026) - SCHEDULES ONLY
  // ============================================
  console.log('\n📆 Week 3: Feb 16-22, 2026 (Future - Ready for scheduling)...');
  
  const week3Start = new Date('2026-02-16');
  const week3Dates = [
    { date: '2026-02-16', day: 'Monday' },
    { date: '2026-02-17', day: 'Tuesday' },
    { date: '2026-02-18', day: 'Wednesday' },
    { date: '2026-02-19', day: 'Thursday' },
    { date: '2026-02-20', day: 'Friday' },
    { date: '2026-02-21', day: 'Saturday' },
  ];

  // Create weekly plans
  const week3Plans: any = {};
  for (const dept of [salesDept, techDept, hrDept]) {
    const plan = await prisma.deptWeeklyPlan.create({
      data: {
        departmentId: dept!.id,
        weekStartDate: week3Start,
        status: 'DRAFT',
      },
    });
    week3Plans[dept!.id] = plan;
  }

  // Create shift openings for Week 3
  let week3OpeningCount = 0;
  for (const dept of [salesDept, techDept, hrDept]) {
    const deptTemplates = savedShiftTemplates.filter(t => t.departmentId === dept!.id);
    const plan = week3Plans[dept!.id];
    
    for (const { date } of week3Dates) {
      for (const template of deptTemplates) {
        await prisma.shiftOpening.create({
          data: {
            planId: plan.id,
            templateId: template.id,
            date: new Date(date),
            shiftType: template.shiftType,
            startTime: template.startTime,
            endTime: template.endTime,
            isFTEnabled: true,
            ftAutoAssigned: false, // Will auto-assign when published
            isPTEnabled: template.allowPartTime,
            ptCapacity: 3,
          },
        });
        week3OpeningCount++;
      }
    }
  }
  console.log(`✅ Created ${week3OpeningCount} shift openings for Week 3 (no schedules yet)`);

  // ============================================
  // CREATE DIVERSE LEAVE REQUESTS
  // ============================================
  console.log('\n🏖️ Creating leave requests...');
  
  const ptSales1 = await prisma.user.findUnique({ where: { email: 'pt.sales1@company.com' } });
  const ftTech1 = await prisma.user.findUnique({ where: { email: 'ft.tech1@company.com' } });
  const staffUser = await prisma.user.findUnique({ where: { email: 'staff@company.com' } });

  // Pending leave for next week
  await prisma.leaveRequest.create({
    data: {
      employeeId: ptSales1!.id,
      leaveType: 'PERSONAL',
      startDate: new Date('2026-02-10'),
      endDate: new Date('2026-02-11'),
      reason: 'Cần xử lý việc cá nhân',
      status: 'PENDING',
    },
  });

  // Approved leave for Week 3
  await prisma.leaveRequest.create({
    data: {
      employeeId: ftTech1!.id,
      leaveType: 'SICK',
      startDate: new Date('2026-02-17'),
      endDate: new Date('2026-02-18'),
      reason: 'Bị cảm, cần nghỉ ngơi',
      status: 'APPROVED',
      approvedAt: new Date('2026-02-08'),
    },
  });

  // Rejected leave
  await prisma.leaveRequest.create({
    data: {
      employeeId: staffUser!.id,
      leaveType: 'EMERGENCY',
      startDate: new Date('2026-02-11'),
      endDate: new Date('2026-02-11'),
      reason: 'Khẩn cấp gia đình',
      status: 'REJECTED',
      rejectionReason: 'Không đủ nhân sự trong ngày này',
      approvedAt: new Date('2026-02-08'),
    },
  });

  console.log('✅ Created 3 diverse leave requests');

  console.log('\n✨ Seed completed successfully!');
  console.log('\n📊 COMPREHENSIVE DATA SUMMARY:');
  console.log('═══════════════════════════════════════════════');
  console.log('📅 Week 1 (Past - Feb 2-8): LOCKED with full attendance');
  console.log(`   - ${week1Shifts.length} shifts scheduled`);
  console.log(`   - ${week1AttendanceCount} attendance records (100% complete)`);
  console.log('');
  console.log('📅 Week 2 (Current - Feb 9-15): PUBLISHED with partial attendance');
  console.log(`   - ${week2Shifts.length} shifts scheduled`);
  console.log(`   - ${week2AttendanceCount} attendance records (partial for testing)`);
  console.log('   - Ready for check-in testing');
  console.log('');
  console.log('📅 Week 3 (Future - Feb 16-22): DRAFT for planning');
  console.log(`   - ${week3OpeningCount} shift openings created`);
  console.log('   - No schedules yet (ready for employee registration)');
  console.log('');
  console.log('🏖️ Leave Requests: 3 (Pending, Approved, Rejected)');
  console.log('═══════════════════════════════════════════════');
  console.log('\n👤 TEST ACCOUNTS (password: 123456):');
  console.log('   🔴 manager@company.com - System Manager (HR Dept)');
  console.log('   🟡 sales.manager@company.com - Sales Manager');
  console.log('   🟡 tech.manager@company.com - Tech Manager');
  console.log('   🟢 staff@company.com - FT Staff (Tech Dept)');
  console.log('   🟢 ft.sales1@company.com - FT Staff (Sales Dept)');
  console.log('   🟢 ft.sales2@company.com - FT Staff (Sales Dept)');
  console.log('   🔵 pt.sales1@company.com - PT Staff (Sales Dept)');
  console.log('   🔵 pt.sales2@company.com - PT Staff (Sales Dept)');
  console.log('   🔵 pt.tech1@company.com - PT Staff (Tech Dept)');
  console.log('\n✅ ATTENDANCE CHECK-IN READY:');
  console.log('   - Week 2 shifts can be tested with /staff/attendance/check-in');
  console.log('   - Check-in window: 30 mins before → 60 mins after shift start');
  console.log('   - Status: PRESENT (on time) or LATE (>15 mins)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
