# Steps 1–5: implementation and local verification

Measured 2026-09-05. Status: **Implemented / verified locally**.
[Full plan](performance-plan.md) · [Production baseline](performance-baseline.md).

## What changed

1. **Reliable hero handoff.** The poster remains until the shader library emits
   its actual `ready` event. `unavailable` keeps the fallback visible. Pending
   idle callbacks/timeouts are cancelled when leaving the page, and the GPU
   probe releases its temporary context.
2. **Shader eligibility before import.** A mounted parent gate requires a viewport
   of at least 1024 px and no reduced-motion preference. Startup uses idle time
   on both initial and return navigation. The library's offscreen pause remains.
3. **Mobile experience rows.** Dates stack above roles on narrow screens; company
   names wrap and the desktop separator remains on wider screens.
4. **Short, consistent transitions.** Shared `ScrollReveal` keeps content visible
   immediately and moves it 8 px over 220 ms once. Local stagger is capped at
   120 ms. Page entry moves 6 px over 160 ms with a persistent header. Scroll
   restoration waits for the incoming page DOM.
5. **Reduced motion.** Reveal and page movement, the theme wipe and smooth hash
   scrolling respect the preference. Ordinary theme changes use a 300 ms wipe,
   accept keyboard activation and safely handle overlapping/cancelled transitions.

Implementation is recorded in local commit `8a47717b15793496e4ad930f05142de130a0e38d`.
Primary files: `HeroShaders.client.vue`, `landing/Hero.vue`,
`landing/WorkExperience.vue`, `ScrollReveal.vue`, `ColorModeButton.vue`,
`router.options.ts`, `main.css`, `nuxt.config.ts`, and former Motion call sites.
The Motion dependency remains because other UI components can still use it;
this work does not claim to remove its shared bundle.

## Verification

- `pnpm lint:fix`, `pnpm typecheck` and `pnpm generate` passed. The production
  build prerendered 232 routes. Build warnings included icon-fetch timeouts,
  redundant SEO description configuration, Rollup annotations and four existing
  absolute-link warnings; link checking reported no errors.
- Production preview: `http://127.0.0.1:4173`, served with `serve@14.2.5`.
  Nuxt build ID: `ec818c57-a7e1-4d4c-b997-1597cc6ea181`.
- Fresh browser contexts at 320, 375, 390 and 768 px had equal viewport/document
  widths, no canvas and no shader chunk request. Mobile experience rows and
  desktop alignment were also checked visually in the in-app browser.
- Reduced-motion desktop requested no shader, left reveal text visible without
  transforms, used no View Transition for keyboard theme activation, and used
  instant scrolling for the article's `#breaking-changes` link.
- A deliberately delayed WebGPU adapter kept the poster visible beyond the old
  two-frame delay. Releasing initialization produced a canvas and faded the
  poster. Changing the motion preference then removed the canvas and restored
  the poster. A null adapter kept the poster visible.
- Navigation to Projects reset scroll to zero, Back restored 1200 px, Forward
  reset to zero, and the same header DOM remained mounted. Keyboard theme
  switching and rapid Home → Career navigation completed without page exceptions.

One separate hydration warning remains on `/blog/wpnuxt-v2`. A diagnostic browser
response instrumented Vue's mismatch handler and identified the Shiki `<style>`:
prerendering minifies its CSS text, while MDC hydrates the equivalent CSS with
spaces and semicolons. This is outside the changed motion logic. The verification
runner records this known article warning explicitly and fails on other hydration
warnings or page exceptions. Investigate the CSS/minification boundary in step 8;
do not suppress hydration checking globally.

## Desktop interaction profile

Chrome 152.0.7977.76, Apple M3 Max / ANGLE Metal, 1440 × 900, DPR 1, no CPU or
network throttling. One run without tracing, using the same scripted scenarios
as the baseline. The shader was running (1440 × 724 canvas, poster opacity zero).
No page exceptions or console warnings/errors were captured in this profile.

| Scenario | Median RAF gap | P95 gap | Largest gap | Long tasks >50 ms |
| --- | ---: | ---: | ---: | ---: |
| Initial home load | 16.7 ms | 16.7 ms | 33.3 ms | 0 |
| Hero idle | 16.7 ms | 16.8 ms | 16.8 ms | 0 |
| Scroll down | 16.7 ms | 16.8 ms | 16.8 ms | 0 |
| Below-fold idle | 16.7 ms | 16.7 ms | 33.4 ms | 0 |
| Scroll up | 16.7 ms | 16.7 ms | 16.8 ms | 0 |
| Navigate to Projects | 16.7 ms | 16.8 ms | 50.1 ms | 1 (53 ms) |
| Return home | 16.7 ms | 16.8 ms | 16.8 ms | 0 |

These are requestAnimationFrame callback intervals, not measured GPU-presented
FPS or real-user INP. Scrolling and return-home remained steady in this run.
The Projects task persists (baseline 57–59 ms); 53 ms is too small a difference
in a single local run to claim an improvement. Step 6 remains the next proposed
loading/performance candidate. Slower devices still need production validation.

## Local Lighthouse results

Lighthouse 13.4.1, Chrome 152.0.7977.76, with the same simulated mobile/desktop
settings as the baseline. Seven serial audits completed without run warnings or
runtime errors.

| Route / run | Performance | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Home mobile 1 | 72 | 4.24 s | 4.62 s | 137 ms | 0 |
| Home mobile 2 | 72 | 4.24 s | 4.62 s | 138 ms | 0 |
| Home mobile 3 | 72 | 4.24 s | 4.62 s | 142 ms | 0 |
| **Home mobile median** | **72** | **4.24 s** | **4.62 s** | **138 ms** | **0** |
| Home desktop | 97 | 1.01 s | 1.05 s | 11 ms | 0 |
| Projects mobile | 72 | 4.07 s | 4.85 s | 135 ms | 0 |
| Blog mobile | 74 | 4.24 s | 4.53 s | 0 ms | 0 |
| Open Source mobile | 76 | 4.07 s | 4.15 s | 0 ms | 0 |

Best Practices and SEO scored 100 throughout. Accessibility scored 96 on Home
and Open Source, 100 on Projects and Blog. With experience text now visible
without waiting for a scroll reveal, the audit reports existing company colors:
Opgroeien / Kind & Gezin (3.62:1), Atos Origin (4.16:1), Alcatel e-Com (3.60:1).
Their color values were not changed in steps 1–5. These join the existing Open
Source star-count contrast issue in step 9.

This local production-build check is **not a controlled before/after comparison**
with the CDN baseline. Server latency, compression, build identity and content differ:
the local build also contains pre-existing untracked blog articles absent from
the baseline deployment. Production verification remains pending.

### Same-server homepage comparison

To distinguish the local-server effect from code changes, the pre-change commit
`4e1161005964ad76a407a246cd9f990f9561ab6a` was generated in an isolated temporary
directory using the same installed dependencies and the same untracked blog
content. It was served with `serve@14.2.5` over local HTTP/1.1 on port 4174.
Before-build ID: `6b005a07-1ee3-4da1-9a9f-71124d7848c0`. Three mobile homepage
runs and one desktop run used the same Lighthouse settings and completed without
warnings/errors. The after suite ran first, followed by these before runs; this
was serial rather than a randomized/interleaved experiment.

| Homepage metric | Local before | Local after |
| --- | ---: | ---: |
| Mobile performance median (range) | 72 (72–74) | 72 (72–72) |
| Mobile FCP median | 4.24 s | 4.24 s |
| Mobile LCP median (range) | 4.62 s (4.46–4.62) | 4.62 s (4.62–4.62) |
| Mobile TBT median (range) | 121 ms (110–126) | 138 ms (137–142) |
| Desktop performance | 97 | 97 |
| Desktop LCP | 1.05 s | 1.05 s |
| Desktop TBT | 14 ms | 11 ms |
| CLS, all homepage runs | 0 | 0 |

The large gap between local and CDN scores is also present in the old code.
These changes do **not** demonstrate a homepage loading-score or LCP gain.
Mobile TBT rose by 17 ms in the local medians; record and revisit this in the
production repeat rather than dismissing it or asserting its cause. The verified
benefits of steps 1–5 are reliable GPU handoff/fallback, reduced-motion import
gating, mobile layout and consistent interaction behavior. The local accessibility
score changed from 100 to 96 because the always-visible company text exposes the
contrast issues listed above; it must be fixed in the remaining plan.

Raw comparison reports: [local pre-change homepage audits](../.unlighthouse/performance/items-1-5/local-before/).

## Reproduce

Generate the production site, then serve `.output/public` on port 4173. With
Puppeteer Core 25.10.0 available, run these serially from the repository root:

```sh
node scripts/performance/verify-ui.mjs /absolute/path/to/puppeteer-core/lib/puppeteer/puppeteer-core.js
PERF_ORIGIN=http://127.0.0.1:4173 PERF_TRACE=0 node scripts/performance/profile.mjs /absolute/path/to/puppeteer-core/lib/puppeteer/puppeteer-core.js .unlighthouse/performance/items-1-5/profile
bash scripts/performance/lighthouse.sh http://127.0.0.1:4173 .unlighthouse/performance/items-1-5/lighthouse
```

The UI runner targets this local generated build and discovers its shader chunk;
its second argument overrides the origin. Use `PERF_CHROME_PATH` for a different
Chrome executable. Large raw reports remain ignored by Git:
[UI checks](../.unlighthouse/performance/items-1-5/ui-verification.json),
[interaction profile](../.unlighthouse/performance/items-1-5/profile/desktop-interactions.json),
[Lighthouse reports](../.unlighthouse/performance/items-1-5/lighthouse/).
