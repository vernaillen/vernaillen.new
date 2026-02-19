import type { BlogCollectionItem } from '@nuxt/content'
import { queryCollection } from '#imports'

export default defineSitemapEventHandler(async (e) => {
  const posts = await queryCollection(e, 'blog').all() as BlogCollectionItem[]

  return posts.map((post) => {
    return asSitemapUrl({
      loc: post.path,
      lastmod: new Date(post.date),
      images: post.image ? [{ loc: post.image }] : []
    })
  })
})
