
// useFirestoreCollection.ts

import { useState, useEffect } from 'react';
import { collection, getDocs, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Define a common interface for data fetched from a collection
interface FirestoreDocument extends DocumentData {
  id: string; // The required document ID
}

// Define the shape of the hook's return value
interface HookState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch all documents from a specified Firestore collection.
 * @param collectionName The name of the Firestore collection (e.g., 'category').
 * @returns An object containing the data, loading state, and error message.
 */
export function useFirestoreCollection<T extends FirestoreDocument>(
  collectionName: string
): HookState<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const collectionRef = collection(db, collectionName);
        const querySnapshot = await getDocs(collectionRef);

        const fetchedData = (querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<T, 'id'>) // Explicitly cast the data
        })) as T[]);

        setData(fetchedData);
      } catch (err) {
        console.error(`Error fetching collection '${collectionName}':`, err);
        setError(`Failed to load data from '${collectionName}'.`);
        setData([]); // Clear data on error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [collectionName]); // Re-run if the collection name changes

  return { data, loading, error };
}
