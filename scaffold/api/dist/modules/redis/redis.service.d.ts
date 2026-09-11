import { OnModuleDestroy } from '@nestjs/common';
type RedisHandler = (payload: any) => void;
export declare class RedisPubSubService implements OnModuleDestroy {
    private readonly logger;
    private pubClient;
    private subClient;
    private readonly handlers;
    private memoryOnly;
    private readonly memoryKv;
    private readonly memoryCounters;
    private fallbackLogged;
    constructor();
    private activateMemoryFallback;
    private dispatchLocal;
    publish(channel: string, payload: any): Promise<void>;
    subscribe(channel: string, handler: RedisHandler): Promise<void>;
    unsubscribe(channel: string, handler?: RedisHandler): Promise<void>;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<void>;
    incrementWithTTL(key: string, ttlSeconds: number): Promise<number | null>;
    onModuleDestroy(): Promise<void>;
}
export {};
