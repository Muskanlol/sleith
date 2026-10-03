const SIZE = {
  sm: { outer: 'h-10 w-10', text: 'text-sm' },
  md: { outer: 'h-16 w-16', text: 'text-xl' },
  lg: { outer: 'h-24 w-24', text: 'text-3xl' },
  xl: { outer: 'h-28 w-28', text: 'text-4xl' },
}

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

function gradientForName(name = '') {
  const palettes = [
    'linear-gradient(135deg, #1A1406 0%, #3D2C0A 100%)',
    'linear-gradient(135deg, #140610 0%, #3A0E2A 100%)',
    'linear-gradient(135deg, #07100E 0%, #103027 100%)',
    'linear-gradient(135deg, #0D0D14 0%, #1C1A38 100%)',
    'linear-gradient(135deg, #120811 0%, #2E1230 100%)',
  ]
  const idx = (name.charCodeAt(0) || 0) % palettes.length
  return palettes[idx]
}

export default function StaffAvatar({ name = '', photo = null, size = 'md', accentColor = '#C9A96E' }) {
  const { outer, text } = SIZE[size] || SIZE.md

  const borderColor = accentColor === '#9b5a6e'
    ? 'rgba(155,90,110,0.3)'
    : 'rgba(201,169,110,0.25)'

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={`${outer} rounded-full object-cover`}
        style={{ border: `1.5px solid ${borderColor}` }}
      />
    )
  }

  return (
    <div
      className={`${outer} flex items-center justify-center rounded-full select-none`}
      style={{
        background: gradientForName(name),
        border: `1.5px solid ${borderColor}`,
      }}
      aria-label={name}
    >
      <span
        className={`font-semibold ${text}`}
        style={{ fontFamily: "'Playfair Display', Georgia, serif", color: accentColor }}
      >
        {initials(name)}
      </span>
    </div>
  )
}
