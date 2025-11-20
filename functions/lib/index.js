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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTransactionalEmail = exports.updateKnowledgeBase = exports.sendTestEmail = exports.helloWorld = exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const resend_1 = require("./resend");
const updateKb_1 = require("./updateKb");
const transactionalEmail_1 = require("./transactionalEmail");
Object.defineProperty(exports, "sendTransactionalEmail", { enumerable: true, get: function () { return transactionalEmail_1.sendTransactionalEmail; } });
const app_1 = __importDefault(require("./api/app"));
// REST API endpoint
exports.api = functions.https.onRequest(app_1.default);
// Example HTTP function
exports.helloWorld = functions.https.onRequest(async (req, res) => {
    res.send('Hello from Firebase Functions!');
});
// Example email trigger function
exports.sendTestEmail = functions.https.onRequest(async (req, res) => {
    try {
        const result = await (0, resend_1.sendEmail)({
            to: 'recipient@example.com',
            subject: 'Test Email',
            html: '<h1>Hello World</h1>',
        });
        res.send(result);
    }
    catch (error) {
        res.status(500).send(error instanceof Error ? error.message : 'Unknown error');
    }
});
// Example KB update function trigger
exports.updateKnowledgeBase = functions.https.onRequest(async (req, res) => {
    try {
        const result = await (0, updateKb_1.updateKb)(req.body);
        res.send(result);
    }
    catch (error) {
        res.status(500).send(error instanceof Error ? error.message : 'Unknown error');
    }
});
//# sourceMappingURL=index.js.map