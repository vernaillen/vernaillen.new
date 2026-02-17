export function useGlowFollow() {
  const colorMode = useColorMode()
  const ease = 0.035

  let currentX = 0
  let currentY = 0
  let targetX = 0
  let targetY = 0
  let hasMousePosition = false
  let rafId: number | null = null
  let el: HTMLDivElement | null = null

  function createGlow() {
    el = document.createElement('div')
    el.setAttribute('aria-hidden', 'true')
    el.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      pointer-events: none;
      z-index: 0;
      filter: blur(180px);
      transform: translate(-50%, -50%);
      will-change: transform;
      opacity: 0;
      transition: opacity 1s ease;
    `
    applyColor()
    // Insert as first child of body so it's behind all page content
    document.body.prepend(el)
  }

  function applyColor() {
    if (!el) return
    if (colorMode.value === 'dark') {
      el.style.background = 'rgba(140, 120, 21, 0.07)'
    } else {
      el.style.background = 'rgba(186, 175, 78, 0.10)'
    }
  }

  function onMouseMove(e: MouseEvent) {
    targetX = e.clientX
    targetY = e.clientY

    if (!hasMousePosition) {
      hasMousePosition = true
      currentX = targetX
      currentY = targetY
      if (el) el.style.opacity = '1'
    }

    if (rafId === null) {
      rafId = requestAnimationFrame(tick)
    }
  }

  function tick() {
    currentX += (targetX - currentX) * ease
    currentY += (targetY - currentY) * ease

    if (el) {
      el.style.transform = `translate(calc(${currentX.toFixed(0)}px - 50%), calc(${currentY.toFixed(0)}px - 50%))`
    }

    if (Math.abs(targetX - currentX) > 0.5 || Math.abs(targetY - currentY) > 0.5) {
      rafId = requestAnimationFrame(tick)
    } else {
      rafId = null
    }
  }

  onMounted(() => {
    createGlow()
    window.addEventListener('mousemove', onMouseMove, { passive: true })
  })

  watch(colorMode, () => applyColor())

  onUnmounted(() => {
    window.removeEventListener('mousemove', onMouseMove)
    if (rafId !== null) cancelAnimationFrame(rafId)
    if (el) el.remove()
  })
}
