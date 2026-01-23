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
   * 3. Remove department from all teams
   * 4. Remove departmentId from the department manager
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

    // 4. Remove department from all teams
    await prisma.team.updateMany({
      where: { departmentId },
      data: { departmentId: null },
    });

    // 5. If department had a manager, remove their departmentId
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
   * IMPORTANT: Only assign managerId to regular employees, NOT to DEPT_MANAGER
   * DEPT_MANAGER should not have a manager relationship
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
      // Check if employee is DEPT_MANAGER
      const employee = await prisma.user.findUnique({
        where: { id: employeeId },
        select: { role: { select: { name: true } } },
      });

      const isDeptManager = employee?.role.name === 'DEPT_MANAGER';

      // Only assign managerId to regular employees, not DEPT_MANAGER
      await prisma.user.update({
        where: { id: employeeId },
        data: {
          departmentId,
          // Only assign managerId if:
          // 1. autoAssignManager is true
          // 2. managerId exists
          // 3. Employee is NOT DEPT_MANAGER
          ...(managerId !== undefined && !isDeptManager && { managerId }),
        },
      });
    }
  }

  /**
   * When removing employees from a department, also remove their manager relationship
   * if the manager is the department manager
   */
  async removeEmployeesFromDepartment(
    departmentId: string,
    employeeIds: string[],
    tx?: any,
  ): Promise<void> {
    const prisma = tx || this.prisma;

    // Get department manager
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { managerId: true },
    });

    // Update each employee
    for (const employeeId of employeeIds) {
      const employee = await prisma.user.findUnique({
        where: { id: employeeId },
        select: { managerId: true },
      });

      const shouldRemoveManager = employee?.managerId === department?.managerId;

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
