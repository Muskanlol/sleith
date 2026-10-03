import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function CustomCursor() {
  const ringRef = useRef(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return

    const ring = ringRef.current
    if (!ring) return

    gsap.set(ring, { xPercent: -50, yPercent: -50, opacity: 0 })

    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2
    let ringX  = mouseX
    let ringY  = mouseY
    let hovering = false

    const onMouseMove = (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
      gsap.to(ring, { opacity: 1, duration: 0.4, overwrite: false })
    }

    const tickerId = gsap.ticker.add(() => {
      ringX += (mouseX - ringX) * 0.11
      ringY += (mouseY - ringY) * 0.11
      gsap.set(ring, { x: ringX, y: ringY })
    })

    const onOver = (e) => {
      const target = e.target.closest('a, button, [data-cursor]')
      if (target && !hovering) {
        hovering = true
        gsap.to(ring, { scale: 2.2, opacity: 0.65, duration: 0.35, ease: 'power2.out' })
      }
    }
    const onOut = (e) => {
      const target = e.target.closest('a, button, [data-cursor]')
      if (target && hovering) {
        hovering = false
        gsap.to(ring, { scale: 1, opacity: 0.85, duration: 0.35, ease: 'power2.out' })
      }
    }

    const onClick = () => {
      gsap.timeline()
        .to(ring, { scale: hovering ? 1.6 : 0.7, duration: 0.12, ease: 'power2.in' })
        .to(ring, { scale: hovering ? 2.2 : 1,   duration: 0.22, ease: 'power2.out' })
    }

    const onLeave = () => gsap.to(ring, { opacity: 0, duration: 0.3 })
    const onEnter = () => gsap.to(ring, { opacity: hovering ? 0.65 : 0.85, duration: 0.3 })

    window.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseover',   onOver)
    document.addEventListener('mouseout',    onOut)
    document.addEventListener('click',       onClick)
    document.addEventListener('mouseleave',  onLeave)
    document.addEventListener('mouseenter',  onEnter)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseover',   onOver)
      document.removeEventListener('mouseout',    onOut)
      document.removeEventListener('click',       onClick)
      document.removeEventListener('mouseleave',  onLeave)
      document.removeEventListener('mouseenter',  onEnter)
      gsap.ticker.remove(tickerId)
    }
  }, [])

  return (
    <div
      ref={ringRef}
      className="pointer-events-none fixed left-0 top-0 z-[99998]"
      aria-hidden="true"
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        border: '1.5px solid rgba(201,169,110,0.6)',
        background: 'transparent',
        willChange: 'transform',
      }}
    />
  )
}
