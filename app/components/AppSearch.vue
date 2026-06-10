<script setup lang="ts">
// Mounting UContentSearch eagerly made every visitor download the
// fuse.js/command-palette chunk during hydration, and querying the search
// index in app.vue baked the full-text index into every page's payload.
// Defer both until the first ⌘K: mount the dialog (its own shortcut handles
// toggling from then on), then fetch the prerendered index JSON.
const navLinks = useNavLinks()

const mounted = ref(false)
const { open } = useContentSearch()

const fetchIndex = () => $fetch('/api/search-index.json')
const searchIndex = shallowRef<Awaited<ReturnType<typeof fetchIndex>>>()

defineShortcuts({
  meta_k: async () => {
    if (mounted.value) {
      return
    }
    mounted.value = true
    open.value = true
    searchIndex.value = await fetchIndex()
  }
})
</script>

<template>
  <LazyUContentSearch
    v-if="mounted"
    :files="searchIndex?.files"
    :navigation="searchIndex?.navigation"
    shortcut="meta_k"
    :links="navLinks"
    :fuse="{ resultLimit: 42 }"
  />
</template>
