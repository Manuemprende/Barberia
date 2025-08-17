'use client'

import { motion } from 'framer-motion'
import { FaCut, FaUserTie, FaPaintBrush, FaHotTub, FaRegClock } from 'react-icons/fa'

export default function Services() {
  const services = [
    {
      title: 'Corte Clásico',
      description: 'Estilo tradicional con precisión moderna. Ideal para cualquier ocasión.',
      price: '$8.000',
      duration: '45 min',
      icon: <FaCut size={40} className="text-yellow-500" />
    },
    {
      title: 'Afeitado Premium',
      description: 'Afeitado con toalla caliente, espuma rica y navaja profesional.',
      price: '$6.000',
      duration: '30 min',
      icon: <FaHotTub size={40} className="text-yellow-500" />
    },
    {
      title: 'Perfilado de Barba',
      description: 'Diseño perfecto para tu rostro. Limpio, simétrico y con estilo.',
      price: '$5.000',
      duration: '30 min',
      icon: <FaUserTie size={40} className="text-yellow-500" />
    },
    {
      title: 'Corte + Barba',
      description: 'Pack completo para renovar tu imagen de forma integral.',
      price: '$12.000',
      duration: '1 hora',
      icon: <FaPaintBrush size={40} className="text-yellow-500" />
    },
    {
      title: 'Tinte o Color',
      description: 'Cubre canas o transforma tu look con productos de alta calidad.',
      price: '$15.000',
      duration: '1 hora',
      icon: <FaPaintBrush size={40} className="text-yellow-500" />
    }
  ]

  // Variants para entrada tipo zoom + fade
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 16 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: 'easeOut',
        delay: i * 0.08 // pequeña cascada
      }
    })
  }

  return (
    <section id="services" className="py-20 px-6 bg-black text-white">
      <div className="max-w-6xl mx-auto text-center space-y-10">
        <h2 className="text-4xl font-bold text-yellow-500">Nuestros Servicios</h2>
        <p className="text-gray-300 text-lg">
          Profesionalismo, precisión y estilo en cada corte.
        </p>

        <motion.div
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {services.map((service, index) => (
            <motion.article
              key={service.title}
              custom={index}
              variants={cardVariants}
              // Hover zoom + borde luminiscente sutil
              whileHover={{ scale: 1.03 }}
              className="group relative overflow-hidden rounded-xl bg-zinc-900 p-6 shadow-md transition
                         hover:shadow-yellow-500/30 border border-zinc-800"
            >
              {/* halo suave en hover */}
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition
                              duration-300 bg-gradient-to-b from-yellow-500/5 to-transparent" />

              <div className="flex justify-center mb-5">{service.icon}</div>

              <h3 className="text-xl font-semibold mb-2">{service.title}</h3>

              <p className="text-gray-300 mb-5 leading-relaxed">
                {service.description}
              </p>

              <div className="flex justify-center items-center gap-2 mt-2 text-yellow-500 font-semibold text-lg">
                <FaRegClock className="text-yellow-500" />
                <span>{service.duration}</span>
                <span className="mx-2 text-yellow-600">•</span>
                <span className="text-xl font-bold">{service.price}</span>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
