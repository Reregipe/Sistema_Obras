import { useEffect, useState } from 'react';
import { getAcionamentos, Acionamento } from '../services/api';

export function useAcionamentos() {
  const [data, setData] = useState<Acionamento[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAcionamentos()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
