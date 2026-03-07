import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.constant.js';
import { Redis as RedisClient } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClient) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);

    if (data) {
      console.log(`Cache HIT: ${key}`);
      return JSON.parse(data);
    }

    console.log(`Cache Miss: ${key}`);
    return null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const data = JSON.stringify(value);
    await this.redis.set(key, data, 'EX', ttl ?? 60);
  }

  async deleteByPattern(key: string) {
    const stream = this.redis.scanStream({
      match: key,
    });

    const keys: string[] = [];

    for await (const resultKeys of stream) {
      keys.push(...resultKeys);
    }

    if (keys.length) {
      await this.redis.del(...keys);
    }
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async flushAll(): Promise<void> {
    await this.redis.flushall();
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
