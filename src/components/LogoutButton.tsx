'use client';

import { useLogout } from '@/hooks/useLogout';

export default function LogoutButton() {
  const { logout, loading } = useLogout();
  return (
    <button
      onClick={logout}
      className="text-red-300 hover:text-red-400"
      disabled={loading}
      title="Cerrar sesión"
    >
      {loading ? 'Saliendo…' : 'Salir'}
    </button>
  );
}
