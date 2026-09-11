import { KitchenService } from './kitchen.service';
export declare class KitchenController {
    private readonly kitchenService;
    constructor(kitchenService: KitchenService);
    getTickets(storeId: string, station?: string): Promise<any[]>;
    createTicket(data: any): Promise<any>;
    updateTicketStatus(id: string, status: string): Promise<{
        id: string;
        status: string;
    }>;
}
