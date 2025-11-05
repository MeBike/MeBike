// Firebase configuration - lazy initialization to avoid errors at startup
let storage: any = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

async function initializeFirebase(): Promise<void> {
  // Return existing promise if already initializing
  if (initPromise) {
    return initPromise;
  }

  // Return if already initialized
  if (isInitialized) {
    return;
  }

  // Create initialization promise
  initPromise = new Promise((resolve) => {
    try {
      const { initializeApp } = require('firebase/app');
      const { getStorage } = require('firebase/storage');

      // Firebase configuration
      const firebaseConfig = {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      };

      // Initialize Firebase
      const app = initializeApp(firebaseConfig);

      // Initialize Cloud Storage
      storage = getStorage(app);
      isInitialized = true;

      resolve();
    } catch (error) {
      console.warn('Firebase initialization warning:', error instanceof Error ? error.message : 'Unknown error');
      isInitialized = true; // Mark as initialized even on error to prevent retry loops
      resolve();
    }
  });

  return initPromise;
}

export { storage, initializeFirebase };