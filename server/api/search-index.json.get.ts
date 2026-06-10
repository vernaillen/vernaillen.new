import { queryCollectionNavigation, queryCollectionSearchSections } from '@nuxt/content/server'

export default defineEventHandler(async (event) => {
  const [navigation, files] = await Promise.all([
    queryCollectionNavigation(event, 'blog'),
    queryCollectionSearchSections(event, 'blog')
  ])

  return { navigation, files }
})
