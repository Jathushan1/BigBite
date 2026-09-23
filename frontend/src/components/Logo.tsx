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
          <rect width="48" height="48" rx="14" fill="var(--primary)" />
          <path d="M12 36 L24 14 L36 36 C32 37 28 37.5 24 37.5 C20 37.5 16 37 12 36 Z" fill="#FFFFFF" />
          <path d="M11 36.5 C15.5 38 20 38.5 24 38.5 C28 38.5 32.5 38 37 36.5" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="20" cy="25" r="2.2" fill="var(--primary)" />
          <circle cx="28" cy="27" r="2.5" fill="var(--primary)" />
          <circle cx="23" cy="32" r="1.8" fill="var(--primary)" />
        </svg>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-md shadow-primary/20 shrink-0 p-1.5">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M12 36 L24 14 L36 36 C32 37 28 37.5 24 37.5 C20 37.5 16 37 12 36 Z" fill="#FFFFFF" />
          <path d="M11 36.5 C15.5 38 20 38.5 24 38.5 C28 38.5 32.5 38 37 36.5" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="20" cy="25" r="2.2" fill="var(--primary)" />
          <circle cx="28" cy="27" r="2.5" fill="var(--primary)" />
          <circle cx="23" cy="32" r="1.8" fill="var(--primary)" />
        </svg>
      </div>
      <span className={`text-2xl font-black tracking-tight ${lightText ? 'text-white' : 'text-foreground'}`}>
        Big<span className="text-primary">Bite</span>
      </span>
    </div>
  )
}
