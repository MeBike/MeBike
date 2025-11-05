import type { ImagePickerAsset } from 'expo-image-picker';
import { storage, initializeFirebase } from './firebase';

let ref: any;
let uploadBytes: any;
let getDownloadURL: any;
let functionsInitialized = false;

// Safely import Firebase storage functions
const initializeFirebaseStorage = () => {
  if (functionsInitialized) return;
  try {
    const firebaseStorage = require('firebase/storage');
    ref = firebaseStorage.ref;
    uploadBytes = firebaseStorage.uploadBytes;
    getDownloadURL = firebaseStorage.getDownloadURL;
    functionsInitialized = true;
  } catch (error) {
    console.warn('Firebase storage functions initialization warning:', error instanceof Error ? error.message : 'Unknown error');
  }
};

export const uploadImageToFirebase = async (image: ImagePickerAsset): Promise<string> => {
  try {
    // Initialize Firebase before using
    await initializeFirebase();
    initializeFirebaseStorage();

    if (!storage) {
      throw new Error('Firebase Storage not initialized');
    }

    if (!ref || !uploadBytes || !getDownloadURL) {
      throw new Error('Firebase Storage functions not available');
    }

    // Create a unique filename
    const filename = `reports/${Date.now()}_${image.fileName || 'image.jpg'}`;
    const storageRef = ref(storage, filename);

    // Convert URI to blob
    const response = await fetch(image.uri);
    const blob = await response.blob();

    // Upload the image
    const snapshot = await uploadBytes(storageRef, blob);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading image to Firebase:', error);
    throw new Error('Failed to upload image');
  }
};

export const uploadMultipleImagesToFirebase = async (images: ImagePickerAsset[]): Promise<string[]> => {
  try {
    const uploadPromises = images.map(image => uploadImageToFirebase(image));
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('Error uploading multiple images to Firebase:', error);
    throw new Error('Failed to upload images');
  }
};