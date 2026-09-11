"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
const app_module_1 = require("./app.module");
const redis_service_1 = require("./modules/redis/redis.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { rawBody: true });
    const nodeEnv = process.env.NODE_ENV || 'development';
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'your-secret-key') {
        throw new Error('JWT_SECRET must be configured with a strong value');
    }
    const corsOrigins = (process.env.CORS_ORIGINS || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    app.enableCors({
        origin: corsOrigins.length > 0 ? corsOrigins : [
            'http://localhost:3001',
            'http://localhost:3002',
            'http://localhost:3003',
            'http://localhost:3004',
            'http://localhost:3005',
            'http://localhost:3006',
        ],
        credentials: true,
    });
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('X-XSS-Protection', '0');
        res.setHeader('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none'; base-uri 'self'");
        if (nodeEnv === 'production') {
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }
        next();
    });
    const rateLimitEnabled = (process.env.ENABLE_RATE_LIMIT || (nodeEnv === 'production' ? 'true' : 'false')).toLowerCase() === 'true';
    if (rateLimitEnabled) {
        const rateWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
        const rateMax = Number(process.env.RATE_LIMIT_MAX || 120);
        const windowSeconds = Math.max(1, Math.ceil(rateWindowMs / 1000));
        const redisService = app.get(redis_service_1.RedisPubSubService, { strict: false });
        const localBucket = new Map();
        app.use(async (req, res, next) => {
            const path = req.path || '';
            const isAuthEndpoint = path.startsWith('/api/v1/auth') || path.startsWith('/api/v1/drivers/auth');
            const method = req.method.toUpperCase();
            const shouldThrottle = isAuthEndpoint && method !== 'OPTIONS';
            if (!shouldThrottle) {
                return next();
            }
            const ip = req.ip || req.socket.remoteAddress || 'unknown';
            const key = `ratelimit:${path}:${ip}`;
            let count = null;
            if (redisService) {
                count = await redisService.incrementWithTTL(key, windowSeconds);
            }
            if (count === null) {
                const now = Date.now();
                const entry = localBucket.get(key);
                if (!entry || entry.resetAt < now) {
                    localBucket.set(key, { count: 1, resetAt: now + rateWindowMs });
                    return next();
                }
                entry.count += 1;
                if (entry.count > rateMax) {
                    res.status(429).json({ message: 'Too many requests' });
                    return;
                }
                return next();
            }
            if (count > rateMax) {
                res.status(429).json({ message: 'Too many requests' });
                return;
            }
            next();
        });
    }
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.useWebSocketAdapter(new platform_socket_io_1.IoAdapter(app));
    app.setGlobalPrefix('api/v1');
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Restaurant Platform API')
        .setDescription('Multi-store Pizza & QSR Management Platform API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = Number(process.env.PORT || 3000);
    await app.listen(port);
    const base = `http://localhost:${port}`;
    console.log('');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('  READY — Restaurant API is listening');
    console.log(`  • REST base   ${base}/api/v1`);
    console.log(`  • Swagger     ${base}/api/docs`);
    console.log(`  • Health      ${base}/api/v1/health`);
    console.log('  Kitchen UI (separate terminal): cd scaffold/web-kds && npm run dev → http://localhost:3003');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('');
}
bootstrap();
//# sourceMappingURL=main.js.map