"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const addons_service_1 = require("./addons.service");
const prisma_service_1 = require("../../prisma/prisma.service");
describe('AddonsService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                addons_service_1.AddonsService,
                { provide: prisma_service_1.PrismaService, useValue: {} },
            ],
        }).compile();
        service = module.get(addons_service_1.AddonsService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=addons.service.spec.js.map