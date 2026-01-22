import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
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
  
  const roles = [
    {
      name: 'MANAGER',
      displayName: 'Quản lý',
      description: 'Quản lý cấp cao / Chủ hệ thống - Quản lý toàn bộ nhân sự, phòng ban, team. Có quyền khóa lịch tuần (LOCKED)',
      level: 4,
    },
    {
      name: 'DEPT_MANAGER',
      displayName: 'Trưởng phòng',
      description: 'Quản lý hiệu suất & nguồn lực của phòng ban. Duyệt lịch tuần cấp 2, duyệt nghỉ phép',
      level: 3,
    },
    {
      name: 'TEAM_LEAD',
      displayName: 'Trưởng nhóm',
      description: 'Quản lý vi mô nhân viên trong Team. Duyệt lịch tuần cấp 1, duyệt nghỉ đột xuất',
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
    { name: 'lock_all_schedules', displayName: 'Khóa lịch toàn công ty', resource: 'schedule', action: 'lock_all' },
    { name: 'create_schedule', displayName: 'Tạo lịch làm việc', resource: 'schedule', action: 'create' },
    { name: 'view_own_schedule', displayName: 'Xem lịch cá nhân', resource: 'schedule', action: 'read_own' },
    
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
    { name: 'manage_teams', displayName: 'Quản lý team', resource: 'team', action: 'manage' },
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
  const teamLeadRole = await prisma.role.findUnique({ where: { name: 'TEAM_LEAD' } });
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
          'view_team_members',
          'view_own_profile',
          'approve_dept_schedules_level2',
          'approve_team_schedules_level1',
          'create_schedule',
          'view_own_schedule',
          'approve_dept_leaves',
          'create_leave_request',
          'view_dept_attendance',
          'view_team_attendance',
          'check_in_out',
          'manage_teams',
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

  // TEAM_LEAD permissions
  const teamLeadPermissions = await prisma.permission.findMany({
    where: {
      name: {
        in: [
          'manage_team_members',
          'view_team_members',
          'view_own_profile',
          'approve_team_schedules_level1',
          'create_schedule',
          'view_own_schedule',
          'approve_dept_leaves',
          'create_leave_request',
          'view_team_attendance',
          'check_in_out',
        ],
      },
    },
  });
  for (const permission of teamLeadPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: teamLeadRole!.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: teamLeadRole!.id,
        permissionId: permission.id,
      },
    });
  }
  console.log(`✅ Assigned ${teamLeadPermissions.length} permissions to TEAM_LEAD`);

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

  // Create Team Leads
  const salesTeamLead = await prisma.user.upsert({
    where: { email: 'sales.teamlead@company.com' },
    update: {},
    create: {
      email: 'sales.teamlead@company.com',
      password: hashedPassword,
      fullName: 'Lê Văn Trưởng Nhóm',
      phone: '0905234567',
      roleId: teamLeadRole!.id,
      departmentId: salesDept!.id,
      managerId: salesManagerUser.id,
      employmentType: 'FULL_TIME',
      fixedDayOff: 'SUNDAY',
      isActive: true,
    },
  });
  console.log('✅ Created user: sales.teamlead@company.com (password: 123456)');

  const techTeamLead = await prisma.user.upsert({
    where: { email: 'tech.teamlead@company.com' },
    update: {},
    create: {
      email: 'tech.teamlead@company.com',
      password: hashedPassword,
      fullName: 'Hoàng Thị Trưởng Nhóm',
      phone: '0906234567',
      roleId: teamLeadRole!.id,
      departmentId: techDept!.id,
      managerId: techManagerUser.id,
      employmentType: 'FULL_TIME',
      fixedDayOff: 'SUNDAY',
      isActive: true,
    },
  });
  console.log('✅ Created user: tech.teamlead@company.com (password: 123456)');

  // Create Staff
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
      managerId: techTeamLead.id,
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

  console.log('\n✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
