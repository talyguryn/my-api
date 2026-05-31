import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(3600),
          },
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  describe('set and get', () => {
    it('should set and get a value', () => {
      const key = 'test-key';
      const value = { data: 'test' };

      service.set(key, value);
      const result = service.get<typeof value>(key);

      expect(result).toEqual(value);
    });

    it('should return null for non-existent key', () => {
      const result = service.get('non-existent');
      expect(result).toBeNull();
    });

    it('should respect custom TTL', async () => {
      const key = 'short-lived';
      const value = { data: 'test' };

      service.set(key, value, 1); // 1 second TTL
      expect(service.get(key)).toEqual(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(service.get(key)).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      service.set('test-key', { data: 'test' });
      expect(service.has('test-key')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(service.has('non-existent')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete a key', () => {
      service.set('test-key', { data: 'test' });
      service.delete('test-key');
      expect(service.has('test-key')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all cache', () => {
      service.set('key1', { data: '1' });
      service.set('key2', { data: '2' });

      service.clear();

      expect(service.has('key1')).toBe(false);
      expect(service.has('key2')).toBe(false);
    });
  });

  describe('cleanupExpired', () => {
    it('should remove expired entries', async () => {
      const key1 = 'short-lived';
      const key2 = 'long-lived';

      service.set(key1, { data: '1' }, 1);
      service.set(key2, { data: '2' }, 3600);

      await new Promise(resolve => setTimeout(resolve, 1100));
      await service.cleanupExpired();

      expect(service.has(key1)).toBe(false);
      expect(service.has(key2)).toBe(true);
    });
  });
});
