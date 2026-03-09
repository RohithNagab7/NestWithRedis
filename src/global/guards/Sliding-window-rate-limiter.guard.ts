import {
  CanActivate,
  Injectable,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { RedisService } from '../../redis/redis.service.js';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_KEY } from '../constants/rat-limit.constant.js';
import { RateLimitnterface } from '../interfaces/global-interfaces.interface.js';

@Injectable()
export class SlidingWindowRateLimiter implements CanActivate {
  private readonly DEFAULT_LIMIT = 10;
  private readonly DEFAULT_WINDOW = 60;
  constructor(
    private readonly redisService: RedisService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip =
      request.headers['x-forwarded-for'] ||
      request.ip ||
      request.socket.remoteAddress;

    const metaData = this.reflector.getAllAndOverride<RateLimitnterface>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    const limit = metaData.limit ?? this.DEFAULT_LIMIT;
    const window = metaData.window ?? this.DEFAULT_WINDOW;

    const route = request.route?.path || request.url;
    const method = request.method;

    const key = `ratelimit:sliding:${ip}:${method}:${route}`;
    const redis = this.redisService.getClient();

    const now = Date.now();
    const windowStart = now - window * 1000;
    const multi = redis.multi();

    multi.zremrangebyscore(key, 0, windowStart);
    multi.zadd(key, now, now.toString());
    multi.zcard(key);
    multi.expire(key, window);

    const result = await multi.exec();
    const requestCount = result?.[2]?.[1] as number;

    if (requestCount > limit) {
      throw new BadRequestException('API rate limit exceeded');
    }

    return true;
  }
}
