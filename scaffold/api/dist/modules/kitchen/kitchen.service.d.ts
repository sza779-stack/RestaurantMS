import { PrismaService } from '../../prisma/prisma.service';
export declare class KitchenService {
    private prisma;
    constructor(prisma: PrismaService);
    getTickets(storeId: string, station?: string): Promise<any[]>;
    updateTicketStatus(id: string, status: string): Promise<{
        id: string;
        status: string;
    }>;
    createTicket(data: any): Promise<any>;
}
