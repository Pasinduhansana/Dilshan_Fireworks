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
    if (!landingShell || !eventShell) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const foreground = Array.from(landingShell.querySelectorAll<HTMLElement>(".intro-element")).filter(
      (element) => element.tagName !== "NAV",
    );

    landingShell.style.isolation = "auto";
    const innerSection = landingShell.querySelector<HTMLElement>("section");
    if (innerSection) innerSection.style.isolation = "auto";

    const navbar = landingShell.querySelector<HTMLElement>("nav");
    const pinNavbar = () => {
      if (!navbar || !innerSection) return;
      let documentTop = 0;
      let node: HTMLElement | null = innerSection;
      while (node) {
        documentTop += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      navbar.style.position = "fixed";
      navbar.style.top = `${documentTop + innerSection.offsetHeight * 0.04}px`;
      navbar.style.right = `${window.innerWidth - innerSection.getBoundingClientRect().right + innerSection.offsetWidth * 0.02}px`;
      navbar.style.zIndex = "100";
    };
    pinNavbar();
    window.addEventListener("resize", pinNavbar);

    let transition: gsap.core.Timeline | null = null;

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
      const destination = transition?.scrollTrigger?.end ?? landingShell.offsetTop + landingShell.offsetHeight;
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

    if (!reduced && foreground.length) {
      context = gsap.context(() => {
        transition = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: landingShell,
            start: "top top",
            end: "+=100%",
            pin: true,
            pinSpacing: false,
            scrub: 1,
            invalidateOnRefresh: true,
            onLeave: () => gsap.set(landingShell, { clearProps: "transform" }),
            onEnterBack: () => gsap.set(landingShell, { clearProps: "transform" }),
          },
        });

        transition.fromTo(
          foreground,
          { y: 0, opacity: 1, filter: "blur(0px)" },
          {
            y: -96,
            opacity: 0,
            filter: "blur(14px)",
            stagger: 0.08,
            duration: 0.7,
            overwrite: "auto",
            immediateRender: false,
          },
          0,
        );
      }, journey);
    }

    ScrollTrigger.refresh();

    return () => {
      document.removeEventListener("click", handleNavClick);
      window.removeEventListener("wheel", handleInterrupt);
      window.removeEventListener("touchstart", handleInterrupt);
      window.removeEventListener("keydown", handleInterrupt);
      window.removeEventListener("resize", pinNavbar);
      stopScrollTween();
      context?.revert();
    };
  }, []);

  return (
    <div ref={root} className="relative w-full">
      <div id="home" data-landing-shell className="relative">
        {landing}
      </div>
      <div data-event-shell className="relative z-30">{events}</div>
    </div>
  );
}
