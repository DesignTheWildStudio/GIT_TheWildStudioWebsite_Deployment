# The Wild Studio — deployment notes

The live site is hosted on Webtold (site "The Wild Studio", slug `the-wild-studio`):

- https://www.thewildstudio.co/ (primary)
- https://the-wild-studio.webtold.app/ (redirects to the primary domain)

This repository mirrors the hand-authored source of that site so text and code
changes are tracked in git. It is an Astro project; the portfolio pages live as
plain HTML under `public/`.

## What is in this repo

- `public/*.html` — the site pages (home, work, project, about, services, contact)
- `public/projects-data.js` — the single source of truth for every portfolio
  project: name, services, year, card image and the **overview blurb** shown on
  the project page and on work-grid hover cards
- `public/*.js`, `public/responsive.css` — shared behaviour and styles
- `public/favicon.svg` — the browser-tab icon (brush W on a black tile)
- `src/`, `astro.config.mjs`, `package.json` — the Astro scaffold Webtold builds

Last synced with live deploy `ece76b25` (5 Oct 2026). Every file under
`public/` was checked byte-for-byte against the live build with Webtold's
`verify_page` (sha256).

## What is NOT in this repo

- `public/media/` — the image library (hundreds of `.webp` files) is managed in
  Webtold's media store
- `public/uploads/` — video, font and other uploaded binaries. The 5 Oct pages
  rely on `uploads/showreel-web.mp4` (home showreel, a ~4.5 MB re-encode of the
  1080p master, which is over Webtold's 5 MB upload limit),
  `uploads/hero-animation-web.mp4` and `uploads/untitled-design-7-d4a87f94.mp4`
  (work banner, light/dark), `uploads/woman-typing-man-pointing-v7.mp4` and
  `uploads/woman-typing-dark-mode-c10fc1ed.mp4` (contact illustration), plus
  `media/showreel-poster-1080.webp`; and, from 7 Oct, `uploads/showreel-mobile.webm`
  (vertical 720x1280 home showreel for phones up to 640px wide; VP9 + Opus,
  60 fps, ~4.5 MB)
- `public/favicon.png` — the binary PNG version of the favicon
- `public/fig-*/components.bundle.js` — generated Figma case-study bundles

Those files are large or binary and are kept on Webtold. Use the Webtold
`export_site` action to get a complete, buildable copy including them.

## Editing a project overview

Edit the `blurb` string for the project's entry in `public/projects-data.js`,
apply the same edit on Webtold (`edit_file` on `public/projects-data.js`), bump
the `?v=` cache-buster on the `projects-data.js` script tag in
`public/project.html` and `public/work.html`, then `publish`. Source edits on
Webtold are not live until a publish runs.

## Publishing from Claude (known limitation)

Webtold's `publish` must snapshot all ~888 source files before it queues a
build. On this site that takes longer than one minute, and builds themselves
run roughly 7 to 28 minutes even when nothing changed.

Claude Code cloud sessions cap every MCP connector call at 60 seconds
(`MCP_TOOL_TIMEOUT=60000`). The publish call is killed mid-snapshot, so no
deploy is ever queued, and the site keeps serving the previous build. Editing
files through the connector still works, because those calls return quickly.

Two ways around it:

1. Publish from the Webtold dashboard at https://api.webtold.app/dashboard.
   Source edits made by Claude are already saved server-side, so one click
   ships them.
2. Raise the timeout for the cloud environment, then start a NEW session
   (cloud sessions copy environment values once, at startup). Set both of
   these in the environment configuration UI at claude.ai/code:

       MCP_TOOL_TIMEOUT=900000
       CLAUDE_CODE_MCP_TOOL_IDLE_TIMEOUT=900000

`.claude/settings.json` in this repo sets the same two values. Prefer the
environment UI, since a platform-provided value may take precedence over the
repo setting.

The long-term fix is fewer source files: 796 of the 888 are images under
`public/media/`, and 36 generated Figma bundles account for about 4.3 MB.
