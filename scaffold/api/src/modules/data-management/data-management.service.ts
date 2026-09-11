import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { exec as execCallback, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(execCallback);

/** Sequential local web ports, ordered by order flow from entry to fulfillment. */
const WEB_DEV_APPS: Record<string, { dir: string; offset: number }> = {
  'web-admin': { dir: 'web-admin', offset: 0 },
  'web-online': { dir: 'web-online', offset: 1 },
  'web-kds': { dir: 'web-kds', offset: 2 },
  'web-packing': { dir: 'web-packing', offset: 3 },
  'web-osdu': { dir: 'web-osdu', offset: 4 },
  'web-driver': { dir: 'web-driver', offset: 5 },
};

@Injectable()
export class DataManagementService {
  constructor(private readonly prisma: PrismaService) {}

  private assertWebDevSpawnAllowed() {
    const isProd = process.env.NODE_ENV === 'production';
    const forcedAllow = process.env.ALLOW_WEB_DEV_SPAWN === 'true';
    if (isProd && !forcedAllow) {
      throw new ForbiddenException(
        'Starting local dev servers is disabled in production. Set ALLOW_WEB_DEV_SPAWN=true on the API if you intend this.',
      );
    }
  }

  private async runCommand(command: string, timeoutMs = 10 * 60 * 1000) {
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024 * 16,
    });
    return {
      command,
      stdout: (stdout || '').trim(),
      stderr: (stderr || '').trim(),
    };
  }

  private getDockerComposePath(): string {
    const localDockerPath = path.resolve(process.cwd(), '../docker/docker-compose.yml');
    return localDockerPath;
  }

  async stopDockerServices(services?: string[]) {
    const composePath = this.getDockerComposePath();
    const serviceList = services && services.length > 0
      ? services.join(' ')
	      : 'postgres redis minio api web-admin web-online web-kds web-packing web-osdu web-driver';
    const command = `docker compose -f "${composePath}" stop ${serviceList}`;
    return this.runCommand(command);
  }

  async startDockerServices(services?: string[]) {
    const composePath = this.getDockerComposePath();
    const serviceList = services && services.length > 0
      ? services.join(' ')
	      : 'postgres redis minio api web-admin web-online web-kds web-packing web-osdu web-driver';
    const command = `docker compose -f "${composePath}" up -d ${serviceList}`;
    return this.runCommand(command);
  }

  async createDatabaseBackup() {
    const tables = await this.prisma.$queryRawUnsafe<Array<{ tablename: string }>>(
      `SELECT tablename
       FROM pg_tables
       WHERE schemaname = 'public'
       ORDER BY tablename`,
    );

    const records: Record<string, any[]> = {};
    let rowCount = 0;
    for (const table of tables) {
      const rows = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM "${table.tablename}"`,
      );
      records[table.tablename] = rows;
      rowCount += rows.length;
    }

    const exportedAt = new Date().toISOString();
    const fileName = `backup-${exportedAt.replace(/[:.]/g, '-')}.json`;
    const payload = {
      meta: {
        exportedAt,
        tableCount: tables.length,
        rowCount,
      },
      data: records,
    };
    const json = JSON.stringify(payload, null, 2);
    const backupDir = path.resolve(process.cwd(), 'backups');
    await fs.mkdir(backupDir, { recursive: true });
    await fs.writeFile(path.join(backupDir, fileName), json, 'utf8');

    return {
      fileName,
      json,
      tableCount: tables.length,
      rowCount,
      savedPath: path.join(backupDir, fileName),
    };
  }

  async loadTestData() {
    const resetResult = await this.runCommand(
      'npx prisma migrate reset --force --skip-generate --skip-seed',
    );
    const syncResult = await this.runCommand('npx prisma db push');
    const seedResult = await this.runCommand('npx prisma db seed');
    return {
      message: 'Test data loaded',
      resetResult,
      syncResult,
      ...seedResult,
    };
  }

  async resetToCleanSlate() {
    const resetResult = await this.runCommand(
      'npx prisma migrate reset --force --skip-generate --skip-seed',
    );
    const syncResult = await this.runCommand('npx prisma db push');
    return {
      message: 'Database reset to clean slate',
      resetResult,
      syncResult,
    };
  }

  /**
   * Spawns `npm run dev` for a scaffold web-* app (detached). API cwd must be `scaffold/api`.
   */
  startWebDevServer(appKey: string) {
    this.assertWebDevSpawnAllowed();
    const entry = WEB_DEV_APPS[appKey];
    if (!entry) {
      throw new BadRequestException(`Unknown app key: ${appKey}`);
    }
    const appDir = path.resolve(process.cwd(), '..', entry.dir);
    return new Promise<{ message: string; pid: number; cwd: string }>((resolve, reject) => {
      const child = spawn('npm', ['run', 'dev'], {
        cwd: appDir,
        detached: true,
        stdio: 'ignore',
        shell: true,
        env: { ...process.env },
      });
      child.on('error', (err) => reject(err));
      child.unref();
      if (child.pid === undefined) {
        reject(new BadRequestException('Failed to spawn npm run dev'));
        return;
      }
      resolve({
        message: `npm run dev started for ${entry.dir}`,
        pid: child.pid,
        cwd: appDir,
      });
    });
  }
}
