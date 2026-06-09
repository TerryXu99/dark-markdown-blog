/**
 * Static text content for the pseudo-FS. Inlined directly into the
 * manifest (small, ships once with the page). Long-form content like
 * blog posts is fetched lazily through `endpoint`.
 */

/**
 * Hostname-style label for the FS root. Surfaced in the prompt host
 * segment and as the prefix of `pwd` output (so the tree visibly
 * "lives" on this machine). Change here, propagates everywhere.
 */
export const ROOT_LABEL = 'viperxu.devserver'

export const SOCIAL_LINKS: { label: string; href: string }[] = [
  { label: 'github', href: 'https://github.com/TerryXu99' }
]

export const README_TEXT = `viperxu.devserver — a pseudo-FS over my site content.

If you're an AI agent the easy path is the public manifest:
  GET https://example.com/.well-known/viperxu-manifest.json
That returns the same tree you see here, plus instructions and the
endpoint dictionary. CORS is open.

If you're poking around in dev mode:
  ls               — see what's here
  search agent     — search posts and notes
  cat about        — short bio
  cat now          — what I'm working on
  cd /blog         — recent posts (each has meta / summary / post)
  cat /blog/<slug>/post  — inline read with shiki highlighting
  manifest         — same data as the well-known URL, in this terminal
`

export const ABOUT_TEXT = `ViperXu
Student · Wuhan, Hubei · China University of Geosciences (Wuhan)

Currently looking for an internship and learning Agent development.
Focus areas: LLMs, tool use, RAG, and multi-agent collaboration.
`

export const NOW_TEXT = `Now:

- learning Agent development
- organizing this personal blog into a clean cold-tone site
- preparing projects and notes for future internship applications
`

export const PERSONALITY_TEXT = `# personality.conf
# referenced by the boot sequence — flavor only

style:     terminal-native, quiet, cold-tone
voice:     concise, curious, engineering-focused
languages: zh-CN, en, ts, py
location:  Wuhan, Hubei, China · UTC+8
`

export const MOTD_TEXT = `Welcome to viperxu.sh dev mode.

This is a pseudo-FS exposing my site's content as a directory tree.
Type \`help\` for commands. \`exit\` or Esc to leave.
`
