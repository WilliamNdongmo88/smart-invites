const admin = require('firebase-admin');
// const path = require('path');

// const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_BUCKET_NAME 
});

const bucket = admin.storage().bucket();

module.exports = { admin, bucket };
