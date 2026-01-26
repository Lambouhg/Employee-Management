import { PrismaClient } from '@prisma/client';

/**
 * Helper service to centralize department relationship management
 * Automatically handles all related data when departments are created, updated, or deleted
 */
export class DepartmentRelationshipsHelper {
  constructor(private prisma: PrismaClient) {}

  /**
   * Clean up all relationships when deleting a department
   * This ensures data integrity and prevents orphaned references
   *
   * Logic:
   * 1. Remove all employees from department (departmentId = null)
   * 2. Remove managerId from employees if their manager is the department manager
   * 3. Remove departmentId from the department manager
   */
  async cleanupOnDelete(departmentId: string, tx?: any): Promise<void> {
    const prisma = tx || this.prisma;

    // 1. Get department info (including managerId)
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { managerId: true },
    });

    if (!department) {
      return; // Department doesn't exist, nothing to clean up
    }

    // 2. Get all employees in this department
    const employees = await prisma.user.findMany({
      where: { departmentId },
      select: { id: true, managerId: true },
    });

    // 3. Update all employees:
    //    - Remove departmentId (they no longer belong to this department)
    //    - Remove managerId ONLY if their manager is the department manager
    //      (because when department is deleted, department manager relationship is invalid)
    for (const employee of employees) {
      const shouldRemoveManager = employee.managerId === department.managerId;

      await prisma.user.update({
        where: { id: employee.id },
        data: {
          departmentId: null,
          ...(shouldRemoveManager && { managerId: null }),
        },
      });
    }

    // 4. If department had a manager, remove their departmentId
    //    (they are no longer managing this department)
    if (department.managerId) {
      await prisma.user.update({
        where: { id: department.managerId },
        data: { departmentId: null },
      });
    }
  }

  /**
   * Update employee manager relationships when department manager changes
   * Automatically assigns department manager as direct manager for regular employees only
   * DEPT_MANAGER should NOT have a manager (they are managers themselves)
   */
  async updateEmployeeManagers(
    departmentId: string,
    managerId: string | null,
    tx?: any,
  ): Promise<void> {
    const prisma = tx || this.prisma;

    // Only update regular employees (not DEPT_MANAGER)
    // DEPT_MANAGER should not have a manager relationship
    await prisma.user.updateMany({
      where: {
        departmentId,
        role: {
          name: {
            not: 'DEPT_MANAGER', // Exclude DEPT_MANAGER
          },
        },
      },
      data: { managerId },
    });
  }

  /**
   * When assigning employees to a department, automatically assign department manager
   * as their direct manager (if autoAssignManager is true)
   *
   * IMPORTANT: 
   * - Only assign managerId to regular employees, NOT to DEPT_MANAGER
   * - A user can only belong to ONE department at a time
   * - When moving to new department, automatically cleanup managerId from old department
   */
  async assignEmployeesToDepartment(
    departmentId: string,
    employeeIds: string[],
    autoAssignManager: boolean = true,
    tx?: any,
  ): Promise<void> {
    const prisma = tx || this.prisma;

    // Get department manager if auto-assign is enabled
    let managerId: string | undefined = undefined;
    if (autoAssignManager) {
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { managerId: true },
      });
      managerId = department?.managerId || undefined;
    }

    // Update each employee
    for (const employeeId of employeeIds) {
      // Get current employee info including old department
      const employee = await prisma.user.findUnique({
        where: { id: employeeId },
        select: { 
          role: { select: { name: true } },
          departmentId: true,
          managerId: true,
        },
      });

      if (!employee) continue;

      const isDeptManager = employee.role.name === 'DEPT_MANAGER';
      const oldDepartmentId = employee.departmentId;

      // Determine new managerId based on different scenarios
      let newManagerId: string | null | undefined = undefined;
      
      // DEPT_MANAGER should never have a manager
      if (isDeptManager) {
        newManagerId = null;
      } 
      // If employee was in another department, cleanup managerId from old department
      else if (oldDepartmentId && oldDepartmentId !== departmentId) {
        // Get old department manager
        const oldDepartment = await prisma.department.findUnique({
          where: { id: oldDepartmentId },
          select: { managerId: true },
        });

        // If employee's manager was the old department manager, clear it
        // Then assign new department manager if auto-assign is enabled
        if (oldDepartment?.managerId === employee.managerId) {
          newManagerId = autoAssignManager && managerId ? managerId : null;
        } else {
          // Employee's manager is not the old department manager
          // Assign new department manager if auto-assign is enabled
          newManagerId = autoAssignManager && managerId ? managerId : employee.managerId;
        }
      }
      // Employee has no old department or is already in this department
      else {
        // Assign new manager if auto-assign is enabled
        if (autoAssignManager && managerId) {
          newManagerId = managerId;
        } else {
          // Keep existing managerId
          newManagerId = employee.managerId;
        }
      }

      // Update employee: set new departmentId and managerId
      await prisma.user.update({
        where: { id: employeeId },
        data: {
          departmentId, // Set new department (replaces old one automatically)
          ...(newManagerId !== undefined && { managerId: newManagerId }),
        },
      });
    }
  }

  /**
   * When removing employees from a department, also remove their manager relationship
   * if the manager is the department manager
   * 
   * IMPORTANT: Cannot remove department manager from their own department
   */
  async removeEmployeesFromDepartment(
    departmentId: string,
    employeeIds: string[],
    tx?: any,
  ): Promise<void> {
    const prisma = tx || this.prisma;

    // Get department info including manager
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { managerId: true },
    });

    if (!department) {
      throw new Error('Department not found');
    }

    // Check if trying to remove department manager
    const managerIdsToRemove = employeeIds.filter(id => id === department.managerId);
    if (managerIdsToRemove.length > 0) {
      throw new Error(
        'Không thể xóa quản lý phòng ban khỏi phòng ban của họ. Vui lòng thay đổi quản lý phòng ban trước.'
      );
    }

    // Update each employee
    for (const employeeId of employeeIds) {
      const employee = await prisma.user.findUnique({
        where: { id: employeeId },
        select: { managerId: true },
      });

      if (!employee) continue;

      const shouldRemoveManager = employee.managerId === department.managerId;

      await prisma.user.update({
        where: { id: employeeId },
        data: {
          departmentId: null,
          ...(shouldRemoveManager && { managerId: null }),
        },
      });
    }
  }
}
