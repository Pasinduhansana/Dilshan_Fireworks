"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import birthdayImage from "../../public/images/events/birthday.jpg";
import corporateImage from "../../public/images/events/corporate.jpg";
import cricketImage from "../../public/images/events/cricket.jpg";
import festivalImage from "../../public/images/events/festival.jpg";
import musicImage from "../../public/images/events/music.jpg";
import weddingImage from "../../public/images/events/wedding.jpg";

gsap.registerPlugin(ScrollTrigger);

const categories = [
  {
    title: "Weddings",
    line: "For the moment the sky joins the celebration.",
    image: weddingImage,
    alt: "Newlyweds beneath sparklers and a shower of fireworks",
    span: "col-span-2 lg:col-span-7 lg:row-span-2",
  },
  {
    title: "Musical Shows",
    line: "For the songs you feel more than hear.",
    image: musicImage,
    alt: "Concert crowd beneath red pyrotechnic fireworks and stage lights",
    span: "lg:col-span-5",
  },
  {
    title: "Cricket Matches",
    line: "For the last ball under the floodlights.",
    image: cricketImage,
    alt: "Floodlit cricket stadium filled with spectators at night",
    span: "lg:col-span-5",
  },
  {
    title: "Birthday Parties",
    line: "For one more wish, and one bigger spark.",
    image: birthdayImage,
    alt: "Friends gathered around a birthday cake with lit candles",
    span: "lg:col-span-4",
  },
  {
    title: "Corporate Events",
    line: "For the night after the final keynote.",
    image: corporateImage,
    alt: "Speaker addressing an audience at a corporate conference",
    span: "lg:col-span-4",
  },
  {
    title: "Festivals",
    line: "For a sky that belongs to everyone.",
    image: festivalImage,
    alt: "Crowd watching a brilliant fireworks display at a night festival",
    span: "lg:col-span-4",
  },
];

export default function Event() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = root.current;
    if (!section || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cleanups: Array<() => void> = [];

    const context = gsap.context(() => {
      section.querySelectorAll<HTMLElement>(".event-chapter").forEach((chapter) => {
        const pieces = chapter.querySelectorAll<HTMLElement>(".event-chapter__reveal");
        if (!pieces.length) return;

        gsap.set(pieces, { opacity: 0, filter: "blur(24px)" });
        gsap.to(pieces, {
          opacity: 1,
          filter: "blur(0px)",
          duration: 1.4,
          ease: "power2.out",
          stagger: 0.15,
          scrollTrigger: {
            trigger: chapter,
            start: chapter.tagName === "HEADER" ? "top 15%" : "top 85%",
            once: true,
          },
        });
      });

      section.querySelectorAll<HTMLElement>(".event-tile").forEach((tile) => {
        const media = tile.querySelector<HTMLElement>(".event-tile__media");
        const image = tile.querySelector<HTMLElement>(".event-tile__media img");
        const line = tile.querySelector<HTMLElement>(".event-tile__line");
        const copy = tile.querySelectorAll<HTMLElement>(".event-tile__title, .event-tile__copy");
        if (!media || !image || !line) return;

        gsap.set(media, { clipPath: "inset(100% 0% 0% 0%)", scale: 1.14, yPercent: -5 });
        gsap.set([...copy, line], { opacity: 0, filter: "blur(12px)" });

        gsap
          .timeline({ scrollTrigger: { trigger: tile, start: "top 88%", once: true } })
          .to(media, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.15, ease: "power3.out" })
          .to([...copy, line], { opacity: 1, filter: "blur(0px)", duration: 0.9, stagger: 0.1, ease: "power2.out" }, 0.3);

        gsap.to(media, {
          yPercent: 5,
          ease: "none",
          scrollTrigger: { trigger: tile, start: "top bottom", end: "bottom top", scrub: true },
        });

        const onEnter = () => {
          gsap.to(image, { scale: 1.12, duration: 0.9, ease: "power3.out", overwrite: "auto" });
          gsap.to(line, { width: 72, duration: 0.6, ease: "power3.out", overwrite: "auto" });
        };
        const onLeave = () => {
          gsap.to(image, { scale: 1, duration: 0.9, ease: "power3.out", overwrite: "auto" });
          gsap.to(line, { width: 40, duration: 0.5, ease: "power3.inOut", overwrite: "auto" });
        };
        tile.addEventListener("mouseenter", onEnter);
        tile.addEventListener("mouseleave", onLeave);
        cleanups.push(() => {
          tile.removeEventListener("mouseenter", onEnter);
          tile.removeEventListener("mouseleave", onLeave);
        });
      });
    }, section);

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      context.revert();
    };
  }, []);

  return (
    <section id="events" ref={root} aria-labelledby="events-title" className="relative text-white">
      <div className="relative w-full py-5 sm:py-8">
        <div className="w-full border-y border-white/15 bg-[rgba(7,26,32,0.28)] px-6 py-12 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-[22px] sm:px-10 sm:py-16 lg:px-16">
          <div className="mx-auto w-full max-w-[1360px]">
            <header className="event-chapter flex min-h-[52vh] flex-col justify-center pb-12 pt-16 lg:min-h-[62vh] lg:pb-16 lg:pt-20">
              <div className="event-chapter__reveal flex items-center gap-4">
                <span className="h-px w-12 bg-[#df914c]" />
                <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/60">Events &amp; displays</span>
              </div>
              <h2
                id="events-title"
                className="event-chapter__reveal mt-6 max-w-[14ch] font-head text-[clamp(2.6rem,7vw,6rem)] font-semibold leading-[0.94] tracking-[-0.045em]"
              >
                The night is yours to shape.
              </h2>
              <p className="event-chapter__reveal mt-6 max-w-[34rem] text-[14px] leading-[1.85] text-white/70 sm:text-[16px]">
                From weddings and village festivals to cricket nights and grand celebrations, every display is tailored to your moment with safe,
                brilliant fireworks.
              </p>
            </header>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-12 lg:auto-rows-[minmax(170px,23vh)]">
              {categories.map((category) => (
                <article
                  key={category.title}
                  className={`event-tile group relative overflow-hidden rounded-[10px] aspect-[4/3] lg:aspect-auto ${category.span}`}
                >
                  <div className="event-tile__media absolute inset-0 overflow-hidden">
                    <Image
                      src={category.image}
                      alt={category.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#041015]/90 via-[#041015]/25 to-transparent" />
                  <div className="pointer-events-none absolute inset-0 rounded-[10px] ring-1 ring-inset ring-white/10 transition-colors duration-500 group-hover:ring-[#df914c]/50" />
                  <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-6">
                    <span className="event-tile__line block h-px w-10 bg-[#df914c]" />
                    <h3 className="event-tile__title mt-3 font-head text-[clamp(1.15rem,2vw,2rem)] font-semibold leading-tight tracking-[-0.03em]">
                      {category.title}
                    </h3>
                    <p className="event-tile__copy mt-1.5 text-[11px] leading-relaxed text-white/70 sm:text-[12px]">{category.line}</p>
                  </div>
                </article>
              ))}
            </div>

            <footer className="event-chapter flex flex-col justify-center gap-6 py-14 lg:flex-row lg:items-end lg:justify-between lg:py-20">
              <p className="event-chapter__reveal max-w-[20ch] font-head text-[clamp(1.9rem,5vw,3.8rem)] font-semibold leading-[1.04] tracking-[-0.04em]">
                Every celebration deserves its own sky.
              </p>
              <a
                href="#home"
                className="event-chapter__reveal inline-flex w-fit items-center gap-3 border-b border-white/35 pb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-white/80 transition-colors hover:border-[#df914c] hover:text-white"
              >
                Back to the beginning
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.5]">
                  <path d="M12 20V5m-6 6 6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </footer>
          </div>
        </div>
      </div>
    </section>
  );
}
