import { useState, useEffect } from 'react';
import { isStoragePersisted, getStorageEstimate } from '../lib/storage';

interface StorageEstimate {
  usage: number;
  quota: number;
}

interface StoragePersistenceState {
  isPersisted: boolean;
  estimate: StorageEstimate;
}

export function useStoragePersistence(): StoragePersistenceState {
  const [state, setState] = useState<StoragePersistenceState>({
    isPersisted: false,
    estimate: { usage: 0, quota: 0 },
  });

  useEffect(() => {
    async function checkStorage() {
      try {
        const persisted = await isStoragePersisted();
        const estimate = await getStorageEstimate();
        
        setState({
          isPersisted: persisted,
          estimate,
        });
      } catch (error) {
        console.error('Error checking storage persistence:', error);
      }
    }

    checkStorage();
  }, []);

  return state;
}
