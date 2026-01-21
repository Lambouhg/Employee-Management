import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async getRoles() {
    const roles = await this.prisma.role.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        level: true,
        description: true,
      },
      orderBy: { level: 'asc' },
    });

    return roles;
  }
}


