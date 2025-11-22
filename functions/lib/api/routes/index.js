"use strict";
/**
 * Main Routes
 * Aggregates all API routes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const projects_routes_1 = __importDefault(require("./projects.routes"));
const events_routes_1 = __importDefault(require("./events.routes"));
const ngos_routes_1 = __importDefault(require("./ngos.routes"));
const users_routes_1 = __importDefault(require("./users.routes"));
const admin_routes_1 = __importDefault(require("./admin.routes"));
const analytics_routes_1 = __importDefault(require("./analytics.routes"));
const webhooks_routes_1 = __importDefault(require("./webhooks.routes"));
const router = (0, express_1.Router)();
// API health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'ok',
            version: '1.0.0',
            timestamp: new Date(),
        },
    });
});
// Mount resource routes
router.use('/projects', projects_routes_1.default);
router.use('/events', events_routes_1.default);
router.use('/ngos', ngos_routes_1.default);
router.use('/users', users_routes_1.default);
router.use('/admin', admin_routes_1.default);
router.use('/analytics', analytics_routes_1.default);
router.use('/webhooks', webhooks_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map