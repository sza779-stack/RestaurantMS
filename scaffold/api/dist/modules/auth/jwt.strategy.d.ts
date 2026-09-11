import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RedisPubSubService } from '../redis/redis.service';
import { Request } from 'express';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private redisService;
    constructor(configService: ConfigService, redisService: RedisPubSubService);
    validate(req: Request, payload: any): Promise<{
        userId: any;
        email: any;
        role: any;
        companyId: any;
    }>;
}
export {};
