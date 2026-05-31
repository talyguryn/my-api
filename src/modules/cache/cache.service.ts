import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

@Injectable()
export class CacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private ttl: number;

  constructor(private configService: ConfigService) {
    this.ttl = this.configService.get<number>('cache.ttl', 3600);
  }

  set<T = unknown>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.ttl) * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  get<T = unknown>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries periodically
  async cleanupExpired(): Promise<void> {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}
