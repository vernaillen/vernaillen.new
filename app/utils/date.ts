// Format a post date deterministically in UTC. Content dates are stored at
// midnight UTC (z.date()), so formatting in the visitor's local timezone makes
// clients behind UTC render the previous day — diverging from the UTC-rendered
// SSR HTML and triggering a hydration mismatch. Pinning locale + timeZone keeps
// server and client identical everywhere.
export function formatPostDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeZone: 'UTC'
  }).format(new Date(date))
}
