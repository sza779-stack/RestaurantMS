import { Body, Controller, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DataManagementService } from './data-management.service';

@UseGuards(JwtAuthGuard)
@Controller('admin/data-management')
export class DataManagementController {
  constructor(private readonly dataManagementService: DataManagementService) {}

  @Post('docker/stop')
  @HttpCode(HttpStatus.OK)
  async stopDocker(@Body('services') services?: string[]) {
    return this.dataManagementService.stopDockerServices(services);
  }

  @Post('docker/start')
  @HttpCode(HttpStatus.OK)
  async startDocker(@Body('services') services?: string[]) {
    return this.dataManagementService.startDockerServices(services);
  }

  @Post('backup')
  @HttpCode(HttpStatus.OK)
  async backup(@Res() res: Response) {
    const backup = await this.dataManagementService.createDatabaseBackup();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${backup.fileName}"`);
    res.send(backup.json);
  }

  @Post('load-test-data')
  @HttpCode(HttpStatus.OK)
  async loadTestData() {
    return this.dataManagementService.loadTestData();
  }

  @Post('reset-clean-slate')
  @HttpCode(HttpStatus.OK)
  async resetCleanSlate(@Body('confirmText') confirmText?: string) {
    if (confirmText !== 'RESET') {
      return {
        message: 'Confirmation text mismatch. Send confirmText = "RESET" to continue.',
      };
    }
    return this.dataManagementService.resetToCleanSlate();
  }

  /** Spawn `npm run dev` for a web-* workspace folder (local testing; guarded in service). */
  @Post('web-dev/start')
  @HttpCode(HttpStatus.OK)
  async startWebDev(@Body('appKey') appKey?: string) {
    return this.dataManagementService.startWebDevServer(String(appKey || ''));
  }
}

