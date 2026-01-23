import { Module } from '@nestjs/common';
import { ManagerDepartmentsController } from './manager-departments.controller';
import { ManagerDepartmentsService } from './manager-departments.service';
import { PrismaService } from '../../../common/database/prisma.service';

@Module({
  controllers: [ManagerDepartmentsController],
  providers: [ManagerDepartmentsService, PrismaService],
})
export class ManagerDepartmentsModule {}
