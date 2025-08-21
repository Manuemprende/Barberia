'use client';

import { useEffect, useState } from 'react';

export type AdminMetrics = {
  today: { total: number; paid: number; unpaid: number };
  revenue: { day: number; week: number; month: number };
  upcoming24h: Array<{
    id: number;
    start: string;
    end: string;
    status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
    customerName: string;
    service?: { name: string | null } | null;
    barber?: { name: string | null } | null;
  }>;
  services: { total: number };
  barbers: { total: number };
  comments: { visibleCount: number };
  now: string;
};

export function useAdminMetrics(pollMs = 60_000) {
  const [data, setData]   = useState<AdminMetrics | null>(null);
  const [loading, setLo]  = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLo(true);
      const r = await fetch('/api/admin/metrics', { cache: 'no-store' });
      if (!r.ok) throw new Error('bad_status');
      const j = (await r.json()) as AdminMetrics;
      setData(j);
      setError(null);
    } catch (e) {
      setError('metrics_failed');
    } finally {
      setLo(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, pollMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error, reload: load };
}
