import type { APIRoute } from 'astro'

import { ROOT_LABEL } from '@/components/terminal/fs/content'
import { buildSiteFs } from '@/components/terminal/fs/server'

const SITE_URL = 'https://example.com'

const INSTRUCTIONS = `You're reading a structured map of ViperXu's personal site.

Quick start:
  - Read the "instructions" field and "description" field for context.
  - Walk "tree" — it mirrors a Unix-style filesystem. Files have either
    "content" (inline text, ready to read) or "endpoint" (URL to fetch
    full content).
  - For blog posts, GET "<endpoint>" returns { html, headings }.
  - Resolve link nodes via their "href" field.

Suggested first reads: /about, /now, /README. Then ls /blog for posts.

If you're a human exploring this URL: the site has an interactive dev mode
opened with the backtick key.`

export const GET: APIRoute = async () => {
  const tree = await buildSiteFs()

  const manifest = {
    version: '0.1',
    name: ROOT_LABEL,
    site: SITE_URL,
    description:
      'ViperXu — student at China University of Geosciences (Wuhan), ' +
      'currently looking for an internship and learning Agent development. ' +
      'Focus areas include LLMs, tool use, RAG, and multi-agent collaboration.',
    instructions: INSTRUCTIONS,
    tree,
    endpoints: {
      blog_post: {
        url: `${SITE_URL}/api/blog/<id>`,
        method: 'GET',
        format: 'json',
        fields: ['html', 'headings'],
        note:
          'Always use the `endpoint` field from a post node directly. Astro ' +
          'collection ids and FS-safe names may diverge.'
      },
      well_known_manifest: {
        url: `${SITE_URL}/.well-known/viperxu-manifest.json`,
        method: 'GET',
        format: 'json',
        note: 'this document'
      }
    },
    links: {
      site: SITE_URL,
      github: 'https://github.com/TerryXu99',
      rss: `${SITE_URL}/rss.xml`,
      sitemap: `${SITE_URL}/sitemap-index.xml`
    },
    generated_at: new Date().toISOString()
  }

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=86400',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'x-robots-tag': 'all'
    }
  })
}

export const OPTIONS: APIRoute = () =>
  new Response(null, {
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-max-age': '86400'
    }
  })
