import type { ReactNode } from 'react'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="w-full max-w-[1360px] overflow-hidden rounded-[28px] bg-[#FCFBFA] shadow-[0_24px_64px_-12px_rgba(75,42,173,0.35)]">
      {children}
    </div>
  )
}
