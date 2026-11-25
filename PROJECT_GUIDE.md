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
- `Event.tsx`: independent Events section. Owns its own GSAP ScrollTrigger reveal animations for `.event-chapter__reveal` elements. Uses real images from `public/images/`; copy is derived from the landing page, no invented business data.
- `CinematicJourney.tsx`: owns the single scroll-driven transition timeline and the `a[href="#events"]` click handler. Both scrolling and clicking drive the same timeline via the same scroll position — no second transition timeline.

## Animation setup

### Load-in (existing, unchanged)
`CinematicIntro.tsx` animates `.hero-image` scale 1.1 → 1 and all `.intro-element` elements from opacity 0 / blur 18px / y 28 to their final state. Reduced motion sets final state immediately.

### Landing → Events transition (`CinematicJourney.tsx`)
- `ScrollTrigger` on `[data-landing-shell]`: `start: "top top"`, `end: "+=100%"`, `pin: true`, `pinSpacing: false`, `scrub: 1`.
- Pinning keeps the landing background image visually stationary; the Events section (`[data-event-shell]`, `z-10`) slides up over it naturally from the bottom. No transform/blur/opacity is applied to the landing background or the shell itself.
- Only the landing foreground elements (`.intro-element` **excluding** `nav`) are animated: `y: 0 → -96`, `opacity: 1 → 0`, `filter: blur(0) → blur(14px)`, staggered 0.08. `immediateRender: false` preserves the intro animation on first load.
- Navbar is explicitly filtered out of the transition and is never moved, blurred, or faded by it.
- Events nav click: the existing `a[href="#events"]` is intercepted with a 1.65s GSAP scroll-position tween to `transition.scrollTrigger.end`; wheel/touch/keydown cancel the tween. Hash is updated with `replaceState`.
- Reduced motion: no pin, no transition timeline, no reveals; click jumps instantly.
- Everything is wrapped in `gsap.context()` and reverted on cleanup.

### Events content reveals (`Event.tsx`)
- Separate `ScrollTrigger` per `.event-chapter`.
- `.event-chapter__reveal` elements use an explicit `gsap.fromTo` (blur 16px → 0, opacity 0 → 1, stagger 0.12, `immediateRender: true`, `once: true`) so the hidden state is deterministic from first paint. No positional movement — content does not travel with the sliding background.
- Intro header uses `start: "top 5%"` so its copy reveals only after the Events background has nearly covered the viewport; later chapters use `top 82%`.

## Important restrictions

1. Landing markup in `LandingPage.tsx`, its CSS in `globals.css`, and `CinematicIntro.tsx` are approved — do not modify them.
2. Never animate the landing hero image or its wrapper during the Events transition.
3. Never animate the navbar as part of the transition.
4. Events content reveals must be blur/opacity only (no `y` translation).
5. Keep one shared scroll-driven transition for both wheel/touch scroll and nav clicks.
6. Do not add new dependencies; keep routes and existing links intact.
7. Use only supplied imagery; do not invent business-specific facts, prices, or contact details.

## Current implementation notes

- `PROJECT_GUIDE.md` is the primary reference; prefer targeted reads of the four component files above.
- Verified with `npm run lint` and `npm run build` (both pass).
- Browser verification checklist: landing at scroll 0 must be pixel-identical to the original; mid-scroll must show a stationary hero image with only foreground blur/fade and the Events dark background sliding up over it; Events copy must blur in after the background; Events nav click must reproduce the same states as scrolling; check 1440x900 and 390x844; console must be clean.
- Last verification passed: hero transform stays identity at every scroll position; navbar keeps opacity 1 / blur 0; only the 4 non-nav `.intro-element` nodes move/blur/fade; Events rect top tracks the scroll while landing stays pinned; Events title is hidden at top and blurs clear at the end; click and scroll reach identical end states on desktop and mobile. No console errors (a one-off Next Image preload warning can appear only when the QA script switches viewport widths mid-session).
- Production preview: `npm run build && npm run start` (default http://localhost:3000).
- The three `fw-*.jpg` images in `public/images/` were supplied for the Events section and are intentionally untracked in git.
