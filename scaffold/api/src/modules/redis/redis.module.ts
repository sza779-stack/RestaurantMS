import { Global, Module } from '@nestjs/common';
import { RedisPubSubService } from './redis.service';

@Global()
@Module({
  providers: [RedisPubSubService],
  exports: [RedisPubSubService],
})
export class RedisModule {}
