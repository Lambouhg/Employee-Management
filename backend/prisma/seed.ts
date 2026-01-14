import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const databaseUrl = process.env.DATABASE_URL;
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Xóa dữ liệu cũ (nếu có) - theo thứ tự dependency
  console.log('🗑️  Cleaning old data...');
  
  // Xóa các bảng phụ thuộc trước
  try {
    await prisma.$executeRaw`TRUNCATE TABLE "activity_logs" CASCADE`;
  } catch (e) {
    console.log('ℹ️  activity_logs table not found or already empty');
  }
  
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  // 2. Tạo Permissions
  console.log('📝 Creating permissions...');
  const permissions = await Promise.all([
    // Employee management
    prisma.permission.create({
      data: {
        name: 'manage_all_employees',
        displayName: 'Quản lý toàn bộ nhân viên',
        resource: 'employee',
        action: 'manage_all',
        description: 'Có thể xem và quản lý tất cả nhân viên',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'manage_subordinates',
        displayName: 'Quản lý nhân viên cấp dưới',
        resource: 'employee',
        action: 'manage_subordinates',
        description: 'Chỉ có thể quản lý nhân viên thuộc quyền',
      },
    }),
    // Schedule management
    prisma.permission.create({
      data: {
        name: 'approve_all_schedules',
        displayName: 'Duyệt lịch tất cả nhân viên',
        resource: 'schedule',
        action: 'approve_all',
        description: 'Có thể duyệt lịch của tất cả nhân viên',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'approve_subordinate_schedules',
        displayName: 'Duyệt lịch nhân viên cấp dưới',
        resource: 'schedule',
        action: 'approve_subordinates',
        description: 'Chỉ có thể duyệt lịch nhân viên thuộc quyền',
      },
    }),
    // Attendance management
    prisma.permission.create({
      data: {
        name: 'manage_all_attendance',
        displayName: 'Quản lý chấm công toàn bộ',
        resource: 'attendance',
        action: 'manage_all',
        description: 'Có thể xem và chấm công cho tất cả',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'manage_subordinate_attendance',
        displayName: 'Quản lý chấm công cấp dưới',
        resource: 'attendance',
        action: 'manage_subordinates',
        description: 'Chỉ có thể chấm công cho nhân viên thuộc quyền',
      },
    }),
    // Leave requests
    prisma.permission.create({
      data: {
        name: 'approve_all_leaves',
        displayName: 'Duyệt nghỉ phép toàn bộ',
        resource: 'leave',
        action: 'approve_all',
        description: 'Có thể duyệt yêu cầu nghỉ của tất cả',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'approve_subordinate_leaves',
        displayName: 'Duyệt nghỉ phép cấp dưới',
        resource: 'leave',
        action: 'approve_subordinates',
        description: 'Chỉ có thể duyệt nghỉ của nhân viên thuộc quyền',
      },
    }),
  ]);

  console.log(`✅ Created ${permissions.length} permissions`);

  // 3. Tạo Roles
  console.log('👥 Creating roles...');
  const adminRole = await prisma.role.create({
    data: {
      name: 'ADMIN',
      displayName: 'Quản trị viên',
      description: 'Quyền cao nhất, quản lý toàn bộ hệ thống',
      level: 100,
    },
  });

  const managerRole = await prisma.role.create({
    data: {
      name: 'MANAGER',
      displayName: 'Quản lý',
      description: 'Quản lý tất cả nhân viên và hoạt động',
      level: 3,
    },
  });

  const superStaffRole = await prisma.role.create({
    data: {
      name: 'SUPER_STAFF',
      displayName: 'Trưởng nhóm',
      description: 'Quản lý nhân viên cấp dưới',
      level: 2,
    },
  });

  const staffRole = await prisma.role.create({
    data: {
      name: 'STAFF',
      displayName: 'Nhân viên',
      description: 'Nhân viên thông thường',
      level: 1,
    },
  });

  console.log('✅ Created 4 roles');

  // 4. Gán Permissions cho Roles
  console.log('🔗 Assigning permissions to roles...');
  
  // ADMIN - có tất cả quyền
  await Promise.all(
    permissions.map((perm) =>
      prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      }),
    ),
  );

  // MANAGER - có tất cả quyền quản lý
  const managerPermissions = permissions.filter((p) =>
    p.name.includes('all') || p.name.includes('manage'),
  );
  await Promise.all(
    managerPermissions.map((perm) =>
      prisma.rolePermission.create({
        data: {
          roleId: managerRole.id,
          permissionId: perm.id,
        },
      }),
    ),
  );

  // SUPER_STAFF - chỉ quản lý subordinates
  const superStaffPermissions = permissions.filter((p) =>
    p.name.includes('subordinate'),
  );
  await Promise.all(
    superStaffPermissions.map((perm) =>
      prisma.rolePermission.create({
        data: {
          roleId: superStaffRole.id,
          permissionId: perm.id,
        },
      }),
    ),
  );

  console.log('✅ Assigned permissions to roles');

  // 5. Tạo Users mặc định
  console.log('👤 Creating default users...');
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      fullName: 'Administrator',
      phone: '0123456789',
      employmentType: 'FULL_TIME',
      isActive: true,
      roleId: adminRole.id,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@example.com',
      password: hashedPassword,
      fullName: 'Manager User',
      phone: '0123456788',
      employmentType: 'FULL_TIME',
      isActive: true,
      roleId: managerRole.id,
    },
  });

  const superStaffUser = await prisma.user.create({
    data: {
      email: 'superstaff@example.com',
      password: hashedPassword,
      fullName: 'Super Staff User',
      phone: '0123456786',
      employmentType: 'FULL_TIME',
      isActive: true,
      roleId: superStaffRole.id,
      managerId: managerUser.id, // Thuộc quyền Manager
    },
  });

  const staffUser1 = await prisma.user.create({
    data: {
      email: 'staff1@example.com',
      password: hashedPassword,
      fullName: 'Staff User 1',
      phone: '0123456787',
      employmentType: 'FULL_TIME',
      isActive: true,
      roleId: staffRole.id,
      managerId: superStaffUser.id, // Thuộc quyền Super Staff
    },
  });

  const staffUser2 = await prisma.user.create({
    data: {
      email: 'staff2@example.com',
      password: hashedPassword,
      fullName: 'Staff User 2',
      phone: '0123456785',
      employmentType: 'PART_TIME',
      isActive: true,
      roleId: staffRole.id,
      managerId: superStaffUser.id, // Thuộc quyền Super Staff
    },
  });

  console.log('✅ Created 5 default users');

  // 6. Summary
  console.log('\n🎉 Seed completed successfully!\n');
  console.log('📋 Default accounts:');
  console.log('┌─────────────────────────────────────────────────────┐');
  console.log('│ Admin Account:                                      │');
  console.log('│   Email: admin@example.com                          │');
  console.log('│   Password: admin123                                │');
  console.log('│   Role: Administrator (Full access)                 │');
  console.log('├─────────────────────────────────────────────────────┤');
  console.log('│ Manager Account:                                    │');
  console.log('│   Email: manager@example.com                        │');
  console.log('│   Password: admin123                                │');
  console.log('│   Role: Manager (Quản lý toàn bộ, duyệt lịch)       │');
  console.log('├─────────────────────────────────────────────────────┤');
  console.log('│ Super Staff Account:                                │');
  console.log('│   Email: superstaff@example.com                     │');
  console.log('│   Password: admin123                                │');
  console.log('│   Role: Trưởng nhóm (Quản lý nhóm nhân viên)        │');
  console.log('├─────────────────────────────────────────────────────┤');
  console.log('│ Staff 1 (Full-time):                                │');
  console.log('│   Email: staff1@example.com                         │');
  console.log('│   Password: admin123                                │');
  console.log('│   Manager: Super Staff                              │');
  console.log('├─────────────────────────────────────────────────────┤');
  console.log('│ Staff 2 (Part-time):                                │');
  console.log('│   Email: staff2@example.com                         │');
  console.log('│   Password: admin123                                │');
  console.log('│   Manager: Super Staff                              │');
  console.log('└─────────────────────────────────────────────────────┘');
  console.log('\n💡 Run: npm run start:dev');
  console.log('📚 Swagger: http://localhost:3000/api-docs\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
