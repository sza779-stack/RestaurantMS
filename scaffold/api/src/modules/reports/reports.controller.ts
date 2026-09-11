import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  getSalesReport(
    @Query('storeId') storeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getSalesReport(
      storeId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('pl')
  getPLReport(
    @Query('companyId') companyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getPLReport(
      companyId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('multi-store')
  getMultiStoreOverview(
    @Query('companyId') companyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getMultiStoreOverview(
      companyId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('rankings')
  getStorePerformanceRanking(
    @Query('companyId') companyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getStorePerformanceRanking(
      companyId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('insights')
  getGlobalInsights(
    @Query('companyId') companyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getGlobalInsights(
      companyId,
      new Date(startDate),
      new Date(endDate),
    );
  }
}
