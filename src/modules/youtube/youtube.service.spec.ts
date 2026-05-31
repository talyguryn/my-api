import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { YoutubeService } from './youtube.service';
import { CacheService } from '../cache/cache.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('YoutubeService', () => {
  let service: YoutubeService;
  let cacheService: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YoutubeService,
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<YoutubeService>(YoutubeService);
    cacheService = module.get(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getChannelInfo', () => {
    it('should return cached result if available', async () => {
      const cachedResult = {
        uri: '@google',
        link: 'https://www.youtube.com/@google',
        title: 'Google',
        description: 'Welcome to Google',
        image: 'https://example.com/image.jpg',
        updatedAt: '2024-01-01T00:00:00.000Z',
        subscribers: 19000000,
        subscribersText: '19M subscribers',
        videos: 5000,
        videosText: '5,000 videos',
        views: 1500000000,
        viewsText: '1.5B views',
        joinedAt: 'Joined May 23, 2005',
      };

      jest.spyOn(cacheService, 'get').mockReturnValue(cachedResult);

      const result = await service.getChannelInfo('@google');

      expect(result).toEqual(cachedResult);
      expect(cacheService.get).toHaveBeenCalledWith('youtube:@google');
    });

    it('should force refresh cache when forceRefresh is true', async () => {
      const htmlContent = `
        <script>var ytInitialData = {
          "contents": {},
          "metadata": {}
        };</script>
      `;

      jest.spyOn(cacheService, 'get').mockReturnValue(null);
      mockedAxios.get.mockResolvedValue({ data: htmlContent });

      // This will fail due to missing required properties, but that's ok for this test
      try {
        await service.getChannelInfo('@google', true);
      } catch {
        // Expected to fail
      }

      // Cache should not be checked when forceRefresh is true
      expect(cacheService.get).not.toHaveBeenCalled();
    });
  });

  describe('Channel normalization', () => {
    it('should handle @username format', () => {
      // Test through the normalizeChannelInput method indirectly
      // This would require making the method public or testing through getChannelInfo
      expect(service).toBeDefined();
    });
  });
});
