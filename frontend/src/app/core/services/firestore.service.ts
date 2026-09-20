import { Injectable } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Firestore,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  private db: Firestore;

  constructor() {
    const app = getApps().length === 0 ? initializeApp(environment.firebase) : getApp();
    this.db = getFirestore(app);
  }

  public getDb(): Firestore {
    return this.db;
  }

  public async getCollection<T>(collectionName: string, constraints: QueryConstraint[] = []): Promise<T[]> {
    try {
      const colRef = collection(this.db, collectionName);
      const q = query(colRef, ...constraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          _id: d.id,
          ...data,
        } as unknown as T;
      });
    } catch (err) {
      console.error(`Error querying ${collectionName}:`, err);
      throw err;
    }
  }

  public async getDocument<T>(collectionName: string, id: string): Promise<T | null> {
    try {
      const docRef = doc(this.db, collectionName, id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return {
        id: docSnap.id,
        _id: docSnap.id,
        ...docSnap.data(),
      } as unknown as T;
    } catch (err) {
      console.error(`Error fetching doc ${collectionName}/${id}:`, err);
      throw err;
    }
  }

  public async setDocument<T extends DocumentData>(collectionName: string, id: string, data: T): Promise<void> {
    const docRef = doc(this.db, collectionName, id);
    await setDoc(docRef, data, { merge: true });
  }

  public async addDocument<T extends DocumentData>(collectionName: string, data: T): Promise<string> {
    const colRef = collection(this.db, collectionName);
    const docRef = await addDoc(colRef, data);
    return docRef.id;
  }

  public async updateDocument(collectionName: string, id: string, data: Partial<DocumentData>): Promise<void> {
    const docRef = doc(this.db, collectionName, id);
    await updateDoc(docRef, data);
  }

  public async deleteDocument(collectionName: string, id: string): Promise<void> {
    const docRef = doc(this.db, collectionName, id);
    await deleteDoc(docRef);
  }
}
