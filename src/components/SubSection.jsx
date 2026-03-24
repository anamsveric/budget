import { useState } from 'react'

export default function SubSection({
  label,
  total,
  children,
  defaultOpen = false,
  labelClass = 'text-gray-400',
  boxClass = 'border-gray-100 bg-gray-50/50',
}) {
  const [open, setOpen] = useState(defaultOpen)

  const formatted = total.toLocaleString('hr-HR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <div className="mt-3 mb-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between mb-1 px-1 group cursor-pointer"
      >
        <span className={`text-xs font-semibold uppercase tracking-wider group-hover:opacity-80 transition-opacity ${labelClass}`}>
          {label}
        </span>
        <div className="flex items-center gap-2">
          {total > 0 && (
            <span className={`text-xs font-semibold tabular-nums ${labelClass}`}>{formatted} €</span>
          )}
          <span className={`text-xs opacity-50 group-hover:opacity-70 transition-opacity ${labelClass}`}>
            {open ? '▲' : '▼'}
          </span>
        </div>
      </button>
      {open && (
        <div className={`rounded-xl border px-3 py-0.5 ${boxClass}`}>
          {children}
        </div>
      )}
    </div>
  )
}
