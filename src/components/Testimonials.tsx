'use client'
import { useEffect, useState } from 'react'
import { GiScissors } from 'react-icons/gi'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

type Comment = { id: number; name: string; message: string; createdAt: string }

export default function Testimonials() {
  const [comments, setComments] = useState<Comment[]>([])

  useEffect(() => {
    const load = async () => {
      const r = await fetch('/api/comments')
      const data = (await r.json().catch(() => [])) as Comment[]
      setComments(Array.isArray(data) ? data : [])
    }
    load()
  }, [])

  return (
    <section id="testimonios" className="bg-black text-white py-20 px-6">
      {/* ... tu UI + Swiper ... */}
      <Swiper modules={[Autoplay, Pagination]} autoplay={{ delay: 3500, disableOnInteraction: false }} pagination={{ clickable: true }}>
        {comments.map((c) => (
          <SwiperSlide key={c.id}>
            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
              <GiScissors className="mx-auto text-3xl text-yellow-500 mb-3" />
              <blockquote className="text-gray-300 italic text-center">“{c.message}”</blockquote>
              <p className="text-sm text-center mt-3 text-zinc-400">— {c.name}</p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}
