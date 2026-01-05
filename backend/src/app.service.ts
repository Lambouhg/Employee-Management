import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getHello(): string {
    return 'Employee Management Backend API - NestJS';
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.configService.get('NODE_ENV', 'development'),
    };
  }

  getInfo() {
    return {
      name: 'Employee Management Backend',
      version: '1.0.0',
      description: 'Backend API for Employee Management System',
      environment: this.configService.get('NODE_ENV', 'development'),
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    };
  }

  testCICD() {
    return {
      message: '✅ CI/CD Test Successful!',
      status: 'deployed',
      timestamp: new Date().toISOString(),
      deployment: {
        environment: this.configService.get('NODE_ENV', 'development'),
        port: this.configService.get('PORT', 3000),
        frontendUrl: this.configService.get('FRONTEND_URL', 'not configured'),
      },
      server: {
        platform: process.platform,
        nodeVersion: process.version,
        uptime: `${Math.floor(process.uptime())} seconds`,
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
        },
      },
    };
  }
}
