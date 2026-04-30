import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Simple connection test only if properly configured
async function testConnection() {
  if (firebaseConfig.apiKey.includes('remixed-')) {
    console.log('Firebase: skipping connection test (manual configuration required)');
    return;
  }
  
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase: Connected successfully');
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn("Firebase: Client appears to be offline or config is invalid.");
    }
  }
}

testConnection();
