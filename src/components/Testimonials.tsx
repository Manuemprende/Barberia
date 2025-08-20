'use client';

import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Autoplay } from 'swiper/modules';
import { FaQuoteLeft, FaUserCircle } from 'react-icons/fa';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

type Comment = { id: number; name: string; message: string; createdAt: string };

export default function Testimonials() {
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    const fetchComments = async () => {
      const r = await fetch('/api/comments');
      const data = (await r.json().catch(() => [])) as Comment[];
      setComments(Array.isArray(data) ? data : []);
    };

    fetchComments(); // carga inicial

    // refresca cada 60 segundos (60 000 ms)
    const intervalId = setInterval(() => {
      fetchComments();
    }, 60_000);

    // limpieza al desmontar el componente
    return () => clearInterval(intervalId);
  }, []);

  return (
    <section className="bg-black text-white py-20">
      <h2 className="text-center text-3xl font-bold text-yellow-500 mb-6">
        Lo que dicen nuestros clientes
      </h2>
      <div className="max-w-5xl mx-auto px-4">
        <Swiper
          modules={[Pagination, Navigation, Autoplay]}
          autoplay={{ delay: 5000 }}
          loop
          pagination={{ clickable: true }}
          navigation
          spaceBetween={30}
          slidesPerView={1}
          breakpoints={{
            // 2 tarjetas en pantallas medianas y 3 en grandes
            640: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="pb-10"
        >
          {comments.map((c) => (
            <SwiperSlide key={c.id}>
              <div className="h-full bg-[#131313] border border-yellow-600 rounded-lg p-6 shadow-lg flex flex-col justify-between">
                <div>
                  <FaQuoteLeft className="text-yellow-500 text-3xl mb-4" />
                  <p className="text-gray-200 italic leading-relaxed mb-4">
                    “{c.message}”
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-auto">
                  <FaUserCircle className="text-yellow-500 text-4xl" />
                  <div>
                    <p className="font-semibold text-white">{c.name}</p>
                    {/* Si quieres mostrar la fecha:
                    <p className="text-sm text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString('es-CL')}
                    </p>
                    */}
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
