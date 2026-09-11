"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataManagementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const WEB_DEV_APPS = {
    'web-admin': { dir: 'web-admin', offset: 0 },
    'web-online': { dir: 'web-online', offset: 1 },
    'web-kds': { dir: 'web-kds', offset: 2 },
    'web-packing': { dir: 'web-packing', offset: 3 },
    'web-osdu': { dir: 'web-osdu', offset: 4 },
    'web-driver': { dir: 'web-driver', offset: 5 },
};
let DataManagementService = class DataManagementService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    assertWebDevSpawnAllowed() {
        const isProd = process.env.NODE_ENV === 'production';
        const forcedAllow = process.env.ALLOW_WEB_DEV_SPAWN === 'true';
        if (isProd && !forcedAllow) {
            throw new common_1.ForbiddenException('Starting local dev servers is disabled in production. Set ALLOW_WEB_DEV_SPAWN=true on the API if you intend this.');
        }
    }
    async runCommand(command, timeoutMs = 10 * 60 * 1000) {
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
    getDockerComposePath() {
        const localDockerPath = path.resolve(process.cwd(), '../docker/docker-compose.yml');
        return localDockerPath;
    }
    async stopDockerServices(services) {
        const composePath = this.getDockerComposePath();
        const serviceList = services && services.length > 0
            ? services.join(' ')
            : 'postgres redis minio api web-admin web-online web-kds web-packing web-osdu web-driver';
        const command = `docker compose -f "${composePath}" stop ${serviceList}`;
        return this.runCommand(command);
    }
    async startDockerServices(services) {
        const composePath = this.getDockerComposePath();
        const serviceList = services && services.length > 0
            ? services.join(' ')
            : 'postgres redis minio api web-admin web-online web-kds web-packing web-osdu web-driver';
        const command = `docker compose -f "${composePath}" up -d ${serviceList}`;
        return this.runCommand(command);
    }
    async createDatabaseBackup() {
        const tables = await this.prisma.$queryRawUnsafe(`SELECT tablename
       FROM pg_tables
       WHERE schemaname = 'public'
       ORDER BY tablename`);
        const records = {};
        let rowCount = 0;
        for (const table of tables) {
            const rows = await this.prisma.$queryRawUnsafe(`SELECT * FROM "${table.tablename}"`);
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
        const resetResult = await this.runCommand('npx prisma migrate reset --force --skip-generate --skip-seed');
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
        const resetResult = await this.runCommand('npx prisma migrate reset --force --skip-generate --skip-seed');
        const syncResult = await this.runCommand('npx prisma db push');
        return {
            message: 'Database reset to clean slate',
            resetResult,
            syncResult,
        };
    }
    startWebDevServer(appKey) {
        this.assertWebDevSpawnAllowed();
        const entry = WEB_DEV_APPS[appKey];
        if (!entry) {
            throw new common_1.BadRequestException(`Unknown app key: ${appKey}`);
        }
        const appDir = path.resolve(process.cwd(), '..', entry.dir);
        return new Promise((resolve, reject) => {
            const child = (0, child_process_1.spawn)('npm', ['run', 'dev'], {
                cwd: appDir,
                detached: true,
                stdio: 'ignore',
                shell: true,
                env: { ...process.env },
            });
            child.on('error', (err) => reject(err));
            child.unref();
            if (child.pid === undefined) {
                reject(new common_1.BadRequestException('Failed to spawn npm run dev'));
                return;
            }
            resolve({
                message: `npm run dev started for ${entry.dir}`,
                pid: child.pid,
                cwd: appDir,
            });
        });
    }
};
exports.DataManagementService = DataManagementService;
exports.DataManagementService = DataManagementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DataManagementService);
//# sourceMappingURL=data-management.service.js.map