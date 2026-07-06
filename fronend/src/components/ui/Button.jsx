const VARIANTS = {
  solid: 'bg-indigo text-white hover:bg-indigo-dark border border-indigo',
  outline: 'bg-white text-ink border border-paper-line hover:border-indigo/50 hover:text-indigo',
  danger: 'bg-white text-brick border border-brick/40 hover:bg-brick hover:text-white',
  ghost: 'bg-transparent text-ink-soft hover:bg-paper-dim border border-transparent'
}

const SIZES = {
  sm: 'text-xs px-2.5 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-[15px] px-5 py-2.5'
}

export default function Button({
  children,
  variant = 'solid',
  size = 'md',
  icon: Icon,
  className = '',
  ...rest
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-[8px] font-body font-medium
                  transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed
                  ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {Icon && <Icon size={16} strokeWidth={2} />}
      {children}
    </button>
  )
}
