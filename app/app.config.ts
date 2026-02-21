export default defineAppConfig({
  global: {
    picture: {
      dark: '/images/woutervernaillen.jpg',
      light: '/images/woutervernaillen.jpg',
      alt: 'Wouter Vernaillen'
    },
    meetingLink: 'https://calendly.com/vernaillen/15min',
    email: 'wouter@vernaillen.com',
    available: true
  },
  ui: {
    colors: {
      primary: 'vernaillen',
      neutral: 'dusk'
    },
    pageHero: {
      slots: {
        container: 'py-18 sm:py-24 lg:py-32',
        title: 'mx-auto max-w-2xl text-pretty text-3xl sm:text-4xl lg:text-5xl',
        description: 'mt-2 text-md mx-auto max-w-2xl text-pretty sm:text-md text-muted'
      }
    },
    blogPost: {
      slots: {
        root: 'md:grid md:grid-cols-2 group overflow-visible transition-all duration-300',
        image: 'rounded-lg shadow-lg border-1 border-muted ring-2 ring-default',
        header: 'overflow-visible'
      },
      variants: {
        to: {
          true: {
            image: 'group-hover/blog-post:scale-105'
          }
        }
      }
    }
  },
  footer: {
    credits: `Built with Nuxt UI • © ${new Date().getFullYear()} Wouter Vernaillen`,
    colorMode: false,
    links: [{
      'icon': 'i-simple-icons-github',
      'to': 'https://github.com/vernaillen',
      'target': '_blank',
      'aria-label': 'GitHub'
    }, {
      'icon': 'i-simple-icons-linkedin',
      'to': 'https://www.linkedin.com/in/woutervernaillen/',
      'target': '_blank',
      'aria-label': 'LinkedIn'
    }, {
      'icon': 'i-simple-icons-x',
      'to': 'https://x.com/vernaillen',
      'target': '_blank',
      'aria-label': 'X'
    }, {
      'icon': 'i-simple-icons-bluesky',
      'to': 'https://bsky.app/profile/vernaillen.dev',
      'target': '_blank',
      'aria-label': 'Bluesky'
    }]
  }
})
