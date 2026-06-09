import type { APIRoute } from 'astro'

export const prerender = true

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ query: '', results: [] }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300'
    }
  })
