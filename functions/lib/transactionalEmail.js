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
exports.sendTransactionalEmail = void 0;
const functions = __importStar(require("firebase-functions"));
const firebase_functions_1 = require("firebase-functions");
const crypto_1 = require("crypto");
const firebase_1 = require("./firebase");
const config_1 = require("./config");
const resend_1 = require("./resend");
const emailTemplates_1 = require("./emailTemplates");
const rateLimiter_1 = require("./rateLimiter");
const RUN_OPTIONS = {
    timeoutSeconds: 30,
    memory: '256MB',
    minInstances: 0,
};
const UNAUTH_TEMPLATES = ['verification', 'forgot-password'];
function hashIdentifier(value) {
    return (0, crypto_1.createHash)('sha256').update(value.toLowerCase()).digest('hex');
}
function requireString(value, field) {
    if (typeof value !== 'string' || !value.trim()) {
        throw new functions.https.HttpsError('invalid-argument', `${field} is required`);
    }
    return value.trim();
}
async function buildTemplateInput(template, data, email, context) {
    switch (template) {
        case 'verification': {
            const appUrl = data.link || `${(0, config_1.getAppUrl)()}/dashboard`;
            const link = await firebase_1.admin.auth().generateEmailVerificationLink(email, {
                url: appUrl,
                handleCodeInApp: true,
            });
            return { type: 'verification', link, name: data.name || context.auth?.token?.name };
        }
        case 'forgot-password': {
            const appUrl = data.link || `${(0, config_1.getAppUrl)()}/dashboard`;
            const link = await firebase_1.admin.auth().generatePasswordResetLink(email, {
                url: appUrl,
                handleCodeInApp: true,
            });
            return { type: 'forgot-password', link, name: data.name || context.auth?.token?.name };
        }
        case 'welcome':
            return {
                type: 'welcome',
                name: requireString(data.name || context.auth?.token?.name || 'Friend', 'name'),
                role: data.role || context.auth?.token?.role || 'volunteer',
            };
        case 'project-submission':
        case 'project-approval':
            return {
                type: template,
                name: requireString(data.name || context.auth?.token?.name || 'Friend', 'name'),
                projectName: requireString(data.projectName, 'projectName'),
                submissionType: data.submissionType || 'project',
            };
        case 'reminder':
            return {
                type: 'reminder',
                name: requireString(data.name || context.auth?.token?.name || 'Friend', 'name'),
                projectName: requireString(data.projectName, 'projectName'),
                message: requireString(data.message, 'message'),
            };
        case 'volunteer-confirmation':
            return {
                type: 'volunteer-confirmation',
                name: requireString(data.name || context.auth?.token?.name || 'Friend', 'name'),
            };
        case 'edit-request-submitted':
            return {
                type: 'edit-request-submitted',
                name: requireString(data.name || context.auth?.token?.name || 'Friend', 'name'),
                submissionTitle: requireString(data.submissionTitle, 'submissionTitle'),
                submissionType: data.submissionType || 'project',
            };
        case 'edit-request-status':
            return {
                type: 'edit-request-status',
                name: requireString(data.name || context.auth?.token?.name || 'Friend', 'name'),
                submissionTitle: requireString(data.submissionTitle, 'submissionTitle'),
                submissionType: data.submissionType || 'project',
                status: data.status || 'approved',
                rejectionReason: data.rejectionReason,
            };
        case 'notification':
            return {
                type: 'notification',
                title: requireString(data.title, 'title'),
                body: requireString(data.body, 'body'),
                ctaLabel: data.ctaLabel,
                ctaUrl: data.ctaUrl,
            };
        default:
            throw new functions.https.HttpsError('invalid-argument', `Unsupported template ${template}`);
    }
}
exports.sendTransactionalEmail = functions
    .runWith(RUN_OPTIONS)
    .https.onCall(async (data, context) => {
    const startTime = Date.now();
    const template = data?.template;
    firebase_functions_1.logger.info('sendTransactionalEmail called', {
        template,
        hasAuth: !!context.auth,
        authUid: context.auth?.uid,
        requestEmail: data.email,
    });
    if (!template) {
        firebase_functions_1.logger.warn('sendTransactionalEmail: template missing');
        throw new functions.https.HttpsError('invalid-argument', 'template is required');
    }
    // Auth check: require auth for all templates except verification and forgot-password
    if (!context.auth && !UNAUTH_TEMPLATES.includes(template)) {
        firebase_functions_1.logger.warn('sendTransactionalEmail: unauthenticated request for protected template', {
            template,
        });
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required to send this email');
    }
    const authEmail = context.auth?.token?.email;
    const targetEmail = data.email || authEmail;
    if (!targetEmail) {
        firebase_functions_1.logger.warn('sendTransactionalEmail: email missing');
        throw new functions.https.HttpsError('invalid-argument', 'email is required');
    }
    // For authenticated users, email must match their auth email
    if (context.auth && data.email && data.email !== authEmail) {
        firebase_functions_1.logger.warn('sendTransactionalEmail: email mismatch for authenticated user', {
            authEmail,
            requestedEmail: data.email,
            uid: context.auth.uid,
        });
        throw new functions.https.HttpsError('permission-denied', 'Email does not match authenticated user');
    }
    // For unauthenticated verification requests, verify email matches request body to prevent abuse
    if (!context.auth && template === 'verification') {
        if (!data.email || data.email !== targetEmail) {
            firebase_functions_1.logger.warn('sendTransactionalEmail: verification email mismatch for unauthenticated request', {
                requestedEmail: data.email,
                targetEmail,
            });
            throw new functions.https.HttpsError('invalid-argument', 'Email verification requires email parameter to match request');
        }
    }
    // Rate limiting: per-user or per-email
    const throttleKey = context.auth?.uid
        ? `uid:${context.auth.uid}`
        : `email:${hashIdentifier(targetEmail)}`;
    try {
        await (0, rateLimiter_1.enforceRateLimit)(throttleKey, {
            metadata: { template, email: targetEmail },
        });
        firebase_functions_1.logger.info('sendTransactionalEmail: rate limit check passed', {
            throttleKey: throttleKey.substring(0, 20) + '...', // Partial key for logging
            template,
        });
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError && error.code === 'resource-exhausted') {
            firebase_functions_1.logger.warn('sendTransactionalEmail: rate limit exceeded', {
                throttleKey: throttleKey.substring(0, 20) + '...',
                template,
                uid: context.auth?.uid,
            });
        }
        throw error;
    }
    // Build template input and send email
    let templateInput;
    try {
        templateInput = await buildTemplateInput(template, data, targetEmail, context);
        firebase_functions_1.logger.info('sendTransactionalEmail: template built', { template });
    }
    catch (error) {
        firebase_functions_1.logger.error('sendTransactionalEmail: template build failed', {
            template,
            error: error instanceof Error ? error.message : error,
        });
        throw error;
    }
    const { subject, html } = (0, emailTemplates_1.buildEmailTemplate)(templateInput);
    const result = await (0, resend_1.sendEmail)({
        to: targetEmail,
        subject,
        html,
        type: template, // Pass template type for logging
    });
    const duration = Date.now() - startTime;
    if (!result.success) {
        firebase_functions_1.logger.error('sendTransactionalEmail: email send failed', {
            template,
            error: result.error,
            duration,
            uid: context.auth?.uid,
        });
        throw new functions.https.HttpsError('internal', result.error || 'Failed to send email');
    }
    firebase_functions_1.logger.info('sendTransactionalEmail: success', {
        template,
        messageId: result.messageId,
        duration,
        uid: context.auth?.uid,
    });
    return {
        success: true,
        template,
        messageId: result.messageId,
    };
});
//# sourceMappingURL=transactionalEmail.js.map