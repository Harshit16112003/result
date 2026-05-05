import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, serverTimestamp, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  checkInAt: any;
  checkOutAt?: any;
  durationHours?: number;
}

export function useAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      setAuthenticated(!!user);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!authenticated) {
      setRecords([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'attendance'),
      orderBy('checkInAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recordsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceRecord[];
      setRecords(recordsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching attendance:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [authenticated]);

  return { records, loading, authenticated };
}

export async function processAttendance(userId: string, userName: string) {
  try {
    // Check if there is an active session (checked in, but not checked out)
    const activeSessionQuery = query(
      collection(db, 'attendance'),
      where('userId', '==', userId),
      where('checkOutAt', '==', null)
    );
    
    // We can't query `checkOutAt == null` easily in firestore unless we structure it differently or filter client-side.
    // Instead we can just order by checkInAt desc limit 1 and check client side.
    const recentQuery = query(
      collection(db, 'attendance'),
      where('userId', '==', userId),
      orderBy('checkInAt', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(recentQuery);
    let activeSession = null;
    
    if (!snapshot.empty) {
      const latestDoc = snapshot.docs[0];
      const data = latestDoc.data();
      if (!data.checkOutAt) {
        activeSession = { id: latestDoc.id, ...data };
      }
    }

    if (activeSession) {
      // Check out
      const checkInTime = activeSession.checkInAt.toMillis();
      const checkOutTime = Date.now();
      const durationHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);

      const docRef = doc(db, 'attendance', activeSession.id);
      await updateDoc(docRef, {
        checkOutAt: serverTimestamp(),
        durationHours: Number(durationHours.toFixed(2))
      });

      return { status: 'checked_out', duration: durationHours };
    } else {
      // Check in
      const newDocRef = doc(collection(db, 'attendance'));
      await setDoc(newDocRef, {
        userId,
        userName,
        checkInAt: serverTimestamp()
      });

      return { status: 'checked_in' };
    }
  } catch (error) {
    console.error("Error processing attendance:", error);
    throw error;
  }
}
