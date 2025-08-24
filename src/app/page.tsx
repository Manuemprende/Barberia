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
import Section from '@/components/Section';

export default function Page() {
  return (
    <>
      <Navbar />

      <Hero
        poster="/hero/poster.jpg"
        webmSrc="/hero/barber.webm"
        mp4Src="/hero/barber.mp4"
      />

      {/* Servicios con fondo y panel translúcido */}
      <Section id="servicios" bg="/sections/img6.jpg" overlayOpacity={0.65}>
        <Services />
      </Section>

      {/* Reserva con un fondo distinto */}
      <Section id="booking" bg="/sections/img2.jpg" overlayOpacity={0.65}>
        <BookingForm />
      </Section>

      {/* Cancelación (puedes reusar mismo fondo o cambiar) */}
      <Section id="cancel" bg="/sections/img3.jpg" overlayOpacity={0.65}>
        <CancelBooking />
      </Section>

      {/* Galería sin tarjeta (contenido directo sobre el fondo) */}
      <Section id="galeria" bg="/sections/img4.jpg" overlayOpacity={0.65} withCard={false}>
        <Gallery />
      </Section>

      {/* Testimonios con tarjeta más clara */}
      <Section id="testimonios" bg="/sections/img5.jpg" overlayOpacity={0.65} cardClassName="bg-black/50">
        <Testimonials />
      </Section>

      {/* Comentarios */}
      <Section id="comentarios" bg="/sections/img6.jpg" overlayOpacity={0.65}>
        <CommentsForm />
      </Section>

      <Footer />
      <Toaster />
    </>
  );
}
