import { Controller, Get, Post, Body, Param, Put, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { KitchenService } from './kitchen.service';

@ApiTags('Kitchen')
@ApiBearerAuth()
@Controller('kitchen')
export class KitchenController {
  constructor(private readonly kitchenService: KitchenService) {}

  @Get('tickets')
  getTickets(
    @Query('storeId') storeId: string,
    @Query('station') station?: string,
  ) {
    return this.kitchenService.getTickets(storeId, station);
  }

  @Post('tickets')
  createTicket(@Body() data: any) {
    return this.kitchenService.createTicket(data);
  }

  @Put('tickets/:id/status')
  updateTicketStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.kitchenService.updateTicketStatus(id, status);
  }
}
