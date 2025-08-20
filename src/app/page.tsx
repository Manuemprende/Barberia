'use client';

import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import BookingForm from '@/components/BookingForm';
import CancelBooking from '@/components/CancelBooking';
import Gallery from '@/components/Gallery';
import Testimonials from '@/components/Testimonials';
import CommentsForm from '@/components/CommentsForm';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Services />
      <BookingForm />   {/* Aquí se renderiza el formulario de reserva al cargar la página */}
      <CancelBooking />
      <Gallery />
      <Testimonials />
      <CommentsForm />
      <Footer />
      <Toaster />       {/* Para mostrar notificaciones toast en toda la página */}
    </>
  );
}
