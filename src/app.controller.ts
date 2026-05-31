import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class AppController {
  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Check if the API server is running and healthy',
  })
  @ApiResponse({
    status: 200,
    description: 'Server is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-01-01T12:00:00.000Z' },
      },
    },
  })
  @Public()
  healthCheck(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
