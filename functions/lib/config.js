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
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtimeEnvironment = void 0;
exports.getResendConfig = getResendConfig;
exports.getAppUrl = getAppUrl;
exports.getHostingUrl = getHostingUrl;
exports.resetCachedConfig = resetCachedConfig;
const firebase_functions_1 = require("firebase-functions");
const functions = __importStar(require("firebase-functions"));
const ONE_TIME_WARNINGS = new Set();
let cachedResendConfig = null;
let cachedRuntimeConfig = null;
const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true' ||
    process.env.NODE_ENV === 'development';
function loadRuntimeConfig() {
    if (cachedRuntimeConfig) {
        return cachedRuntimeConfig;
    }
    try {
        cachedRuntimeConfig = functions.config();
    }
    catch (error) {
        if (!ONE_TIME_WARNINGS.has('config')) {
            ONE_TIME_WARNINGS.add('config');
            firebase_functions_1.logger.warn('firebase functions:config not available. Run `firebase functions:config:set resend.api_key="..." resend.sender="..."` before deploying.');
        }
        cachedRuntimeConfig = {};
    }
    return cachedRuntimeConfig;
}
function resolveConfigValue(localValue, configValue, fallback) {
    if (localValue !== null && localValue !== undefined && `${localValue}`.length) {
        return localValue;
    }
    if (configValue !== null && configValue !== undefined && `${configValue}`.length) {
        return configValue;
    }
    if (fallback !== undefined) {
        return fallback;
    }
    throw new Error('CONFIG_VALUE_MISSING');
}
function getResendConfig() {
    if (cachedResendConfig) {
        return cachedResendConfig;
    }
    const runtimeConfig = loadRuntimeConfig();
    try {
        const apiKey = resolveConfigValue(process.env.RESEND_API_KEY, runtimeConfig?.resend?.api_key);
        const sender = resolveConfigValue(process.env.RESEND_SENDER, runtimeConfig?.resend?.sender);
        cachedResendConfig = { apiKey, sender };
        // Validate at cold start (first load)
        if (!apiKey || !sender) {
            const guidance = isEmulator
                ? '\n\n🔧 Local Development: Create functions/.env file with:\n  RESEND_API_KEY=re_xxx\n  RESEND_SENDER=noreply@wasillah.live'
                : '\n\n🔧 Production: Run `firebase functions:config:set resend.api_key="re_xxx" resend.sender="noreply@wasillah.live"`';
            firebase_functions_1.logger.error(`Missing Resend configuration at cold start.${guidance}\n\nSee functions/.env.example for template.`);
            throw new Error('RESEND_CONFIG_MISSING: Required RESEND_API_KEY and RESEND_SENDER not configured');
        }
        firebase_functions_1.logger.info('Resend config loaded successfully', {
            hasApiKey: !!apiKey,
            sender,
            source: isEmulator ? 'env' : 'functions.config()',
        });
    }
    catch (error) {
        if (error instanceof Error && error.message === 'CONFIG_VALUE_MISSING') {
            const guidance = isEmulator
                ? '\n\n🔧 Local Development: Create functions/.env file with:\n  RESEND_API_KEY=re_xxx\n  RESEND_SENDER=noreply@wasillah.live'
                : '\n\n🔧 Production: Run `firebase functions:config:set resend.api_key="re_xxx" resend.sender="noreply@wasillah.live"`';
            if (!ONE_TIME_WARNINGS.has('resend')) {
                ONE_TIME_WARNINGS.add('resend');
                firebase_functions_1.logger.error(`Missing Resend configuration.${guidance}\n\nSee functions/.env.example for template.`);
            }
        }
        throw error;
    }
    return cachedResendConfig;
}
function getAppUrl() {
    const runtimeConfig = loadRuntimeConfig();
    return (process.env.APP_URL ||
        runtimeConfig?.app?.url ||
        'https://wasilah-new.web.app');
}
function getHostingUrl() {
    const runtimeConfig = loadRuntimeConfig();
    return (process.env.FIREBASE_HOSTING_URL ||
        runtimeConfig?.hosting?.url);
}
function resetCachedConfig() {
    cachedResendConfig = null;
    cachedRuntimeConfig = null;
}
exports.runtimeEnvironment = {
    isEmulator,
};
//# sourceMappingURL=config.js.map