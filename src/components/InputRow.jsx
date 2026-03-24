export default function InputRow({ label, value, onChange, indent = false }) {
  return (
    <div className={`flex items-center justify-between gap-3 py-2.5 border-b border-gray-100 last:border-0 ${indent ? 'pl-5' : ''}`}>
      <label className="text-sm text-gray-600 leading-tight flex-1">{label}</label>
      <div className="relative flex items-center shrink-0">
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={onChange}
          placeholder="0"
          className="w-32 text-right pr-7 pl-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder-gray-300"
        />
        <span className="absolute right-2.5 text-xs text-gray-400 pointer-events-none select-none">€</span>
      </div>
    </div>
  )
}
