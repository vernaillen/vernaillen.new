<script lang="ts" setup>
defineOptions({
  inheritAttrs: false
})
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <div
    class="w-full h-full flex flex-col justify-between"
    style="background-color: #0a0908; font-family: 'Space Grotesk', sans-serif; position: relative; overflow: hidden;"
  >
    <!-- Dot pattern -->
    <div
      style="position: absolute; inset: 0; background-image: radial-gradient(circle, rgba(156, 142, 27, 0.3) 1px, transparent 1px); background-size: 14px 14px; mask-image: radial-gradient(ellipse at center, black, transparent 70%); -webkit-mask-image: radial-gradient(ellipse at center, black, transparent 70%);"
    />

    <!-- Gold glow -->
    <div
      style="position: absolute; top: 20%; left: 30%; width: 40%; height: 60%; background: radial-gradient(50% 50% at 50% 50%, rgba(140, 120, 21, 0.35) 0%, transparent 70%); filter: blur(80px);"
    />

    <!-- Top: Logo -->
    <div style="padding: 48px 64px 0;">
      <svg
        viewBox="0 0 754 276"
        width="120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g
          fill="none"
          opacity="transparent"
        >
          <path
            fill="#9c8e1b"
            d="M0 0 H92 V184 H172 V0 H264 V184 H344 V0 H436 V276 H0 Z"
          />
          <path
            fill="#f9f8f5"
            d="M490 0 H582 V184 H662 V0 H754 V276 H490 Z"
          />
        </g>
      </svg>
    </div>

    <!-- Center: Title & Description -->
    <div style="padding: 0 64px; flex: 1; display: flex; flex-direction: column; justify-content: center;">
      <h1 style="font-size: 56px; font-weight: 500; color: #f9f8f5; letter-spacing: 0.02em; line-height: 1.15; margin: 0;">
        {{ title }}<span style="color: #9c8e1b;">.</span>
      </h1>
      <p style="font-size: 24px; font-weight: 300; color: #918d82; margin-top: 16px; line-height: 1.4;">
        {{ description }}
      </p>
    </div>

    <!-- Bottom: URL -->
    <div style="padding: 0 64px 40px; display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 18px; color: #656158; font-weight: 400;">vernaillen.dev</span>
    </div>
  </div>
</template>
