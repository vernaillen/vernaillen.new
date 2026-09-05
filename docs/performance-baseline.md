# Production performance baseline

Measured 2026-09-05 against https://vernaillen.dev. No website implementation
changes were made for these measurements. See the [full plan](performance-plan.md).

## Lighthouse results

Lighthouse 13.4.1, Google Chrome 152.0.7977.76, macOS 26.6.1 / Apple M3 Max.
Audits ran serially in fresh headless Chrome sessions with normal Lighthouse
storage reset and simulated throttling. The CDN and OS/network caches were not
purged. Mobile: 412 × 823, DPR 1.75, 150 ms RTT, 1638.4 Kbps throughput,
4× simulated CPU slowdown. Desktop: 1350 × 940, DPR 1, 40 ms RTT,
10240 Kbps throughput, 1× CPU.

Production Nuxt build ID observed in the network logs:
`a7230665-85d4-46ec-8dd6-cae133d18182`.
Local source HEAD: `4e1161005964ad76a407a246cd9f990f9561ab6a`.
The local commit is contextual information, not proof of the deployed git SHA.
Existing untracked blog content was left untouched.

| Route / run | Performance | FCP | LCP | Speed Index | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Home mobile 1 | 89 | 1.44 s | 3.74 s | 1.44 s | 42 ms | 0 |
| Home mobile 2 | 99 | 1.42 s | 2.00 s | 1.42 s | 49 ms | 0 |
| Home mobile 3 | 83 | 2.32 s | 4.07 s | 3.31 s | 91 ms | 0 |
| **Home mobile median** | **89** | **1.44 s** | **3.74 s** | **1.44 s** | **49 ms** | **0** |
| Home desktop | 100 | 0.49 s | 0.61 s | 0.74 s | 22 ms | 0 |
| Projects mobile | 80 | 2.53 s | 4.03 s | 4.83 s | 56 ms | 0 |
| Blog mobile | 86 | 1.29 s | 3.97 s | 1.29 s | 125 ms | 0 |
| Open Source mobile | 85 | 2.39 s | 3.77 s | 3.26 s | 87 ms | 0 |

The median row contains independent medians of each metric. CLS is rounded as
displayed by Lighthouse. Only the mobile homepage has repeated Lighthouse runs;
the other routes are single-run baselines, not precise performance estimates.
There were no Lighthouse run warnings or runtime errors.

Accessibility, Best Practices and SEO scored 100 on all tested routes except
Open Source accessibility, which scored 96. Automated scores do not establish
complete accessibility or measure the earlier observed mobile overflow.

## Findings and impact on the plan

1. **Mobile loading has room to improve; desktop load is already strong.**
   Home's 83–99 score range and 2.00–4.07 s LCP range are substantial. Compare
   repeated runs under identical settings rather than treating the 99 as a
   stable baseline. No single cause of the variability was established.
2. **The Projects poster is a concrete loading candidate (step 6).** Its FFT
   poster is the LCP element, and Lighthouse flags lazy loading, missing high
   priority and late discovery. The observed trace breaks out roughly 1.10 s
   resource-load delay and 0.99 s render delay. These are trace timings, not
   components of the separately simulated 4.03 s LCP. Make this poster available
   eagerly in the initial HTML when above the fold while deferring the renderer.
3. **Projects also fetches a video during the load audit (step 6).** The WebM
   accounts for about 164 KB of transfer. Measure the benefit of deferring it
   until visible and respect reduced motion.
4. **The homepage poster is already discovered and prioritized correctly.**
   All three image-discovery checks pass. Lighthouse estimates about 19 KiB of
   image-delivery savings on mobile; don't blindly add another preload.
5. **There is some unused initial JavaScript, but no evidence for a broad
   configuration rewrite (step 8).** Lighthouse estimates around 48 KiB savings
   on mobile, including Motion code. Total observed transfer is approximately
   534 KB on mobile home and 1.26 MB on desktop home. Desktop loads the 2.47 MB
   decoded shader chunk, about 731 KB over the wire in Lighthouse (different
   negotiated encoding from the earlier 690 KB curl measurement). Mobile does
   not load that shader chunk in these audits.
6. **Open Source has a specific contrast failure (step 9).** The small repository
   star count uses `text-dimmed` with a measured ratio of 3.22:1 against the dark
   background, below the audit's 4.5:1 requirement for this text size.
7. **Projects has a non-actionable bfcache diagnostic.** Lighthouse reports an
   internal `IgnoreEventAndEvict` reason, explicitly marked not actionable. Do
   not treat it as a confirmed application defect.

## Desktop interaction profile

This is a synthetic requestAnimationFrame (RAF) heartbeat and Long Tasks
profile with a Chrome trace, not GPU-presented frame counting or real-user INP.
It ran at 1440 × 900, DPR 1, without CPU/network throttling. Chrome reported
ANGLE Metal / Apple M3 Max hardware acceleration. The shader bundle loaded,
the 1440 × 724 canvas was present, the poster faded out, and the captured hero
image confirmed shader output. Reduced motion was off. No page exceptions or
console warnings/errors were captured.

Scenarios: initial load (8 seconds), visible-hero idle (5 seconds), scripted
wheel scrolling down, below-fold idle (4 seconds), scrolling back up, navigation
to Projects, and return-home navigation (6 seconds observation). Wheel inputs
were 100 px approximately every 100 ms. Screenshot/trace collection introduces
overhead; this machine is much faster than a typical phone.

| Scenario, trace enabled | Median RAF gap | P95 RAF gap | Largest gap | Long tasks >50 ms |
| --- | ---: | ---: | ---: | ---: |
| Initial home load | 16.7 ms | 16.8 ms | 33.5 ms | 0 |
| Hero idle | 16.7 ms | 16.8 ms | 16.8 ms | 0 |
| Scroll down | 16.7 ms | 16.8 ms | 233.3 ms | 0 |
| Below-fold idle | 16.7 ms | 16.7 ms | 16.8 ms | 0 |
| Scroll up | 16.7 ms | 16.7 ms | 16.8 ms | 0 |
| Navigate to Projects | 16.7 ms | 16.7 ms | 50.0 ms | 1 (59 ms) |
| Return home | 16.7 ms | 16.7 ms | 16.8 ms | 0 |

The ordinary callback cadence was approximately 60 Hz. A 233 ms callback gap
occurred during scroll, without a corresponding Long Task. That does not by
itself identify an application bug: browser scheduling, rendering, tracing or
other system activity can also produce gaps. Return-home startup did not show
a stall on this machine, so the earlier concern remains a robustness/slow-device
hypothesis, not a reproduced desktop regression.

The repeat without trace recording did **not** reproduce the scroll outlier:
both scroll directions had maximum RAF gaps of 16.8 ms and no Long Tasks.
Initial startup peaked at 33.4 ms. Navigation to Projects again produced one
Long Task (57 ms, versus 59 ms in the trace run) and a 49.9 ms RAF gap.
Return-home again peaked at 16.8 ms with no Long Tasks. Both profiles therefore
support generally steady callback cadence on this desktop, with a small
repeatable Projects-navigation stall to investigate alongside step 6. They do
not establish the behavior of slower GPUs or mobile devices.

The repeat's raw summary and samples are in the `repeat-no-trace/` subfolder.

## Reproduce and inspect

From the repository root:

```sh
bash scripts/performance/lighthouse.sh https://vernaillen.dev .unlighthouse/performance/after-step-1
```

The pinned runner uses npm's package cache without changing this project's
dependencies. Set `CHROME_PATH` if Lighthouse cannot discover Chrome. Inspect
each `.report.html`; load the matching `*-0.trace.json` in Chrome DevTools'
Performance panel for load diagnostics. Large raw reports are ignored by Git.

The interaction script accepts the installed Puppeteer Core entry point:

```sh
node scripts/performance/profile.mjs /absolute/path/to/puppeteer-core/lib/puppeteer/puppeteer-core.js .unlighthouse/performance/after-step-1
```

Baseline Puppeteer Core version: 25.10.0 (available with Lighthouse's cached
dependencies). Set `PERF_TRACE=0` to repeat without tracing. Set
`PERF_CHROME_PATH` to use another Chrome executable. The trace is
`desktop-interactions.trace.json`; summary data is `desktop-interactions.json`.

Raw baseline folder: [reports and traces](../.unlighthouse/performance/baseline-2026-09-05/).
Representative HTML reports: [mobile home](../.unlighthouse/performance/baseline-2026-09-05/home-mobile-1.report.html),
[desktop home](../.unlighthouse/performance/baseline-2026-09-05/home-desktop.report.html),
[Projects](../.unlighthouse/performance/baseline-2026-09-05/projects-mobile.report.html),
[Blog](../.unlighthouse/performance/baseline-2026-09-05/blog-mobile.report.html),
[Open Source](../.unlighthouse/performance/baseline-2026-09-05/open-source-mobile.report.html).

Commit the small documentation and runner files when implementing the plan;
raw reports remain local unless explicitly archived elsewhere. A different
checkout will retain the summaries through Git, but not ignored trace files.

Method references: [Lighthouse CLI](https://github.com/GoogleChrome/lighthouse/blob/main/readme.md),
[measurement variability](https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md),
[Lighthouse trace inspection](https://developer.chrome.com/docs/devtools/lighthouse).
