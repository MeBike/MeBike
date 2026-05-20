import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY
          ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
          : undefined,
      }),
      // QUAN TRỌNG: Link Realtime Database của bạn
      databaseURL: "https://uploadimgikoi-default-rtdb.asia-southeast1.firebasedatabase.app"
    });
    console.log("Firebase Admin Initialized Successfully");
  } catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
  }
}

export const firebaseAdmin = admin;