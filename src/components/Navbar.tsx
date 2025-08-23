'use client'

import { useEffect, useState } from 'react'
import { FaBars, FaTimes } from 'react-icons/fa'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('')

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  const navLinks = [
    { label: 'Inicio', href: '#hero' },
    { label: 'Servicios', href: '#services' },
    { label: 'Reserva', href: '#booking' },
    { label: 'Galería', href: '#galeria' },
    { label: 'Testimonios', href: '#testimonios' },
    { label: 'Comentarios', href: '#comentarios' }
  ]

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200 // buffer por el header fijo

      const sections = navLinks.map(link => {
        const section = document.querySelector(link.href)
        return section ? { id: link.href, offsetTop: section.getBoundingClientRect().top + window.scrollY } : null
      }).filter(Boolean) as { id: string, offsetTop: number }[]

      const current = sections.reverse().find(section => scrollPosition >= section.offsetTop)

      if (current) {
        setActiveSection(current.id)
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // inicial

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-black shadow-md">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between text-white">
        <a href="#hero" className="text-2xl font-bold text-yellow-500">Danny The Barber</a>

        <ul className="hidden md:flex gap-6 items-center text-sm font-semibold mx-auto">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={closeMenu}
                className={`transition ${
                  activeSection === link.href ? 'text-yellow-500' : 'text-white hover:text-yellow-500'
                }`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="md:hidden">
          <button onClick={toggleMenu}>
            {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-black border-t border-zinc-800 px-6 pb-4">
          <ul className="space-y-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={closeMenu}
                  className={`block transition ${
                    activeSection === link.href ? 'text-yellow-500' : 'text-white hover:text-yellow-500'
                  }`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  )
}
