'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

type Props = {
  poster?: string;        // e.g. '/hero/danny.png'
  mp4Src?: string;        // e.g. '/hero/barber.mp4'
  webmSrc?: string;       // e.g. '/hero/barber.webm'
};

export default function Hero({
  poster = '/hero/danny.png',
  mp4Src = '/hero/barber.mp4',
  webmSrc = '/hero/barber.webm',
}: Props) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handle = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.('change', handle);
    return () => mq.removeEventListener?.('change', handle);
  }, []);

  return (
    <section className="relative h-[90vh] min-h-[560px] w-full overflow-hidden bg-black">
      {/* Video fondo */}
      {!reduced && (mp4Src || webmSrc) ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={poster}
        >
          {webmSrc && <source src={webmSrc} type="video/webm" />}
          {mp4Src && <source src={mp4Src} type="video/mp4" />}
        </video>
      ) : (
        // Fallback imagen si reduce-motion o no hay video
        <Image
          src={poster}
          alt="Fondo barbería"
          fill
          priority
          className="object-cover"
        />
      )}

      {/* Overlay oscuro + leve degradado dorado */}
      <div className="absolute inset-0 bg-black/60" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-yellow-500/5" />

      {/* Contenido */}
      <div className="relative z-10 flex h-full items-center justify-center px-6">
        <div className="max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight">
            Donde cada corte cuenta <br className="hidden md:block" />
            <span className="text-white">una historia</span>
          </h1>
          <p className="mt-4 text-gray-200 max-w-2xl mx-auto">
            Bienvenido a <span className="font-semibold text-yellow-400">Danny The Barber</span>,
            estilo con precisión. Agenda tu cita y transforma tu look.
          </p>

          <button
            onClick={() =>
              document.querySelector('#booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
            className="mt-8 inline-block rounded-md bg-gradient-to-r from-yellow-400 to-yellow-600 px-6 py-3 font-semibold text-black shadow-md hover:from-yellow-500 hover:to-yellow-700 transition-colors"
          >
            Reserva tu hora
          </button>
        </div>
      </div>
    </section>
  );
}
