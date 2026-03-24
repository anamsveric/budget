import { useState } from 'react'

export default function Card({ title, icon, total, headerClass, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)

  const formatted = total.toLocaleString('hr-HR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-5 py-4 cursor-pointer transition-opacity hover:opacity-90 ${headerClass}`}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{icon}</span>
          <span className="font-semibold text-lg">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg tabular-nums">{formatted} €</span>
          <span className="text-sm opacity-70">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-5 py-3">
          {children}
        </div>
      )}
    </div>
  )
}
