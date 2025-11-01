// useFirestoreCollection.ts

import { db } from "@/lib/firebase";
import {
  type DocumentData,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
  collection,
  getDocs,
  limit,
  query,
  startAfter,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";

// Define a common interface for data fetched from a collection
interface FirestoreDocument extends DocumentData {
  id: string; // The required document ID
}

// Define the shape of the hook's options
interface FirestoreCollectionOptions {
  pageSize: number;
}

// Define the shape of the hook's return value
interface HookState<T> {
  data: T[];
  loading: boolean; // True during initial load (page 1)
  loadingMore: boolean; // True when loading subsequent pages
  error: string | null;
  hasMore: boolean; // True if more documents might exist
  loadMore: () => Promise<void>; // Function to load the next page
  reload: () => Promise<void>; // Function to clear data and reload page 1
}

/**
 * Custom hook to fetch documents from a Firestore collection with pagination.
 * @param collectionName The name of the Firestore collection (e.g., 'category').
 * @param options An object containing pagination options, like `pageSize`.
 * @returns An object containing the data, loading states, error, and pagination functions.
 */
export function useFirestoreCollection<T extends FirestoreDocument>(
  collectionName: string,
  options: FirestoreCollectionOptions,
): HookState<T> {
  const { pageSize } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Helper to process a QuerySnapshot and extract data + last doc
  const processSnapshot = (
    snapshot: QuerySnapshot<DocumentData>,
  ): { processedData: T[]; lastVisibleDoc: QueryDocumentSnapshot | null } => {
    const fetchedData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<T, "id">),
    })) as T[];

    const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1] || null;
    return { processedData: fetchedData, lastVisibleDoc };
  };

  // Function to fetch the FIRST page (or reload)
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    setHasMore(true); // Assume there's more until proven otherwise
    setLastDoc(null); // Reset cursor

    try {
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, limit(pageSize));
      const querySnapshot = await getDocs(q);

      const { processedData, lastVisibleDoc } = processSnapshot(querySnapshot);

      setData(processedData);
      setLastDoc(lastVisibleDoc);
      // If we fetched *less* than the page size, we're at the end.
      setHasMore(processedData.length === pageSize);
    } catch (err) {
      console.error(`Error fetching collection '${collectionName}':`, err);
      setError(`Failed to load data from '${collectionName}'.`);
      setData([]);
      setHasMore(false); // Can't fetch more if first load failed
    } finally {
      setLoading(false);
    }
  }, [collectionName, pageSize]); // Re-run if collection or page size changes

  // Function to fetch the NEXT page
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const loadMore = useCallback(async () => {
    // Don't fetch if already loading, or if there are no more docs, or if we don't have a cursor
    if (loadingMore || !hasMore || !lastDoc) {
      if (!lastDoc && hasMore) {
        // This case means reload() returned 0 docs.
        setHasMore(false);
      }
      return;
    }

    setLoadingMore(true);
    setError(null);

    try {
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, startAfter(lastDoc), limit(pageSize));
      const querySnapshot = await getDocs(q);

      const { processedData, lastVisibleDoc } = processSnapshot(querySnapshot);

      if (processedData.length > 0) {
        setData((prevData) => [...prevData, ...processedData]);
        setLastDoc(lastVisibleDoc);
        setHasMore(processedData.length === pageSize);
      } else {
        // We loaded a page and got 0 docs, so we're at the end.
        setHasMore(false);
      }
    } catch (err) {
      console.error(`Error loading more data from '${collectionName}':`, err);
      setError(`Failed to load more data from '${collectionName}'.`);
      // Don't clear existing data, just report the error
    } finally {
      setLoadingMore(false);
    }
  }, [collectionName, pageSize, lastDoc, hasMore, loadingMore]);

  // Initial fetch (runs reload)
  useEffect(() => {
    reload();
    // We pass `reload` in the dependency array.
    // This ensures it re-runs if collectionName or pageSize changes.
  }, [reload]);

  return { data, loading, loadingMore, error, hasMore, loadMore, reload };
}
