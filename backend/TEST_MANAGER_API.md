# 🧪 TEST MANAGER API - JWT & PERMISSIONS

## ✅ CHECKLIST
- [ ] JWT Authentication hoạt động
- [ ] Permissions Guard hoạt động  
- [ ] CRUD operations hoạt động
- [ ] Error handling đúng

---

## 📋 TEST SCENARIOS

### 1. ❌ TEST KHÔNG CÓ TOKEN (Expected: 401 Unauthorized)
```bash
curl http://localhost:3000/manager/employees
# Expected: 401 Unauthorized
```

### 2. ✅ TEST LOGIN LẤY TOKEN
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
  
# Expected: 200 + { accessToken, user }
# Save token để dùng cho các test sau
```

### 3. ✅ TEST GET EMPLOYEES WITH TOKEN (Expected: 200)
```bash
curl http://localhost:3000/manager/employees \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
  
# Expected: 200 + danh sách employees với pagination
```

### 4. ❌ TEST WITH STAFF TOKEN (Expected: 403 Forbidden)
```bash
# Login với staff không có permission manage_all_employees
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff1@example.com","password":"admin123"}'

# Dùng staff token để gọi manager API
curl http://localhost:3000/manager/employees \
  -H "Authorization: Bearer STAFF_TOKEN"
  
# Expected: 403 Forbidden - "Bạn không có quyền truy cập"
```

### 5. ✅ TEST GET ROLES (Expected: 200)
```bash
curl http://localhost:3000/manager/employees/roles \
  -H "Authorization: Bearer ADMIN_TOKEN"
  
# Expected: Danh sách roles
```

### 6. ✅ TEST CREATE EMPLOYEE (Expected: 201)
```bash
curl -X POST http://localhost:3000/manager/employees \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test Employee",
    "phone": "0999999999",
    "roleId": "ROLE_UUID_HERE",
    "employmentType": "FULL_TIME"
  }'
  
# Expected: 201 + thông tin employee mới tạo
```

### 7. ❌ TEST CREATE DUPLICATE EMAIL (Expected: 409)
```bash
# Tạo lại employee với email đã tồn tại
curl -X POST http://localhost:3000/manager/employees \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "fullName": "Test",
    "roleId": "ROLE_UUID",
    "employmentType": "FULL_TIME"
  }'
  
# Expected: 409 Conflict - "Email đã được sử dụng"
```

### 8. ✅ TEST SEARCH & FILTER (Expected: 200)
```bash
# Search by name
curl "http://localhost:3000/manager/employees?search=Admin" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Filter by employmentType
curl "http://localhost:3000/manager/employees?employmentType=FULL_TIME" \
  -H "Authorization: Bearer ADMIN_TOKEN"
  
# Pagination
curl "http://localhost:3000/manager/employees?page=1&limit=5" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 🎯 SWAGGER UI TEST (RECOMMENDED)

1. Mở: http://localhost:3000/api-docs
2. Click **"Authorize"** button
3. Login qua `/auth/login` để lấy token
4. Nhập token vào ô "value": `Bearer YOUR_TOKEN`
5. Click "Authorize" và "Close"
6. Test tất cả endpoints trong section **"Manager - Employee Management"**

---

## ✅ EXPECTED RESULTS

### JWT Authentication ✓
- ❌ Không có token → 401 Unauthorized
- ✅ Có token hợp lệ → 200 OK
- ❌ Token hết hạn → 401 Unauthorized

### Permissions ✓
- ✅ Admin/Manager (có permission) → 200 OK
- ❌ Staff (không có permission) → 403 Forbidden

### CRUD Operations ✓
- ✅ GET /manager/employees → Danh sách + pagination
- ✅ POST /manager/employees → Tạo mới
- ✅ PATCH /manager/employees/:id → Cập nhật
- ✅ GET /manager/employees/:id → Chi tiết

### Error Handling ✓
- ❌ Email trùng → 409 Conflict
- ❌ Không tìm thấy → 404 Not Found
- ❌ Dữ liệu không hợp lệ → 400 Bad Request

---

## 🔍 CẦN CẢI THIỆN

### 1. **Thêm Soft Delete**
```typescript
// Thay vì xóa hẳn, đặt isActive = false
@Delete(':id')
async softDelete(@Param('id') id: string) {
  return this.managerService.update(id, { isActive: false });
}
```

### 2. **Thêm Activity Logs**
✅ Đã có trong service (create/update)
- [ ] Cần thêm logs cho delete, assign manager

### 3. **Thêm Bulk Operations**
```typescript
@Post('bulk-create')
async bulkCreate(@Body() dto: CreateUserDto[]) { ... }

@Patch('bulk-update')
async bulkUpdate(@Body() dto: BulkUpdateDto) { ... }
```

### 4. **Thêm Export Data**
```typescript
@Get('export')
async export(@Query() query: QueryUserDto) {
  // Export to CSV/Excel
}
```

### 5. **Cải thiện Pagination Response**
```typescript
// Thêm links, hasNextPage, hasPrevPage
meta: {
  total: 100,
  page: 1,
  limit: 10,
  totalPages: 10,
  hasNextPage: true,
  hasPrevPage: false
}
```

### 6. **Thêm Rate Limiting**
```typescript
import { ThrottlerModule } from '@nestjs/throttler';

// Giới hạn số request để tránh abuse
@UseGuards(ThrottlerGuard)
```

### 7. **Thêm Input Sanitization**
```typescript
import { Transform } from 'class-transformer';

@Transform(({ value }) => value.trim().toLowerCase())
email: string;
```

### 8. **Cải thiện Error Messages**
Thêm error codes cho FE dễ handle:
```typescript
throw new ConflictException({
  statusCode: 409,
  errorCode: 'EMAIL_ALREADY_EXISTS',
  message: 'Email đã được sử dụng'
});
```
