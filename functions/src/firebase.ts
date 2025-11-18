import * as admin from 'firebase-admin';

const app = admin.apps.length ? admin.app() : admin.initializeApp();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

export { admin, app, db, FieldValue, Timestamp };
