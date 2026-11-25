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
    fw-30048038.jpg       Events: family gatherings (portrait)
    fw-32974947.jpg       Events: village festivals
    fw-33689354.jpg       Events: grand celebrations + intro panel
PROJECT_GUIDE.md      This file — update when implementation changes
```

## Component responsibilities

- `LandingPage.tsx`: exact, verbatim copy of the approved landing page. Do not restyle, reposition, reorder, or remove anything here. The navbar is `<nav class="intro-element ...">` and must keep its existing markup and styling.
- `CinematicIntro.tsx`: pre-existing intro timeline (hero scale + `.intro-element` fade/blur/slide). Untouched. Still owns initial page-load motion.
- `Event.tsx`: independent Events section with **no solid section background**. All content sits inside one translucent frosted-glass panel (`rgba(7,26,32,0.28)` + `backdrop-blur(22px)`), so the landing hero shows through blurred while Events slides over it. Owns its own GSAP ScrollTrigger reveal animations for `.event-chapter__reveal` elements. Uses real images from `public/images/`; copy is derived from the landing page, no invented business data.
- `CinematicJourney.tsx`: owns the single scroll-driven transition timeline, the `a[href="#events"]` click handler, and keeps the existing navbar fixed above the overlapping Events layer (`z-index: 100`; ancestor `isolation` set to `auto`; `eventShell` is `z-30`). Both scrolling and clicking drive the same timeline via the same scroll position — no second transition timeline.

## Animation setup

### Load-in (existing, unchanged)
`CinematicIntro.tsx` animates `.hero-image` scale 1.1 → 1 and all `.intro-element` elements from opacity 0 / blur 18px / y 28 to their final state. Reduced motion sets final state immediately.

### Landing → Events transition (`CinematicJourney.tsx`)
- `ScrollTrigger` on `[data-landing-shell]`: `start: "top top"`, `end: "+=100%"`, `pin: true`, `pinSpacing: false`, `scrub: 1`.
- Pinning keeps the landing background image visually stationary; the Events section (`[data-event-shell]`, `z-30`) slides up over it naturally from the bottom. No transform/blur/opacity is applied to the landing background or the shell itself. The Events content is inside a frosted-glass panel, so the pinned landing image is visible through it, blurred.
- Only the landing foreground elements (`.intro-element` **excluding** `nav`) are animated: `y: 0 → -96`, `opacity: 1 → 0`, `filter: blur(0) → blur(14px)`, staggered 0.08. `immediateRender: false` preserves the intro animation on first load.
- Navbar is explicitly filtered out of the transition and is never moved, blurred, or faded by it.
- Events nav click: the existing `a[href="#events"]` is intercepted with a 1.65s GSAP scroll-position tween to `transition.scrollTrigger.end`; wheel/touch/keydown cancel the tween. Hash is updated with `replaceState`.
- Reduced motion: no pin, no transition timeline, no reveals; click jumps instantly.
- Everything is wrapped in `gsap.context()` and reverted on cleanup.

### Events content reveals (`Event.tsx`)
- Separate `ScrollTrigger` per `.event-chapter`.
- `.event-chapter__reveal` elements are hidden with `gsap.set` (opacity 0, blur 16px) and revealed with a `gsap.to` blur-to-clear tween (stagger 0.12, `once: true`). `gsap.set` is used instead of `fromTo` because ScrollTrigger's `from` initialization was unreliable. No positional movement — content does not travel with the sliding background.
- Intro header uses `start: "top 15%"` so its copy reveals as the Events glass panel finishes covering the viewport (and before the click destination of 100vh); later chapters use `top 82%`.
- Navbar is lifted out of its ancestor stacking contexts at runtime (`isolation: auto` on landing shell + inner section), set to `position: fixed` with offsets derived from the inner section's rect (not the nav's own rect, which changes with font loading), and given `z-index: 100`. `[data-event-shell]` is `z-30`, so everything else stays behind Events while the navbar stays on top.

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
- Last verification passed: hero transform stays identity at every scroll position; navbar keeps opacity 1 / blur 0; only the 4 non-nav `.intro-element` nodes move/blur/fade; Events rect top tracks the scroll while landing stays pinned; Events title is hidden at top and blurs clear at the end; click and scroll reach identical end states on desktop and mobile. No console errors (a one-off Next Image preload warning can appear only when the QA script switches viewport widths mid-session).
- Production preview: `npm run build && npm run start` (default http://localhost:3000).
- **User preference (keep in memory):** do not create `.mjs` (or similar QA script) files in this chat. The user checks the UI manually. Use inline `--eval` expressions and screenshots only when browser verification is needed, and delete any temporary QA scripts created earlier.
- The three `fw-*.jpg` images in `public/images/` were supplied for the Events section and are intentionally untracked in git.
