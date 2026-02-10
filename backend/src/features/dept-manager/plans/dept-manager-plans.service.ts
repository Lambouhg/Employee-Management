import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class DeptManagerPlansService {
    constructor(private readonly prisma: PrismaService) { }

    async createWeeklyPlan(currentUser: any, dto: any) {
        const { weekStartDate, shiftOpenings } = dto;

        const department = await this.prisma.department.findUnique({
            where: { managerId: currentUser.id },
            select: { id: true }
        });

        if (!department) throw new NotFoundException('Department not found');

        const startDate = new Date(weekStartDate);
        startDate.setUTCHours(0, 0, 0, 0);

        // Pre-fetch templates if needed to fill missing info
        const templateIds = shiftOpenings
            ?.filter((s: any) => s.templateId)
            .map((s: any) => s.templateId) || [];

        let templates: any[] = [];
        if (templateIds.length > 0) {
            templates = await this.prisma.shiftTemplate.findMany({
                where: { id: { in: templateIds } }
            });
        }

        return this.prisma.$transaction(async (tx) => {
            const plan = await tx.deptWeeklyPlan.upsert({
                where: {
                    departmentId_weekStartDate: {
                        departmentId: department.id,
                        weekStartDate: startDate,
                    }
                },
                update: { createdByUserId: currentUser.id }, // Keep status as is if exists, or simple update
                create: {
                    departmentId: department.id,
                    weekStartDate: startDate,
                    createdByUserId: currentUser.id,
                    status: 'DRAFT',
                }
            });

            // If status was PUBLISHED, we might need logic to unpublish or handle updates, 
            // but for createWeeklyPlan (usually draft), we just overwrite openings.

            if (shiftOpenings && shiftOpenings.length > 0) {
                // Remove all existing openings to replace with new set
                await tx.shiftOpening.deleteMany({ where: { planId: plan.id } });

                const openingsData = shiftOpenings.map((s: any) => {
                    const template = s.templateId ? templates.find(t => t.id === s.templateId) : null;

                    // Determine time and type
                    const shiftType = s.shiftType || template?.shiftType;
       const date = new Date(s.date);

                    let startTime: Date;
                    let endTime: Date;

                    if (s.startTime && s.endTime) {
                        startTime = new Date(s.startTime);
                        endTime = new Date(s.endTime);
                    } else if (template) {
                        // Combine opening date with template time
                        startTime = new Date(date);
                        const tStart = new Date(template.startTime);
                        startTime.setHours(tStart.getHours(), tStart.getMinutes(), 0, 0);

                        endTime = new Date(date);
                        const tEnd = new Date(template.endTime);
                        endTime.setHours(tEnd.getHours(), tEnd.getMinutes(), 0, 0);

                        // Handle overnight shift? If end < start, add 1 day? 
                        // Simplified: assuming same day for now or handled by frontend sending exact ISO
                    } else {
                        throw new Error('Start/End time required if no template provided');
                    }

                    return {
                        planId: plan.id,
                        templateId: s.templateId,
                        date: date,
                        shiftType: shiftType,
                        startTime: startTime,
                        endTime: endTime,
                        // FT Capacity
                        isFTEnabled: s.isFTEnabled ?? template?.allowFullTime ?? false,
                        ftAutoAssigned: false, // Deprecated
                        // PT Capacity
                        isPTEnabled: s.isPTEnabled ?? template?.allowPartTime ?? true,
                        ptCapacity: s.ptCapacity ?? 0,
                        notes: s.notes || template?.notes,
                    };
                });

                await tx.shiftOpening.createMany({
                    data: openingsData
                });
            }

            return tx.deptWeeklyPlan.findUnique({
                where: { id: plan.id },
                include: { shiftOpenings: true }
            });
        });
    }

    async getWeeklyPlans(currentUser: any) {
        const department = await this.prisma.department.findUnique({
            where: { managerId: currentUser.id },
            select: { id: true }
        });

        if (!department) return [];

        return this.prisma.deptWeeklyPlan.findMany({
            where: { departmentId: department.id },
            include: { shiftOpenings: true },
            orderBy: { weekStartDate: 'desc' }
        });
    }

    async publishPlan(currentUser: any, planId: string) {
        const department = await this.prisma.department.findUnique({
            where: { managerId: currentUser.id },
            select: { id: true }
        });

        if (!department) throw new NotFoundException('Department not found');

        const plan = await this.prisma.deptWeeklyPlan.findUnique({
            where: { id: planId },
            include: { shiftOpenings: true }
        });

        if (!plan || plan.departmentId !== department.id) {
            throw new NotFoundException('Plan not found');
        }

        const updatedPlan = await this.prisma.deptWeeklyPlan.update({
            where: { id: planId },
            data: { status: 'PUBLISHED' }
        });

        // REMOVED: Auto-assign FT shifts
        // Department managers now must manually assign shifts to all employees
        // await this.generateFTShiftsForPlan(plan);

        return updatedPlan;
    }

    async updateOpenings(currentUser: any, planId: string, shiftOpenings: any[]) {
        const department = await this.prisma.department.findUnique({
            where: { managerId: currentUser.id },
            select: { id: true }
        });

        if (!department) throw new NotFoundException('Department not found');

        const plan = await this.prisma.deptWeeklyPlan.findUnique({
            where: { id: planId },
            include: { shiftOpenings: true }
        });

        if (!plan || plan.departmentId !== department.id) {
            throw new NotFoundException('Plan not found');
        }

        // Fetch templates involved
        const templateIds = shiftOpenings
            .filter(s => s.templateId)
            .map(s => s.templateId);

        let templates: any[] = [];
        if (templateIds.length > 0) {
            templates = await this.prisma.shiftTemplate.findMany({
                where: { id: { in: templateIds } }
            });
        }

        return this.prisma.$transaction(async (tx) => {
            // Delete removed openings
            await tx.shiftOpening.deleteMany({
                where: {
                    planId: plan.id,
                    NOT: {
                        id: { in: shiftOpenings.filter(o => o.id).map(o => o.id) }
                    }
                }
            });

            for (const s of shiftOpenings) {
                const template = s.templateId ? templates.find(t => t.id === s.templateId) : null;

                // Common logic to prepare data
                const prepareData = (input: any, tmpl: any) => {
                    const date = new Date(input.date);
                    let startTime: Date;
                    let endTime: Date;

                    if (input.startTime && input.endTime) {
                        startTime = new Date(input.startTime);
                        endTime = new Date(input.endTime);
                    } else if (tmpl) {
                        startTime = new Date(date);
                        const tStart = new Date(tmpl.startTime);
                        startTime.setHours(tStart.getHours(), tStart.getMinutes(), 0, 0);

                        endTime = new Date(date);
                        const tEnd = new Date(tmpl.endTime);
                        endTime.setHours(tEnd.getHours(), tEnd.getMinutes(), 0, 0);
                    } else {
                        // Fallback or keep existing if update? 
                        // For update, we might rely on existing DB value if not provided, but here we rebuild.
                        // Simplest: require start/end if not template.
                        startTime = new Date(input.startTime); // Might fail if null
                        endTime = new Date(input.endTime);
                    }

                    return {
                        templateId: input.templateId,
                        date: date,
                        shiftType: input.shiftType || tmpl?.shiftType,
                        startTime: startTime,
                        endTime: endTime,
                        isFTEnabled: input.isFTEnabled ?? tmpl?.allowFullTime ?? false,
                        ftAutoAssigned: false, // Deprecated
                        isPTEnabled: input.isPTEnabled ?? tmpl?.allowPartTime ?? true,
                        ptCapacity: input.ptCapacity ?? 0,
                        notes: input.notes || tmpl?.notes,
                    };
                };

                const data = prepareData(s, template);

                if (s.id) {
                    await tx.shiftOpening.update({
                        where: { id: s.id },
                        data: {
                            ...data,
                            // Ensure planId is not updated (redundant but safe)
                        }
                    });
                } else {
                    await tx.shiftOpening.create({
                        data: {
                            planId: plan.id,
                            ...data
                        }
                    });
                }
            }

            return tx.deptWeeklyPlan.findUnique({
                where: { id: plan.id },
                include: { shiftOpenings: true }
            });
        });
    }

    async lockPlan(currentUser: any, planId: string) {
        const department = await this.prisma.department.findUnique({
            where: { managerId: currentUser.id },
            select: { id: true }
        });

        if (!department) throw new NotFoundException('Department not found');

        const plan = await this.prisma.deptWeeklyPlan.findUnique({
            where: { id: planId }
        });

        if (!plan || plan.departmentId !== department.id) {
            throw new NotFoundException('Plan not found');
        }

        return this.prisma.$transaction(async (tx) => {
            // 1. Lock the Plan
            const updatedPlan = await tx.deptWeeklyPlan.update({
                where: { id: planId },
                data: { status: 'LOCKED' }
            });

            // 2. Lock all associated WorkSchedules for this week and department
            await tx.workSchedule.updateMany({
                where: {
                    weekStartDate: plan.weekStartDate,
                    employee: { departmentId: department.id },
                    status: 'APPROVED'
                },
                data: {
                    status: 'LOCKED' as any,
                    lockedAt: new Date()
                }
            });

            return updatedPlan;
        });
    }

    private getDatesInWeek(startDate: Date): Date[] {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            return d;
        });
    }

    private getDayOfWeekName(date: Date): string {
        return ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][date.getDay()];
    }

    private setTime(date: Date, hours: number, minutes: number): Date {
        const d = new Date(date);
        d.setHours(hours, minutes, 0, 0);
        return d;
    }
}
