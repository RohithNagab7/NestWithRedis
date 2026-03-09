import { SetMetadata } from '@nestjs/common';
import { RATE_LIMIT_KEY } from '../constants/rat-limit.constant.js';

export const RateLimit = (limit: number, window: number) => {
  return SetMetadata(RATE_LIMIT_KEY, { limit, window });
};
