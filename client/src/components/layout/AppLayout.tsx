import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { Footer } from './Footer'

export const AppLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  // Full-width routes without sidebar
  const isFullWidthRoute =
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/register'

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <div className="flex-1 flex w-full">
        {!isFullWidthRoute && (
          <Sidebar
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          />
        )}

        <main className={`flex-1 flex flex-col min-w-0 ${!isFullWidthRoute ? 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto' : ''}`}>
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  )
}
