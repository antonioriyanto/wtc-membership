import { useEffect, useState } from 'react';
import { doc, onSnapshot, DocumentSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Member } from '../types';

/**
 * Granular single-document hook streaming live point balance, tier, and transaction updates
 * directly to Customer PWA in <500ms without collection-level listener overhead.
 */
export function useMemberLiveProfile(memberId: string | null) {
  const [profile, setProfile] = useState<Member | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!memberId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const memberDocRef = doc(db, 'members', memberId);

    const unsubscribe = onSnapshot(
      memberDocRef,
      (docSnap: DocumentSnapshot) => {
        if (docSnap.exists()) {
          setProfile({ id: docSnap.id, ...(docSnap.data() as any) });
          setError(null);
        } else {
          setProfile(null);
          setError('Profile document not found');
        }
        setLoading(false);
      },
      (err) => {
        console.warn(`[useMemberLiveProfile] Snapshot stream error for ${memberId}:`, err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memberId]);

  return { profile, loading, error };
}
