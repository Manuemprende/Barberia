'use client'

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center bg-black text-white px-6 overflow-hidden"
    >
      {/* 🖼 Imagen de fondo */}
      <img
        src="./video/7801349.jpg"
        alt="Fondo de barbería"
        className="absolute top-0 left-0 w-full h-full object-cover z-[-2]"
      />

      {/* 🟤 Capa oscura encima de la imagen */}
      <div className="absolute top-0 left-0 w-full h-full bg-black opacity-60 z-[-1]" />

      {/* 🔤 Contenido */}
      <div className="max-w-4xl text-center space-y-6 z-10">
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
          Donde cada corte cuenta una historia
        </h1>
        <p className="text-gray-300 text-lg md:text-xl">
          Bienvenido a <strong>Corte Maestro</strong>, la barbería donde el estilo se encuentra con la precisión.
          Agenda tu cita y transforma tu look.
        </p>
        <a
          href="#booking"
          className="inline-block bg-yellow-600 hover:bg-red-700 px-6 py-3 rounded-lg text-white font-semibold text-lg transition"
        >
          Reserva tu hora
        </a>
      </div>
    </section>
  )
}
