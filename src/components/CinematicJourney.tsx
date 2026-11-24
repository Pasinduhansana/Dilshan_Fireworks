"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type CinematicJourneyProps = {
  landing: ReactNode;
  events: ReactNode;
};

export default function CinematicJourney({ landing, events }: CinematicJourneyProps) {
  const root = useRef<HTMLDivElement>(null);
  const scrollTween = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const journey = root.current;
    if (!journey) return;

    const landingShell = journey.querySelector<HTMLElement>("[data-landing-shell]");
    const eventShell = journey.querySelector<HTMLElement>("[data-event-shell]");
    const veil = journey.querySelector<HTMLElement>("[data-journey-veil]");
    if (!landingShell || !eventShell) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const stopScrollTween = () => {
      scrollTween.current?.kill();
      scrollTween.current = null;
    };

    const handleNavClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      const anchor = target instanceof Element ? target.closest('a[href="#events"]') : null;
      if (!anchor) return;

      event.preventDefault();
      const destination = landingShell.offsetTop + landingShell.offsetHeight;
      history.replaceState(null, "", "#events");

      if (reduced) {
        window.scrollTo(0, destination);
        return;
      }

      stopScrollTween();
      const position = { y: window.scrollY };
      scrollTween.current = gsap.to(position, {
        y: destination,
        duration: 1.65,
        ease: "power2.inOut",
        overwrite: true,
        onUpdate: () => window.scrollTo(0, position.y),
        onComplete: () => {
          scrollTween.current = null;
        },
      });
    };

    const handleInterrupt = () => stopScrollTween();

    document.addEventListener("click", handleNavClick);
    window.addEventListener("wheel", handleInterrupt, { passive: true });
    window.addEventListener("touchstart", handleInterrupt, { passive: true });
    window.addEventListener("keydown", handleInterrupt);

    let context: ReturnType<typeof gsap.context> | null = null;

    if (!reduced) {
      context = gsap.context(() => {
        const transition = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: landingShell,
            start: "top top",
            end: "bottom top",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });

        transition
          .to(
            landingShell,
            {
              y: -72,
              scale: 1.045,
              filter: "blur(12px)",
              opacity: 0,
              transformOrigin: "50% 35%",
              duration: 1,
            },
            0,
          )
          .to(veil, { opacity: 0.92, duration: 0.85 }, 0)
          .fromTo(
            eventShell,
            { y: 84, scale: 0.97, filter: "blur(14px)" },
            { y: 0, scale: 1, filter: "blur(0px)", transformOrigin: "50% 20%", duration: 0.85 },
            0.15,
          );
      }, journey);
    }

    ScrollTrigger.refresh();

    return () => {
      document.removeEventListener("click", handleNavClick);
      window.removeEventListener("wheel", handleInterrupt);
      window.removeEventListener("touchstart", handleInterrupt);
      window.removeEventListener("keydown", handleInterrupt);
      stopScrollTween();
      context?.revert();
    };
  }, []);

  return (
    <div ref={root} className="relative w-full">
      <div id="home" data-landing-shell className="relative isolate will-change-[transform,filter,opacity]">
        {landing}
        <div data-journey-veil aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 bg-[#071a20] opacity-0" />
      </div>
      <div data-event-shell className="relative will-change-[transform,filter,opacity]">{events}</div>
    </div>
  );
}
