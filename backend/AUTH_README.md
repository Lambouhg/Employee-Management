# Authentication & Authorization - Employee Management System

## 🎯 Chức năng đã hoàn thành

✅ Đăng nhập với JWT  
✅ Phân quyền RBAC (Role-Based Access Control)  
✅ Guards cho authentication & authorization  
✅ Decorators tiện ích  
✅ Feature-Based Architecture  

## 📁 Cấu trúc thư mục

```
src/
├── features/
│   └── auth/
│       ├── decorators/           # Custom decorators
│       │   ├── public.decorator.ts
│       │   ├── permissions.decorator.ts
│       │   └── roles.decorator.ts
│       ├── dto/                  # Data Transfer Objects
│       │   └── login.dto.ts
│       ├── guards/               # Authorization guards
│       │   ├── jwt-auth.guard.ts
│       │   ├── permissions.guard.ts
│       │   └── roles.guard.ts
│       ├── strategies/           # Passport strategies
│       │   └── jwt.strategy.ts
│       ├── auth.controller.ts
│       ├── auth.service.ts
│       └── auth.module.ts
├── common/
│   ├── database/
│   │   ├── prisma.service.ts
│   │   └── database.module.ts
│   └── decorators/
│       └── current-user.decorator.ts
└── config/
    └── configuration.ts
```

## 🔐 API Endpoints

### POST /auth/login
Đăng nhập và nhận JWT token

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "role": {
      "id": "uuid",
      "name": "MANAGER",
      "displayName": "Manager",
      "level": 3
    },
    "employmentType": "FULL_TIME"
  }
}
```

## 🛡️ Sử dụng Guards & Decorators

### 1. Public Route (Không cần authentication)
```typescript
@Public()
@Get('public-data')
getPublicData() {
  return 'This is public';
}
```

### 2. Protected Route (Cần đăng nhập)
```typescript
// Tự động protect bởi global JwtAuthGuard
@Get('protected-data')
getProtectedData(@CurrentUser() user) {
  return `Hello ${user.fullName}`;
}
```

### 3. Kiểm tra Role
```typescript
@RequireRoles('MANAGER', 'SUPER_STAFF')
@UseGuards(RolesGuard)
@Get('managers-only')
getManagersData() {
  return 'Only managers can see this';
}
```

### 4. Kiểm tra Permission
```typescript
@RequirePermissions('approve_all_schedules')
@UseGuards(PermissionsGuard)
@Post('approve-schedule')
approveSchedule() {
  return 'Schedule approved';
}
```

### 5. Lấy thông tin user hiện tại
```typescript
@Get('me')
getProfile(@CurrentUser() user) {
  return user;
}

// Hoặc lấy 1 field cụ thể
@Get('my-email')
getEmail(@CurrentUser('email') email: string) {
  return { email };
}
```

## 🎭 Phân quyền RBAC

### Roles và Permissions

| Role | Level | Permissions | Phạm vi |
|------|-------|-------------|---------|
| **MANAGER** | 3 | 9 permissions | Toàn hệ thống |
| **SUPER_STAFF** | 2 | 6 permissions | Nhóm cấp dưới |
| **STAFF** | 1 | 4 permissions | Cá nhân |

### Manager Permissions:
- ✅ manage_all_employees
- ✅ approve_all_schedules
- ✅ lock_schedules
- ✅ manage_all_attendance
- ✅ approve_all_leaves
- ✅ create_own_schedule
- ✅ checkin_checkout
- ✅ create_leave_request
- ✅ view_own_profile

### Super Staff Permissions:
- ✅ manage_subordinates
- ✅ approve_all_schedules (cho nhóm)
- ✅ create_own_schedule
- ✅ checkin_checkout
- ✅ create_leave_request
- ✅ view_own_profile

### Staff Permissions:
- ✅ create_own_schedule
- ✅ checkin_checkout
- ✅ create_leave_request
- ✅ view_own_profile

## 🧪 Test với cURL hoặc Postman

### 1. Đăng nhập
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@example.com",
    "password": "password123"
  }'
```

### 2. Truy cập protected endpoint
```bash
curl http://localhost:3000/protected-endpoint \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## 📝 Tạo User mẫu để test

Chạy script sau trong Prisma Studio hoặc code:

```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUsers() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Lấy roleId
  const managerRole = await prisma.role.findUnique({ where: { name: 'MANAGER' } });
  const superStaffRole = await prisma.role.findUnique({ where: { name: 'SUPER_STAFF' } });
  const staffRole = await prisma.role.findUnique({ where: { name: 'STAFF' } });

  // Tạo Manager
  await prisma.user.create({
    data: {
      email: 'manager@example.com',
      password: hashedPassword,
      fullName: 'Nguyễn Văn Manager',
      roleId: managerRole.id,
      employmentType: 'FULL_TIME',
    },
  });

  // Tạo Super Staff
  await prisma.user.create({
    data: {
      email: 'superstaff@example.com',
      password: hashedPassword,
      fullName: 'Trần Thị Super Staff',
      roleId: superStaffRole.id,
      employmentType: 'FULL_TIME',
    },
  });

  // Tạo Staff
  await prisma.user.create({
    data: {
      email: 'staff@example.com',
      password: hashedPassword,
      fullName: 'Lê Văn Staff',
      roleId: staffRole.id,
      employmentType: 'PART_TIME',
    },
  });
}
```

## ⚙️ Cấu hình Environment

Tạo file `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/employee_management"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-2026"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:4200"
```

## 🚀 Chạy ứng dụng

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## ✅ Checklist hoàn thành

- [x] Cấu trúc Feature-Based Architecture
- [x] Prisma Service với Prisma 7 adapter
- [x] JWT Authentication
- [x] Login API endpoint
- [x] JWT Strategy & Guards
- [x] RBAC với Role & Permission models
- [x] Permission Guard
- [x] Role Guard
- [x] Custom decorators (@Public, @RequirePermissions, @RequireRoles, @CurrentUser)
- [x] Global validation pipe
- [x] Activity logging
- [x] Seed data cho roles & permissions

## 🔜 Tiếp theo

- [ ] Refresh token
- [ ] Register endpoint
- [ ] Forgot password
- [ ] Change password
- [ ] User management endpoints
- [ ] Schedule management endpoints
- [ ] Attendance endpoints
