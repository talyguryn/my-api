import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { TelegramService } from './telegram.service';
import { CacheService } from '../cache/cache.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TelegramService', () => {
  let service: TelegramService;
  let cacheService: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramService,
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getChannelInfo', () => {
    it('should return cached result if available', async () => {
      const cachedResult = {
        uri: 'telegram',
        link: 'https://t.me/telegram',
        title: 'Telegram',
        description: 'The official Telegram channel',
        image: 'https://example.com/image.jpg',
        updatedAt: '2024-01-01T00:00:00.000Z',
        subscribers: 500000,
        subscribersText: '500K subscribers',
      };

      jest.spyOn(cacheService, 'get').mockReturnValue(cachedResult);

      const result = await service.getChannelInfo('telegram');

      expect(result).toEqual(cachedResult);
      expect(cacheService.get).toHaveBeenCalledWith('telegram:telegram');
    });

    it('should force refresh cache when forceRefresh is true', async () => {
      const htmlContent = `
        <div class="tgme_page_title"><span>Test Channel</span></div>
        <div class="tgme_page_description">Description</div>
        <div class="tgme_page_extra">100 subscribers</div>
      `;

      jest.spyOn(cacheService, 'get').mockReturnValue(null);
      mockedAxios.get.mockResolvedValue({ data: htmlContent });

      const result = await service.getChannelInfo('testchannel', true);

      expect(result).toBeDefined();
      expect(result.title).toBe('Test Channel');
    });

    it('should handle channel with @ prefix', async () => {
      const htmlContent = `
        <div class="tgme_page_title"><span>Test</span></div>
        <div class="tgme_page_extra">100 subscribers</div>
      `;

      jest.spyOn(cacheService, 'get').mockReturnValue(null);
      mockedAxios.get.mockResolvedValue({ data: htmlContent });

      const result = await service.getChannelInfo('@testchannel', true);

      expect(result.uri).toBe('testchannel');
      expect(result.link).toBe('https://t.me/testchannel');
    });
  });
});
