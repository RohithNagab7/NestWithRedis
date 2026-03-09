import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service.js';

@Injectable()
export class FixedWindowGlobalRateLimit implements CanActivate {
  private readonly LIMIT = 100;
  private readonly WINDOW = 60;

  constructor(private readonly redisClient: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const currentWindow = Math.floor(Date.now() / 1000 / this.WINDOW);
    const key = `ratelimit:${ip}:${currentWindow}`;
    const redis = this.redisClient.getClient();
    const requestCount = await redis.incr(key);
    if (requestCount === 1) {
      await redis.expire(key, this.WINDOW);
    }

    if (requestCount > this.LIMIT) {
      throw new BadRequestException('Too many requests');
    }

    return true;
  }
}
