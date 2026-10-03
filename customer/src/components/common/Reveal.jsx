import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function Reveal({
  children,
  y = 40,
  delay = 0,
  duration = 0.85,
  className = '',
  as: Tag = 'div',
}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration,
          delay,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        }
      )
    })

    return () => ctx.revert()
  }, [y, delay, duration])

  return (
    <Tag ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </Tag>
  )
}

export function StaggerReveal({ children, stagger = 0.09, y = 50, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        Array.from(container.children),
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          stagger,
          duration: 0.75,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        }
      )
    })

    return () => ctx.revert()
  }, [stagger, y])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
