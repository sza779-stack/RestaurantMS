import { PrismaService } from '../../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
export declare class OvenTimerService {
    private readonly prisma;
    private readonly websocketGateway;
    private readonly logger;
    private readonly activeTimers;
    private readonly COOK_TIMES;
    private readonly CATEGORY_KEYWORDS;
    constructor(prisma: PrismaService, websocketGateway: WebsocketGateway);
    startOvenTimer(orderId: string, storeId: string): Promise<void>;
    cancelOvenTimer(orderId: string): void;
    hasActiveTimer(orderId: string): boolean;
    getRemainingTime(orderId: string): number | null;
    private calculateCookTime;
    private getItemCookTime;
    private handleOvenTimerComplete;
    cleanup(): void;
}
