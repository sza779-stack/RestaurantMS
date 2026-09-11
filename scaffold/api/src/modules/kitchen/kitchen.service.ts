import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class KitchenService {
  constructor(private prisma: PrismaService) {}

  async getTickets(storeId: string, station?: string) {
    return [];
  }

  async updateTicketStatus(id: string, status: string) {
    return { id, status };
  }

  async createTicket(data: any) {
    return data;
  }
}
