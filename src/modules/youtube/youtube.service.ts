import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { CacheService } from '../cache/cache.service';
import { YoutubeChannelResponseDto } from './youtube.dto';

type UnknownRecord = Record<string, unknown>;

@Injectable()
export class YoutubeService {
  private readonly CACHE_KEY_PREFIX = 'youtube:';

  constructor(private cacheService: CacheService) {}

  async getChannelInfo(
    channel: string,
    forceRefresh: boolean = false,
  ): Promise<YoutubeChannelResponseDto> {
    const cacheKey = this.CACHE_KEY_PREFIX + channel;

    // Check cache if not forced refresh
    if (!forceRefresh) {
      const cached = this.cacheService.get<YoutubeChannelResponseDto>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const result = await this.fetchChannelInfo(channel);
    this.cacheService.set(cacheKey, result);
    return result;
  }

  private async fetchChannelInfo(
    channel: string,
  ): Promise<YoutubeChannelResponseDto> {
    try {
      const normalized = this.normalizeChannelInput(channel);
      const url = `https://www.youtube.com/${normalized.path}/about?hl=en`;

      const { data: html } = await axios.get<string>(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 15_000,
      });

      const initialData = this.extractInitialData(html);
      if (!initialData) {
        throw new HttpException(
          'Failed to parse YouTube initial data',
          HttpStatus.BAD_GATEWAY,
        );
      }

      const about = this.findObjectByKey(initialData, 'aboutChannelViewModel');
      const metadata = this.findObjectByKey(
        initialData,
        'channelMetadataRenderer',
      );

      const title = this.getString(metadata?.title) || null;
      const description =
        this.getString(about?.description) ||
        this.getString(metadata?.description) ||
        null;
      const link =
        this.getString(about?.canonicalChannelUrl) ||
        this.getString(metadata?.channelUrl) ||
        `https://www.youtube.com/${normalized.path}`;
      const image = this.pickAvatarUrl(metadata, initialData);

      const subscribersText = this.getString(about?.subscriberCountText);
      const videosText = this.getString(about?.videoCountText);
      const viewsText = this.getString(about?.viewCountText);
      const joinedAt = this.getJoinedDate(about?.joinedDateText);

      return {
        uri: normalized.input,
        link,
        title,
        description,
        image,
        updatedAt: new Date().toISOString(),
        subscribers: this.parseCount(subscribersText),
        subscribersText,
        videos: this.parseCount(videosText),
        videosText,
        views: this.parseCount(viewsText),
        viewsText,
        joinedAt,
      };
    } catch (err: unknown) {
      if (err instanceof HttpException) {
        throw err;
      }

      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to fetch YouTube channel data';

      throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private normalizeChannelInput(channel: string): {
    path: string;
    input: string;
  } {
    const input = channel.trim();

    if (/^https?:\/\//i.test(input)) {
      try {
        const parsed = new URL(input);
        const pieces = parsed.pathname.split('/').filter(Boolean);

        if (pieces.length > 0) {
          if (pieces[0].startsWith('@')) {
            return { path: pieces[0], input };
          }
          if (pieces[0] === 'channel' && pieces[1]) {
            return { path: `channel/${pieces[1]}`, input };
          }
          if (pieces[0] === 'c' && pieces[1]) {
            return { path: `c/${pieces[1]}`, input };
          }
          if (pieces[0] === 'user' && pieces[1]) {
            return { path: `user/${pieces[1]}`, input };
          }
        }
      } catch {
        // Fall through to plain input parsing
      }
    }

    if (input.startsWith('@')) {
      return { path: input, input };
    }

    if (input.startsWith('UC')) {
      return { path: `channel/${input}`, input };
    }

    return { path: `@${input}`, input };
  }

  private extractInitialData(html: string): UnknownRecord | null {
    const match = html.match(
      /var ytInitialData\s*=\s*(\{[\s\S]*?\});<\/script>/,
    );
    if (!match?.[1]) {
      return null;
    }

    try {
      return JSON.parse(match[1]) as UnknownRecord;
    } catch {
      return null;
    }
  }

  private findObjectByKey(root: unknown, key: string): UnknownRecord | null {
    const queue: unknown[] = [root];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || typeof current !== 'object') {
        continue;
      }

      const record = current as UnknownRecord;
      if (key in record && record[key] && typeof record[key] === 'object') {
        return record[key] as UnknownRecord;
      }

      if (Array.isArray(current)) {
        queue.push(...current);
      } else {
        queue.push(...Object.values(record));
      }
    }

    return null;
  }

  private getString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0
      ? value.trim()
      : null;
  }

  private getJoinedDate(value: unknown): string | null {
    if (typeof value === 'string') {
      return value.trim() || null;
    }

    if (value && typeof value === 'object') {
      const content = (value as UnknownRecord).content;
      return this.getString(content);
    }

    return null;
  }

  private parseCount(text: string | null): number | null {
    if (!text) {
      return null;
    }

    const normalized = text.replace(/,/g, '').replace(/\s+/g, ' ').trim();
    const match = normalized.match(/([\d.]+)\s*([KMB])?/i);

    if (!match?.[1]) {
      return null;
    }

    const base = Number.parseFloat(match[1]);
    if (!Number.isFinite(base)) {
      return null;
    }

    const suffix = (match[2] || '').toUpperCase();
    const multipliers: Record<string, number> = {
      K: 1_000,
      M: 1_000_000,
      B: 1_000_000_000,
    };

    return Math.round(base * (multipliers[suffix] || 1));
  }

  private pickAvatarUrl(
    metadata: UnknownRecord | null,
    initialData: UnknownRecord,
  ): string | null {
    const metadataAvatar = metadata?.avatar as UnknownRecord | undefined;
    const thumbnails = metadataAvatar?.thumbnails as unknown[] | undefined;

    if (Array.isArray(thumbnails) && thumbnails.length > 0) {
      const last = thumbnails[thumbnails.length - 1] as UnknownRecord;
      return this.getString(last.url);
    }

    const microformat = this.findObjectByKey(
      initialData,
      'microformatDataRenderer',
    );
    const thumb = microformat?.thumbnail as UnknownRecord | undefined;
    const microThumbnails = thumb?.thumbnails as unknown[] | undefined;
    if (Array.isArray(microThumbnails) && microThumbnails.length > 0) {
      const first = microThumbnails[0] as UnknownRecord;
      return this.getString(first.url);
    }

    return null;
  }
}
