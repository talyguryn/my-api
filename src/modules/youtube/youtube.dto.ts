import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetYoutubeChannelDto {
  @ApiProperty({
    description:
      'YouTube channel identifier (username, channel ID, or full URL)',
    example: '@google',
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

export class YoutubeChannelResponseDto {
  @ApiProperty({
    description: 'The original input channel identifier',
    example: '@google',
  })
  uri!: string;

  @ApiProperty({
    description: 'Channel URL',
    example: 'https://www.youtube.com/@google',
  })
  link!: string;

  @ApiProperty({
    description: 'Channel title',
    example: 'Google',
  })
  title!: string | null;

  @ApiProperty({
    description: 'Channel description',
    example: 'Welcome to the official Google YouTube channel...',
  })
  description!: string | null;

  @ApiProperty({
    description: 'Channel avatar image URL',
    example:
      'https://yt3.googleusercontent.com/...',
  })
  image!: string | null;

  @ApiProperty({
    description: 'Timestamp of when this data was fetched',
    example: '2024-01-01T12:00:00.000Z',
  })
  updatedAt!: string;

  @ApiProperty({
    description: 'Subscriber count as a number',
    example: 19000000,
  })
  subscribers!: number | null;

  @ApiProperty({
    description: 'Subscriber count as formatted text',
    example: '19M subscribers',
  })
  subscribersText!: string | null;

  @ApiProperty({
    description: 'Video count as a number',
    example: 5000,
  })
  videos!: number | null;

  @ApiProperty({
    description: 'Video count as formatted text',
    example: '5,000 videos',
  })
  videosText!: string | null;

  @ApiProperty({
    description: 'View count as a number',
    example: 1500000000,
  })
  views!: number | null;

  @ApiProperty({
    description: 'View count as formatted text',
    example: '1.5B views',
  })
  viewsText!: string | null;

  @ApiProperty({
    description: 'Date when channel was joined',
    example: 'Joined May 23, 2005',
  })
  joinedAt!: string | null;
}
