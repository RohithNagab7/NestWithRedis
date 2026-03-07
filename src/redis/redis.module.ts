import { Global, Module } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.constant.js';
import Redis from 'ioredis';
import type { Redis as RedisClient } from 'ioredis';
import { RedisService } from './redis.service.js';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const redis: RedisClient = new Redis.default({
          host: 'localhost',
          port: 6379,
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
        });

        redis.on('connect', () => {
          console.log('Redis connected');
        });

        redis.on('error', (err) => {
          console.error('Redis Error: ', err);
        });

        return redis;
      },
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
