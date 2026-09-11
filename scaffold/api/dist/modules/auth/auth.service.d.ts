import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisPubSubService } from '../redis/redis.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private redisService;
    constructor(prisma: PrismaService, jwtService: JwtService, redisService: RedisPubSubService);
    login(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: any;
    }>;
    logout(userId: string, token?: string): Promise<{
        message: string;
    }>;
    getProfile(userId: string): Promise<any>;
    refreshToken(userId: string, rawToken?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    private generateTokens;
    private sanitizeUser;
    hashPassword(password: string): Promise<string>;
}
