// src/components/Section.tsx
'use client';

import React from 'react';

type Props = {
  /** Imagen de fondo de la sección (ruta pública, p.ej. /bg/services.jpg) */
  bg?: string;
  /** Opacidad del overlay negro (0 a 1). Default 0.35 */
  overlayOpacity?: number;
  /** Clases extra para el <section> */
  className?: string;
  /** id opcional (anclaje) */
  id?: string;
  /** Contenido de la sección */
  children: React.ReactNode;
  /** Mostrar tarjeta translúcida sobre el fondo */
  withCard?: boolean;
  /** Clases extra para la tarjeta */
  cardClassName?: string;
};

export default function Section({
  bg,
  overlayOpacity = 0.35,
  className = '',
  id,
  children,
  withCard = true,
  cardClassName = '',
}: Props) {
  return (
    <section
      id={id}
      className={`relative isolate ${className}`}
      style={
        bg
          ? {
              backgroundImage: `url(${bg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
            }
          : undefined
      }
    >
      {/* Overlay oscuro para contraste */}
      <div
        className="absolute inset-0 -z-10"
        style={{ background: `rgba(0,0,0,${overlayOpacity})` }}
      />

      <div className="mx-auto max-w-6xl px-6 py-12">
        {withCard ? (
          <div
            className={`rounded-2xl border border-yellow-600/30 bg-black/60 backdrop-blur-sm shadow-[0_10px_40px_rgba(0,0,0,.4)] ${cardClassName}`}
          >
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
