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
      secondary: 'teal',
      neutral: 'dusk'
    },
    pageHero: {
      slots: {
        container: 'py-18 sm:py-24 lg:py-32',
        title: 'mx-auto max-w-3xl text-pretty text-3xl sm:text-4xl lg:text-5xl tracking-tight',
        description: 'mt-2 text-md mx-auto max-w-3xl text-pretty sm:text-md text-muted font-mono'
      }
    },
    header: {
      slots: {
        root: 'backdrop-blur-md',
        title: 'absolute top-0'
      }
    },
    blogPost: {
      slots: {
        root: 'group overflow-hidden transition-all duration-200',
        image: 'rounded-lg object-center',
        header: ''
      },
      variants: {
        to: {
          true: {
            image: 'group-hover/blog-post:scale-100'
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
