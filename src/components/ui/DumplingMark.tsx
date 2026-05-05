interface DumplingMarkProps {
  size?: number
}

export default function DumplingMark({ size = 28 }: DumplingMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M4 20 Q16 4 28 20 Z" fill="#B8562B" opacity="0.18" />
      <path d="M4 20 Q16 4 28 20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" fill="none" />
      <path d="M4 20 L28 20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M10 20 q1.5 -3 3 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <path d="M14.5 20 q1.5 -3.5 3 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <path d="M19 20 q1.5 -3 3 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <path d="M13 6 q1 -2 0 -4" stroke="#B8562B" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" fill="none" />
      <path d="M16 5 q1 -2 0 -4" stroke="#B8562B" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" fill="none" />
      <path d="M19 6 q1 -2 0 -4" stroke="#B8562B" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" fill="none" />
    </svg>
  )
}
