# Migration Gaps: `vernaillen.dev` (old) → `vernaillen.new`

A feature/functionality audit of what existed in the previous site (`../vernaillen.dev`, GSAP + content-driven) that was **not** carried over to the current rebuild (`vernaillen.new`, page-driven + motion-v/shaders).

> Generated 2026-06-24. The two versions have fundamentally different architectures: the old site composed pages from Markdown + custom MDC content components; the new site uses dedicated `.vue` pages backed by YAML data files. Many "gaps" are deliberate redesign choices — this list is for triage, not a defect report.

**Legend:** ❌ removed entirely · ⚠️ reduced / partially migrated · 🔁 replaced by a different approach

---

## 1. Removed pages / routes

| Old route | Status | Notes |
|---|---|---|
| `/links` (linktree-style) | ❌ | Now 301-redirects to `/` (`vercel.json`). Lost: embedded SoundCloud player, Telegram link, curated link cards (Harmonics, WPNuxt, DJ set, About). |
| `/expertise` (skill meters) | ❌ | No equivalent page. The 9 animated skill bars — Nuxt 88%, Spring 94%, Java 96%, Vue 75%, Docker 80%, Kubernetes 75%, Jenkins 70%, Liferay 60%, Angular 55% — are gone. Tech is now only mentioned in FAQ prose. |
| `/test` (GSAP demo) | ❌ | Dev-only scratch page, not a real feature. |

> New page added (not a gap): `/open-source` (live GitHub contributions).

---

## 2. Removed homepage sections

- ❌ **"My Values"** section — Committed to my clients / Rolling up my sleeves / Techie with a heart.
- ❌ **"Passion for Web Development"** + **"Developing the WPNuxt module"** feature blocks (image + bullet features). Partly folded into the new About/Stats blocks.
- 🔁 **Animated hero text** — character-by-character reveal of "Wouter Vernaillen" and the staggered "Java, Spring, Nuxt & DevOps" tagline → replaced by a static hero with WebGL shaders.

---

## 3. Removed animations & UI helpers (the GSAP layer)

The old site ran on GSAP (SplitText, ScrollTrigger, Flip, DrawSVG, ScrollTo); the new site uses `motion-v` + shaders. Specific losses:

- ❌ **Scroll-progress bar + back-to-top button** (`ScrollHelpers.vue`) — no equivalent in new.
- 🔁 **Parallax scroll effects** & pinned-project scroll animations.
- ❌ **Animated SVG home background** (`home/Background.vue` — drawn circles/lines).
- ❌ **Animated separator** (drawn-logo divider).
- 🔁 Header **logo-scaling-on-scroll** + Flip nav highlight.
- 🔁 Per-element **reveal-in-view** across content.

---

## 4. Removed content / blog-authoring components

- ❌ **`YouTubePlayer`** and generic **`VideoPlayer`** MDC components — old blog posts could embed YouTube / HTML5 video inline. New content components are only `Faq`, `ProseImg`, `Pre` — no inline video for blog content. (Projects can show an mp4 thumbnail, but that's separate.)
- ❌ **`SocialComments`** — links to existing Mastodon/social discussion threads on a post. New posts instead have share buttons (X, LinkedIn, Bluesky) + copy-link.
- 🔁 **`TheLazyImage`** (ring + skeleton placeholder via `vue3-lazyload`) → `@nuxt/image` / `ProseImg`.

---

## 5. Reduced / trimmed content

- ⚠️ **Testimonials: 5 → 3.** Dropped **Davy Vanherbergen** (UPM-Kymmene) and **Kurt Eeckhout** (Group Idewe — the Dutch-language one).
- ⚠️ **Career page much thinner.** Old had per-role **project name, role, full tech-stack list, contract type, and company logo images** in an alternating timeline. New `career.yml` keeps only title/date/location/category — no stack lists, no company images, and **no Harmonics entry**.
- ⚠️ **Projects:** dropped **"Radio app"** (radio.vernaillen.dev) and **"links.vernaillen.dev"**. Added "Vue FFT Visualizer".
  - 🐛 *Data bug:* new has a **duplicate Harmonics** entry (`content/projects/3.harmonics.yml` and `5.harmonics.yml`) and two `3.`-prefixed files (`3.harmonics.yml`, `3.vue-fft-visualizer.yml`).
- ⚠️ **Social links trimmed.** Old: GitHub, LinkedIn, Instagram, Twitter, Mastodon (+ SoundCloud, Telegram on links page). New: only **GitHub, LinkedIn, X**. Dropped: **Instagram, Mastodon, Telegram, SoundCloud**.

### Blog posts not carried over

- ❌ **`989.developing-mcp-servers`** — not migrated at all (not even as a draft).
- ⚠️ **`991.supercharging-claude-code-with-mcp-servers`** and **`992.claude-code-development`** — present only as **unpublished drafts** (dot-prefixed) in new.
- ✅ `990.wpnuxt-v2-beta` → republished as `993.wpnuxt-v2`; `994`–`999` carried over.

---

## 6. Dev / infra regressions (not user-facing)

- ❌ **Test suite removed.** Old had Vitest + `@nuxt/test-utils` + Playwright (unit, app-config, coverage). New has no tests or test tooling.
- 🔁 **Image CDN:** TwicPics (external) → `@nuxt/image` local WebP. Not a feature loss, just a note.
- ⚠️ Footer **VAT/company info** (`Harmonics BV BE 0503.971.022`) and the **Nuxt-version display** are gone (new footer shows credits / self-hosting info instead).

---

## 7. Suggested triage — biggest genuine gaps

Decide **restore** vs **intentionally dropped** for each:

- [ ] `/expertise` skill-meter page (or fold meters into About)
- [ ] `/links` linktree page (currently redirects to `/`)
- [ ] Scroll-progress bar / back-to-top button
- [ ] YouTube / video embeds for blog posts
- [ ] 2 dropped testimonials (Davy Vanherbergen, Kurt Eeckhout)
- [ ] Richer career detail (tech stacks + company logos) + Harmonics entry
- [ ] `989.developing-mcp-servers` post + publish the two MCP/Claude drafts
- [ ] Dropped socials (Instagram, Mastodon, Telegram, SoundCloud)
- [ ] Fix duplicate/mis-numbered Harmonics project YAML files
