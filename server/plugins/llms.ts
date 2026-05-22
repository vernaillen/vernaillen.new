import { queryCollection } from '@nuxt/content/server'

const formatYear = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return String(d.getFullYear())
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('content:llms:generate:document', (_event, doc, options) => {
    if (!doc?.body?.value || !doc?.path) return
    const url = `${options.domain}${doc.path}`
    const label = url.replace(/^https?:\/\//, '')
    doc.body.value.unshift([
      'p',
      {},
      'Source: ',
      ['a', { href: url }, label]
    ])
  })

  nitroApp.hooks.hook('llms:generate:full', async (event, options, contents) => {
    const [home, career, projects] = await Promise.all([
      queryCollection(event, 'index').first(),
      queryCollection(event, 'career').first(),
      queryCollection(event, 'projects').all()
    ])

    if (home) {
      const sections: string[] = [`# Home\n\nSource: ${options.domain}/`]

      if (home.about?.description) {
        sections.push(`## ${home.about.title ?? 'About'}\n\n${home.about.description.trim()}`)
      }

      if (home.experience?.items?.length) {
        const lines = home.experience.items.map((item: { position: string, date: string, company: { name: string, url?: string } }) => {
          const company = item.company.url
            ? `[${item.company.name}](${item.company.url})`
            : item.company.name
          return `- **${item.date}** — ${item.position} ${company}`
        })
        sections.push(`## ${home.experience.title ?? 'Work Experience'}\n\n${lines.join('\n')}`)
      }

      if (home.stats?.length) {
        const lines = home.stats.map((s: { value: string, label: string }) => `- **${s.value}** ${s.label}`)
        sections.push(`## At a Glance\n\n${lines.join('\n')}`)
      }

      if (home.faq?.categories?.length) {
        const blocks: string[] = [`## ${home.faq.title ?? 'FAQ'}`]
        for (const cat of home.faq.categories) {
          blocks.push(`### ${cat.title}`)
          for (const q of cat.questions) {
            blocks.push(`**${q.label}**\n\n${q.content.trim()}`)
          }
        }
        sections.push(blocks.join('\n\n'))
      }

      contents.push(sections.join('\n\n'))
    }

    if (career?.events?.length) {
      const events = [...career.events].sort((a, b) => +new Date(b.date) - +new Date(a.date))
      const lines = events.map((e: { date: string, category: string, title: string, location: string, url?: string }) => {
        const location = e.url ? `[${e.location}](${e.url})` : e.location
        return `- **${formatYear(e.date)}** — *${e.category}* — ${e.title} @ ${location}`
      })
      const description = career.description ? `${career.description}\n\n` : ''
      contents.push(`# Career\n\nSource: ${options.domain}/career\n\n${description}${lines.join('\n')}`)
    }

    if (projects?.length) {
      const sorted = [...projects].sort((a, b) => +new Date(b.date) - +new Date(a.date))
      const blocks = sorted.map((p: { title: string, description: string, url: string, tags?: string[], date: string }) => {
        const tags = p.tags?.length ? `\n\nTags: ${p.tags.join(', ')}` : ''
        return `## [${p.title}](${p.url})\n\n${p.description}${tags}`
      })
      contents.push(`# Projects\n\nSource: ${options.domain}/projects\n\n${blocks.join('\n\n')}`)
    }
  })
})
