"use client";

import { useEffect, useState } from "react";

type Metrics = {
  totalHoy: number;
  proximas: any[];
  totalComentarios: number;
  totalServicios: number;
};

export function useAdminMetrics() {
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch("/api/admin/metrics");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Error cargando métricas:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  return { data, loading };
}
