import type { Response } from 'express';
import { DataManagementService } from './data-management.service';
export declare class DataManagementController {
    private readonly dataManagementService;
    constructor(dataManagementService: DataManagementService);
    stopDocker(services?: string[]): Promise<{
        command: string;
        stdout: string;
        stderr: string;
    }>;
    startDocker(services?: string[]): Promise<{
        command: string;
        stdout: string;
        stderr: string;
    }>;
    backup(res: Response): Promise<void>;
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
    resetCleanSlate(confirmText?: string): Promise<{
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
    } | {
        message: string;
    }>;
    startWebDev(appKey?: string): Promise<{
        message: string;
        pid: number;
        cwd: string;
    }>;
}
