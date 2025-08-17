'use client';

import { useEffect, useState, useCallback } from 'react';

type GalleryItem = {
  id: number | string;
  title?: string;
  imageUrl?: string; // preferido
  src?: string;      // compatibilidad
};

export default function Gallery() {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lightbox
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

  // Keyboard navigation
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

  // Fetch
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/gallery');
        const data = await res.json();

        if (Array.isArray(data)) {
          setImages(data);
        } else {
          console.error('Respuesta inválida:', data);
          setImages([]);
        }
      } catch (err) {
        console.error('Error al cargar imágenes:', err);
        setError('No se pudieron cargar las imágenes.');
        setImages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

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
          <div className="text-center text-red-400">{error}</div>
        )}

        {/* Masonry grid */}
        {!loading && !error && (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {images.map((img, idx) => {
              const url = img.imageUrl || img.src || '';
              const title = img.title || 'Imagen';

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
      </div>

      {/* Lightbox */}
      {isOpen && openIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={close}
        >
          <div
            className="relative max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[openIndex].imageUrl || images[openIndex].src || ''}
              alt={images[openIndex].title || 'Imagen'}
              className="max-h-[80vh] w-full object-contain rounded-lg"
            />
            {/* Caption */}
            {images[openIndex].title && (
              <div className="mt-3 text-center text-gray-300">
                {images[openIndex].title}
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
