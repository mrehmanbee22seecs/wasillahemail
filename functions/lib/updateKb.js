"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateKb = updateKb;
const firebase_1 = require("./firebase");
async function updateKb(data) {
    if (!data || !data.id || !data.content) {
        throw new Error('Invalid KB update data');
    }
    const docRef = firebase_1.db.collection('knowledgeBase').doc(data.id);
    await docRef.set({
        content: data.content,
        updatedAt: firebase_1.Timestamp.now(),
    }, { merge: true });
    return { success: true, id: data.id };
}
//# sourceMappingURL=updateKb.js.map