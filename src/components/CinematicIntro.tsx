"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

type CinematicIntroProps = {
  children: ReactNode;
  className?: string;
};

export default function CinematicIntro({ children, className }: CinematicIntroProps) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!root.current) return;

    const context = gsap.context(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(".hero-image", { scale: 1 });
        gsap.set(".intro-element", { opacity: 1, filter: "blur(0px)", y: 0 });
        return;
      }

      const timeline = gsap.timeline();

      timeline
        .fromTo(
          ".hero-image",
          { scale: 1.1 },
          { scale: 1, duration: 2.4, ease: "power2.out" },
          0,
        )
        .fromTo(
          ".intro-element",
          { opacity: 0, filter: "blur(18px)", y: 28 },
          {
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            duration: 1.3,
            stagger: 0.16,
            ease: "power3.out",
          },
          0.8,
        );
    }, root);

    return () => context.revert();
  }, []);

  return (
    <main ref={root} className={className}>
      {children}
    </main>
  );
}
