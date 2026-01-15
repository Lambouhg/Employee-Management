# Manager APIs - Employee Management

## 📋 Tổng quan

Các API đầy đủ cho Manager để quản lý nhân viên trong hệ thống.

**Base URL:** `http://localhost:3000/manager/employees`

**Authentication:** Bearer Token (JWT)

**Required Permission:** `manage_all_employees`

---

## 📚 API Endpoints

### 1. GET /manager/employees
**Lấy danh sách nhân viên (có phân trang & filter)**

**Query Parameters:**
```typescript
{
  search?: string;           // Tìm kiếm theo tên hoặc email
  employmentType?: 'FULL_TIME' | 'PART_TIME';
  roleId?: string;          // UUID
  managerId?: string;       // UUID
  departmentId?: string;    // UUID
  isActive?: boolean;       // true/false
  page?: number;            // Default: 1
  limit?: number;           // Default: 10
}
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "Nguyễn Văn A",
      "phone": "0123456789",
      "employmentType": "FULL_TIME",
      "isActive": true,
      "role": {
        "id": "uuid",
        "name": "STAFF",
        "displayName": "Nhân viên",
        "level": 1
      },
      "department": {
        "id": "uuid",
        "name": "Kỹ thuật",
        "code": "TECH"
      },
      "manager": {
        "id": "uuid",
        "fullName": "Quản lý X",
        "email": "manager@example.com"
      },
      "subordinates": []
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

---

### 2. GET /manager/employees/:id
**Xem chi tiết nhân viên**

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "Nguyễn Văn A",
  "phone": "0123456789",
  "employmentType": "FULL_TIME",
  "fixedDayOff": "SUNDAY",
  "isActive": true,
  "role": {
    "id": "uuid",
    "name": "STAFF",
    "displayName": "Nhân viên",
    "level": 1
  },
  "department": {
    "id": "uuid",
    "name": "Kỹ thuật",
    "code": "TECH"
  },
  "manager": {
    "id": "uuid",
    "fullName": "Quản lý X",
    "email": "manager@example.com"
  },
  "subordinates": [],
  "permissions": [
    "view_own_profile",
    "create_schedule",
    "view_own_schedule",
    "create_leave_request",
    "check_in_out"
  ]
}
```

---

### 3. POST /manager/employees
**Tạo nhân viên mới**

**Request Body:**
```json
{
  "email": "newuser@company.com",
  "password": "password123",
  "fullName": "Trần Thị B",
  "phone": "0987654321",
  "roleId": "uuid",
  "departmentId": "uuid",
  "employmentType": "FULL_TIME",
  "fixedDayOff": "SUNDAY",
  "managerId": "uuid"
}
```

**Response:** 201 Created
```json
{
  "id": "uuid",
  "email": "newuser@company.com",
  "fullName": "Trần Thị B",
  "phone": "0987654321",
  "employmentType": "FULL_TIME",
  "isActive": true,
  "role": { ... },
  "department": { ... },
  "manager": { ... }
}
```

**Errors:**
- 409: Email đã được sử dụng
- 400: Dữ liệu không hợp lệ

---

### 4. PATCH /manager/employees/:id
**Cập nhật thông tin nhân viên**

**Request Body:** (tất cả optional)
```json
{
  "email": "updated@company.com",
  "password": "newpassword123",
  "fullName": "Tên mới",
  "phone": "0999999999",
  "roleId": "uuid",
  "departmentId": "uuid",
  "employmentType": "PART_TIME",
  "fixedDayOff": "MONDAY",
  "managerId": "uuid",
  "isActive": true
}
```

**Response:** 200 OK

**Errors:**
- 404: Không tìm thấy nhân viên
- 409: Email đã được sử dụng

---

### 5. DELETE /manager/employees/:id
**Xóa nhân viên (soft delete)**

**Description:** Chuyển `isActive = false`, không xóa khỏi database

**Response:** 204 No Content

**Errors:**
- 404: Không tìm thấy nhân viên

---

### 6. PATCH /manager/employees/:id/activate
**Kích hoạt lại nhân viên**

**Response:**
```json
{
  "message": "Kích hoạt nhân viên thành công",
  "user": {
    "id": "uuid",
    "isActive": true
  }
}
```

---

### 7. PATCH /manager/employees/:id/deactivate
**Vô hiệu hóa nhân viên**

**Response:**
```json
{
  "message": "Vô hiệu hóa nhân viên thành công",
  "user": {
    "id": "uuid",
    "isActive": false
  }
}
```

---

### 8. PATCH /manager/employees/:id/transfer-department
**Chuyển nhân viên sang phòng ban khác**

**Request Body:**
```json
{
  "departmentId": "uuid"  // hoặc null để remove khỏi department
}
```

**Response:**
```json
{
  "message": "Chuyển phòng ban thành công",
  "user": {
    "id": "uuid",
    "departmentId": "uuid",
    "departmentName": "Kinh doanh"
  }
}
```

**Errors:**
- 404: Không tìm thấy nhân viên
- 400: Phòng ban không tồn tại

---

### 9. PATCH /manager/employees/:id/assign-manager
**Gán/thay đổi quản lý trực tiếp**

**Request Body:**
```json
{
  "managerId": "uuid"  // hoặc null để remove manager
}
```

**Response:**
```json
{
  "message": "Gán quản lý thành công",
  "user": {
    "id": "uuid",
    "managerId": "uuid",
    "managerName": "Nguyễn Văn Quản Lý"
  }
}
```

**Errors:**
- 404: Không tìm thấy nhân viên
- 400: Quản lý không tồn tại hoặc tự gán mình làm quản lý

---

### 10. PATCH /manager/employees/:id/reset-password
**Reset mật khẩu về mặc định (123456)**

**Response:**
```json
{
  "message": "Reset mật khẩu thành công. Mật khẩu mới: 123456"
}
```

**Errors:**
- 404: Không tìm thấy nhân viên

---

### 11. GET /manager/employees/:id/subordinates
**Lấy danh sách nhân viên dưới quyền**

**Response:**
```json
{
  "manager": {
    "id": "uuid",
    "fullName": "Nguyễn Văn Quản Lý",
    "email": "manager@example.com"
  },
  "subordinates": [
    {
      "id": "uuid",
      "email": "staff1@example.com",
      "fullName": "Nhân viên 1",
      "role": { ... },
      "department": { ... }
    },
    {
      "id": "uuid",
      "email": "staff2@example.com",
      "fullName": "Nhân viên 2",
      "role": { ... },
      "department": { ... }
    }
  ],
  "count": 2
}
```

---

### 12. GET /manager/employees/roles
**Lấy danh sách vai trò**

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "MANAGER",
    "displayName": "Quản lý",
    "description": "Quản lý toàn công ty",
    "level": 3
  },
  {
    "id": "uuid",
    "name": "DEPT_MANAGER",
    "displayName": "Trưởng phòng",
    "description": "Quản lý department",
    "level": 2
  },
  {
    "id": "uuid",
    "name": "STAFF",
    "displayName": "Nhân viên",
    "description": "Nhân viên thường",
    "level": 1
  }
]
```

---

### 13. GET /manager/employees/managers
**Lấy danh sách quản lý (để gán cho nhân viên)**

**Response:**
```json
[
  {
    "id": "uuid",
    "fullName": "Nguyễn Văn Quản Lý",
    "email": "manager@example.com",
    "role": {
      "name": "MANAGER",
      "displayName": "Quản lý",
      "level": 3
    },
    "department": {
      "id": "uuid",
      "name": "Nhân sự",
      "code": "HR"
    }
  }
]
```

---

### 14. GET /manager/employees/departments
**Lấy danh sách phòng ban**

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Kinh doanh",
    "code": "SALES",
    "description": "Phòng kinh doanh",
    "parentId": null,
    "manager": {
      "id": "uuid",
      "fullName": "Trần Thị Trưởng Phòng",
      "email": "sales.manager@example.com"
    },
    "_count": {
      "employees": 5,
      "subDepartments": 2
    }
  }
]
```

---

## 🔒 Authentication

Tất cả endpoints yêu cầu JWT token trong header:

```http
Authorization: Bearer <token>
```

Lấy token từ endpoint `/auth/login`.

---

## ⚡ Activity Logging

Tất cả thao tác quan trọng được log vào bảng `activity_logs`:

- CREATE: Tạo nhân viên mới
- UPDATE: Cập nhật thông tin
- DELETE: Xóa nhân viên
- ACTIVATE: Kích hoạt
- DEACTIVATE: Vô hiệu hóa
- TRANSFER_DEPARTMENT: Chuyển phòng ban
- ASSIGN_MANAGER: Gán quản lý
- RESET_PASSWORD: Reset mật khẩu

---

## 📊 Use Cases

### Case 1: Tạo nhân viên mới vào phòng Kỹ thuật
```bash
POST /manager/employees
{
  "email": "dev@company.com",
  "password": "123456",
  "fullName": "Lập trình viên A",
  "roleId": "<STAFF_ROLE_ID>",
  "departmentId": "<TECH_DEPT_ID>",
  "managerId": "<TECH_MANAGER_ID>",
  "employmentType": "FULL_TIME"
}
```

### Case 2: Thăng chức nhân viên lên Trưởng phòng
```bash
PATCH /manager/employees/<USER_ID>
{
  "roleId": "<DEPT_MANAGER_ROLE_ID>"
}
```

### Case 3: Chuyển nhân viên từ phòng Kỹ thuật sang Kinh doanh
```bash
PATCH /manager/employees/<USER_ID>/transfer-department
{
  "departmentId": "<SALES_DEPT_ID>"
}
```

### Case 4: Reset mật khẩu cho nhân viên quên mật khẩu
```bash
PATCH /manager/employees/<USER_ID>/reset-password
```

### Case 5: Xem danh sách nhân viên dưới quyền của manager
```bash
GET /manager/employees/<MANAGER_ID>/subordinates
```

### Case 6: Tìm kiếm nhân viên theo phòng ban
```bash
GET /manager/employees?departmentId=<DEPT_ID>&page=1&limit=20
```

---

## 🧪 Testing với Swagger

Truy cập: `http://localhost:3000/api-docs`

Tất cả endpoints đều có Swagger documentation đầy đủ.

---

## 🔄 Next Features (TODO)

- [ ] Bulk create employees (Import CSV/Excel)
- [ ] Bulk update (mass operations)
- [ ] Export employee list to CSV/Excel
- [ ] Employee statistics & reports
- [ ] Department hierarchy management
- [ ] Role-based access for dept managers (only manage their dept)
- [ ] Audit trail viewer
- [ ] Email notifications for password reset
