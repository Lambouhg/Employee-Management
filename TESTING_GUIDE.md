# 📖 Hướng Dẫn Quy Trình & Test Data Setup

## 🔄 Quy Trình Hoàn Chỉnh

### **PHASE 1: Setup Database & Seed Data**

```bash
# 1. Chạy migrations
cd backend
npm run prisma:migrate

# 2. Seed database với data mẫu
npm run seed
```

**Seed tạo:**
- ✅ 3 Roles: MANAGER, DEPT_MANAGER, STAFF
- ✅ 3 Departments: Sales, Tech, HR
- ✅ Users:
  - `manager@company.com` (HR Manager)
  - `sales.manager@company.com` (Sales Dept Manager)
  - `tech.manager@company.com` (Tech Dept Manager)
  - `staff@company.com` (Tech Staff)
  - 3 Part-time staff
  - 3 Full-time staff
- ✅ Shift Templates (Morning, Afternoon, Evening)

**Mật khẩu mặc định: `123456`**

---

### **PHASE 2: Dept Manager - Tạo Weekly Plan & Assign Shifts**

#### **Bước 1: Đăng nhập Dept Manager**
```
Email: sales.manager@company.com
Password: 123456
```

#### **Bước 2: Tạo Weekly Plan**
1. Vào **Weekly Plans** → Click **Create New Plan**
2. Chọn tuần (ví dụ: 10/02/2026 - 16/02/2026)
3. Thêm Shift Openings:
   - **Ngày 10/02**: Ca Sáng (Morning 8-17h)
     - FT Capacity: 2
     - PT Capacity: 1
   - **Ngày 11/02**: Ca Chiều (Afternoon 13-22h)
     - FT Capacity: 2
     - PT Capacity: 1
   - **Ngày 12/02**: Ca Sáng
     - FT Capacity: 2
4. Save plan

#### **Bước 3: Assign Shifts cho Nhân Viên**
1. Vào **Assign Shifts** → Chọn plan vừa tạo
2. Assign từng ca:
   - **10/02 - Ca Sáng**: Assign cho `ft.sales1@company.com`
   - **11/02 - Ca Chiều**: Assign cho `ft.sales1@company.com`
   - **12/02 - Ca Sáng**: Assign cho `ft.sales1@company.com`

**⚠️ Lưu ý:** Khi assign, hệ thống sẽ:
- ✅ Check fixedDayOff (không assign vào ngày nghỉ cố định)
- ✅ Check max 6 shifts/tuần cho FT, 5 shifts cho PT
- ✅ Check **nghỉ phép đã duyệt** (APPROVED leave) → Block
- ⚠️ Warning nếu có PENDING leave

---

### **PHASE 3: Staff - Tạo Yêu Cầu Nghỉ Phép**

#### **Bước 1: Đăng nhập Staff**
```
Email: ft.sales1@company.com
Password: 123456
```

#### **Bước 2: Thử tạo nghỉ phép (Sẽ bị block vì có shifts)**
1. Vào **Leave Requests** → **Create New**
2. Điền form:
   - Loại phép: Sick (Nghỉ ốm)
   - Từ ngày: 10/02/2026
   - Đến ngày: 12/02/2026
   - Lý do: "Ốm cần nghỉ dưỡng"
3. Click **Submit**

**❌ Kết quả:** Bị block với message:
```
"Bạn đã được phân công 3 ca làm việc trong khoảng thời gian này (10/02/2026, 11/02/2026, 12/02/2026).
Vui lòng liên hệ trưởng phòng để điều chỉnh lịch trước khi xin nghỉ phép."
```

#### **Bước 3: Tạo nghỉ phép cho khoảng không có shift**
1. Thử lại với ngày 15/02 - 16/02 (không có shift)
2. Điền form:
   - Loại phép: Personal
   - Từ ngày: 15/02/2026
   - Đến ngày: 16/02/2026
   - Lý do: "Có việc cá nhân"
3. Submit

**✅ Kết quả:** Tạo thành công, status = PENDING

**🔍 Validation thực hiện:**
- ✅ Check shifts conflict → Không có shift trong 15-16/02
- ✅ Check số dư phép → FT có 12 ngày/năm, request 2 ngày
- ✅ Check overlap với leave khác

---

### **PHASE 4: Dept Manager - Xem & Xử Lý Leave Request**

#### **Bước 1: Đăng nhập lại Dept Manager**
```
Email: sales.manager@company.com
Password: 123456
```

#### **Bước 2: Xem danh sách nghỉ phép**
1. Vào **Leave Requests**
2. Thấy statistics:
   - Pending: 1
   - Approved: 0
   - Rejected: 0
3. Thấy yêu cầu của `ft.sales1@company.com` trong danh sách

#### **Bước 3: Xem chi tiết**
1. Click vào yêu cầu nghỉ phép
2. Xem thông tin:
   - Nhân viên: ft.sales1@company.com
   - Loại phép: Personal
   - Từ 15/02 → 16/02 (2 ngày)
   - Lý do: "Có việc cá nhân"
   - **Conflicting Shifts**: Không có (vì 15-16/02 không assign shift)

#### **Bước 4: Approve Leave Request**
1. Click **Approve**
2. Confirm
3. ✅ Status → APPROVED

**📝 Activity Logs:**
- Ghi lại: User X approved leave request Y
- Không có shifts bị xóa (vì không conflict)

---

### **PHASE 5: Test Conflict Scenario (Quan Trọng)**

#### **Scenario: Staff có shift nhưng xin nghỉ**

**Setup:**
1. Dept Manager assign thêm shifts cho staff:
   - **20/02 - Ca Sáng**: ft.sales1@company.com
   - **21/02 - Ca Chiều**: ft.sales1@company.com

**Action:**
1. Staff login
2. Tạo nghỉ phép 20/02 - 21/02
3. ❌ Bị block: "Đã có 2 ca làm việc..."

**Workaround Test (Manual):**
Vì UI staff bị block, test flow approval conflict qua database:

```sql
-- Insert nghỉ phép trực tiếp (bypass validation để test)
INSERT INTO leave_requests (id, employee_id, leave_type, start_date, end_date, reason, status, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'ft.sales1@company.com'),
  'SICK',
  '2026-02-20',
  '2026-02-21',
  'Test conflict scenario',
  'PENDING',
  NOW(),
  NOW()
);
```

**Dept Manager Review:**
1. Login dept manager
2. Vào Leave Requests → Thấy yêu cầu mới
3. Click chi tiết

**⚠️ Hiển thị Conflict Warning:**
```
⚠️ Cảnh báo: Có ca làm việc bị conflict!
Nhân viên này đã được phân công 2 ca làm việc trong khoảng thời gian nghỉ phép.
Các ca này sẽ TỰ ĐỘNG BỊ XÓA nếu bạn duyệt yêu cầu này.

Danh sách shifts:
- 20/02/2026 - Ca Sáng
- 21/02/2026 - Ca Chiều
```

**Approve:**
1. Click **Approve**
2. Confirm popup: "3 shifts sẽ bị xóa..."
3. ✅ Approved

**🔥 Tự động xử lý:**
- ✅ Delete 2 shifts (20/02, 21/02)
- ✅ Update leave status → APPROVED
- ✅ Activity log: "AUTO_DELETE_SHIFTS_ON_LEAVE_APPROVAL"

---

## 🎯 Test Checklist

### **✅ Staff Leave Creation**
- [ ] Block khi có shifts conflict (10-12/02)
- [ ] Success khi không có shifts (15-16/02)
- [ ] Check số dư phép
- [ ] Block khi không đủ phép

### **✅ Dept Manager Review**
- [ ] Xem danh sách với filter (PENDING/APPROVED/REJECTED)
- [ ] Xem statistics
- [ ] Xem chi tiết với conflicting shifts
- [ ] Approve → shifts bị xóa
- [ ] Reject với lý do

### **✅ Shift Assignment Validation**
- [ ] Block assign khi có APPROVED leave
- [ ] Warning log khi có PENDING leave
- [ ] Check fixedDayOff
- [ ] Check max shifts/week

---

## 🚀 Quick Start Commands

```bash
# Backend
cd backend
npm install
npm run prisma:migrate
npm run seed
npm start

# Frontend (terminal mới)
cd frontend
npm install
npm start
```

**URLs:**
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api

---

## 📱 Test Accounts

| Email | Password | Role | Department |
|-------|----------|------|------------|
| manager@company.com | 123456 | Manager | HR |
| sales.manager@company.com | 123456 | Dept Manager | Sales |
| tech.manager@company.com | 123456 | Dept Manager | Tech |
| ft.sales1@company.com | 123456 | Staff (FT) | Sales |
| pt.sales1@company.com | 123456 | Staff (PT) | Sales |
| staff@company.com | 123456 | Staff (FT) | Tech |

---

## 📊 API Endpoints để Test

### **Staff Leaves**
```bash
# Get leave balance
GET /staff/leaves/balance
Authorization: Bearer <staff_token>

# Create leave request
POST /staff/leaves
{
  "leaveType": "SICK",
  "startDate": "2026-02-15",
  "endDate": "2026-02-16",
  "reason": "Test leave"
}

# Get my leave requests
GET /staff/leaves?status=PENDING&page=1&limit=10
```

### **Dept Manager Leaves**
```bash
# Get department leaves
GET /dept-manager/leaves?status=PENDING
Authorization: Bearer <dept_manager_token>

# Get leave detail
GET /dept-manager/leaves/{id}

# Approve leave
PATCH /dept-manager/leaves/{id}/approve
{
  "action": "APPROVE"
}

# Reject leave
PATCH /dept-manager/leaves/{id}/approve
{
  "action": "REJECT",
  "rejectionReason": "Không đủ nhân sự"
}

# Get stats
GET /dept-manager/leaves/stats
```

---

## 🔧 Troubleshooting

### **Không thấy leaves trong dept-manager UI?**
- Check department assignment: Staff phải thuộc department của manager
- Check role: User phải có role DEPT_MANAGER
- Check managerId trong department table

### **Không block khi tạo leave có shift?**
- Check shifts đã được assign chưa (có trong bảng shifts)
- Check schedule status: Phải APPROVED hoặc LOCKED
- Check date range overlap

### **Shifts không bị xóa khi approve?**
- Check conflictingShifts trong response GET /leaves/:id
- Check activity logs trong database
- Check console logs backend

---

## 📝 Next Steps

1. **Test Manual theo checklist** ⬆️
2. **Verify Activity Logs** trong database
3. **Test Edge Cases:**
   - Leave overlap với nhiều shifts
   - Multiple pending leaves
   - Approve leave khi shift đã LOCKED
4. **Frontend Enhancement:**
   - Calendar view tích hợp (Task #8 - Optional)
   - Real-time notifications
