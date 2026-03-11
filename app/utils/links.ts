import type { NavigationMenuItem } from '@nuxt/ui'

export function useNavLinks(): Ref<NavigationMenuItem[]> {
  const route = useRoute()

  return computed(() => [{
    label: 'Home',
    icon: 'i-lucide-home',
    to: '/'
  }, {
    label: 'Projects',
    icon: 'i-lucide-folder',
    to: '/projects'
  }, {
    label: 'Blog',
    icon: 'i-lucide-file-text',
    to: '/blog',
    active: route.path.startsWith('/blog')
  }, {
    label: 'Career',
    icon: 'i-lucide-briefcase',
    to: '/career'
  }, {
    label: 'About',
    icon: 'i-lucide-user',
    to: '/about'
  }])
}
