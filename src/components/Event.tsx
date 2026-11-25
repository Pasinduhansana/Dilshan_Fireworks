"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const chapters = [
  {
    kicker: "For the people closest to you",
    title: "Family gatherings",
    copy: "The small moments deserve the same care as the big ones. Hand-picked fireworks and a display shaped around the people you are celebrating with.",
    image: "/images/fw-30048038.jpg",
    alt: "Orange and blue firework blooming against a deep night sky",
    portrait: true,
  },
  {
    kicker: "For the whole neighbourhood",
    title: "Village festivals",
    copy: "A night that brings everyone out. Brilliant colour, careful planning and fireworks chosen to fit the spirit of the celebration.",
    image: "/images/fw-32974947.jpg",
    alt: "Wide golden firework burst radiating across a dark sky",
    portrait: false,
  },
  {
    kicker: "For the moments that matter most",
    title: "Grand celebrations",
    copy: "When the occasion calls for something unforgettable, the display is built around the moment you want everyone to remember.",
    image: "/images/fw-33689354.jpg",
    alt: "Blue and gold fireworks filling the night sky",
    portrait: false,
  },
];

const promises = ["Hand-picked fireworks", "Displays tailored to the occasion", "Safe, spectacular celebrations"];

export default function Event() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = root.current;
    if (!section || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      section.querySelectorAll<HTMLElement>(".event-chapter").forEach((chapter) => {
        const pieces = chapter.querySelectorAll<HTMLElement>(".event-chapter__reveal");
        if (!pieces.length) return;

        gsap.set(pieces, { opacity: 0, filter: "blur(16px)" });
        gsap.to(pieces, {
          opacity: 1,
          filter: "blur(0px)",
          duration: 1.15,
          ease: "power2.out",
          stagger: 0.12,
          scrollTrigger: {
            trigger: chapter,
            start: chapter.tagName === "HEADER" ? "top 15%" : "top 82%",
            once: true,
          },
        });
      });
    }, section);

    return () => context.revert();
  }, []);

  return (
    <section id="events" ref={root} aria-labelledby="events-title" className="relative text-white">
      <div className="relative mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-8 sm:py-8 lg:px-12">
        <div className="rounded-[20px] border border-white/15 bg-[rgba(7,26,32,0.28)] px-6 py-12 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-[22px] sm:px-10 sm:py-16 lg:px-16">
          <header className="event-chapter relative flex min-h-[72vh] flex-col justify-center pb-14 pt-24 sm:pb-20 sm:pt-28 lg:min-h-[88vh]">
          <div
            aria-hidden="true"
            className="event-chapter__reveal pointer-events-none absolute right-0 top-[20vh] hidden h-[60vh] w-[34vw] max-w-[480px] overflow-hidden rounded-[12px] opacity-60 lg:block"
          >
            <Image src="/images/fw-33689354.jpg" alt="" fill sizes="34vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#071a20] via-[#071a20]/35 to-transparent" />
          </div>
          <div className="relative z-10">
            <div className="event-chapter__reveal flex items-center gap-4">
              <span className="h-px w-12 bg-[#df914c]" />
              <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/60">Events &amp; displays</span>
            </div>
            <h2
              id="events-title"
              className="event-chapter__reveal mt-7 max-w-[13ch] font-head text-[clamp(2.6rem,7vw,6rem)] font-semibold leading-[0.94] tracking-[-0.045em]"
            >
              The night is yours to shape.
            </h2>
            <p className="event-chapter__reveal mt-8 max-w-[34rem] text-[14px] leading-[1.85] text-white/70 sm:text-[17px]">
              From family gatherings to grand village festivals, every display is tailored to your moment with safe, brilliant fireworks.
            </p>
            <div className="event-chapter__reveal mt-12 flex items-center gap-3 text-[10px] uppercase tracking-[0.26em] text-white/45">
              <span>Explore the collection</span>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.5]">
                <path d="M12 4v15m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </header>

        <div className="border-t border-white/10">
          {chapters.map((chapter, index) => (
            <article
              key={chapter.title}
              className="event-chapter grid gap-9 border-b border-white/10 py-16 sm:py-24 lg:grid-cols-2 lg:items-center lg:gap-20"
            >
              <div
                className={`event-chapter__reveal group relative overflow-hidden rounded-[10px] ${
                  chapter.portrait ? "aspect-[4/5] lg:aspect-[4/5]" : "aspect-[5/4] lg:aspect-[16/11]"
                } ${index % 2 === 1 ? "lg:order-2" : ""}`}
              >
                <Image
                  src={chapter.image}
                  alt={chapter.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.05]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#041015]/50 via-transparent to-transparent" />
                <span className="absolute bottom-5 left-5 h-px w-16 bg-[#df914c]" />
              </div>

              <div className={`event-chapter__reveal ${index % 2 === 1 ? "lg:order-1" : ""}`}>
                <span className="text-[10px] font-medium uppercase tracking-[0.26em] text-[#e0a367]">{chapter.kicker}</span>
                <h3 className="mt-5 font-head text-[clamp(1.9rem,4vw,3.4rem)] font-semibold leading-[1.05] tracking-[-0.035em]">
                  {chapter.title}
                </h3>
                <div className="mt-7 h-px w-24 bg-white/25" />
                <p className="mt-7 max-w-[30rem] text-[14px] leading-[1.85] text-white/70 sm:text-[15px]">{chapter.copy}</p>
              </div>
            </article>
          ))}
        </div>

        <section className="event-chapter mt-12 rounded-[14px] border border-white/10 bg-white/[0.06] px-6 py-14 sm:mt-16 sm:px-12 sm:py-20">
          <div className="event-chapter__reveal flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between lg:gap-20">
            <div>
              <span className="text-[10px] font-medium uppercase tracking-[0.26em] text-[#e0a367]">What we do</span>
              <h3 className="mt-5 max-w-[19ch] font-head text-[clamp(2rem,4.6vw,3.6rem)] font-semibold leading-[1.05] tracking-[-0.035em]">
                A display built around your moment.
              </h3>
            </div>
            <ul className="grid gap-5 text-[13px] leading-relaxed text-white/70 sm:grid-cols-3 lg:max-w-[44rem]">
              {promises.map((promise) => (
                <li key={promise} className="border-t border-white/20 pt-4">
                  {promise}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <footer className="event-chapter flex min-h-[56vh] flex-col justify-center py-20">
          <p className="event-chapter__reveal max-w-[18ch] font-head text-[clamp(2.2rem,6vw,4.8rem)] font-semibold leading-[1.02] tracking-[-0.04em]">
            Every celebration deserves its own sky.
          </p>
          <a
            href="#home"
            className="event-chapter__reveal mt-10 inline-flex w-fit items-center gap-3 border-b border-white/35 pb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-white/80 transition-colors hover:border-[#df914c] hover:text-white"
          >
            Back to the beginning
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.5]">
              <path d="M12 20V5m-6 6 6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          </footer>
        </div>
      </div>
    </section>
  );
}
