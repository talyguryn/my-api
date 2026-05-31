import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { CacheService } from '../cache/cache.service';
import { TelegramChannelResponseDto } from './telegram.dto';

@Injectable()
export class TelegramService {
  private readonly CACHE_KEY_PREFIX = 'telegram:';

  constructor(private cacheService: CacheService) {}

  async getChannelInfo(
    channel: string,
    forceRefresh: boolean = false,
  ): Promise<TelegramChannelResponseDto> {
    const normalizedChannel = this.normalizeChannel(channel);
    const cacheKey = this.CACHE_KEY_PREFIX + normalizedChannel;

    // Check cache if not forced refresh
    if (!forceRefresh) {
      const cached =
        this.cacheService.get<TelegramChannelResponseDto>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const result = await this.fetchChannelInfo(normalizedChannel);
    this.cacheService.set(cacheKey, result);
    return result;
  }

  private async fetchChannelInfo(
    channel: string,
  ): Promise<TelegramChannelResponseDto> {
    try {
      const url = `https://t.me/${channel}`;
      const { data: html } = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36',
        },
        timeout: 15_000,
      });

      const $ = cheerio.load(html);

      // Basic metadata
      const title = $('.tgme_page_title span').text().trim() || null;

      // Preserve line breaks in description
      const descriptionHtml = $('.tgme_page_description').html() || '';
      const description = descriptionHtml
        .replace(/<br\s*\/?>/gi, '\n') // convert <br> to newline
        .replace(/<\/?[^>]+>/g, '') // strip remaining HTML tags
        .trim();

      const image =
        $('.tgme_page_photo_image').attr('src') ||
        $('meta[property="og:image"]').attr('content') ||
        null;

      // Subscribers or members
      const extraText = $('.tgme_page_extra').text().trim();
      const match = extraText.match(/([\d\s]+)\s+(subscribers|members)/i);
      const subscribersText = match ? match[0].trim() : null;
      const subscribers = match
        ? parseInt(match[1].replace(/\s+/g, ''), 10)
        : null;

      const result: TelegramChannelResponseDto = {
        uri: channel,
        link: url,
        title,
        description: description || null,
        image,
        updatedAt: new Date().toISOString(),
      };

      if (subscribers !== null) {
        result.subscribers = subscribers;
        result.subscribersText = subscribersText;
      }

      return result;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to fetch Telegram channel data';

      throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private normalizeChannel(channel: string): string {
    return channel.startsWith('@') ? channel.slice(1) : channel;
  }
}
