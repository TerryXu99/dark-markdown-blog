const siteBase = import.meta.env.BASE_URL.replace(/\/$/, '')

export function withBasePath(href: string | undefined | null): string | undefined | null {
  if (!href || !siteBase) return href
  if (!href.startsWith('/') || href.startsWith('//')) return href
  if (href === siteBase || href.startsWith(`${siteBase}/`)) return href
  return `${siteBase}${href}`
}

