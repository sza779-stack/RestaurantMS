"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const redis_service_1 = require("../redis/redis.service");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(configService, redisService) {
        const jwtSecret = configService.get('JWT_SECRET');
        if (!jwtSecret || jwtSecret === 'your-secret-key') {
            throw new common_1.UnauthorizedException('JWT_SECRET is not configured');
        }
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtSecret,
            passReqToCallback: true,
        });
        this.redisService = redisService;
    }
    async validate(req, payload) {
        const token = req.headers?.authorization?.replace('Bearer ', '');
        if (token) {
            const isBlacklisted = await this.redisService.get(`blacklist:${token}`);
            if (isBlacklisted) {
                throw new common_1.UnauthorizedException('Token is blacklisted');
            }
        }
        return {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            companyId: payload.companyId,
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        redis_service_1.RedisPubSubService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map