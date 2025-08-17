'use client'

import { Toaster } from 'react-hot-toast' // ⬅️ AÑADE ESTA LÍNEA
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Services from '@/components/Services'
import BookingForm from '@/components/BookingForm'
import CancelBooking from '@/components/CancelBooking'
import Gallery from '@/components/Gallery'
import Testimonials from '@/components/Testimonials'
import CommentsForm from '@/components/CommentsForm'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="bg-black text-white">
      <Navbar />
      <Hero />
      <Services />
      <BookingForm />
      <CancelBooking />
      <Gallery />
      <Testimonials />
      <CommentsForm />
      <Footer />

      {/* Toaster visible en toda la página */}
      <Toaster position="top-center" reverseOrder={false} />
    </div>
  )
}
