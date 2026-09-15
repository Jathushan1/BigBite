import React from 'react'

interface LogoProps {
  className?: string
  variant?: 'full' | 'mark'
  lightText?: boolean
}

export const Logo: React.FC<LogoProps> = ({ className = 'h-10', variant = 'full', lightText = false }) => {
  if (variant === 'mark') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <rect width="48" height="48" rx="14" fill="#E4002B" />
          <path d="M12 36 L24 14 L36 36 C32 37 28 37.5 24 37.5 C20 37.5 16 37 12 36 Z" fill="#FFFFFF" />
          <path d="M11 36.5 C15.5 38 20 38.5 24 38.5 C28 38.5 32.5 38 37 36.5" stroke="#E4002B" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="20" cy="25" r="2.2" fill="#E4002B" />
          <circle cx="28" cy="27" r="2.5" fill="#E4002B" />
          <circle cx="23" cy="32" r="1.8" fill="#E4002B" />
          <path d="M48 6 C43 6 39 10 39 15 C39 16.5 39.4 17.8 40 19 C38 20 37 22.5 37 25 C37 29.5 40.5 33 45 33 C46 33 47 32.8 48 32.4 Z" fill="currentColor" className="text-white dark:text-neutral-900 opacity-20" />
        </svg>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E4002B] to-[#FF2B4F] flex items-center justify-center shadow-md shadow-red-600/20 flex-shrink-0 p-1.5">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M12 36 L24 14 L36 36 C32 37 28 37.5 24 37.5 C20 37.5 16 37 12 36 Z" fill="#FFFFFF" />
          <path d="M11 36.5 C15.5 38 20 38.5 24 38.5 C28 38.5 32.5 38 37 36.5" stroke="#E4002B" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="20" cy="25" r="2.2" fill="#E4002B" />
          <circle cx="28" cy="27" r="2.5" fill="#E4002B" />
          <circle cx="23" cy="32" r="1.8" fill="#E4002B" />
        </svg>
      </div>
      <span className={`text-2xl font-black tracking-tight ${lightText ? 'text-white' : 'text-neutral-900'}`}>
        Big<span className="text-[#E4002B]">Bite</span>
      </span>
    </div>
  )
}
