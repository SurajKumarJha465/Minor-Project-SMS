import { Search } from 'lucide-react'

export default function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border border-paper-line rounded-[8px] pl-9 pr-3 py-2
                   text-sm text-ink placeholder:text-ink-faint focus:border-indigo/50
                   outline-none transition-colors"
      />
    </div>
  )
}
