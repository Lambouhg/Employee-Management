import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return the welcome message', () => {
      expect(appController.getHello()).toBe(
        'Employee Management Backend API - NestJS',
      );
    });
  });

  describe('health', () => {
    it('should return health status', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const health = appController.getHealth();
      expect(health).toHaveProperty('status', 'ok');
      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('uptime');
      expect(health).toHaveProperty('environment');
    });
  });

  describe('info', () => {
    it('should return API information', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const info = appController.getInfo();
      expect(info).toHaveProperty('name', 'Employee Management Backend');
      expect(info).toHaveProperty('version');
      expect(info).toHaveProperty('environment');
    });
  });

  describe('test-cicd', () => {
    it('should return CI/CD test information', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const cicdTest = appController.testCICD();
      expect(cicdTest).toHaveProperty('message');
      expect(cicdTest).toHaveProperty('status', 'deployed');
      expect(cicdTest).toHaveProperty('deployment');
      expect(cicdTest).toHaveProperty('server');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(cicdTest.message).toContain('CI/CD Test Successful');
    });
  });
});
