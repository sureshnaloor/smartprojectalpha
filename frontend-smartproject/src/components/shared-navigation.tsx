import React, { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '@/contexts/auth-context'
import { UserProfile } from '@/components/user-profile'
import { Button } from '@/components/ui/button'

interface SharedNavigationProps {
  variant?: 'landing' | 'app'
}

export const SharedNavigation: React.FC<SharedNavigationProps> = ({ variant = 'app' }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [location, setLocation] = useLocation()
  const { authenticated, user, login } = useAuth()

  useEffect(() => {
    // Add scroll effect to header
    const handleScroll = () => {
      const header = document.querySelector('nav')
      if (header) {
        if (window.scrollY > 100) {
          header.style.boxShadow = '0 4px 20px rgba(44, 62, 80, 0.1)'
        } else {
          header.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    // Only use smooth scroll on landing page
    if (variant === 'landing' && location === '/') {
      e.preventDefault()
      const targetElement = document.querySelector(targetId)
      if (targetElement) {
        const offsetTop = targetElement.offsetTop - 80
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        })
      }
      setMobileMenuOpen(false)
    }
  }

  const handleNavClick = (path: string) => {
    setLocation(path)
    setMobileMenuOpen(false)
  }

  const isLanding = variant === 'landing'
  const navBgClass = isLanding 
    ? 'bg-white/95 backdrop-blur-sm' 
    : 'bg-white shadow-sm border-b border-gray-200'

  return (
    <nav className={`fixed top-0 w-full ${navBgClass} z-50 ${isLanding ? 'shadow-sm' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div 
              className="font-display text-2xl font-bold gradient-text cursor-pointer flex items-center gap-2"
              onClick={() => handleNavClick('/')}
            >
              {!isLanding && (
                <img src="/smartproject.png" alt="ConstructPro Logo" className="h-8 w-auto mr-2" />
              )}
              <span>ConstructPro</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            {/* Navigation Links */}
            {isLanding ? (
              <>
                <a 
                  href="#features" 
                  className="nav-link" 
                  onClick={(e) => handleSmoothScroll(e, '#features')}
                >
                  Features
                </a>
                <a 
                  href="#demo" 
                  className="nav-link" 
                  onClick={(e) => handleSmoothScroll(e, '#demo')}
                >
                  Demo
                </a>
                <a 
                  href="#pricing" 
                  className="nav-link" 
                  onClick={(e) => handleSmoothScroll(e, '#pricing')}
                >
                  Pricing
                </a>
                <a 
                  href="#contact" 
                  className="nav-link" 
                  onClick={(e) => handleSmoothScroll(e, '#contact')}
                >
                  Contact
                </a>
                <a 
                  href="/playground"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-link flex items-center gap-1.5"
                >
                  <span>Playground</span>
                  <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                  </svg>
                </a>
              </>
            ) : (
              <>
                <a 
                  href="/playground"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-link flex items-center gap-1.5"
                >
                  <span>Playground/ Demo Test</span>
                  <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                  </svg>
                </a>
                {authenticated && (
                  <>
                    <button 
                      className="nav-link border-none bg-transparent p-0"
                      onClick={() => handleNavClick('/activity-master')}
                    >
                      Activity Master
                    </button>
                    <button 
                      className="nav-link border-none bg-transparent p-0"
                      onClick={() => handleNavClick('/task-master')}
                    >
                      Task Master
                    </button>
                    <button 
                      className="nav-link border-none bg-transparent p-0"
                      onClick={() => handleNavClick('/resource-master')}
                    >
                      Resource Master
                    </button>
                    <button 
                      className="nav-link border-none bg-transparent p-0"
                      onClick={() => handleNavClick('/collab')}
                    >
                      Collaboration
                    </button>
                  </>
                )}
              </>
            )}

            {/* Auth Section */}
            {authenticated ? (
              <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                <UserProfile />
              </div>
            ) : (
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => handleNavClick('/login')}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => login('google')}
                  variant="default"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              className="text-gray-600 hover:text-gray-900"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 py-4">
          <div className="space-y-3">
            {isLanding ? (
              <>
                <a 
                  href="#features" 
                  className="block py-2 text-gray-700 hover:text-orange-600"
                  onClick={(e) => handleSmoothScroll(e, '#features')}
                >
                  Features
                </a>
                <a 
                  href="#demo" 
                  className="block py-2 text-gray-700 hover:text-orange-600"
                  onClick={(e) => handleSmoothScroll(e, '#demo')}
                >
                  Demo
                </a>
                <a 
                  href="#pricing" 
                  className="block py-2 text-gray-700 hover:text-orange-600"
                  onClick={(e) => handleSmoothScroll(e, '#pricing')}
                >
                  Pricing
                </a>
                <a 
                  href="#contact" 
                  className="block py-2 text-gray-700 hover:text-orange-600"
                  onClick={(e) => handleSmoothScroll(e, '#contact')}
                >
                  Contact
                </a>
                <a 
                  href="/playground"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-2 text-gray-700 hover:text-orange-600 flex items-center gap-1.5"
                >
                  <span>Playground</span>
                  <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                  </svg>
                </a>
              </>
            ) : (
              <>
                <a 
                  href="/playground"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-left py-2 text-gray-700 hover:text-orange-600 flex items-center gap-1.5"
                >
                  <span>Playground/ Demo Test</span>
                  <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                  </svg>
                </a>
                {authenticated && (
                  <>
                    <button 
                      className="block w-full text-left py-2 text-gray-700 hover:text-orange-600"
                      onClick={() => handleNavClick('/activity-master')}
                    >
                      Activity Master
                    </button>
                    <button 
                      className="block w-full text-left py-2 text-gray-700 hover:text-orange-600"
                      onClick={() => handleNavClick('/task-master')}
                    >
                      Task Master
                    </button>
                    <button 
                      className="block w-full text-left py-2 text-gray-700 hover:text-orange-600"
                      onClick={() => handleNavClick('/resource-master')}
                    >
                      Resource Master
                    </button>
                    <button 
                      className="block w-full text-left py-2 text-gray-700 hover:text-orange-600"
                      onClick={() => handleNavClick('/collab')}
                    >
                      Collaboration
                    </button>
                  </>
                )}
              </>
            )}

            {/* Mobile Auth Section */}
            <div className="pt-4 border-t border-gray-200">
              {authenticated ? (
                <div className="flex items-center gap-2">
                  <UserProfile />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleNavClick('/login')}
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => login('google')}
                    variant="default"
                    className="w-full"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

