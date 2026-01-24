import { useEffect, useState } from 'react';
import { getEquipes, Equipe } from '../services/api';

export function useEquipes() {
  const [data, setData] = useState<Equipe[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEquipes()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
