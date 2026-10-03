import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const leftNav = [
  { to: '/services', label: 'Services' },
  { to: '/staff',    label: 'Team' },
  { to: '/packages', label: 'Packages' },
]

const rightNav = [
  { to: '/academy', label: 'Academy' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/about',   label: 'About' },
  { to: '/contact', label: 'Contact' },
]

const allNav = [...leftNav, ...rightNav]

function NavItem({ to, label, onDark }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group relative whitespace-nowrap px-1 py-1 text-[12px] font-medium tracking-[0.18em] uppercase transition-colors duration-300 ${
          isActive
            ? 'text-gold'
            : onDark
              ? 'text-white/75 hover:text-white'
              : 'text-text-secondary hover:text-text-primary'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {label}
          <span
            className={`absolute -bottom-1 left-1/2 h-[3px] w-[3px] -translate-x-1/2 rotate-45 transition-all duration-300 ${
              isActive ? 'bg-gold opacity-100' : 'bg-gold/0 opacity-0 group-hover:bg-gold/70 group-hover:opacity-100'
            }`}
          />
        </>
      )}
    </NavLink>
  )
}

function BrandMark({ onDark }) {
  return (
    <Link to="/" className="group mx-6 flex flex-shrink-0 flex-col items-center leading-none lg:mx-10">
      <span className="flex items-center gap-2">
        <span className={`text-[9px] ${onDark ? 'text-gold/80' : 'text-gold'}`}>✦</span>
        <span
          className={`font-display text-[1.15rem] font-semibold tracking-[0.32em] uppercase transition-colors ${
            onDark ? 'text-white group-hover:text-gold' : 'text-text-primary group-hover:text-gold'
          }`}
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          SLEITH
        </span>
        <span className={`text-[9px] ${onDark ? 'text-gold/80' : 'text-gold'}`}>✦</span>
      </span>
      <span className={`mt-1 text-[8px] tracking-[0.38em] uppercase ${onDark ? 'text-white/40' : 'text-text-secondary/80'}`}>
        Salon &amp; Academy
      </span>
    </Link>
  )
}

function UserMenu({ user, logout, onDark }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = (name = '') =>
    name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'

  const firstName = user?.full_name?.split(' ')[0] || 'Account'

  const menuItems = [
    { to: '/account',              label: 'My Profile' },
    { to: '/account/appointments', label: 'Appointments' },
    { to: '/account/packages',     label: 'Packages' },
    { to: '/account/applications', label: 'Applications' },
    { to: '/account/academy',      label: 'Academy' },
    { to: '/account/academy-fees', label: 'Fees' },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-all duration-300 ${
          onDark
            ? 'border border-white/20 bg-white/5 hover:border-gold/50'
            : 'border border-black/10 bg-black/[0.03] hover:border-gold/40'
        }`}
      >
        {user?.photo_url ? (
          <img
            src={user.photo_url}
            alt=""
            className="h-7 w-7 flex-shrink-0 rounded-full object-cover"
            style={{ border: '1px solid rgba(201,169,110,0.4)' }}
          />
        ) : (
          <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-[#0F0D0B]"
            style={{ background: 'linear-gradient(135deg,#EDD9A3,#C9A96E,#A88550)' }}
          >
            {initials(user?.full_name ?? '')}
          </div>
        )}
        <span className={`hidden max-w-[80px] truncate text-[12px] font-medium sm:block ${onDark ? 'text-white' : 'text-text-primary'}`}>
          {firstName}
        </span>
        <svg
          className={`h-3 w-3 transition-transform duration-200 ${onDark ? 'text-white/60' : 'text-text-secondary'}`}
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-2xl border shadow-2xl"
          style={{
            background: '#14110E',
            borderColor: 'rgba(201,169,110,0.22)',
            boxShadow: '0 18px 50px rgba(0,0,0,0.35)',
          }}
        >
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(201,169,110,0.12)' }}>
            <p className="truncate text-sm font-semibold text-white">{user?.full_name || '—'}</p>
            <p className="truncate text-[11px] text-white/45">{user?.email}</p>
          </div>
          <div className="py-1.5">
            {menuItems.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 text-[12px] tracking-wide text-white/75 transition-colors hover:bg-white/5 hover:text-gold"
              >
                {label}
                <span className="text-[8px] text-gold/50">✦</span>
              </Link>
            ))}
          </div>
          <div className="p-2" style={{ borderTop: '1px solid rgba(201,169,110,0.12)' }}>
            <Link
              to="/book"
              onClick={() => setOpen(false)}
              className="btn-gold-shimmer mb-1 flex w-full items-center justify-center rounded-full px-4 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase"
            >
              Book
            </Link>
            <button
              onClick={() => { logout(); setOpen(false) }}
              className="flex w-full items-center justify-center px-4 py-2 text-[11px] tracking-[0.16em] text-white/40 uppercase transition-colors hover:text-red-400"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const isHome = location.pathname === '/'
  const onDark = isHome && !scrolled

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="pointer-events-auto relative z-50">
        <div
          className={`nav-shell flex w-full items-center border-x-0 border-t-0 px-8 py-3 transition-all duration-500 sm:px-12 lg:px-16 xl:px-24 ${
            onDark
              ? 'border-white/10 bg-[#0B0907]/45 shadow-[0_8px_40px_rgba(0,0,0,0.28)]'
              : 'border-gold/20 bg-[#FAF8F3]/88 shadow-[0_10px_40px_rgba(20,12,4,0.12)]'
          }`}
        >
          <nav className="hidden min-w-0 flex-1 items-center justify-evenly lg:flex">
            {leftNav.map((item) => (
              <NavItem key={item.to} {...item} onDark={onDark} />
            ))}
          </nav>

          <BrandMark onDark={onDark} />

          <div className="hidden min-w-0 flex-1 items-center justify-evenly lg:flex">
            {rightNav.map((item) => (
              <NavItem key={item.to} {...item} onDark={onDark} />
            ))}

            {isAuthenticated ? (
              <UserMenu user={user} logout={logout} onDark={onDark} />
            ) : (
              <Link
                to="/login"
                className={`whitespace-nowrap text-[12px] tracking-[0.18em] uppercase ${
                  onDark ? 'text-white/55 hover:text-white' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Log in
              </Link>
            )}

            <Link
              to="/book"
              className={
                onDark
                  ? 'whitespace-nowrap rounded-full border border-gold/55 px-5 py-1.5 text-[11px] font-semibold tracking-[0.22em] text-gold uppercase transition-colors hover:bg-gold hover:text-[#0F0D0B]'
                  : 'btn-gold-shimmer whitespace-nowrap rounded-full px-5 py-1.5 text-[11px] font-semibold tracking-[0.22em] uppercase'
              }
            >
              Book
            </Link>
          </div>

          <button
            className={`ml-auto flex h-10 w-10 items-center justify-center rounded-full border lg:hidden ${
              onDark ? 'border-white/20 text-white' : 'border-black/10 text-text-primary'
            }`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className="relative block h-3.5 w-4">
              <span className={`absolute left-0 h-px w-4 bg-current transition-all duration-300 ${menuOpen ? 'top-1.5 rotate-45' : 'top-0'}`} />
              <span className={`absolute left-0 top-1.5 h-px w-4 bg-current transition-opacity duration-200 ${menuOpen ? 'opacity-0' : 'opacity-100'}`} />
              <span className={`absolute left-0 h-px w-4 bg-current transition-all duration-300 ${menuOpen ? 'top-1.5 -rotate-45' : 'top-3'}`} />
            </span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className="pointer-events-auto fixed inset-0 z-40 flex flex-col bg-[#0B0907]/96 px-8 pt-24 backdrop-blur-md lg:hidden"
          style={{ animation: 'fade-in 0.3s ease both' }}
        >
          <p className="mb-8 text-[10px] tracking-[0.4em] text-gold/60 uppercase">Menu</p>
          <nav className="flex flex-1 flex-col gap-1">
            {allNav.map((item, i) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-baseline gap-4 border-b border-white/10 py-4 ${
                    isActive ? 'text-gold' : 'text-white/85'
                  }`
                }
              >
                <span className="text-[10px] tracking-[0.2em] text-gold/45">{String(i + 1).padStart(2, '0')}</span>
                <span
                  className="text-3xl font-semibold"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {item.label}
                </span>
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-col gap-3 py-8">
            {isAuthenticated ? (
              <>
                <p className="text-sm text-white/50">{user?.full_name}</p>
                <Link
                  to="/account"
                  onClick={() => setMenuOpen(false)}
                  className="text-[12px] tracking-[0.2em] text-white/70 uppercase"
                >
                  My profile
                </Link>
                <Link
                  to="/book"
                  onClick={() => setMenuOpen(false)}
                  className="btn-gold-shimmer inline-flex w-max items-center justify-center rounded-full px-7 py-3 text-xs font-semibold tracking-[0.22em] uppercase"
                >
                  Book
                </Link>
                <button
                  onClick={() => { logout(); setMenuOpen(false) }}
                  className="text-left text-[11px] tracking-[0.18em] text-white/35 uppercase"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-[12px] tracking-[0.2em] text-white/70 uppercase"
                >
                  Log in
                </Link>
                <Link
                  to="/book"
                  onClick={() => setMenuOpen(false)}
                  className="btn-gold-shimmer inline-flex items-center justify-center rounded-full px-7 py-3 text-xs font-semibold tracking-[0.22em] uppercase"
                >
                  Book
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
