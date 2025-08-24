'use client';

import React from 'react';

type Props = {
  bg?: string;                 // ruta en /public, ej: /bg/services.jpg
  overlayOpacity?: number;     // 0..1 (default 0.35)
  className?: string;
  id?: string;
  children: React.ReactNode;
  withCard?: boolean;          // si quieres el panel negro translúcido
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
      {/* Overlay oscuro (transparente) */}
      <div
        className="absolute inset-0 -z-10"
        style={{ background: `rgba(0,0,0,${overlayOpacity})` }}
      />

      <div className="mx-auto max-w-6xl px-6 py-12">
        {withCard ? (
          <div className={`rounded-2xl border border-yellow-600/30 bg-black/60 backdrop-blur-sm shadow-[0_10px_40px_rgba(0,0,0,.4)] ${cardClassName}`}>
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
