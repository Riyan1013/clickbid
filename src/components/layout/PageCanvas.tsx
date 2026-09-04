import type { ReactNode } from 'react'

interface PageCanvasProps {
  children: ReactNode
}

export function PageCanvas({ children }: PageCanvasProps) {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-[#1B1230] via-[#14102B] to-[#14102B]">
      {/* Violet atmospheric glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-8%] h-[560px] w-[880px] -translate-x-1/2 rounded-full bg-[#4C2A8C] opacity-40 blur-[140px]"
      />

      {/* Subtle gold accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[4%] h-[280px] w-[560px] -translate-x-1/2 rounded-full bg-[#D4A73A] opacity-[0.06] blur-[120px]"
      />

      {/* Application content */}
      <div className="relative z-10 flex justify-center px-4 py-10 sm:px-6 sm:py-12 md:px-10 md:py-14 lg:px-16 lg:py-16">
        {children}
      </div>
    </div>
  )
}
