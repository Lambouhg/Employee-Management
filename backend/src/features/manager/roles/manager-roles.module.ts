import { Module } from '@nestjs/common';
import { ManagerRolesController } from './manager-roles.controller';
import { ManagerRolesService } from './manager-roles.service';
import { PrismaService } from '../../../common/database/prisma.service';

@Module({
  controllers: [ManagerRolesController],
  providers: [ManagerRolesService, PrismaService],
})
export class ManagerRolesModule {}
