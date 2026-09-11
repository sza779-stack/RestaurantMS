"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataManagementController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const data_management_service_1 = require("./data-management.service");
let DataManagementController = class DataManagementController {
    constructor(dataManagementService) {
        this.dataManagementService = dataManagementService;
    }
    async stopDocker(services) {
        return this.dataManagementService.stopDockerServices(services);
    }
    async startDocker(services) {
        return this.dataManagementService.startDockerServices(services);
    }
    async backup(res) {
        const backup = await this.dataManagementService.createDatabaseBackup();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${backup.fileName}"`);
        res.send(backup.json);
    }
    async loadTestData() {
        return this.dataManagementService.loadTestData();
    }
    async resetCleanSlate(confirmText) {
        if (confirmText !== 'RESET') {
            return {
                message: 'Confirmation text mismatch. Send confirmText = "RESET" to continue.',
            };
        }
        return this.dataManagementService.resetToCleanSlate();
    }
    async startWebDev(appKey) {
        return this.dataManagementService.startWebDevServer(String(appKey || ''));
    }
};
exports.DataManagementController = DataManagementController;
__decorate([
    (0, common_1.Post)('docker/stop'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('services')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], DataManagementController.prototype, "stopDocker", null);
__decorate([
    (0, common_1.Post)('docker/start'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('services')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], DataManagementController.prototype, "startDocker", null);
__decorate([
    (0, common_1.Post)('backup'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DataManagementController.prototype, "backup", null);
__decorate([
    (0, common_1.Post)('load-test-data'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DataManagementController.prototype, "loadTestData", null);
__decorate([
    (0, common_1.Post)('reset-clean-slate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('confirmText')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DataManagementController.prototype, "resetCleanSlate", null);
__decorate([
    (0, common_1.Post)('web-dev/start'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('appKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DataManagementController.prototype, "startWebDev", null);
exports.DataManagementController = DataManagementController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('admin/data-management'),
    __metadata("design:paramtypes", [data_management_service_1.DataManagementService])
], DataManagementController);
//# sourceMappingURL=data-management.controller.js.map