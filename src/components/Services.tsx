
//src/components/Gallery.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from "framer-motion";
import { FaCut, FaUserTie, FaPaintBrush, FaHotTub, FaRegClock } from 'react-icons/fa'

// Define the type for a single service based on the Prisma schema
interface Service {
  id: number;
  name: string;
  price: number;
  duration: number;
}

// Helper function to get an icon based on the service name
const getServiceIcon = (serviceName: string) => {
  const name = serviceName.toLowerCase();
  if (name.includes('corte')) return <FaCut size={40} className="text-yellow-500" />;
  if (name.includes('afeitado')) return <FaHotTub size={40} className="text-yellow-500" />;
  if (name.includes('barba')) return <FaUserTie size={40} className="text-yellow-500" />;
  if (name.includes('tinte') || name.includes('color')) return <FaPaintBrush size={40} className="text-yellow-500" />;
  return <FaCut size={40} className="text-yellow-500" />; // Default icon
};

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        console.log('Fetching services...');
        const response = await fetch('/api/services');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Services data received:', data, 'Type:', typeof data, 'Is array:', Array.isArray(data));
        
        // CORREGIDO: Verificar que data sea un array antes de asignarlo
        if (Array.isArray(data)) {
          setServices(data);
        } else {
          console.warn('API did not return an array:', data);
          setServices([]);
          // Si hay un mensaje de error en la respuesta, mostrarlo
          if (data?.error) {
            setError(`Error de API: ${data.error}`);
          } else {
            setError('La API no devolvió un formato válido');
          }
        }
      } catch (err) {
        console.error('Error fetching services:', err);
        const errorMessage = err instanceof Error ? err.message : 'Un error desconocido ocurrió';
        setError(`Error al cargar los servicios: ${errorMessage}`);
        setServices([]); // Asegurar que services sea un array vacío
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 16 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: 'easeOut',
        delay: i * 0.08
      }
    })
  };

  return (
    <section id="services" className="py-20 px-6 bg-black text-white">
      <div className="max-w-6xl mx-auto text-center space-y-10">
        <h2 className="text-4xl font-bold text-yellow-500">Nuestros Servicios</h2>
        <p className="text-gray-300 text-lg">
          Profesionalismo, precisión y estilo en cada corte.
        </p>

        {loading && (
          <div className="flex justify-center">
            <div className="text-lg text-yellow-500">Cargando servicios...</div>
          </div>
        )}
        
        {error && (
          <div className="text-center">
            <p className="text-lg text-red-400 bg-red-900/20 p-4 rounded-lg">{error}</p>
          </div>
        )}

        {/* CORREGIDO: Verificación adicional antes del map */}
        {!loading && !error && Array.isArray(services) && services.length > 0 && (
          <motion.div
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {services.map((service, index) => (
              <motion.article
                key={service.id}
                custom={index}
                variants={cardVariants}
                whileHover={{ scale: 1.03 }}
                className="group relative overflow-hidden rounded-xl bg-zinc-900 p-6 shadow-md transition
                           hover:shadow-yellow-500/30 border border-zinc-800"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition
                                duration-300 bg-gradient-to-b from-yellow-500/5 to-transparent" />

                <div className="flex justify-center mb-5">{getServiceIcon(service.name)}</div>

                <h3 className="text-xl font-semibold mb-4">{service.name}</h3>

                <div className="flex justify-center items-center gap-2 mt-2 text-yellow-500 font-semibold text-lg">
                  <FaRegClock className="text-yellow-500" />
                  <span>{service.duration} min</span>
                  <span className="mx-2 text-yellow-600">•</span>
                  <span className="text-xl font-bold">${new Intl.NumberFormat('es-CL').format(service.price)}</span>
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}

        {/* Mensaje si no hay servicios */}
        {!loading && !error && (!services || services.length === 0) && (
          <div className="text-center text-gray-400 py-8">
            No hay servicios disponibles
          </div>
        )}
      </div>
    </section>
  )
}