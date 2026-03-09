import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AppService } from './app.service.js';
import { UserModule } from './user/user.module.js';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ResponseInterceptor } from './global/interceptors/response-formatter.interceptor.js';
import { RedisModule } from './redis/redis.module.js';
import { FixedWindowGlobalRateLimit } from './global/guards/Fixed-window-rate-liimiter.guard.js';
import { SlidingWindowRateLimiter } from './global/guards/Sliding-window-rate-limiter.guard.js';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    RedisModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: FixedWindowGlobalRateLimit,
    },
    {
      provide: APP_GUARD,
      useClass: SlidingWindowRateLimiter,
    },
  ],
})
export class AppModule {}
