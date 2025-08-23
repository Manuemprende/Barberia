// src/components/Gallery.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';

type GalleryItem = {
  id: number | string;
  // NUEVO: campos reales que devuelve tu API
  url?: string;
  alt?: string | null;

  // Compatibilidad con estructura anterior
  title?: string;
  imageUrl?: string;
  src?: string;
  visible?: boolean;
};

export default function Gallery() {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const isOpen = openIndex !== null;

  const open = (idx: number) => setOpenIndex(idx);
  const close = () => setOpenIndex(null);

  const prev = useCallback(() => {
    if (openIndex === null || images.length === 0) return;
    setOpenIndex((i) => (i! - 1 + images.length) % images.length);
  }, [openIndex, images.length]);

  const next = useCallback(() => {
    if (openIndex === null || images.length === 0) return;
    setOpenIndex((i) => (i! + 1) % images.length);
  }, [openIndex, images.length]);

  // --- CORREGIDO: función de carga con mejor manejo de errores ---
  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching gallery images...');
      const res = await fetch('/api/gallery?visible=1', { cache: 'no-store' });
      
      // Verificar si la respuesta es exitosa
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('Gallery data received:', data, 'Type:', typeof data, 'Is array:', Array.isArray(data));
      
      // Verificación más robusta
      if (Array.isArray(data)) {
        setImages(data);
      } else {
        console.warn('API did not return an array:', data);
        setImages([]);
        if (data?.error) {
          setError(`Error de API: ${data.error}`);
        }
      }
    } catch (err) {
      console.error('Error al cargar imágenes:', err);
      setError(`No se pudieron cargar las imágenes: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Navegación por teclado
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, prev, next]);

  // --- NUEVO: refrescar al volver al foco/visibilidad ---
  useEffect(() => {
    const onFocus = () => fetchImages();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchImages();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchImages]);

  // --- NUEVO: escuchar BroadcastChannel + fallback storage ---
  useEffect(() => {
    let ch: BroadcastChannel | null = null;

    try {
      ch = new BroadcastChannel('gallery');
      ch.onmessage = (ev) => {
        if (ev?.data?.type === 'refresh') fetchImages();
      };
    } catch {
      // algunos navegadores antiguos no soportan BroadcastChannel
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'gallery:refresh') fetchImages();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      if (ch) ch.close();
      window.removeEventListener('storage', onStorage);
    };
  }, [fetchImages]);

  return (
    <section id="galeria" className="bg-black text-white py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-10">
          <span className="px-4 py-1 rounded-full bg-zinc-800 text-xs uppercase tracking-wider inline-block">
            Nuestro Trabajo
          </span>
          <h2 className="text-4xl font-bold text-yellow-500">Galería de Estilos</h2>
          <p className="text-gray-400 text-lg">
            Una muestra de nuestros cortes de precisión y estilos exclusivos.
          </p>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="mb-4 h-64 bg-zinc-900/70 animate-pulse rounded-xl"
              />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="text-center text-red-400 p-4 bg-red-900/20 rounded-lg">
            {error}
          </div>
        )}

        {/* CORREGIDO: Verificación adicional antes del map */}
        {!loading && !error && Array.isArray(images) && (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {images.map((img, idx) => {
              // NUEVO: prioriza url/alt de la API; mantiene compatibilidad
              const url =
                img.url || img.imageUrl || img.src || '';
              const title =
                (img.alt ?? undefined) || img.title || 'Imagen';

              if (!url) return null;
              return (
                <button
                  key={img.id}
                  onClick={() => open(idx)}
                  className="group mb-4 w-full break-inside-avoid overflow-hidden rounded-xl bg-zinc-900/40 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  title={title}
                >
                  <div className="relative">
                    <img
                      src={url}
                      alt={title}
                      loading="lazy"
                      className="w-full h-auto object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20" />
                  </div>
                  {title && (
                    <div className="p-3 text-sm text-gray-300">{title}</div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Mostrar mensaje si no hay imágenes */}
        {!loading && !error && (!images || images.length === 0) && (
          <div className="text-center text-gray-400 py-8">
            No hay imágenes para mostrar
          </div>
        )}
      </div>

      {/* Lightbox - CORREGIDO: Verificaciones adicionales */}
      {isOpen && openIndex !== null && Array.isArray(images) && images[openIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={close}
        >
          <div
            className="relative max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={
                images[openIndex].url ||
                images[openIndex].imageUrl ||
                images[openIndex].src ||
                ''
              }
              alt={
                images[openIndex].alt ??
                images[openIndex].title ??
                'Imagen'
              }
              className="max-h-[80vh] w-full object-contain rounded-lg"
            />
            {/* Caption */}
            {(images[openIndex].alt || images[openIndex].title) && (
              <div className="mt-3 text-center text-gray-300">
                {images[openIndex].alt ?? images[openIndex].title}
              </div>
            )}

            {/* Controls */}
            <button
              onClick={close}
              className="absolute -top-3 -right-3 bg-yellow-500 text-black rounded-full w-9 h-9 font-bold shadow hover:scale-105 transition"
              aria-label="Cerrar"
              title="Cerrar"
            >
              ×
            </button>

            <button
              onClick={prev}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-full w-10 h-10 flex items-center justify-center"
              aria-label="Anterior"
              title="Anterior"
            >
              ‹
            </button>

            <button
              onClick={next}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-full w-10 h-10 flex items-center justify-center"
              aria-label="Siguiente"
              title="Siguiente"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </section>
  );
}