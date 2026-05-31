import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetTelegramChannelDto {
  @ApiProperty({
    description: 'Telegram channel name (without @)',
    example: 'telegram',
  })
  @IsString()
  @MinLength(1)
  channel!: string;

  @ApiProperty({
    description: 'Whether to force refresh the cache',
    example: false,
    required: false,
  })
  @IsOptional()
  forceRefresh?: boolean;
}

export class TelegramChannelResponseDto {
  @ApiProperty({
    description: 'The original input channel name',
    example: 'telegram',
  })
  uri!: string;

  @ApiProperty({
    description: 'Full Telegram channel URL',
    example: 'https://t.me/telegram',
  })
  link!: string;

  @ApiProperty({
    description: 'Channel title',
    example: 'Telegram',
  })
  title!: string | null;

  @ApiProperty({
    description: 'Channel description',
    example: 'The official Telegram channel...',
  })
  description!: string | null;

  @ApiProperty({
    description: 'Channel avatar image URL',
    example: 'https://cdn4.cdn-telegram.org/...',
  })
  image!: string | null;

  @ApiProperty({
    description: 'Subscriber or member count',
    example: 500000,
  })
  subscribers?: number | null;

  @ApiProperty({
    description: 'Formatted subscriber count',
    example: '500K subscribers',
  })
  subscribersText?: string | null;

  @ApiProperty({
    description: 'Timestamp of when this data was fetched',
    example: '2024-01-01T12:00:00.000Z',
  })
  updatedAt!: string;
}
