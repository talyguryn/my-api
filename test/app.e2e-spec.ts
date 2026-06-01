import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import configuration from '@/config/configuration';
import { AppModule } from '@/app.module';
import { YoutubeService } from '@/modules/youtube/youtube.service';
import { TelegramService } from '@/modules/telegram/telegram.service';
import { YoutubeChannelResponseDto } from '@/modules/youtube/youtube.dto';
import { TelegramChannelResponseDto } from '@/modules/telegram/telegram.dto';

describe('Parser API (e2e)', () => {
  let app: INestApplication;
  let youtubeService: YoutubeService;
  let telegramService: TelegramService;

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

    youtubeService = moduleFixture.get<YoutubeService>(YoutubeService);
    telegramService = moduleFixture.get<TelegramService>(TelegramService);

    // Mock the services to avoid real HTTP calls
    const youtubeResponse: YoutubeChannelResponseDto = {
      uri: 'https://youtube.com/@testchannel',
      link: 'https://youtube.com/@testchannel',
      title: 'Test Channel',
      description: 'Test Description',
      image: 'https://example.com/image.jpg',
      updatedAt: new Date().toISOString(),
      subscribers: 1000000,
      subscribersText: '1M',
      videos: 100,
      videosText: '100',
      views: 50000000,
      viewsText: '50M',
      joinedAt: '2020-01-01',
    };

    jest
      .spyOn(youtubeService, 'getChannelInfo')
      .mockResolvedValue(youtubeResponse);

    const telegramResponse: TelegramChannelResponseDto = {
      uri: 'https://t.me/testchannel',
      link: 'https://t.me/testchannel',
      title: 'Test Channel',
      description: 'Test Description',
      image: 'https://example.com/image.jpg',
      updatedAt: new Date().toISOString(),
      subscribers: 500000,
      subscribersText: '500K',
    };

    jest
      .spyOn(telegramService, 'getChannelInfo')
      .mockResolvedValue(telegramResponse);
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

    it('GET /api/youtube/channel should accept channel parameter and return 200', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/youtube/channel')
        .query({ channel: '@testchannel' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('subscribers');
    });
  });

  describe('Telegram API', () => {
    it('GET /api/telegram/channel should require channel parameter', () => {
      return request(app.getHttpServer())
        .get('/api/telegram/channel')
        .expect(400);
    });

    it('GET /api/telegram/channel should accept channel parameter and return 200', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/telegram/channel')
        .query({ channel: 'testchannel' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('subscribers');
    });
  });

  describe('Bearer Token Authentication', () => {
    it('should allow access to public endpoints without token', () => {
      return request(app.getHttpServer()).get('/health').expect(200);
    });

    it('should allow access to parser endpoints without token (public by default)', () => {
      return request(app.getHttpServer())
        .get('/api/youtube/channel')
        .query({ channel: '@google' })
        .expect(200);
    });
  });
});
