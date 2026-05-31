import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiSecurity,
} from '@nestjs/swagger';
import { YoutubeService } from './youtube.service';
import { GetYoutubeChannelDto, YoutubeChannelResponseDto } from './youtube.dto';
import { Public } from '@/decorators/public.decorator';

@ApiTags('YouTube')
@ApiSecurity('bearer')
@Controller('api/youtube')
export class YoutubeController {
  constructor(private youtubeService: YoutubeService) {}

  @Get('channel')
  @ApiOperation({
    summary: 'Get YouTube channel information',
    description:
      'Fetch detailed information about a YouTube channel including subscribers, videos, and views. Supports @username, channel ID, or full URL.',
  })
  @ApiQuery({
    name: 'channel',
    description: 'YouTube channel identifier (@username, channel ID, or URL)',
    example: '@google',
  })
  @ApiQuery({
    name: 'forceRefresh',
    description: 'Force refresh the cache',
    required: false,
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched channel information',
    type: YoutubeChannelResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid channel parameter',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing bearer token',
  })
  @ApiResponse({
    status: 502,
    description: 'Bad gateway - failed to parse YouTube data',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @Public()
  async getChannelInfo(
    @Query() query: GetYoutubeChannelDto,
  ): Promise<YoutubeChannelResponseDto> {
    return this.youtubeService.getChannelInfo(
      query.channel,
      query.forceRefresh || false,
    );
  }
}
