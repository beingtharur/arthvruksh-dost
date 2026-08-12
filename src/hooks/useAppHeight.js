import { useEffect } from 'react'

/**
 * Keeps the CSS variable --app-height in sync with the *visual* viewport.
 *
 * Why this exists: `100vh` (and even `100dvh`) do not shrink when the mobile
 * software keyboard opens on iOS Safari. Without this, the chat composer gets
 * pushed underneath the keyboard and becomes untappable. `window.visualViewport`
 * is the only thing that reports the actually-visible area, so we mirror it into
 * a custom property that the app shell sizes itself against.
 *
 * Falls back silently to innerHeight (and the CSS dvh/vh default) on browsers
 * without visualViewport support.
 */
export function useAppHeight() {
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null
    let frame = null

    const apply = () => {
      frame = null
      const height = vv ? vv.height : window.innerHeight
      document.documentElement.style.setProperty('--app-height', `${Math.round(height)}px`)
      // When the keyboard opens, iOS may also scroll the layout viewport.
      // Pin it back so the fixed shell stays aligned with the visible area.
      document.documentElement.style.setProperty(
        '--app-offset-top',
        `${Math.round(vv?.offsetTop ?? 0)}px`
      )
    }

    const schedule = () => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(apply)
    }

    apply()

    if (vv) {
      vv.addEventListener('resize', schedule)
      vv.addEventListener('scroll', schedule)
    }
    window.addEventListener('resize', schedule)
    window.addEventListener('orientationchange', schedule)

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
      if (vv) {
        vv.removeEventListener('resize', schedule)
        vv.removeEventListener('scroll', schedule)
      }
      window.removeEventListener('resize', schedule)
      window.removeEventListener('orientationchange', schedule)
    }
  }, [])
}

export default useAppHeight
