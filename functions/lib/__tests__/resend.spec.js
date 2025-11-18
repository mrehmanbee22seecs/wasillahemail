"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resend_1 = require("../resend");
const mockSend = jest.fn();
jest.mock('resend', () => {
    return {
        Resend: jest.fn().mockImplementation(() => ({
            emails: {
                send: mockSend,
            },
        })),
    };
});
jest.mock('../config', () => ({
    getResendConfig: jest.fn(() => ({
        apiKey: 'test-key',
        sender: 'noreply@example.com',
    })),
}));
describe('sendEmail', () => {
    beforeEach(() => {
        mockSend.mockReset();
        (0, resend_1.resetResendClient)();
    });
    it('sends successfully', async () => {
        mockSend.mockResolvedValue({ data: { id: '123' } });
        const result = await (0, resend_1.sendEmail)({
            to: 'user@example.com',
            subject: 'Hello',
            html: '<p>Hi</p>',
        });
        expect(result.success).toBe(true);
        expect(result.messageId).toBe('123');
        expect(mockSend).toHaveBeenCalledTimes(1);
    });
    it('validates payload', async () => {
        await expect((0, resend_1.sendEmail)({ to: '', subject: '', html: '' })).rejects.toThrow('At least one recipient is required');
    });
    it('retries once on transient error', async () => {
        const transientError = Object.assign(new Error('timeout'), { status: 500 });
        mockSend
            .mockRejectedValueOnce(transientError)
            .mockResolvedValueOnce({ data: { id: '456' } });
        const result = await (0, resend_1.sendEmail)({
            to: 'user@example.com',
            subject: 'Retry',
            html: '<p>Retry</p>',
        });
        expect(result.success).toBe(true);
        expect(mockSend).toHaveBeenCalledTimes(2);
    });
    it('returns failure when resend responds with error', async () => {
        mockSend.mockResolvedValue({ error: new Error('Bad request') });
        const result = await (0, resend_1.sendEmail)({
            to: 'user@example.com',
            subject: 'Test',
            html: '<p>Test</p>',
        });
        expect(result.success).toBe(false);
        expect(result.error).toBe('Bad request');
    });
});
//# sourceMappingURL=resend.spec.js.map