import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  doc,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { DefectReport, Style, DefectCategory } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const firebaseService = {
  // Reports
  async saveReport(report: Omit<DefectReport, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, 'reports'), {
        ...report,
        createdAt: new Date().toISOString(),
        serverTimestamp: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reports');
    }
  },

  async getReports() {
    try {
      const q = query(collection(db, 'reports'), orderBy('serverTimestamp', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DefectReport));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'reports');
    }
  },

  listenToReports(callback: (reports: DefectReport[]) => void) {
    const q = query(collection(db, 'reports'), orderBy('serverTimestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DefectReport));
      callback(reports);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports');
    });
  },

  async updateReportStatus(id: string, status: 'pending' | 'resolved') {
    try {
      const docRef = doc(db, 'reports', id);
      await updateDoc(docRef, { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reports/${id}`);
    }
  },

  // Styles
  async getStyles() {
    try {
      const snapshot = await getDocs(collection(db, 'styles'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Style));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'styles');
    }
  },

  async getStyleByBarcode(barcode: string) {
    try {
      const q = query(collection(db, 'styles'), where('barcode', '==', barcode));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Style;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `styles?barcode=${barcode}`);
    }
  },

  // Categories
  async getCategories() {
    try {
      const snapshot = await getDocs(collection(db, 'categories'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as DefectCategory));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    }
  }
};
