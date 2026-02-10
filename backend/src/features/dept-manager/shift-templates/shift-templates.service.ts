import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { CreateShiftTemplateDto } from './dto/create-shift-template.dto';
import { UpdateShiftTemplateDto } from './dto/update-shift-template.dto';

@Injectable()
export class ShiftTemplatesService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Create a new shift template
     */
    async create(currentUser: any, dto: CreateShiftTemplateDto) {
        // Get department managed by current user
        const department = await this.getManagedDepartment(currentUser.id);

        // Parse time strings to Date objects
        const startTime = this.parseTime(dto.startTime);
        const endTime = this.parseTime(dto.endTime);

        // Validate time range
        if (startTime >= endTime) {
            throw new BadRequestException('Giờ bắt đầu phải nhỏ hơn giờ kết thúc');
        }

        // Calculate total hours if not provided
        const totalHours = dto.totalHours ?? this.calculateHours(startTime, endTime);

        // Check for duplicate code in department
        const existingCode = await this.prisma.shiftTemplate.findFirst({
            where: {
                departmentId: department.id,
                code: dto.code,
            },
        });

        if (existingCode) {
            throw new ConflictException(`Mã ca "${dto.code}" đã tồn tại trong phòng ban`);
        }

        // Check for overlapping time in department
        const overlapping = await this.prisma.shiftTemplate.findFirst({
            where: {
                departmentId: department.id,
                startTime,
                endTime,
                isActive: true,
            },
        });

        if (overlapping) {
            throw new ConflictException(
                `Ca làm việc từ ${dto.startTime} đến ${dto.endTime} đã tồn tại trong phòng ban`,
            );
        }

        // Create shift template
        return this.prisma.shiftTemplate.create({
            data: {
                name: dto.name,
                code: dto.code,
                departmentId: department.id,
                shiftType: dto.shiftType,
                startTime,
                endTime,
                totalHours,
                isActive: true,
                allowFullTime: dto.allowFullTime ?? true,
                allowPartTime: dto.allowPartTime ?? true,
                description: dto.description,
                notes: dto.notes,
            },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
        });
    }

    /**
     * Get all shift templates for department
     */
    async findAll(currentUser: any, filters?: { isActive?: boolean; shiftType?: string }) {
        const department = await this.getManagedDepartment(currentUser.id);

        const where: any = {
            departmentId: department.id,
        };

        if (filters?.isActive !== undefined) {
            where.isActive = filters.isActive;
        }

        if (filters?.shiftType) {
            where.shiftType = filters.shiftType;
        }

        return this.prisma.shiftTemplate.findMany({
            where,
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                _count: {
                    select: {
                        shiftOpenings: true,
                    },
                },
            },
            orderBy: [{ shiftType: 'asc' }, { startTime: 'asc' }],
        });
    }

    /**
     * Get single shift template
     */
    async findOne(currentUser: any, id: string) {
        const department = await this.getManagedDepartment(currentUser.id);

        const template = await this.prisma.shiftTemplate.findFirst({
            where: {
                id,
                departmentId: department.id,
            },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                _count: {
                    select: {
                        shiftOpenings: true,
                    },
                },
            },
        });

        if (!template) {
            throw new NotFoundException('Không tìm thấy ca làm việc');
        }

        return template;
    }

    /**
     * Update shift template
     */
    async update(currentUser: any, id: string, dto: UpdateShiftTemplateDto) {
        const department = await this.getManagedDepartment(currentUser.id);

        // Check if template exists and belongs to department
        const existing = await this.prisma.shiftTemplate.findFirst({
            where: {
                id,
                departmentId: department.id,
            },
        });

        if (!existing) {
            throw new NotFoundException('Không tìm thấy ca làm việc');
        }

        const updateData: any = {};

        // Update basic fields
        if (dto.name !== undefined) updateData.name = dto.name;
        if (dto.code !== undefined) {
            // Check for duplicate code
            if (dto.code !== existing.code) {
                const duplicateCode = await this.prisma.shiftTemplate.findFirst({
                    where: {
                        departmentId: department.id,
                        code: dto.code,
                        id: { not: id },
                    },
                });

                if (duplicateCode) {
                    throw new ConflictException(`Mã ca "${dto.code}" đã tồn tại`);
                }
            }
            updateData.code = dto.code;
        }

        if (dto.shiftType !== undefined) updateData.shiftType = dto.shiftType;
        if (dto.allowFullTime !== undefined) updateData.allowFullTime = dto.allowFullTime;
        if (dto.allowPartTime !== undefined) updateData.allowPartTime = dto.allowPartTime;
        if (dto.description !== undefined) updateData.description = dto.description;
        if (dto.notes !== undefined) updateData.notes = dto.notes;
        if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

        // Update time if provided
        if (dto.startTime || dto.endTime) {
            const startTime = dto.startTime ? this.parseTime(dto.startTime) : existing.startTime;
            const endTime = dto.endTime ? this.parseTime(dto.endTime) : existing.endTime;

            if (startTime >= endTime) {
                throw new BadRequestException('Giờ bắt đầu phải nhỏ hơn giờ kết thúc');
            }

            updateData.startTime = startTime;
            updateData.endTime = endTime;
            updateData.totalHours = dto.totalHours ?? this.calculateHours(startTime, endTime);

            // Check for overlapping time
            const overlapping = await this.prisma.shiftTemplate.findFirst({
                where: {
                    departmentId: department.id,
                    startTime,
                    endTime,
                    isActive: true,
                    id: { not: id },
                },
            });

            if (overlapping) {
                throw new ConflictException('Ca làm việc với giờ này đã tồn tại');
            }
        } else if (dto.totalHours !== undefined) {
            updateData.totalHours = dto.totalHours;
        }

        return this.prisma.shiftTemplate.update({
            where: { id },
            data: updateData,
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
        });
    }

    /**
     * Delete (soft delete) shift template
     */
    async remove(currentUser: any, id: string) {
        const department = await this.getManagedDepartment(currentUser.id);

        const template = await this.prisma.shiftTemplate.findFirst({
            where: {
                id,
                departmentId: department.id,
            },
            include: {
                _count: {
                    select: {
                        shiftOpenings: true,
                    },
                },
            },
        });

        if (!template) {
            throw new NotFoundException('Không tìm thấy ca làm việc');
        }

        // Check if template is being used
        if (template._count.shiftOpenings > 0) {
            throw new BadRequestException(
                `Ca làm việc đang được sử dụng trong ${template._count.shiftOpenings} lịch tuần. Vui lòng vô hiệu hóa thay vì xóa.`,
            );
        }

        // Soft delete by setting isActive to false
        return this.prisma.shiftTemplate.update({
            where: { id },
            data: { isActive: false },
        });
    }

    /**
     * Helper: Get department managed by user
     */
    private async getManagedDepartment(managerId: string) {
        const department = await this.prisma.department.findUnique({
            where: { managerId },
            select: { id: true, name: true, code: true },
        });

        if (!department) {
            throw new NotFoundException('Bạn không quản lý phòng ban nào');
        }

        return department;
    }

    /**
     * Helper: Parse time string to Date
     */
    private parseTime(timeStr: string): Date {
        const parts = timeStr.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1] || '0', 10);
        const seconds = parseInt(parts[2] || '0', 10);

        const date = new Date();
        date.setHours(hours, minutes, seconds, 0);
        return date;
    }

    /**
     * Helper: Calculate hours between two times
     */
    private calculateHours(startTime: Date, endTime: Date): number {
        const diff = endTime.getTime() - startTime.getTime();
        return Math.round((diff / (1000 * 60 * 60)) * 10) / 10; // Round to 1 decimal
    }
}
