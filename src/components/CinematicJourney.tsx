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
    const navParent = navbar?.parentElement ?? null;
    const navNextSibling = navbar?.nextSibling ?? null;
    if (navbar && navParent) journey.appendChild(navbar);

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
      navbar.style.zIndex = "9999";
    };
    pinNavbar();

    const navLinks = navbar ? Array.from(navbar.querySelectorAll<HTMLElement>("a")) : [];
    let indicator: HTMLElement | null = null;
    let activeLink: HTMLElement | null = null;
    let homeLink: HTMLElement | null = null;
    let eventsLink: HTMLElement | null = null;

    const placeIndicator = (link: HTMLElement | null, animate: boolean) => {
      if (!indicator || !link) return;
      const vars = { x: link.offsetLeft, y: link.offsetTop, width: link.offsetWidth, height: link.offsetHeight };
      if (animate && !reduced) {
        gsap.to(indicator, { ...vars, duration: 0.55, ease: "power3.inOut", overwrite: true });
      } else {
        gsap.set(indicator, vars);
      }
    };

    const selectLink = (link: HTMLElement | null, animate: boolean) => {
      const animated = animate && !reduced;
      if (activeLink && activeLink !== link) {
        if (animated) gsap.to(activeLink, { color: "#35515a", duration: 0.55, ease: "power3.inOut", overwrite: "auto" });
        else gsap.set(activeLink, { color: "#35515a" });
      }
      activeLink = link;
      if (link) {
        if (animated) gsap.to(link, { color: "#ffffff", duration: 0.55, ease: "power3.inOut", overwrite: "auto" });
        else gsap.set(link, { color: "#ffffff" });
      }
      placeIndicator(link, animate);
    };

    if (navbar && navLinks.length) {
      indicator = document.createElement("span");
      indicator.setAttribute("aria-hidden", "true");
      Object.assign(indicator.style, {
        position: "absolute",
        left: "0",
        top: "0",
        zIndex: "0",
        pointerEvents: "none",
        borderRadius: "9999px",
        background: "linear-gradient(to bottom, #ebac6b, #d5843f)",
        boxShadow: "0 4px 12px rgba(190,105,45,0.35)",
      });
      navbar.insertBefore(indicator, navbar.firstChild);
      navLinks.forEach((link) => {
        link.style.position = "relative";
        link.style.zIndex = "1";
        link.style.transitionProperty = "background-color";
      });
      homeLink = navLinks[0];
      eventsLink = navLinks.find((link) => link.getAttribute("href") === "#events") ?? null;
      homeLink.style.background = "transparent";
      homeLink.style.boxShadow = "none";
      selectLink(homeLink, false);
      document.fonts?.ready.then(() => placeIndicator(activeLink, false));
    }

    let scrollActive = homeLink;
    const syncScrollActive = () => {
      const next = eventShell.getBoundingClientRect().top <= window.innerHeight * 0.5 ? eventsLink : homeLink;
      if (next && next !== scrollActive) {
        scrollActive = next;
        selectLink(next, true);
      }
    };
    window.addEventListener("scroll", syncScrollActive, { passive: true });

    const handleResize = () => {
      pinNavbar();
      placeIndicator(activeLink, false);
    };
    window.addEventListener("resize", handleResize);

    let transition: gsap.core.Timeline | null = null;

    const stopScrollTween = () => {
      scrollTween.current?.kill();
      scrollTween.current = null;
    };

    const handleNavClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      const clickedLink = target instanceof Element ? target.closest("nav a") : null;
      if (clickedLink && navLinks.includes(clickedLink as HTMLElement)) {
        selectLink(clickedLink as HTMLElement, true);
      }

      const anchor = target instanceof Element ? target.closest('a[href="#events"], a[href="#home"]') : null;
      if (!anchor) return;

      event.preventDefault();
      const isHome = anchor.getAttribute("href") === "#home";
      const destination = isHome ? 0 : (transition?.scrollTrigger?.end ?? landingShell.offsetTop + landingShell.offsetHeight);
      history.replaceState(null, "", isHome ? "#home" : "#events");

      if (reduced) {
        window.scrollTo(0, destination);
        return;
      }

      stopScrollTween();
      const position = { y: window.scrollY };
      scrollTween.current = gsap.to(position, {
        y: destination,
        duration: 0.95,
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
        ScrollTrigger.create({
          trigger: landingShell,
          start: "top top",
          end: "max",
          pin: true,
          pinSpacing: false,
          invalidateOnRefresh: true,
          onLeave: () => gsap.set(landingShell, { clearProps: "transform" }),
          onEnterBack: () => gsap.set(landingShell, { clearProps: "transform" }),
        });

        transition = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: journey,
            start: "top top",
            end: "+=100%",
            scrub: 1,
            invalidateOnRefresh: true,
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
      window.removeEventListener("scroll", syncScrollActive);
      window.removeEventListener("wheel", handleInterrupt);
      window.removeEventListener("touchstart", handleInterrupt);
      window.removeEventListener("keydown", handleInterrupt);
      window.removeEventListener("resize", handleResize);
      indicator?.remove();
      if (navbar && navParent) navParent.insertBefore(navbar, navNextSibling);
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
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-50 rounded-[9px] border-[7px] border-[#f7f8f4] sm:rounded-[12px] sm:border-[10px]"
      />
    </div>
  );
}
