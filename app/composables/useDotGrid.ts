import type { Ref } from 'vue'

interface DotGridOptions {
  spacing?: number
  dotRadius?: number
  baseOpacity?: number
  influenceRadius?: number
  maxDisplacement?: number
}

// Per-dot layout: [currentX, currentY, restX, restY]
const STRIDE = 4

export function useDotGrid(
  canvasRef: Ref<HTMLCanvasElement | null>,
  options: DotGridOptions = {}
) {
  const {
    spacing = 14,
    dotRadius = 1,
    baseOpacity = 0.25,
    influenceRadius = 150,
    maxDisplacement = 12
  } = options

  const colorMode = useColorMode()

  let dots = new Float32Array(0)
  // Store logical (CSS pixel) dimensions separately — canvas.clientWidth becomes
  // unreliable after we set canvas.width to the DPR-scaled buffer size
  let logicalW = 0
  let logicalH = 0
  let dotColor = ''
  let animationRunning = false
  let ctx: CanvasRenderingContext2D | null = null

  function readDotColor() {
    const style = getComputedStyle(document.documentElement)
    const raw = style.getPropertyValue('--ui-text-muted').trim()
    dotColor = raw || 'rgb(120, 120, 120)'
  }

  function buildGrid(w: number, h: number) {
    logicalW = w
    logicalH = h
    // CSS background-size tiles center dots at (spacing/2, spacing/2) within each tile
    const offset = spacing / 2
    const cols = Math.ceil(w / spacing)
    const rows = Math.ceil(h / spacing)
    dots = new Float32Array(cols * rows * STRIDE)

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = (r * cols + c) * STRIDE
        const x = c * spacing + offset
        const y = r * spacing + offset
        dots[i] = x // currentX
        dots[i + 1] = y // currentY
        dots[i + 2] = x // restX
        dots[i + 3] = y // restY
      }
    }
  }

  function updatePhysics(mouseX: number, mouseY: number, mouseInside: boolean): boolean {
    const r2 = influenceRadius * influenceRadius
    let allSettled = true

    for (let i = 0; i < dots.length; i += STRIDE) {
      const restX = dots[i + 2]!
      const restY = dots[i + 3]!
      let targetX = restX
      let targetY = restY

      if (mouseInside) {
        const dx = restX - mouseX
        const dy = restY - mouseY
        const distSq = dx * dx + dy * dy

        if (distSq < r2 && distSq > 0) {
          const dist = Math.sqrt(distSq)
          const force = (1 - dist / influenceRadius) * maxDisplacement
          targetX = restX + (dx / dist) * force
          targetY = restY + (dy / dist) * force
        }
      }

      const isDisplaced = targetX !== restX || targetY !== restY
      const ease = isDisplaced ? 0.15 : 0.08

      const curX = dots[i]!
      const curY = dots[i + 1]!
      const newX = curX + (targetX - curX) * ease
      const newY = curY + (targetY - curY) * ease

      if (Math.abs(newX - targetX) > 0.01 || Math.abs(newY - targetY) > 0.01) {
        allSettled = false
      }

      dots[i] = newX
      dots[i + 1] = newY
    }

    return allSettled
  }

  function draw() {
    if (!ctx || logicalW === 0 || logicalH === 0) return

    ctx.clearRect(0, 0, logicalW, logicalH)

    // Match CSS: mask-image: radial-gradient(ellipse at center, black, transparent 70%)
    // CSS farthest-corner sizing: ellipse semi-axes = w/√2, h/√2
    // 70% stop → fade reaches zero at 0.7 × those semi-axes
    const cx = logicalW / 2
    const cy = logicalH / 2
    const SQRT2 = Math.SQRT2
    const fadeRx = logicalW * 0.7 / SQRT2
    const fadeRy = logicalH * 0.7 / SQRT2

    ctx.fillStyle = dotColor

    for (let i = 0; i < dots.length; i += STRIDE) {
      const x = dots[i]!
      const y = dots[i + 1]!

      // Normalized elliptical distance — 0 at center, 1 at fade boundary
      const nx = (x - cx) / (fadeRx || 1)
      const ny = (y - cy) / (fadeRy || 1)
      const d = Math.sqrt(nx * nx + ny * ny)
      const fade = Math.max(0, 1 - d)

      if (fade <= 0) continue

      ctx.globalAlpha = baseOpacity * fade
      ctx.beginPath()
      ctx.arc(x, y, dotRadius, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.globalAlpha = 1
  }

  function setupCanvas(canvas: HTMLCanvasElement): boolean {
    const rect = canvas.getBoundingClientRect()
    const w = rect.width
    const h = rect.height

    if (w === 0 || h === 0) return false

    const dpr = window.devicePixelRatio || 1
    canvas.width = w * dpr
    canvas.height = h * dpr

    ctx = canvas.getContext('2d')
    if (!ctx) return false

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)

    buildGrid(w, h)
    return true
  }

  onMounted(() => {
    const canvas = canvasRef.value
    if (!canvas) return

    readDotColor()

    const target = canvas.parentElement || canvas
    const { elementX, elementY, isOutside } = useMouseInElement(target)

    // Initial setup — use nextTick to ensure layout is settled
    nextTick(() => {
      if (!setupCanvas(canvas)) return
      draw()
    })

    // Resize handling
    useResizeObserver(target, () => {
      if (setupCanvas(canvas)) {
        draw()
      }
    })

    const { pause, resume } = useRafFn(() => {
      const mouseInside = !isOutside.value
      const settled = updatePhysics(elementX.value, elementY.value, mouseInside)

      draw()

      if (!mouseInside && settled) {
        animationRunning = false
        pause()
      }
    }, { immediate: false })

    // Start animation when mouse enters
    watch(isOutside, (outside) => {
      if (!outside && !animationRunning) {
        animationRunning = true
        resume()
      }
    })

    // Redraw on color mode change
    watch(colorMode, () => {
      nextTick(() => {
        readDotColor()
        draw()
      })
    })
  })
}
