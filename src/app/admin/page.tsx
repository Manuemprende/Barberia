"use client";

import { useAdminMetrics } from "@/hooks/useAdminMetrics";

export default function AdminDashboard() {
  const { data, loading } = useAdminMetrics();

  if (loading) return <p className="text-white">Cargando métricas...</p>;
  if (!data) return <p className="text-red-500">Error al cargar métricas</p>;

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Dashboard Admin</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg">Citas de Hoy</h2>
          <p className="text-3xl font-bold">{data.totalHoy}</p>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg">Próximas Citas</h2>
          <p className="text-3xl font-bold">{data.proximas.length}</p>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg">Comentarios</h2>
          <p className="text-3xl font-bold">{data.totalComentarios}</p>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg">Servicios Activos</h2>
          <p className="text-3xl font-bold">{data.totalServicios}</p>
        </div>
      </div>
    </div>
  );
}
