"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type CinematicJourneyProps = {
  landing: ReactNode;
  events: ReactNode;
  packages?: ReactNode;
};

export default function CinematicJourney({ landing, events, packages }: CinematicJourneyProps) {
  const root = useRef<HTMLDivElement>(null);
  const scrollTween = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const journey = root.current;
    if (!journey) return;

    const landingShell = journey.querySelector<HTMLElement>("[data-landing-shell]");
    const eventShell = journey.querySelector<HTMLElement>("[data-event-shell]");
    const packagesShell = journey.querySelector<HTMLElement>("[data-packages-shell]");
    if (!landingShell || !eventShell) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const foreground = Array.from(landingShell.querySelectorAll<HTMLElement>(".intro-element")).filter(
      (element) => element.tagName !== "NAV",
    );
    const rocketFlight = landingShell.querySelector<HTMLElement>("[data-rocket-flight]");
    const rocketFloat = rocketFlight?.querySelector<HTMLElement>("[data-rocket-float]") ?? null;
    const rocketParent = rocketFlight?.parentElement ?? null;
    const rocketNextSibling = rocketFlight?.nextSibling ?? null;
    if (rocketFlight) journey.appendChild(rocketFlight);

    landingShell.style.isolation = "auto";
    const innerSection = landingShell.querySelector<HTMLElement>("section");
    if (innerSection) innerSection.style.isolation = "auto";

    const navbar = landingShell.querySelector<HTMLElement>("nav[data-desktop-nav]") ?? landingShell.querySelector<HTMLElement>("nav:not([data-mobile-nav])");
    const navParent = navbar?.parentElement ?? null;
    const navNextSibling = navbar?.nextSibling ?? null;
    if (navbar && navParent) journey.appendChild(navbar);

    const pinNavbar = () => {
      if (!navbar || !innerSection) return;
      if (window.innerWidth < 1024) {
        navbar.style.display = "none";
        return;
      }
      navbar.style.display = "";
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
    let packagesLink: HTMLElement | null = null;

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
      packagesLink = navLinks.find((link) => link.getAttribute("href") === "#packages") ?? null;
      homeLink.style.background = "transparent";
      homeLink.style.boxShadow = "none";
      selectLink(homeLink, false);
      document.fonts?.ready.then(() => placeIndicator(activeLink, false));
    }

    let scrollActive = homeLink;
    const syncScrollActive = () => {
      const half = window.innerHeight * 0.5;
      const atPackages = !!packagesShell && packagesShell.getBoundingClientRect().top <= half;
      const next = atPackages ? packagesLink : eventShell.getBoundingClientRect().top <= half ? eventsLink : homeLink;
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

    let rocketCleanup: (() => void) | null = null;
    if (rocketFlight) {
      const initial = (() => {
        if (!innerSection) return null;
        const rect = innerSection.getBoundingClientRect();
        const vw = window.innerWidth;
        const isLg = vw >= 1024;
        const isSm = vw >= 640;
        const width = rect.width * (isLg ? 0.38 : isSm ? 0.52 : 0.72);
        const height = rect.height * (isLg ? 0.68 : isSm ? 0.6 : 0.46);
        const startLeft = rect.left + rect.width / 2 - width / 2;
        const startTop = rect.top + rect.height * (isLg ? 0.1 : isSm ? 0.12 : 0.14);
        const dockScale = isLg ? 0.34 : isSm ? 0.4 : 0.46;
        const dockLeft = startLeft;
        const dockTop = -height * dockScale - 80;
        Object.assign(rocketFlight.style, {
          position: "fixed",
          left: `${startLeft}px`,
          top: `${startTop}px`,
          width: `${width}px`,
          height: `${height}px`,
          zIndex: "45",
          pointerEvents: "none",
          transform: "none",
        });
        return { startLeft, startTop, width, height, dockLeft, dockTop, dockScale };
      })();

      if (initial) {
        gsap.set(rocketFlight, { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, transformOrigin: "50% 50%", force3D: true });
        if (rocketFloat) gsap.set(rocketFloat, { rotationX: 8, rotationY: 0, y: 0, transformOrigin: "50% 50%", force3D: true });

        if (!reduced) {
          const travel = { p: 0 };
          const state = { p: 0 };
          let dockX = initial.dockLeft - initial.startLeft;
          let dockY = initial.dockTop - initial.startTop;
          let dockScale = initial.dockScale;
          let flightActive = false;

          const floatSpin = rocketFloat
            ? gsap.to(rocketFloat, { rotationY: 360, duration: 16, ease: "none", repeat: -1 })
            : null;
          const floatBob = rocketFloat
            ? gsap.to(rocketFloat, { y: -7, duration: 2.8, ease: "sine.inOut", yoyo: true, repeat: -1 })
            : null;

          const applyRocket = (p: number) => {
            const x = gsap.utils.interpolate(0, dockX, p);
            const y = gsap.utils.interpolate(0, dockY, p);
            const scale = gsap.utils.interpolate(1, dockScale, p);
            const rotation = gsap.utils.interpolate(0, 10, p);
            const opacity = p < 0.72 ? 1 : gsap.utils.interpolate(1, 0, (p - 0.72) / 0.28);
            gsap.set(rocketFlight, { x, y, scale, rotation, opacity, overwrite: "auto" });
          };

          const tick = () => {
            if (!flightActive) return;
            state.p += (travel.p - state.p) * 0.12;
            if (Math.abs(travel.p - state.p) < 0.0005) state.p = travel.p;
            applyRocket(state.p);
          };
          gsap.ticker.add(tick);

          const intro = gsap.fromTo(
            rocketFlight,
            { y: window.innerHeight * 0.75, x: 0, scale: 0.88, rotation: -6, opacity: 0.96 },
            {
              y: 0, x: 0, scale: 1, rotation: 0, opacity: 1,
              duration: 2.2, ease: "power3.out", delay: 0.2, overwrite: "auto",
              onComplete: () => {
                gsap.set(rocketFlight, { x: 0, y: 0, scale: 1, rotation: 0 });
                state.p = travel.p;
                applyRocket(state.p);
                flightActive = true;
              },
            },
          );

          const flight = gsap.to(travel, {
            p: 1,
            ease: "none",
            paused: true,
            scrollTrigger: {
              trigger: journey,
              start: "top top",
              endTrigger: eventShell,
              end: "bottom bottom",
              scrub: true,
              invalidateOnRefresh: true,
              onRefresh: () => {
                if (!innerSection) return;
                const rect = innerSection.getBoundingClientRect();
                const vw = window.innerWidth;
                const isLg = vw >= 1024;
                const isSm = vw >= 640;
                const width = rect.width * (isLg ? 0.38 : isSm ? 0.52 : 0.72);
                const height = rect.height * (isLg ? 0.68 : isSm ? 0.6 : 0.46);
                const startLeft = rect.left + rect.width / 2 - width / 2;
                const startTop = rect.top + rect.height * (isLg ? 0.1 : isSm ? 0.12 : 0.14);
                dockScale = isLg ? 0.34 : isSm ? 0.4 : 0.46;
                const dockLeft = startLeft;
                const dockTop = -height * dockScale - 80;
                dockX = dockLeft - startLeft;
                dockY = dockTop - startTop;
                rocketFlight.style.left = `${startLeft}px`;
                rocketFlight.style.top = `${startTop}px`;
                rocketFlight.style.width = `${width}px`;
                rocketFlight.style.height = `${height}px`;
              },
            },
          });

          rocketCleanup = () => {
            intro.kill();
            flight.scrollTrigger?.kill();
            flight.kill();
            floatSpin?.kill();
            floatBob?.kill();
            gsap.ticker.remove(tick);
            if (rocketFloat) gsap.set(rocketFloat, { clearProps: "transform" });
            gsap.set(rocketFlight, { clearProps: "transform,opacity,zIndex" });
            rocketFlight.style.cssText = "";
            if (rocketParent) rocketParent.insertBefore(rocketFlight, rocketNextSibling);
          };
        } else {
          rocketCleanup = () => {
            if (rocketFloat) gsap.set(rocketFloat, { clearProps: "transform" });
            gsap.set(rocketFlight, { clearProps: "transform,opacity,zIndex" });
            rocketFlight.style.cssText = "";
            if (rocketParent) rocketParent.insertBefore(rocketFlight, rocketNextSibling);
          };
        }
      }
    }

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

      const anchor = target instanceof Element ? target.closest('a[href="#events"], a[href="#home"], a[href="#packages"]') : null;
      if (!anchor) return;

      event.preventDefault();
      const href = anchor.getAttribute("href");
      const isHome = href === "#home";
      const isPackages = href === "#packages";
      const destination = isHome
        ? 0
        : isPackages && packagesShell
          ? window.scrollY + packagesShell.getBoundingClientRect().top
          : (transition?.scrollTrigger?.end ?? landingShell.offsetTop + landingShell.offsetHeight);
      history.replaceState(null, "", isHome ? "#home" : isPackages ? "#packages" : "#events");

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
            onLeaveBack: () => {
              gsap.set(foreground, { y: 0, opacity: 1, filter: "blur(0px)" });
            },
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
      rocketCleanup?.();
      if (rocketFlight && rocketParent && !rocketParent.contains(rocketFlight)) {
        rocketParent.insertBefore(rocketFlight, rocketNextSibling);
      }
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
      {packages ? <div data-packages-shell className="relative z-30">{packages}</div> : null}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-50 rounded-[9px] border-[7px] border-[#f7f8f4] sm:rounded-[12px] sm:border-[10px]"
      />
    </div>
  );
}
