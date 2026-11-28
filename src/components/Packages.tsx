"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type PackageItem = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  includes: string[];
};

const PACKAGES: PackageItem[] = [
  {
    id: "wedding",
    title: "Wedding Package",
    subtitle: "A grand opening for a lifetime moment",
    description:
      "An elegant fireworks composition designed to frame your ceremony with warmth, brilliance, and cinematic timing.",
    includes: ["Ceremony entrance sparkle sequence", "Couple spotlight aerial display", "Grand finale synchronized burst", "On-site safety and coordination"],
  },
  {
    id: "birthday",
    title: "Birthday Package",
    subtitle: "A vivid sky for unforgettable celebrations",
    description:
      "A joyful, high-energy display crafted to elevate birthdays with color, rhythm, and a memorable closing moment.",
    includes: ["Celebration opener fountains", "Color-themed aerial shells", "Cake moment sparkle accent", "Controlled setup and cleanup"],
  },
  {
    id: "custom",
    title: "Customized Fireworks",
    subtitle: "Designed entirely around your vision",
    description:
      "A bespoke fireworks experience tailored to your venue, audience, and atmosphere, from intimate gatherings to large-scale events.",
    includes: ["Concept and display planning", "Venue-aware choreography", "Custom color and intensity palette", "Dedicated event consultation"],
  },
];

type Phase = "idle" | "scrolling" | "panel" | "morph" | "open" | "closing";
type Offset = { dx: number; dy: number };

export default function Packages() {
  const root = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const brandFaceRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelContentRef = useRef<HTMLDivElement>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [boxOpen, setBoxOpen] = useState(false);
  const [faceHalf, setFaceHalf] = useState(160);
  const [closedIndex, setClosedIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [shownPkg, setShownPkg] = useState<PackageItem | null>(null);

  const phaseRef = useRef<Phase>("idle");
  const activeIndexRef = useRef(0);
  const closedIndexRef = useRef(0);
  const scrollTweenRef = useRef<gsap.core.Tween | null>(null);
  const morphRef = useRef({ p: 0 });
  const closedOffsetsRef = useRef<Offset[]>([]);
  const halfRef = useRef(160);
  const wheeledAtRef = useRef(0);
  const dragStartRef = useRef<number | null>(null);

  useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);
  useEffect(() => { closedIndexRef.current = closedIndex; }, [closedIndex]);

  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const getCards = () => cardsRef.current.filter(Boolean) as HTMLElement[];

  const computeHalf = useCallback(() => {
    const w = stageRef.current?.clientWidth ?? 720;
    halfRef.current = Math.min(240, Math.max(96, w * (w < 480 ? 0.3 : 0.26)));
    return halfRef.current;
  }, []);

  const applyFaceTransforms = useCallback((p: number) => {
    const half = halfRef.current;
    const faceW = half * 2;
    const faceH = half * 1.45;
    const cards = getCards();

    cards.forEach((card, i) => {
      const off = closedOffsetsRef.current[i] ?? { dx: 0, dy: 0 };
      const tx = off.dx * (1 - p);
      const ty = off.dy * (1 - p);
      const angle = i * 90 * p;
      const z = half * p;
      card.style.width = `${faceW}px`;
      card.style.height = `${faceH}px`;
      card.style.marginLeft = `${-faceW / 2}px`;
      card.style.marginTop = `${-faceH / 2}px`;
      card.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotateY(${angle}deg) translateZ(${z}px)`;
    });

    if (brandFaceRef.current) {
      brandFaceRef.current.style.width = `${faceW}px`;
      brandFaceRef.current.style.height = `${faceH}px`;
      brandFaceRef.current.style.marginLeft = `${-faceW / 2}px`;
      brandFaceRef.current.style.marginTop = `${-faceH / 2}px`;
      brandFaceRef.current.style.transform = `translate3d(0, 0, 0) rotateY(${270 * p}deg) translateZ(${half * p}px)`;
      brandFaceRef.current.style.opacity = `${Math.min(1, p * 2)}`;
    }
  }, []);

  const applyClosedTrack = useCallback((animate = true) => {
    const stage = stageRef.current;
    const track = trackRef.current;
    const cards = getCards();
    if (!stage || !track || !cards.length) return;
    const stageW = stage.clientWidth;
    const cardW = cards[0].offsetWidth || stageW * 0.5;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 24;
    const step = cardW + gap;
    const x = stageW / 2 - (closedIndexRef.current * step + cardW / 2);
    gsap.to(track, { x, duration: animate && !reducedMotion() ? 0.85 : 0, ease: "power3.inOut", overwrite: "auto" });
    cards.forEach((card, i) => {
      const focused = i === closedIndexRef.current;
      gsap.to(card, {
        scale: focused ? 1 : 0.94,
        opacity: focused ? 1 : 0.55,
        y: focused ? 0 : 12,
        duration: animate && !reducedMotion() ? 0.7 : 0,
        ease: "power3.out",
        overwrite: "auto",
      });
    });
  }, []);

  useEffect(() => {
    if (boxOpen) return;
    applyClosedTrack(true);
  }, [closedIndex, boxOpen, applyClosedTrack]);

  const animatePanelContent = useCallback(() => {
    const content = panelContentRef.current;
    if (!content || reducedMotion()) return;
    const children = Array.from(content.children) as HTMLElement[];
    gsap.fromTo(children, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.055, ease: "power3.out", clearProps: "transform", overwrite: "auto" });
  }, []);

  const captureClosedOffsets = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const sr = stage.getBoundingClientRect();
    const cx = sr.left + sr.width / 2;
    const cy = sr.top + sr.height / 2;
    closedOffsetsRef.current = getCards().map((card) => {
      const r = card.getBoundingClientRect();
      return { dx: r.left + r.width / 2 - cx, dy: r.top + r.height / 2 - cy };
    });
  }, []);

  const openPanel = useCallback((index: number) => {
    activeIndexRef.current = index;
    setActiveIndex(index);
    setShownPkg(PACKAGES[index]);
    captureClosedOffsets();
    setFaceHalf(computeHalf());
    if (reducedMotion()) {
      phaseRef.current = "morph";
      morphRef.current.p = 1;
      applyFaceTransforms(1);
      setBoxOpen(true);
    } else {
      phaseRef.current = "panel";
    }
    setPanelOpen(true);
  }, [applyFaceTransforms, captureClosedOffsets, computeHalf]);

  const requestOpen = useCallback((index: number) => {
    if (phaseRef.current !== "idle") return;
    const section = root.current;
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const sh = rect.height;
    const sectionTop = window.scrollY + rect.top;
    const desired = sh <= vh * 0.92 ? sectionTop - (vh - sh) / 2 : sectionTop;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - vh);
    const target = gsap.utils.clamp(0, maxScroll, desired);

    if (Math.abs(window.scrollY - target) < 8 || reducedMotion()) {
      openPanel(index);
      return;
    }

    phaseRef.current = "scrolling";
    const proxy = { y: window.scrollY };
    const stop = () => {
      scrollTweenRef.current?.kill();
      scrollTweenRef.current = null;
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
      if (phaseRef.current === "scrolling") phaseRef.current = "idle";
    };
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", stop);

    scrollTweenRef.current = gsap.to(proxy, {
      y: target,
      duration: 0.95,
      ease: "power3.inOut",
      overwrite: true,
      onUpdate: () => window.scrollTo(0, proxy.y),
      onComplete: () => {
        window.removeEventListener("wheel", stop);
        window.removeEventListener("touchstart", stop);
        window.removeEventListener("keydown", stop);
        scrollTweenRef.current = null;
        openPanel(index);
      },
    });
  }, [openPanel]);

  const closePanel = useCallback(() => {
    if (phaseRef.current !== "open") return;
    phaseRef.current = "closing";
    setClosedIndex(activeIndexRef.current);

    gsap.to(boxRef.current, { x: 0, y: 0, rotationY: 0, duration: 0.9, ease: "power3.inOut", overwrite: "auto" });
    if (reducedMotion()) {
      morphRef.current.p = 0;
      applyFaceTransforms(0);
      setBoxOpen(false);
      setPanelOpen(false);
      gsap.set(panelRef.current, { display: "none", xPercent: 0, opacity: 1 });
      phaseRef.current = "idle";
      return;
    }

    gsap.to(morphRef.current, {
      p: 0,
      duration: 1,
      ease: "power3.inOut",
      overwrite: true,
      onUpdate: () => applyFaceTransforms(morphRef.current.p),
      onComplete: () => {
        setBoxOpen(false);
        getCards().forEach((card) => {
          card.style.width = "";
          card.style.height = "";
          card.style.marginLeft = "";
          card.style.marginTop = "";
          card.style.transform = "";
        });
        if (brandFaceRef.current) {
          brandFaceRef.current.style.transform = "";
          brandFaceRef.current.style.marginLeft = "";
          brandFaceRef.current.style.marginTop = "";
        }
      },
    });

    gsap.to(panelRef.current, {
      xPercent: -100,
      duration: 0.75,
      ease: "power4.inOut",
      overwrite: true,
      onComplete: () => {
        gsap.set(panelRef.current, { display: "none", xPercent: 0, opacity: 1 });
        setPanelOpen(false);
        phaseRef.current = "idle";
      },
    });
  }, [applyFaceTransforms]);

  const goTo = useCallback((index: number) => {
    if (phaseRef.current !== "open") return;
    const next = gsap.utils.clamp(0, PACKAGES.length - 1, index);
    if (next === activeIndexRef.current) return;
    activeIndexRef.current = next;
    setActiveIndex(next);
    setShownPkg(PACKAGES[next]);
    gsap.to(boxRef.current, {
      x: 0,
      y: 0,
      rotationY: -next * 90,
      duration: 1.15,
      ease: "power3.inOut",
      overwrite: "auto",
    });
    animatePanelContent();
  }, [animatePanelContent]);

  useEffect(() => {
    const section = root.current;
    if (!section || boxOpen) return;
    const reduced = reducedMotion();
    const ctx = gsap.context(() => {
      const reveals = section.querySelectorAll<HTMLElement>(".pkg-reveal");
      gsap.set(reveals, { opacity: 0, y: 28, filter: "blur(14px)" });
      const intro = gsap.timeline({ paused: true });
      intro.to(reveals, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1, ease: "power2.out", stagger: 0.12 });
      const hide = () => { intro.pause(0); gsap.set(reveals, { opacity: 0, y: 28, filter: "blur(14px)" }); };
      if (reduced) {
        gsap.set(reveals, { opacity: 1, y: 0, filter: "blur(0px)" });
      } else {
        ScrollTrigger.create({
          trigger: section,
          start: "top 75%",
          onEnter: () => intro.restart(),
          onEnterBack: () => intro.restart(),
          onLeave: hide,
          onLeaveBack: hide,
        });
      }
    }, section);
    return () => ctx.revert();
  }, [boxOpen]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !panelOpen) return;
    gsap.set(panel, { display: "flex", opacity: 1 });
    if (reducedMotion()) {
      gsap.set(panel, { xPercent: 0 });
      return;
    }
    gsap.fromTo(panel, { xPercent: -100 }, {
      xPercent: 0,
      duration: 0.9,
      ease: "power4.inOut",
      overwrite: true,
      onComplete: () => {
        if (phaseRef.current !== "panel") return;
        phaseRef.current = "morph";
        setBoxOpen(true);
      },
    });
  }, [panelOpen]);

  useLayoutEffect(() => {
    if (!boxOpen) return;
    computeHalf();
    applyFaceTransforms(reducedMotion() ? 1 : morphRef.current.p);
    gsap.set(boxRef.current, { x: 0, y: 0, rotationY: 0, transformOrigin: "0px 0px" });

    if (reducedMotion()) {
      gsap.set(boxRef.current, { x: 0, y: 0, rotationY: -activeIndexRef.current * 90 });
      phaseRef.current = "open";
      animatePanelContent();
      return;
    }

    morphRef.current.p = 0;
    applyFaceTransforms(0);
    gsap.to(morphRef.current, {
      p: 1,
      duration: 1.15,
      ease: "power3.inOut",
      overwrite: true,
      onUpdate: () => applyFaceTransforms(morphRef.current.p),
      onComplete: () => {
        phaseRef.current = "open";
        gsap.to(boxRef.current, { x: 0, y: 0, rotationY: -activeIndexRef.current * 90, duration: 0.9, ease: "power3.inOut", overwrite: "auto" });
        animatePanelContent();
      },
    });
  }, [boxOpen, applyFaceTransforms, animatePanelContent, computeHalf]);

  useEffect(() => {
    const onResize = () => {
      if (boxOpen && phaseRef.current === "open") {
        setFaceHalf(computeHalf());
        applyFaceTransforms(1);
      } else if (!boxOpen) {
        applyClosedTrack(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [boxOpen, applyFaceTransforms, applyClosedTrack, computeHalf]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phaseRef.current === "idle") {
        if (e.key === "ArrowRight" && closedIndexRef.current < PACKAGES.length - 1) setClosedIndex(closedIndexRef.current + 1);
        if (e.key === "ArrowLeft" && closedIndexRef.current > 0) setClosedIndex(closedIndexRef.current - 1);
        if (e.key === "Enter") requestOpen(closedIndexRef.current);
        return;
      }
      if (phaseRef.current !== "open") return;
      if (e.key === "Escape") closePanel();
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goTo(activeIndexRef.current + 1);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goTo(activeIndexRef.current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closePanel, goTo, requestOpen]);

  useEffect(() => () => {
    scrollTweenRef.current?.kill();
    if (panelRef.current) gsap.killTweensOf(panelRef.current);
  }, []);

  const rotateBy = (dir: number) => {
    if (boxOpen) goTo(activeIndexRef.current + dir);
    else setClosedIndex(gsap.utils.clamp(0, PACKAGES.length - 1, closedIndexRef.current + dir));
  };

  const onWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - wheeledAtRef.current < 600 || phaseRef.current !== "open") return;
    wheeledAtRef.current = now;
    e.preventDefault();
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    rotateBy(delta > 0 ? 1 : -1);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (phaseRef.current !== "open") return;
    dragStartRef.current = e.clientX;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const start = dragStartRef.current;
    dragStartRef.current = null;
    if (start === null || phaseRef.current !== "open") return;
    const delta = e.clientX - start;
    if (Math.abs(delta) > 48) rotateBy(delta < 0 ? 1 : -1);
  };

  const stageClass = boxOpen
    ? "fixed right-[2vw] top-0 z-[70] h-[100dvh] w-[50vw] sm:right-[3vw] sm:w-[50vw] lg:right-[4vw] lg:w-[44vw]"
    : "relative w-full overflow-hidden";

  const faceW = faceHalf * 2;
  const faceH = faceHalf * 1.45;
  const faceStyle = (angle: number): React.CSSProperties => ({
    width: faceW,
    height: faceH,
    marginLeft: -faceHalf,
    marginTop: -faceH / 2,
    transform: `rotateY(${angle}deg) translateZ(${faceHalf}px)`,
  });

  return (
    <section id="packages" ref={root} aria-labelledby="packages-title" className="relative overflow-hidden bg-[#081418] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(223,145,76,0.12),transparent_70%),radial-gradient(ellipse_50%_40%_at_80%_100%,rgba(77,156,153,0.08),transparent_70%)]" />
      <div className="relative mx-auto w-full max-w-[1360px] px-6 py-20 sm:px-10 sm:py-24 lg:px-16 2xl:max-w-[1680px] 2xl:py-28">
        <header className="mb-10 sm:mb-14">
          <div className="pkg-reveal flex items-center gap-4">
            <span className="h-px w-12 bg-[#df914c]" />
            <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/55 2xl:text-[11px]">Packages</span>
          </div>
          <h2 id="packages-title" className="pkg-reveal mt-6 max-w-[14ch] font-head text-[clamp(2.4rem,6vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.045em]">
            Crafted for your moment.
          </h2>
        </header>

        <div
          ref={stageRef}
          className={stageClass}
          style={boxOpen ? { perspective: "1500px" } : undefined}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {boxOpen ? (
            <div ref={boxRef} className="absolute left-1/2 top-1/2 h-0 w-0" style={{ transformStyle: "preserve-3d" }}>
              {PACKAGES.map((pkg, i) => (
                <button
                  key={pkg.id}
                  ref={(el) => { cardsRef.current[i] = el; }}
                  data-pkg-id={pkg.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Rotate to ${pkg.title}`}
                  style={faceStyle(i * 90)}
                  className="absolute left-0 top-0 flex flex-col overflow-hidden rounded-[18px] border border-white/12 bg-[rgba(12,34,40,0.78)] p-6 text-left shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-[24px] [backface-visibility:hidden] [transform-style:preserve-3d]"
                >
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.1),transparent_45%,transparent_70%,rgba(223,145,76,0.08))]" />
                  <div className="relative flex h-full flex-col">
                    <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#df914c]">0{i + 1} — {pkg.title}</span>
                    <span className="mt-auto font-head text-[clamp(1.4rem,2.6vw,2.4rem)] font-semibold leading-[1.06] tracking-[-0.04em]">{pkg.subtitle}</span>
                  </div>
                </button>
              ))}
              <div
                ref={brandFaceRef}
                style={faceStyle(270)}
                className="absolute left-0 top-0 flex flex-col items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-[rgba(8,24,30,0.85)] p-6 text-center backdrop-blur-[24px] [backface-visibility:hidden]"
              >
                <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/45">Dilshan</span>
                <span className="mt-4 font-head text-[clamp(1.3rem,2.4vw,2.2rem)] font-semibold tracking-[-0.03em]">Light up every celebration.</span>
              </div>
            </div>
          ) : (
            <div ref={trackRef} className="flex gap-5 sm:gap-6 lg:gap-8">
              {PACKAGES.map((pkg, i) => (
                <button
                  key={pkg.id}
                  ref={(el) => { cardsRef.current[i] = el; }}
                  data-pkg-id={pkg.id}
                  type="button"
                  onClick={() => (i === closedIndexRef.current ? requestOpen(i) : setClosedIndex(i))}
                  aria-label={`View ${pkg.title}`}
                  className={`group relative w-[86%] shrink-0 overflow-hidden rounded-[20px] border p-7 text-left backdrop-blur-[20px] transition-[border-color,background-color,box-shadow] duration-500 sm:w-[62%] sm:p-9 lg:w-[42%] lg:p-10 ${i === closedIndex ? "border-[#df914c]/45 bg-[rgba(18,42,48,0.6)] shadow-[0_30px_80px_rgba(0,0,0,0.4),0_0_60px_rgba(223,145,76,0.1)]" : "border-white/10 bg-[rgba(10,30,36,0.42)] shadow-[0_24px_60px_rgba(0,0,0,0.3)] hover:border-white/25"}`}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.09),transparent_42%,transparent_68%,rgba(223,145,76,0.09))] opacity-80" />
                  <div className="relative flex min-h-[300px] flex-col sm:min-h-[360px]">
                    <span className="text-[10px] font-medium uppercase tracking-[0.26em] text-white/45">0{i + 1} — Fireworks</span>
                    <h3 className="mt-5 max-w-[16ch] font-head text-[clamp(1.8rem,3.4vw,2.9rem)] font-semibold leading-[1.04] tracking-[-0.04em]">{pkg.title}</h3>
                    <p className="mt-4 max-w-[32ch] text-[13px] leading-relaxed text-white/55 sm:text-[15px]">{pkg.subtitle}</p>
                    <div className="mt-auto flex items-center justify-between pt-10">
                      <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#df914c]/85">{i === closedIndex ? "Selected" : "Explore"}</span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/60 transition-colors group-hover:border-[#df914c]/50 group-hover:text-white">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-[1.5]" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-center gap-4">
          <button type="button" onClick={() => rotateBy(-1)} disabled={boxOpen ? activeIndex === 0 : closedIndex === 0} aria-label="Previous package" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/75 transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-30">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.5]" aria-hidden="true"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" onClick={() => (boxOpen ? rotateBy(1) : requestOpen(closedIndexRef.current))} aria-label={boxOpen ? "Rotate to next package" : "Open package details"} className="group flex h-14 w-14 items-center justify-center rounded-full border border-[#df914c]/40 bg-[#df914c]/10 text-[#ebac6b] shadow-[0_0_30px_rgba(223,145,76,0.16)] transition-transform hover:scale-105">
            {boxOpen ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.5] transition-transform duration-500 group-hover:rotate-90" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.5]" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            )}
          </button>
          <button type="button" onClick={() => rotateBy(1)} disabled={boxOpen ? activeIndex === PACKAGES.length - 1 : closedIndex === PACKAGES.length - 1} aria-label="Next package" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/75 transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-30">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.5]" aria-hidden="true"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <span className="ml-2 text-[10px] font-medium uppercase tracking-[0.22em] text-white/45">0{(boxOpen ? activeIndex : closedIndex) + 1} / 0{PACKAGES.length}</span>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[65] bg-[#02090b]/65 backdrop-blur-[2px] transition-opacity duration-500 ${panelOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={closePanel}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        className="fixed left-0 top-0 z-[75] hidden h-[100dvh] w-[64vw] flex-col justify-center border-r border-white/10 bg-[rgba(10,30,36,0.72)] px-6 py-10 shadow-[30px_0_80px_rgba(0,0,0,0.45)] backdrop-blur-[26px] sm:w-[58vw] sm:px-10 lg:left-[3vw] lg:w-[52vw] lg:px-14 2xl:w-[48vw]"
        aria-live="polite"
      >
        <div ref={panelContentRef} className="mx-auto flex w-full max-w-[44rem] flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#df914c]">Selected package</span>
              <h3 className="mt-3 font-head text-[clamp(1.6rem,3.2vw,3.2rem)] font-semibold leading-[1.02] tracking-[-0.04em]">{shownPkg?.title}</h3>
              <p className="mt-2 text-[12px] text-white/55 sm:text-[14px]">{shownPkg?.subtitle}</p>
            </div>
            <button type="button" onClick={closePanel} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white" aria-label="Close package details">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.5]" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" /></svg>
            </button>
          </div>
          <p className="mt-6 max-w-[42rem] text-[13px] leading-[1.85] text-white/72 sm:text-[15px]">{shownPkg?.description}</p>
          <ul className="mt-7 space-y-3">
            {shownPkg?.includes.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[12px] text-white/78 sm:text-[14px]">
                <span className="mt-[7px] h-px w-5 shrink-0 bg-[#df914c]/80" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="pt-10">
            <a href="#contact" className="inline-flex items-center gap-3 rounded-full bg-gradient-to-b from-[#ebac6b] to-[#d5843f] px-7 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_8px_24px_rgba(190,105,45,0.35)] transition-transform hover:-translate-y-0.5">
              Inquire Now
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.5]" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
