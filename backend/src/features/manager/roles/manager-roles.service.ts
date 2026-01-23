import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class ManagerRolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      orderBy: { level: 'desc' },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        level: true,
      },
    });
  }
}
