<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

const props = defineProps<{
  icon?: string
  code?: string
  language?: string
  filename?: string
  highlights?: number[]
  hideHeader?: boolean
  meta?: string
}>()

const { copy, copied } = useClipboard()
</script>

<template>
  <div class="terminal-block">
    <!-- Terminal dots header -->
    <div class="terminal-header">
      <div class="terminal-dots">
        <span
          class="terminal-dot"
          style="background: #ff5f57;"
        />
        <span
          class="terminal-dot"
          style="background: #febc2e;"
        />
        <span
          class="terminal-dot"
          style="background: #28c840;"
        />
      </div>
      <span
        v-if="filename"
        class="terminal-filename"
      >{{ filename }}</span>
      <span
        v-else-if="language"
        class="terminal-language"
      >{{ language }}</span>
    </div>

    <!-- Copy button -->
    <button
      class="terminal-copy"
      :aria-label="copied ? 'Copied' : 'Copy code'"
      @click="copy(props.code || '')"
    >
      <UIcon :name="copied ? 'lucide:check' : 'lucide:copy'" />
    </button>

    <!-- Code -->
    <pre><slot /></pre>
  </div>
</template>

<style>
.shiki span.line { display: block }
.shiki span.line.highlight {
  margin: 0 -16px;
  padding: 0 16px;
  @apply bg-(--ui-bg-accented)/50;
}
</style>

<style scoped>
.terminal-block {
  position: relative;
  margin: 1.5rem 0;
  border: 1px solid var(--color-dusk-200);
  border-radius: 0.5rem;
  overflow: hidden;
}
:is(.dark) .terminal-block {
  border-color: var(--color-dusk-800);
}

.terminal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 0.75rem;
  height: 36px;
  border-bottom: 1px solid var(--color-dusk-200);
  background: var(--color-dusk-100);
}
:is(.dark) .terminal-header {
  border-bottom-color: var(--color-dusk-800);
  background: var(--color-dusk-700);
}

.terminal-dots {
  display: flex;
  gap: 6px;
}
.terminal-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.terminal-filename,
.terminal-language {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--ui-text-muted);
}

.terminal-copy {
  position: absolute;
  top: 44px;
  right: 8px;
  padding: 4px;
  border-radius: 0.25rem;
  color: var(--ui-text-muted);
  opacity: 0;
  transition: opacity 0.2s;
  cursor: pointer;
  background: transparent;
  border: none;
}
.terminal-block:hover .terminal-copy {
  opacity: 1;
}
.terminal-copy:hover {
  color: var(--ui-text-default);
}

.terminal-block pre {
  margin: 0 !important;
  border: none !important;
  border-radius: 0 !important;
  padding: 1rem !important;
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  line-height: 1.6;
  background: var(--color-dusk-50) !important;
}
:is(.dark) .terminal-block pre {
  background: var(--color-dusk-950) !important;
}
</style>
