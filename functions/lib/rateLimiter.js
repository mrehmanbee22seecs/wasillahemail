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
exports.enforceRateLimit = enforceRateLimit;
const functions = __importStar(require("firebase-functions"));
const firebase_1 = require("./firebase");
const WINDOW_MS = 60 * 60 * 1000;
const MAX_EMAILS_PER_WINDOW = 5;
const COLLECTION = 'email_throttle';
async function enforceRateLimit(key, options) {
    if (!key) {
        throw new functions.https.HttpsError('invalid-argument', 'Throttle key is required');
    }
    const limit = options?.limit ?? MAX_EMAILS_PER_WINDOW;
    const windowMs = options?.windowMs ?? WINDOW_MS;
    const now = Date.now();
    const windowStart = now - windowMs;
    const docRef = firebase_1.db.collection(COLLECTION).doc(key);
    await firebase_1.db.runTransaction(async (tx) => {
        const snap = await tx.get(docRef);
        const data = snap.data();
        if (!snap.exists || !data?.windowStart || data.windowStart.toMillis() < windowStart) {
            tx.set(docRef, {
                count: 1,
                windowStart: firebase_1.Timestamp.fromMillis(now),
                updatedAt: firebase_1.FieldValue.serverTimestamp(),
                expiresAt: firebase_1.Timestamp.fromMillis(now + 2 * windowMs),
                metadata: options?.metadata || {},
            });
            return;
        }
        if (data.count >= limit) {
            throw new functions.https.HttpsError('resource-exhausted', 'Hourly email quota exceeded. Please try again later.');
        }
        tx.update(docRef, {
            count: firebase_1.FieldValue.increment(1),
            updatedAt: firebase_1.FieldValue.serverTimestamp(),
            metadata: options?.metadata || {},
        });
    });
}
//# sourceMappingURL=rateLimiter.js.map