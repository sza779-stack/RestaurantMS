"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CombosModule = void 0;
const common_1 = require("@nestjs/common");
const combos_service_1 = require("./combos.service");
const combos_controller_1 = require("./combos.controller");
const websocket_module_1 = require("../websocket/websocket.module");
let CombosModule = class CombosModule {
};
exports.CombosModule = CombosModule;
exports.CombosModule = CombosModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => websocket_module_1.WebSocketModule)],
        controllers: [combos_controller_1.CombosController],
        providers: [combos_service_1.CombosService],
        exports: [combos_service_1.CombosService],
    })
], CombosModule);
//# sourceMappingURL=combos.module.js.map