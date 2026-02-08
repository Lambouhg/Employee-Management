import { Controller, Get, Post, Body, Patch, Param, Delete, Request, Query } from '@nestjs/common';
import { ShiftTemplatesService } from './shift-templates.service';
import { CreateShiftTemplateDto } from './dto/create-shift-template.dto';
import { UpdateShiftTemplateDto } from './dto/update-shift-template.dto';
import { Permissions } from '../../../common/auth-decorators/permissions.decorator';

@Controller('dept-manager/shift-templates')
export class ShiftTemplatesController {
    constructor(private readonly shiftTemplatesService: ShiftTemplatesService) { }

    @Post()
    @Permissions('manage_dept_plans')
    async create(@Request() req: any, @Body() createShiftTemplateDto: CreateShiftTemplateDto) {
        return this.shiftTemplatesService.create(req.user, createShiftTemplateDto);
    }

    @Get()
    @Permissions('view_dept_plans')
    async findAll(@Request() req: any, @Query() query: any) {
        const filters: any = {};

        if (query.isActive !== undefined) {
            filters.isActive = query.isActive === 'true';
        }

        if (query.shiftType) {
            filters.shiftType = query.shiftType;
        }

        return this.shiftTemplatesService.findAll(req.user, filters);
    }

    @Get(':id')
    @Permissions('view_dept_plans')
    async findOne(@Request() req: any, @Param('id') id: string) {
        return this.shiftTemplatesService.findOne(req.user, id);
    }

    @Patch(':id')
    @Permissions('manage_dept_plans')
    async update(
        @Request() req: any,
        @Param('id') id: string,
        @Body() updateShiftTemplateDto: UpdateShiftTemplateDto,
    ) {
        return this.shiftTemplatesService.update(req.user, id, updateShiftTemplateDto);
    }

    @Delete(':id')
    @Permissions('manage_dept_plans')
    async remove(@Request() req: any, @Param('id') id: string) {
        return this.shiftTemplatesService.remove(req.user, id);
    }
}
