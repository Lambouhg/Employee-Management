# Department Management APIs

## 📚 API mới cho quản lý phòng ban

### GET /manager/employees/departments
**Lấy danh sách phòng ban (đa năng)**

**Query Parameters:**
- `includeEmployees`: `'true'` | `'false'` (default: false)

**Use Cases:**

#### 1. Lấy danh sách departments đơn giản (cho dropdown)
```bash
GET /manager/employees/departments
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Kinh doanh",
    "code": "SALES",
    "description": "Phòng kinh doanh",
    "parentId": null,
    "isActive": true,
    "createdAt": "2026-01-15T00:00:00.000Z",
    "manager": {
      "id": "uuid",
      "fullName": "Trần Thị Trưởng Phòng",
      "email": "sales.manager@example.com",
      "phone": "0902234567",
      "role": {
        "id": "uuid",
        "name": "DEPT_MANAGER",
        "displayName": "Trưởng phòng",
        "level": 2
      },
      "employmentType": "FULL_TIME"
    },
    "subDepartments": [
      {
        "id": "uuid",
        "name": "Kinh doanh khu vực 1",
        "code": "SALES_R1"
      }
    ],
    "_count": {
      "employees": 5,
      "subDepartments": 2
    }
  }
]
```

#### 2. Lấy departments với danh sách nhân viên (cho department overview)
```bash
GET /manager/employees/departments?includeEmployees=true
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Kinh doanh",
    "code": "SALES",
    "description": "Phòng kinh doanh",
    "parentId": null,
    "isActive": true,
    "createdAt": "2026-01-15T00:00:00.000Z",
    "manager": {
      "id": "uuid",
      "fullName": "Trần Thị Trưởng Phòng",
      "email": "sales.manager@example.com",
      "phone": "0902234567",
      "role": {
        "id": "uuid",
        "name": "DEPT_MANAGER",
        "displayName": "Trưởng phòng",
        "level": 2
      },
      "employmentType": "FULL_TIME"
    },
    "employees": [
      {
        "id": "uuid",
        "fullName": "Nhân viên A",
        "email": "nvA@company.com",
        "phone": "0903123456",
        "role": {
          "id": "uuid",
          "name": "STAFF",
          "displayName": "Nhân viên",
          "level": 1
        },
        "employmentType": "FULL_TIME",
        "isActive": true,
        "createdAt": "2026-01-10T00:00:00.000Z"
      },
      {
        "id": "uuid",
        "fullName": "Nhân viên B",
        "email": "nvB@company.com",
        "phone": "0903123457",
        "role": {
          "id": "uuid",
          "name": "STAFF",
          "displayName": "Nhân viên",
          "level": 1
        },
        "employmentType": "PART_TIME",
        "isActive": true,
        "createdAt": "2026-01-11T00:00:00.000Z"
      }
    ],
    "subDepartments": [...],
    "_count": {
      "employees": 5,
      "subDepartments": 2
    }
  }
]
```

---

### GET /manager/employees/departments/:id ✨ NEW
**Lấy chi tiết phòng ban (đầy đủ nhân viên + thống kê)**

**URL:** `/manager/employees/departments/{departmentId}`

**Response:**
```json
{
  "id": "uuid",
  "name": "Kinh doanh",
  "code": "SALES",
  "description": "Phòng kinh doanh",
  "parentId": null,
  "isActive": true,
  "createdAt": "2026-01-15T00:00:00.000Z",
  "updatedAt": "2026-01-15T00:00:00.000Z",
  
  "manager": {
    "id": "uuid",
    "fullName": "Trần Thị Trưởng Phòng",
    "email": "sales.manager@example.com",
    "phone": "0902234567",
    "role": {
      "id": "uuid",
      "name": "DEPT_MANAGER",
      "displayName": "Trưởng phòng",
      "level": 2
    },
    "employmentType": "FULL_TIME",
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00.000Z"
  },
  
  "employees": [
    {
      "id": "uuid",
      "fullName": "Nhân viên A",
      "email": "nvA@company.com",
      "phone": "0903123456",
      "role": {
        "id": "uuid",
        "name": "STAFF",
        "displayName": "Nhân viên",
        "level": 1
      },
      "manager": {
        "id": "uuid",
        "fullName": "Trần Thị Trưởng Phòng",
        "email": "sales.manager@example.com"
      },
      "employmentType": "FULL_TIME",
      "fixedDayOff": "SUNDAY",
      "isActive": true,
      "createdAt": "2026-01-10T00:00:00.000Z"
    }
  ],
  
  "subDepartments": [
    {
      "id": "uuid",
      "name": "Kinh doanh khu vực 1",
      "code": "SALES_R1",
      "description": "Khu vực miền Bắc",
      "_count": {
        "employees": 3
      }
    }
  ],
  
  "parent": {
    "id": "uuid",
    "name": "Ban kinh doanh",
    "code": "BUSINESS"
  },
  
  "_count": {
    "employees": 5,
    "subDepartments": 2
  },
  
  "statistics": {
    "totalEmployees": 5,
    "totalSubDepartments": 2,
    "activeEmployees": 5,
    "fullTimeEmployees": 4,
    "partTimeEmployees": 1
  }
}
```

**Errors:**
- 404: Không tìm thấy phòng ban

---

## 🎯 So sánh 2 endpoints

| Feature | GET /departments | GET /departments/:id |
|---------|------------------|---------------------|
| **Purpose** | Danh sách tất cả phòng ban | Chi tiết 1 phòng ban |
| **Employees** | Optional (query param) | Always included |
| **Manager Info** | Basic | Full details |
| **Employee Details** | Basic | Full (có manager, fixedDayOff) |
| **Statistics** | ❌ | ✅ (activeEmployees, fullTime/partTime) |
| **Parent Dept** | ❌ | ✅ |
| **Use Case** | Dropdown, overview | Department detail page |

---

## 📊 Use Cases

### 1. Dropdown chọn phòng ban (khi tạo nhân viên)
```typescript
// GET /manager/employees/departments
const departments = await api.get('/manager/employees/departments');

// Render dropdown
<select>
  {departments.map(dept => (
    <option value={dept.id}>{dept.name} ({dept.code})</option>
  ))}
</select>
```

### 2. Department Overview Card
```typescript
// GET /manager/employees/departments?includeEmployees=true
const departments = await api.get('/manager/employees/departments?includeEmployees=true');

// Hiển thị cards với employee count và list
departments.map(dept => (
  <DepartmentCard 
    name={dept.name}
    manager={dept.manager}
    employeeCount={dept._count.employees}
    employees={dept.employees}
  />
))
```

### 3. Department Detail Page
```typescript
// GET /manager/employees/departments/{id}
const dept = await api.get(`/manager/employees/departments/${deptId}`);

// Hiển thị:
// - Manager info với role badge
// - Employee list table với full info
// - Statistics cards (total, active, fulltime/parttime)
// - Sub-departments list
// - Parent department breadcrumb
```

### 4. Department Statistics Dashboard
```typescript
const dept = await api.get(`/manager/employees/departments/${deptId}`);

// Statistics
console.log(dept.statistics);
// {
//   totalEmployees: 5,
//   activeEmployees: 5,
//   fullTimeEmployees: 4,
//   partTimeEmployees: 1,
//   totalSubDepartments: 2
// }
```

---

## 🔍 Data Structure

### Manager Object (đầy đủ)
```typescript
interface DepartmentManager {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: {
    id: string;
    name: string;        // MANAGER, DEPT_MANAGER
    displayName: string;
    level: number;
  };
  employmentType: 'FULL_TIME' | 'PART_TIME';
  isActive: boolean;
  createdAt: string;
}
```

### Employee Object (trong department)
```typescript
interface DepartmentEmployee {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: {
    id: string;
    name: string;
    displayName: string;
    level: number;
  };
  manager?: {          // Chỉ có trong detail endpoint
    id: string;
    fullName: string;
    email: string;
  };
  employmentType: 'FULL_TIME' | 'PART_TIME';
  fixedDayOff?: 'MONDAY' | 'SUNDAY' | ...;  // Chỉ có trong detail
  isActive: boolean;
  createdAt: string;
}
```

---

## ✅ Benefits

1. **Flexible** - Query param để control data size
2. **Complete** - Đầy đủ thông tin manager, employees, statistics
3. **Hierarchical** - Hiển thị parent/sub departments
4. **Optimized** - Chỉ lấy employees khi cần
5. **Statistics Ready** - Tính sẵn stats cho dashboard
