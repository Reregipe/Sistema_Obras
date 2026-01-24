import { useEffect, useState } from 'react';
import { getUsuarios, Usuario } from '../services/api';

export function useUsuarios() {
  const [data, setData] = useState<Usuario[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getUsuarios()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
