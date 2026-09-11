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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisPubSubService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisPubSubService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisPubSubService = RedisPubSubService_1 = class RedisPubSubService {
    constructor() {
        this.logger = new common_1.Logger(RedisPubSubService_1.name);
        this.pubClient = null;
        this.subClient = null;
        this.handlers = new Map();
        this.memoryOnly = false;
        this.memoryKv = new Map();
        this.memoryCounters = new Map();
        this.fallbackLogged = false;
        const forcedOff = ['1', 'true', 'yes'].includes(String(process.env.REDIS_DISABLED || '').toLowerCase());
        if (forcedOff) {
            this.activateMemoryFallback('REDIS_DISABLED is set');
            return;
        }
        const redisUrl = process.env.REDIS_URL;
        const host = process.env.REDIS_HOST || '127.0.0.1';
        const port = Number(process.env.REDIS_PORT || 6379);
        const baseOptions = {
            lazyConnect: true,
            maxRetriesPerRequest: null,
            enableReadyCheck: true,
            retryStrategy: () => null,
            reconnectOnError: () => false,
        };
        this.pubClient = redisUrl ? new ioredis_1.default(redisUrl, baseOptions) : new ioredis_1.default({ host, port, ...baseOptions });
        this.subClient = redisUrl ? new ioredis_1.default(redisUrl, baseOptions) : new ioredis_1.default({ host, port, ...baseOptions });
        this.subClient.on('message', (channel, message) => {
            const list = this.handlers.get(channel);
            if (!list || list.size === 0)
                return;
            try {
                const parsed = JSON.parse(message);
                list.forEach((handler) => handler(parsed));
            }
            catch (error) {
                this.logger.warn(`Failed to parse Redis payload for ${channel}: ${error.message}`);
            }
        });
        let pubErrorLogged = false;
        this.pubClient.on('error', (error) => {
            if (error.code === 'ECONNREFUSED') {
                if (!pubErrorLogged) {
                    this.logger.warn(`Redis pub connection refused. Is Redis running? Suppressing further pub connection warnings.`);
                    pubErrorLogged = true;
                }
            }
            else {
                this.logger.warn(`Redis pub error: ${error.message || error}`);
            }
        });
        let subErrorLogged = false;
        this.subClient.on('error', (error) => {
            if (error.code === 'ECONNREFUSED') {
                if (!subErrorLogged) {
                    this.logger.warn(`Redis sub connection refused. Is Redis running? Suppressing further sub connection warnings.`);
                    subErrorLogged = true;
                }
            }
            else {
                this.logger.warn(`Redis sub error: ${error.message || error}`);
            }
        });
    }
    activateMemoryFallback(reason) {
        if (this.memoryOnly)
            return;
        this.memoryOnly = true;
        if (!this.fallbackLogged) {
            this.logger.warn(`Redis unavailable (${reason}). Using in-memory pub/sub + KV — OK for local dev; run Redis for multi-instance.`);
            this.fallbackLogged = true;
        }
        try {
            this.subClient?.disconnect(false);
        }
        catch {
        }
        try {
            this.pubClient?.disconnect(false);
        }
        catch {
        }
        this.subClient = null;
        this.pubClient = null;
    }
    dispatchLocal(channel, payload) {
        const list = this.handlers.get(channel);
        if (!list || list.size === 0)
            return;
        list.forEach((handler) => {
            try {
                handler(payload);
            }
            catch (e) {
                this.logger.warn(`Local pub/sub handler error on ${channel}: ${e.message}`);
            }
        });
    }
    async publish(channel, payload) {
        if (this.memoryOnly) {
            this.dispatchLocal(channel, payload);
            return;
        }
        try {
            if (this.pubClient.status !== 'ready') {
                await this.pubClient.connect();
            }
            await this.pubClient.publish(channel, JSON.stringify(payload));
        }
        catch (error) {
            this.activateMemoryFallback(error.message || 'publish failed');
            this.dispatchLocal(channel, payload);
        }
    }
    async subscribe(channel, handler) {
        let set = this.handlers.get(channel);
        const isNewChannel = !set;
        if (isNewChannel) {
            set = new Set();
            this.handlers.set(channel, set);
            if (!this.memoryOnly && this.subClient) {
                try {
                    if (this.subClient.status !== 'ready') {
                        await this.subClient.connect();
                    }
                    await this.subClient.subscribe(channel);
                }
                catch (error) {
                    const msg = error.message || String(error);
                    this.activateMemoryFallback(msg);
                }
            }
        }
        set.add(handler);
    }
    async unsubscribe(channel, handler) {
        const set = this.handlers.get(channel);
        if (!set)
            return;
        if (handler) {
            set.delete(handler);
        }
        else {
            set.clear();
        }
        if (set.size > 0)
            return;
        this.handlers.delete(channel);
        if (!this.memoryOnly && this.subClient) {
            try {
                await this.subClient.unsubscribe(channel);
            }
            catch (error) {
                this.logger.warn(`Redis unsubscribe failed for ${channel}: ${error.message}`);
            }
        }
    }
    async set(key, value, ttlSeconds) {
        if (this.memoryOnly) {
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
            this.memoryKv.set(key, { value: stringValue, expiresAt });
            return;
        }
        try {
            if (this.pubClient.status !== 'ready') {
                await this.pubClient.connect();
            }
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            if (ttlSeconds) {
                await this.pubClient.set(key, stringValue, 'EX', ttlSeconds);
            }
            else {
                await this.pubClient.set(key, stringValue);
            }
        }
        catch (error) {
            this.activateMemoryFallback(error.message || 'set failed');
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
            this.memoryKv.set(key, { value: stringValue, expiresAt });
        }
    }
    async get(key) {
        if (this.memoryOnly) {
            const entry = this.memoryKv.get(key);
            if (!entry)
                return null;
            if (entry.expiresAt != null && Date.now() > entry.expiresAt) {
                this.memoryKv.delete(key);
                return null;
            }
            return entry.value;
        }
        try {
            if (this.pubClient.status !== 'ready') {
                await this.pubClient.connect();
            }
            return await this.pubClient.get(key);
        }
        catch (error) {
            this.activateMemoryFallback(error.message || 'get failed');
            return this.get(key);
        }
    }
    async del(key) {
        if (this.memoryOnly) {
            this.memoryKv.delete(key);
            return;
        }
        try {
            if (this.pubClient.status !== 'ready') {
                await this.pubClient.connect();
            }
            await this.pubClient.del(key);
        }
        catch (error) {
            this.activateMemoryFallback(error.message || 'del failed');
            this.memoryKv.delete(key);
        }
    }
    async incrementWithTTL(key, ttlSeconds) {
        if (this.memoryOnly) {
            const now = Date.now();
            const windowMs = ttlSeconds * 1000;
            let slot = this.memoryCounters.get(key);
            if (!slot || slot.expiresAt <= now) {
                slot = { count: 1, expiresAt: now + windowMs };
                this.memoryCounters.set(key, slot);
                return 1;
            }
            slot.count += 1;
            return slot.count;
        }
        try {
            if (this.pubClient.status !== 'ready') {
                await this.pubClient.connect();
            }
            const next = await this.pubClient.incr(key);
            if (next === 1) {
                await this.pubClient.expire(key, ttlSeconds);
            }
            return next;
        }
        catch (error) {
            this.activateMemoryFallback(error.message || 'increment failed');
            return this.incrementWithTTL(key, ttlSeconds);
        }
    }
    async onModuleDestroy() {
        try {
            await this.subClient?.quit();
            await this.pubClient?.quit();
        }
        catch {
            this.subClient?.disconnect(false);
            this.pubClient?.disconnect(false);
        }
    }
};
exports.RedisPubSubService = RedisPubSubService;
exports.RedisPubSubService = RedisPubSubService = RedisPubSubService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RedisPubSubService);
//# sourceMappingURL=redis.service.js.map