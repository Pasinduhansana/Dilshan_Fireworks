# Dilshan Fireworks — Project Guide

Primary reference for this repository. For future tasks, read this file first and inspect only the components named below.

## Stack

Next.js 16 App Router (Turbopack), React 19, TypeScript, Tailwind CSS v4, GSAP 3 + ScrollTrigger. No extra animation/scroll libraries.

## Structure

```
src/
  app/
    layout.tsx        Root layout, Google fonts (DM Sans / Outfit), metadata
    page.tsx          Thin entry point; renders CinematicJourney only
    globals.css       Brand tokens (--bg, --accent, --accent-2, ...), base styles
  components/
    CinematicJourney.tsx  Client transition orchestrator (scroll + nav click)
    LandingPage.tsx       Approved landing markup (server component)
    CinematicIntro.tsx    Existing load-in animation for landing elements
    Event.tsx             Events section (client component, own content reveals)
public/images/
    hero.jpg              Landing hero background (do not change)
    fw-30048038.jpg       Supplied fireworks image (unused by current Events layout)
    fw-32974947.jpg       Supplied fireworks image (unused by current Events layout)
    fw-33689354.jpg       Supplied fireworks image (unused by current Events layout)
    events/               Six category images (Pexels, free license): wedding, music, cricket, birthday, corporate, festival
PROJECT_GUIDE.md      This file — update when implementation changes
```

## Component responsibilities

- `LandingPage.tsx`: exact, verbatim copy of the approved landing page. Do not restyle, reposition, reorder, or remove anything here. The navbar is `<nav class="intro-element ...">` and must keep its existing markup and styling.
- `CinematicIntro.tsx`: pre-existing intro timeline (hero scale + `.intro-element` fade/blur/slide). Untouched. Still owns initial page-load motion.
- `Event.tsx`: independent Events section with **no solid section background**. All content sits inside one full-width translucent frosted-glass panel (`rgba(7,26,32,0.28)` + `backdrop-blur(22px)`), so the landing hero shows through blurred while Events slides over it. Compact asymmetric 12-column mosaic of six categories (Weddings, Musical Shows, Cricket Matches, Birthday Parties, Corporate Events, Festivals) using local images in `public/images/events/`. Owns its own GSAP ScrollTrigger reveals, image parallax, and hover interactions.
- `CinematicJourney.tsx`: owns the single scroll-driven transition timeline, the `a[href="#events"]` / `a[href="#home"]` click handlers, the persistent white frame layer, and keeps the existing navbar fixed at the top of all layers (`z-index: 9999`). Layer order: Events `z-30` < white frame `z-50` < navbar `z-9999`. Both scrolling and clicking drive the same timeline via the same scroll position — no second transition timeline. `#home` must be scrolled programmatically because its target is pinned.

## Animation setup

### Load-in (existing, unchanged)
`CinematicIntro.tsx` animates `.hero-image` scale 1.1 → 1 and all `.intro-element` elements from opacity 0 / blur 18px / y 28 to their final state. Reduced motion sets final state immediately.

### Landing → Events transition (`CinematicJourney.tsx`)
- Pin `ScrollTrigger` on `[data-landing-shell]`: `start: "top top"`, `end: "max"`, `pin: true`, `pinSpacing: false`. It stays pinned behind the whole Events section so the glass never falls back to the solid body colour.
- A separate transition `ScrollTrigger` on the journey root: `start: "top top"`, `end: "+=100%"`, `scrub: 1`. This keeps foreground motion scoped to the first viewport and supplies the click destination (`transition.scrollTrigger.end`).
- Pinning keeps the landing background image visually stationary; the Events section (`[data-event-shell]`, `z-30`) slides up over it naturally from the bottom. No transform/blur/opacity is applied to the landing background or the shell itself. The Events content is inside a frosted-glass panel, so the pinned landing image is visible through it, blurred.
- Only the landing foreground elements (`.intro-element` **excluding** `nav`) are animated: `y: 0 → -96`, `opacity: 1 → 0`, `filter: blur(0) → blur(14px)`, staggered 0.08. `immediateRender: false` preserves the intro animation on first load.
- Navbar is explicitly filtered out of the transition and is never moved, blurred, or faded by it.
- Events / Home nav clicks: `a[href="#events"]` and `a[href="#home"]` are intercepted with the same 0.95s GSAP scroll-position tween (to `transition.scrollTrigger.end` or `0`); wheel/touch/keydown cancel the tween. Hash is updated with `replaceState`. Without this, `#home` cannot scroll to the pinned element and the landing foreground stays hidden.
- Active-link pill: the orchestrator injects a rounded gradient span into the navbar (runtime only, `LandingPage.tsx` untouched). It starts on Home and morphs (`x`, `y`, `width`, `height`) to the clicked link with a 0.55s `power3.inOut` tween. Home's static pill background is removed so there is only one indicator. Text colour is animated by the same `selectLink()` call with the same 0.55s duration/ease, so whitening and pill movement stay in sync; the previously active link fades back to `#35515a`. Nav link CSS `transition-property` is limited to `background-color` so GSAP owns colour. A scroll listener also selects Home/Events when the user scrolls between the landing and Events sections, so click and scroll stay in sync.
- Reduced motion: no pin, no transition timeline, no reveals; click jumps instantly.
- Everything is wrapped in `gsap.context()` and reverted on cleanup.

### Events content reveals (`Event.tsx`)
- Six `.event-tile` mosaics: `clipPath: inset(100% 0 0 0) → 0` media reveal, blur 12px → 0 + opacity for title/copy/line, staggered once on enter (`top 88%`).
- Scroll-scrubbed `yPercent: -5 → 5` parallax on each tile's media (with `scale: 1.14` to avoid edge gaps).
- Hover: image `scale → 1.12`, accent line `width 40 → 72px`, ring brightens; listeners are removed on cleanup.
- Separate `ScrollTrigger` per `.event-chapter` for intro/closing copy (blur 24px → 0, opacity, stagger, `once: true`).
- `.event-chapter__reveal` elements are hidden with `gsap.set` (opacity 0, blur 24px) and revealed with a `gsap.to` blur-to-clear tween (duration 1.4, stagger 0.15, `once: true`). `gsap.set` is used instead of `fromTo` because ScrollTrigger's `from` initialization was unreliable. No positional movement — content does not travel with the sliding background.
- Intro header uses `start: "top 15%"` so its copy reveals as the Events glass panel finishes covering the viewport (and before the click destination of 100vh); later chapters use `top 82%`.
- Navbar is physically moved to the journey root on mount (and moved back on cleanup) because the pinned landing shell gets a `transform`, which traps even `z-index: 9999` below Events. It is `position: fixed` with scroll-independent offsets derived from the inner section's `offsetTop` chain. A separate fixed white frame (`z-50`) mirrors the landing's pale border so Events slides in behind it while the navbar stays above everything. After pin release the landing transform is cleared (`onLeave` / `onEnterBack`).

## Important restrictions

1. Landing markup in `LandingPage.tsx`, its CSS in `globals.css`, and `CinematicIntro.tsx` are approved — do not modify them.
2. Never animate the landing hero image or its wrapper during the Events transition.
3. Never animate the navbar as part of the transition. It must stay visually fixed on top while Events overlaps; do not restyle it.
4. Events content reveals must be blur/opacity only (no `y` translation), and the Events section must not get a solid background — only the glass panel.
5. Keep one shared scroll-driven transition for both wheel/touch scroll and nav clicks.
6. Do not add new dependencies; keep routes and existing links intact.
7. Use only supplied imagery; do not invent business-specific facts, prices, or contact details.

## Current implementation notes

- `PROJECT_GUIDE.md` is the primary reference; prefer targeted reads of the four component files above.
- Verified with `npm run lint` and `npm run build` (both pass).
- Browser verification checklist: landing at scroll 0 must be pixel-identical to the original; mid-scroll must show a stationary hero image with only foreground blur/fade and the Events dark background sliding up over it; Events copy must blur in after the background; Events nav click must reproduce the same states as scrolling; check 1440x900 and 390x844; console must be clean.
- Last verification passed: six category tiles render with all six local images loaded; page height is ~2207px at 1280px wide (compact); glass remains `rgba(7,26,32,0.28)` + `blur(22px)` at full viewport width; tile media reveals from `inset(100% 0 0 0)` to `inset(0%)`, text blurs clear, parallax changes media transform on scroll, and hover scales the image to 1.12 / expands the accent line 40 → 72px then resets. Navbar still hit-tests on top at Events; no console errors. Landing background/pinning/nav behaviour unchanged from earlier checks.
- Production preview: `npm run build && npm run start` (default http://localhost:3000).
- Round-trip check: scroll to bottom → back to top (manually, via Events footer link, or via nav Home) restores all four foreground elements to opacity 1 / blur 0 at scroll 0. Previously `#home` pointed at the pinned landing element and could not scroll, which left the right cards hidden; the orchestrator now tweens scroll to 0 for `#home`.
- Nav hit-test check: at scroll 0 / mid / Events top / deep / bottom, `elementFromPoint` at the navbar centre returns a navbar link — the navbar is topmost at every scroll position.
- Nav click is ~0.95s; the active pill morphs to the clicked link in 0.55s.
- **User preference (keep in memory):** do not create `.mjs` (or similar QA script) files in this chat. The user checks the UI manually. Use inline `--eval` expressions and screenshots only when browser verification is needed, and delete any temporary QA scripts created earlier.
- The three `fw-*.jpg` images in `public/images/` were supplied for the project and are intentionally untracked in git; the current Events layout uses the six `public/images/events/*.jpg` photos instead (Pexels free licence).
