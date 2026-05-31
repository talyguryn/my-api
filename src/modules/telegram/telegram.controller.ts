import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiSecurity,
} from '@nestjs/swagger';
import { TelegramService } from './telegram.service';
import {
  GetTelegramChannelDto,
  TelegramChannelResponseDto,
} from './telegram.dto';
import { Public } from '@/decorators/public.decorator';

@ApiTags('Telegram')
@ApiSecurity('bearer')
@Controller('api/telegram')
export class TelegramController {
  constructor(private telegramService: TelegramService) {}

  @Get('channel')
  @ApiOperation({
    summary: 'Get Telegram channel information',
    description:
      'Fetch detailed information about a Telegram channel including subscribers count and description.',
  })
  @ApiQuery({
    name: 'channel',
    description: 'Telegram channel name (with or without @)',
    example: 'telegram',
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
    type: TelegramChannelResponseDto,
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
    status: 500,
    description: 'Internal server error',
  })
  @Public()
  async getChannelInfo(
    @Query() query: GetTelegramChannelDto,
  ): Promise<TelegramChannelResponseDto> {
    return this.telegramService.getChannelInfo(
      query.channel,
      query.forceRefresh || false,
    );
  }
}
