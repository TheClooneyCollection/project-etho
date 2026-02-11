# Social Metadata

## Overview
The site uses page-specific Open Graph and Twitter metadata with a shared fallback social image.

Implementation lives in:
- `web/src/_includes/layout.njk`
- `web/src/_data/site.js`

## Global Site Metadata
Defined in `web/src/_data/site.js`:

- `name`: `"Project Etho"`
- `description`: `"Etho's appearances across the web."`
- `url`: canonical site base URL (default `https://etho.clooney.io`)
- `socialImagePath`: `"/assets/social/project-etho-og.svg"`

`SITE_URL` can override `site.url` at build time.

## Tags Rendered Per Page
`layout.njk` sets:

- `<title>`
- `<meta name="description">`
- `<link rel="canonical">`
- `og:type`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:image`, `og:image:alt`
- `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`, `twitter:image:alt`

## Page-Specific Behavior
- Default title/description come from page front matter and site defaults.
- For month pages (`monthPage` exists), metadata is overridden to month-specific values:
  - title: `Project Etho - YYYY-MM`
  - description: `Etho appearances for YYYY-MM.`

## Social Image Asset
Shared image file:
- `web/src/assets/social/project-etho-og.svg`

Output path after build:
- `web/_site/assets/social/project-etho-og.svg`

## Notes
- This is a static fallback image strategy (Option 2: page-specific metadata + shared image).
- If custom per-page images are added later, `socialImagePath` can be overridden per page.
