# Performance and UI improvement plan

Updated: 2026-09-05

This file is the persistent source of truth for the website performance work.
The initial review was previously only in the Codex conversation. The user
authorized implementation of steps 1–5 on 2026-09-05. The user subsequently authorized all remaining steps (6–9).

## Current status

- **Baseline complete:** seven Lighthouse audits and two desktop interaction profiles (with/without tracing).
- **Active:** implementing and measuring steps 6–9; production verification remains pending.
- **Next proposed work:** step 6 (eager FFT poster and deferred demo/video loading).
- **Implementation progress:** 5 of 9 steps implemented and verified locally; steps 6–9 in progress.
- **Baseline:** [measurement report](performance-baseline.md).
- **Latest results:** [steps 1–5 verification](performance-items-1-5.md).

## Progress tracking

At the beginning of each implementation step, mark it **In progress**. When it
finishes, record files/commit or PR, verification results, before/after metrics,
and any remaining concerns. Use **Implemented / verified locally** separately
from **Verified in production**. A build passing does not establish that the
deployed site improved. Record **Blocked** with the specific dependency when
needed; record **Deferred** with the reason if an experiment is not worthwhile.

Each user-facing progress update should say which step is active, what changed,
what was tested, and what is next. At the end of each step update this file and
the measurement report. A future task can resume by reading these two files;
there is no need to rely on the original conversation's context.

## Ordered work

Step IDs remain stable when priorities change. The user selected **1–5 first**.
For reference, after baseline measurement the
proposed implementation order is **1 → 3 → 6 → 5 → 2 → 7 → 4 → 8 → 9**:
the Projects poster's late LCP now gives step 6 stronger evidence than adding
cosmetic route transitions. The initial desktop return-home profile was smooth;
step 2 remains a payload/robustness improvement rather than a reproduced stall.

| Step | Status | Change | Verification / completion criteria |
| --- | --- | --- | --- |
| 0 | Complete | Measured production loading and animation behavior; preserved raw reports and settings. | Three mobile homepage runs, desktop homepage, mobile Projects/Blog/Open Source; no run warnings; two desktop RAF/Long Task profiles with hardware GPU, including a repeat without tracing. Results in the baseline report. |
| 1 | Implemented / verified locally | Use the shader library's real `ready`/`unavailable` events for poster handoff; cancel pending callbacks on unmount. | Poster remains until actual rendering succeeds; GPU failure preserves it; rapid navigation produces no late callbacks or blank hero. |
| 2 | Implemented / verified locally | Gate shader import in a lightweight parent using viewport and reduced motion; defer startup on return navigation. | Mobile and reduced-motion desktop do not download the shader; no hydration mismatch; compare return-home trace and initial load against baseline. Preserve the existing offscreen pause behavior. |
| 3 | Implemented / verified locally | Allow homepage experience rows to wrap or stack on mobile. | No horizontal document overflow at 320, 375, 390, 768 px; long company names readable; desktop alignment preserved. Prior live observation: 468 px document width at 390 px viewport. |
| 4 | Implemented / verified locally | Standardize reveal timing, cap local stagger, and add a short page-content transition if it improves perceived navigation. | Main text visible immediately; later list items have no index-dependent wait; header remains stable; back/forward, hash links, keyboard focus and scroll restoration still work. Profile before adopting route animation. |
| 5 | Implemented / verified locally | Honor reduced motion in theme wipe, Motion components and programmatic smooth scrolling. | Reduced-motion mode changes theme without the 600 ms wipe; controls work with keyboard; no animated reveal or smooth scrolling contrary to preference; ordinary mode remains smooth. |
| 6 | In progress | Serve the above-fold FFT poster eagerly; defer renderer import/mount until playback; gate project video loading/playback by visibility and motion preference. | Poster is discoverable in initial HTML with suitable priority; first click initiates playback; microphone user activation is preserved; error/retry/source switching and navigation cleanup work. Compare Projects LCP, transfer and CPU before playback. |
| 7 | In progress | Include prerendered GitHub contributions in initial Open Source HTML/payload. | Cards present before hydration; no spinner-to-content jump; static deployment still works without a runtime GitHub API; absent build credentials handled. |
| 8 | In progress | Measure shared JavaScript and CSS cost before adjusting preload or inline styles; investigate Shiki style-text hydration mismatch on code-heavy articles. | Controlled A/B measurements show a useful improvement in cold and repeat views; preserve responsive image priority, current font strategy and the guard against speculative shader downloads. Avoid blanket preload removal. |
| 9 | In progress | Fix measured Open Source star-count and homepage company-text contrast; small UI cleanup: duplicate toaster, forced homepage logo reload, mobile spacing, possible View Projects hero action. | Star-count and company-text contrast reach 4.5:1; one notification region; logo uses normal navigation; layout and keyboard behavior checked. Treat CTA and spacing as design choices, not measured performance fixes. |

## Measurement rules

- Audit production or a production build, never Nuxt's development server.
- Pin Lighthouse and record Chrome version, device settings, throttling, URL,
  date, deployment identity where available, and local source commit separately.
- Run audits serially. Use repeated runs and compare medians/ranges for changes.
- Preserve raw HTML/JSON reports and traces under `.unlighthouse/performance/`
  (already ignored by Git); keep small summaries in `docs/` for version control.
- Lighthouse navigation scores are not scroll FPS or real-user INP. Record
  animation traces and interaction measurements separately, including whether
  the shader actually ran and which GPU/backend the browser used.
- First validate the affected routes and scenarios. Run the repository's
  required lint/typecheck/build checks when implementing website changes.
- Do not claim production verification until the changed build is deployed
  and the relevant production measurements have been repeated.

## Activity

| Date | Step | Outcome |
| --- | --- | --- |
| 2026-09-05 | Review | Reviewed live desktop/mobile pages, source and asset sizes. No website changes. |
| 2026-09-05 | 0 | Saved this plan and a pinned, serial Lighthouse runner. Baseline collection started. |
| 2026-09-05 | 0 | Completed seven Lighthouse audits. Mobile home median 89 (83–99); desktop 100; Projects 80; Blog 86; Open Source 85. |
| 2026-09-05 | 0 | Completed hardware-GPU interaction profiles with and without tracing. Return home was smooth in both; one 57–59 ms Projects-navigation task reproduced. Scroll outlier from trace run did not recur without tracing. |
| 2026-09-05 | Priorities | Added eager FFT poster delivery to step 6 and measured star-count contrast to step 9. Moved step 6 ahead of optional route animation. |
| 2026-09-05 | Validation | Audit runners executed successfully; repository lint and typecheck passed; shell/JavaScript syntax and documentation links checked. No production build was needed because application code was unchanged. Files saved locally, not committed or deployed. |
| 2026-09-05 | 1–5 | Implementation recorded in local commit `8a47717`. Production build and behavioral checks passed; local profile kept scrolling/return-home steady. Projects still has a 53 ms task. Detailed results and a separate Shiki hydration warning are recorded in the steps 1–5 report. Production verification pending. |
| 2026-09-05 | 1–5 verification | Completed seven local Lighthouse audits and four same-server pre-change homepage audits. Mobile median score stayed 72; desktop stayed 97; homepage LCP unchanged. Mobile TBT median rose 121 → 138 ms. No loading-score gain claimed. Company-text contrast findings added to step 9; production repeat remains pending. Final lint/typecheck and all five behavioral scenarios passed (known article CSS hydration warning recorded). |
