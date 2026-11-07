interface IconProps {
  size?: number;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.25,
  strokeLinecap: 'square' as const,
  'aria-hidden': true,
});

export function MenuIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

export function CloseIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

export function PinIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

export function ArrowIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}
