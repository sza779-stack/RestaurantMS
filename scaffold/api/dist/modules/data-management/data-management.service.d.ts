import { PrismaService } from '../../prisma/prisma.service';
export declare class DataManagementService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private assertWebDevSpawnAllowed;
    private runCommand;
    private getDockerComposePath;
    stopDockerServices(services?: string[]): Promise<{
        command: string;
        stdout: string;
        stderr: string;
    }>;
    startDockerServices(services?: string[]): Promise<{
        command: string;
        stdout: string;
        stderr: string;
    }>;
    createDatabaseBackup(): Promise<{
        fileName: string;
        json: string;
        tableCount: number;
        rowCount: number;
        savedPath: string;
    }>;
    loadTestData(): Promise<{
        command: string;
        stdout: string;
        stderr: string;
        message: string;
        resetResult: {
            command: string;
            stdout: string;
            stderr: string;
        };
        syncResult: {
            command: string;
            stdout: string;
            stderr: string;
        };
    }>;
    resetToCleanSlate(): Promise<{
        message: string;
        resetResult: {
            command: string;
            stdout: string;
            stderr: string;
        };
        syncResult: {
            command: string;
            stdout: string;
            stderr: string;
        };
    }>;
    startWebDevServer(appKey: string): Promise<{
        message: string;
        pid: number;
        cwd: string;
    }>;
}
