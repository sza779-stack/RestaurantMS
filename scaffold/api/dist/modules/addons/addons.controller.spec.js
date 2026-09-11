"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const addons_controller_1 = require("./addons.controller");
const addons_service_1 = require("./addons.service");
describe('AddonsController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [addons_controller_1.AddonsController],
            providers: [{ provide: addons_service_1.AddonsService, useValue: {} }],
        }).compile();
        controller = module.get(addons_controller_1.AddonsController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=addons.controller.spec.js.map