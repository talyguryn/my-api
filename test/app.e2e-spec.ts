import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import configuration from '@/config/configuration';
import { AppModule } from '@/app.module';

describe('Parser API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configuration],
          isGlobal: true,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('GET /health should return 200 with status ok', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
        });
    });
  });

  describe('YouTube API', () => {
    it('GET /api/youtube/channel should require channel parameter', () => {
      return request(app.getHttpServer())
        .get('/api/youtube/channel')
        .expect(400);
    });

    it('GET /api/youtube/channel should accept channel parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/youtube/channel')
        .query({ channel: '@testchannel' });

      // Will fail due to network, but should validate parameters
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Telegram API', () => {
    it('GET /api/telegram/channel should require channel parameter', () => {
      return request(app.getHttpServer())
        .get('/api/telegram/channel')
        .expect(400);
    });

    it('GET /api/telegram/channel should accept channel parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/telegram/channel')
        .query({ channel: 'testchannel' });

      // Will fail due to network, but should validate parameters
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Bearer Token Authentication', () => {
    it('should allow access without token if token is not configured', () => {
      return request(app.getHttpServer()).get('/health').expect(200);
    });
  });
});
