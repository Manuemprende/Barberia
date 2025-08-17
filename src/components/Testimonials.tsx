'use client'

import { useEffect, useState } from 'react'
import { GiScissors } from 'react-icons/gi'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

export default function Testimonials() {
  const [comments, setComments] = useState<any[]>([])

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch('/api/comments')
        const data = await res.json()
        setComments(data)
      } catch (error) {
        console.error('Error al cargar comentarios', error)
      }
    }

    fetchComments()
  }, [])

  return (
    <section
      id="testimonios"
      className="bg-black text-white py-20 px-6 animate-fade"
    >
      <div className="max-w-5xl mx-auto text-center space-y-6">
        <span className="px-4 py-1 rounded-full bg-zinc-800 text-xs uppercase tracking-wider text-white inline-block animate-fade">
          Opiniones
        </span>
        <h2 className="text-4xl font-bold text-yellow-500 animate-fade">
          Lo que Dicen Nuestros Clientes
        </h2>
        <p className="text-gray-400 text-lg animate-fade">
          Nuestra comunidad habla por nosotros. Conoce las experiencias reales de quienes nos prefieren.
        </p>

        <div className="mt-10 animate-fade">
          <Swiper
            modules={[Pagination, Autoplay]}
            spaceBetween={20}
            breakpoints={{
              320: { slidesPerView: 1 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 2 }
            }}
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            loop
            speed={600}
          >
            {comments.map((t, index) => (
              <SwiperSlide key={index}>
                <div
                  className="group bg-zinc-900 border border-zinc-800 p-6 rounded-lg shadow-lg hover:shadow-yellow-500/30 
                  transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-[1.02] relative h-full 
                  flex flex-col justify-center"
                >
                  <GiScissors
                    className="text-yellow-500 text-3xl absolute top-4 left-4 group-hover:rotate-12 transition-transform duration-300"
                    title="Cliente feliz"
                  />
                  <div className="flex flex-col items-center justify-center mt-10 text-center space-y-4">
                    <p className="text-gray-300 italic text-lg max-w-xs">“{t.message}”</p>
                    <span className="text-yellow-500 font-semibold text-sm">— {t.name}</span>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  )
}
