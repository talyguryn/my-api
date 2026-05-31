import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import configuration from '@/config/configuration';
import { AppController } from './app.controller';
import { AuthGuard } from '@/guards/auth.guard';
import { YoutubeModule } from '@/modules/youtube/youtube.module';
import { TelegramModule } from '@/modules/telegram/telegram.module';
import { CacheModule } from '@/modules/cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    CacheModule,
    YoutubeModule,
    TelegramModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
