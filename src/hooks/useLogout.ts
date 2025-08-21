'use client';

import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import { useState, useCallback } from 'react';

export function useLogout() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const logout = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const r = await fetch('/api/auth/logout', { method: 'POST' });
      if (!r.ok) throw new Error('logout_failed');
      toast('Sesión cerrada correctamente.');
      router.push('/admin/login');
      router.refresh();
    } catch {
      toast('No se pudo cerrar la sesión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [loading, router]);

  return { logout, loading };
}
