import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

type RedisHandler = (payload: any) => void;

/** Parsed KV entry for in-memory blacklist / counters */
type MemoryKv = { value: string; expiresAt?: number };

/**
 * Redis pub/sub + KV used for driver-location fan-out, token blacklist, rate limits.
 *
 * If Redis is unreachable (nothing on REDIS_URL / localhost:6379), we automatically
 * switch to an **in-process** implementation so `npm run start:dev` works without
 * Docker Redis. That mode is **single-instance only** (no cross-process pub/sub).
 *
 * Set `REDIS_DISABLED=true` to skip TCP entirely (same in-memory behaviour).
 */
@Injectable()
export class RedisPubSubService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisPubSubService.name);
  private pubClient: Redis | null = null;
  private subClient: Redis | null = null;
  private readonly handlers = new Map<string, Set<RedisHandler>>();
  private memoryOnly = false;
  private readonly memoryKv = new Map<string, MemoryKv>();
  private readonly memoryCounters = new Map<string, { count: number; expiresAt: number }>();
  private fallbackLogged = false;

  constructor() {
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
      maxRetriesPerRequest: null as number | null,
      enableReadyCheck: true,
      retryStrategy: (): null => null, // stop endless reconnect spam when Redis is down
      reconnectOnError: () => false,
    };

    this.pubClient = redisUrl ? new Redis(redisUrl, baseOptions) : new Redis({ host, port, ...baseOptions });
    this.subClient = redisUrl ? new Redis(redisUrl, baseOptions) : new Redis({ host, port, ...baseOptions });

    this.subClient.on('message', (channel, message) => {
      const list = this.handlers.get(channel);
      if (!list || list.size === 0) return;
      try {
        const parsed = JSON.parse(message);
        list.forEach((handler) => handler(parsed));
      } catch (error) {
        this.logger.warn(`Failed to parse Redis payload for ${channel}: ${(error as Error).message}`);
      }
    });

    let pubErrorLogged = false;
    this.pubClient.on('error', (error: any) => {
      if (error.code === 'ECONNREFUSED') {
        if (!pubErrorLogged) {
          this.logger.warn(
            `Redis pub connection refused. Is Redis running? Suppressing further pub connection warnings.`,
          );
          pubErrorLogged = true;
        }
      } else {
        this.logger.warn(`Redis pub error: ${error.message || error}`);
      }
    });

    let subErrorLogged = false;
    this.subClient.on('error', (error: any) => {
      if (error.code === 'ECONNREFUSED') {
        if (!subErrorLogged) {
          this.logger.warn(
            `Redis sub connection refused. Is Redis running? Suppressing further sub connection warnings.`,
          );
          subErrorLogged = true;
        }
      } else {
        this.logger.warn(`Redis sub error: ${error.message || error}`);
      }
    });
  }

  private activateMemoryFallback(reason: string): void {
    if (this.memoryOnly) return;
    this.memoryOnly = true;
    if (!this.fallbackLogged) {
      this.logger.warn(
        `Redis unavailable (${reason}). Using in-memory pub/sub + KV — OK for local dev; run Redis for multi-instance.`,
      );
      this.fallbackLogged = true;
    }
    try {
      this.subClient?.disconnect(false);
    } catch {
      /* noop */
    }
    try {
      this.pubClient?.disconnect(false);
    } catch {
      /* noop */
    }
    this.subClient = null;
    this.pubClient = null;
  }

  private dispatchLocal(channel: string, payload: any): void {
    const list = this.handlers.get(channel);
    if (!list || list.size === 0) return;
    list.forEach((handler) => {
      try {
        handler(payload);
      } catch (e) {
        this.logger.warn(`Local pub/sub handler error on ${channel}: ${(e as Error).message}`);
      }
    });
  }

  async publish(channel: string, payload: any): Promise<void> {
    if (this.memoryOnly) {
      this.dispatchLocal(channel, payload);
      return;
    }
    try {
      if (this.pubClient!.status !== 'ready') {
        await this.pubClient!.connect();
      }
      await this.pubClient!.publish(channel, JSON.stringify(payload));
    } catch (error) {
      this.activateMemoryFallback((error as Error).message || 'publish failed');
      this.dispatchLocal(channel, payload);
    }
  }

  async subscribe(channel: string, handler: RedisHandler): Promise<void> {
    let set = this.handlers.get(channel);
    const isNewChannel = !set;
    if (isNewChannel) {
      set = new Set<RedisHandler>();
      this.handlers.set(channel, set);
      if (!this.memoryOnly && this.subClient) {
        try {
          if (this.subClient.status !== 'ready') {
            await this.subClient.connect();
          }
          await this.subClient.subscribe(channel);
        } catch (error) {
          const msg = (error as Error).message || String(error);
          this.activateMemoryFallback(msg);
        }
      }
    }
    set!.add(handler);
  }

  async unsubscribe(channel: string, handler?: RedisHandler): Promise<void> {
    const set = this.handlers.get(channel);
    if (!set) return;

    if (handler) {
      set.delete(handler);
    } else {
      set.clear();
    }

    if (set.size > 0) return;

    this.handlers.delete(channel);
    if (!this.memoryOnly && this.subClient) {
      try {
        await this.subClient.unsubscribe(channel);
      } catch (error) {
        this.logger.warn(`Redis unsubscribe failed for ${channel}: ${(error as Error).message}`);
      }
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (this.memoryOnly) {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
      this.memoryKv.set(key, { value: stringValue, expiresAt });
      return;
    }
    try {
      if (this.pubClient!.status !== 'ready') {
        await this.pubClient!.connect();
      }
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttlSeconds) {
        await this.pubClient!.set(key, stringValue, 'EX', ttlSeconds);
      } else {
        await this.pubClient!.set(key, stringValue);
      }
    } catch (error) {
      this.activateMemoryFallback((error as Error).message || 'set failed');
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
      this.memoryKv.set(key, { value: stringValue, expiresAt });
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.memoryOnly) {
      const entry = this.memoryKv.get(key);
      if (!entry) return null;
      if (entry.expiresAt != null && Date.now() > entry.expiresAt) {
        this.memoryKv.delete(key);
        return null;
      }
      return entry.value;
    }
    try {
      if (this.pubClient!.status !== 'ready') {
        await this.pubClient!.connect();
      }
      return await this.pubClient!.get(key);
    } catch (error) {
      this.activateMemoryFallback((error as Error).message || 'get failed');
      return this.get(key);
    }
  }

  async del(key: string): Promise<void> {
    if (this.memoryOnly) {
      this.memoryKv.delete(key);
      return;
    }
    try {
      if (this.pubClient!.status !== 'ready') {
        await this.pubClient!.connect();
      }
      await this.pubClient!.del(key);
    } catch (error) {
      this.activateMemoryFallback((error as Error).message || 'del failed');
      this.memoryKv.delete(key);
    }
  }

  async incrementWithTTL(key: string, ttlSeconds: number): Promise<number | null> {
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
      if (this.pubClient!.status !== 'ready') {
        await this.pubClient!.connect();
      }
      const next = await this.pubClient!.incr(key);
      if (next === 1) {
        await this.pubClient!.expire(key, ttlSeconds);
      }
      return next;
    } catch (error) {
      this.activateMemoryFallback((error as Error).message || 'increment failed');
      return this.incrementWithTTL(key, ttlSeconds);
    }
  }

  async onModuleDestroy() {
    try {
      await this.subClient?.quit();
      await this.pubClient?.quit();
    } catch {
      this.subClient?.disconnect(false);
      this.pubClient?.disconnect(false);
    }
  }
}
