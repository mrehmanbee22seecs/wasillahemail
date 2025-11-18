"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = sendVerificationEmail;
exports.sendWelcomeEmail = sendWelcomeEmail;
const resend_1 = require("./resend");
async function sendVerificationEmail(to) {
    const payload = {
        to,
        subject: 'Verify Your Email',
        html: '<p>Please verify your email by clicking <a href="#">here</a>.</p>',
        type: 'verification',
    };
    return await (0, resend_1.sendEmail)(payload);
}
async function sendWelcomeEmail(to) {
    const payload = {
        to,
        subject: 'Welcome!',
        html: '<p>Welcome to our platform!</p>',
        type: 'welcome',
    };
    return await (0, resend_1.sendEmail)(payload);
}
//# sourceMappingURL=emailFunctions.js.map