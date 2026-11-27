"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import CinematicIntro from "@/components/CinematicIntro";
import RocketScene from "@/components/3D/RocketScene";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Events", href: "#events" },
  { label: "Packages", href: "#packages" },
  { label: "Pricing", href: "#pricing" },
  { label: "Gallery", href: "#gallery" },
  { label: "Contact Us", href: "#contact" },
];

const socials = [
  {
    label: "Facebook",
    path: "M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5h1.65V3.6a22 22 0 0 0-2.4-.12c-2.4 0-4.05 1.46-4.05 4.15v2.27H7.5V13h2.75v8h3.25Z",
  },
  {
    label: "X",
    path: "M17.5 3h3.1l-6.77 7.74L21.8 21h-6.25l-4.9-6.4L4.95 21H1.84l7.24-8.28L1.5 3h6.4l4.43 5.86L17.5 3Zm-1.1 16.2h1.72L7.2 4.7H5.35l11.05 14.5Z",
  },
  {
    label: "Instagram",
    path: "M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.17.43.37 1.06.42 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.42 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.17-1.06.37-2.23.42-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.42a3.8 3.8 0 0 1-1.38-.9 3.8 3.8 0 0 1-.9-1.38c-.17-.43-.37-1.06-.42-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.42-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.17 1.06-.37 2.23-.42C8.42 2.21 8.8 2.2 12 2.2Zm0 3.05a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5Zm0 3.05a3.7 3.7 0 1 1 0 7.4 3.7 3.7 0 0 1 0-7.4Zm7.02-3.2a1.58 1.58 0 1 0 0 3.16 1.58 1.58 0 0 0 0-3.16Z",
  },
  {
    label: "Website",
    path: "M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-6.2l2.1 2.4h-2.7L11.5 17H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm1.2 2.2v7.6h13.6V6.2H5.2Zm2 2h9.6v1.4H7.2V8.2Zm0 2.8h6.4v1.4H7.2V11Z",
  },
];

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <CinematicIntro className="relative h-[100dvh] min-h-[560px] w-full overflow-hidden bg-[#f7f8f4] p-[7px] sm:p-[10px]">
      <section className="relative isolate h-full w-full overflow-hidden rounded-[9px] sm:rounded-[12px]">
        <Image
          src="/images/hero.png"
          alt="Woman in a pale astronaut suit with hands beside her gold-lit helmet, surrounded by teal mist"
          fill
          priority
          sizes="100vw"
          className="hero-image object-cover object-[58%_42%]"
        />
        <div className="hero-scrim pointer-events-none absolute inset-0" />

        {/* Three.js Rocket Visual */}
        <div className="pointer-events-none absolute right-[2%] top-[16%] z-[5] h-[42%] w-[52%] sm:right-[8%] sm:top-[15%] sm:h-[58%] sm:w-[44%] lg:right-[10%] lg:top-[18%] lg:h-[55%] lg:w-[45%]">
          <div className="pointer-events-auto h-full w-full">
            <RocketScene />
          </div>
        </div>

        <Image
          src="/images/logo.png"
          alt="Dilshan Fireworks"
          width={500}
          height={500}
          priority
          className="intro-element absolute left-[3%] top-[10%] z-20 hidden h-auto w-[86px] sm:left-[4%] sm:top-[4%] sm:w-[150px] lg:block"
        />

        <nav
          aria-label="Primary"
          data-desktop-nav
          className="intro-element absolute right-[2%] top-[4%] z-20 hidden items-center gap-0.5 rounded-full border border-white/70 bg-[#f7f8f4]/95 p-[5px] shadow-[0_10px_32px_rgba(6,28,34,0.3)] backdrop-blur-sm sm:gap-1 sm:p-[7px] lg:flex"
        >
          {navLinks.map((link, index) => (
            <a
              key={link.label}
              href={link.href}
              className={
                index === 0
                  ? "whitespace-nowrap rounded-full bg-gradient-to-b from-[#ebac6b] to-[#d5843f] px-2.5 py-[7px] text-[9px] font-semibold text-white shadow-[0_4px_12px_rgba(190,105,45,0.35)] sm:px-5 sm:py-2.5 sm:text-[12px]"
                  : "whitespace-nowrap rounded-full px-2 py-[7px] text-[9px] font-medium text-[#35515a] transition-colors hover:bg-[#35515a]/5 sm:px-4 sm:py-2.5 sm:text-[12px]"
              }
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div data-mobile-nav className="absolute inset-x-0 top-0 z-40 lg:hidden">
          <div className="intro-element flex items-center justify-between px-[4%] pt-[4%] sm:pt-[3%]">
            <a href="#home" onClick={closeMobile} className="relative z-[60] block">
              <Image
                src="/images/logo.png"
                alt="Dilshan Fireworks"
                width={500}
                height={500}
                priority
                className="h-auto w-[86px] sm:w-[110px]"
              />
            </a>
            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu-panel"
              onClick={() => setMobileOpen((v) => !v)}
              className="relative z-[60] flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-[#163b42]/35 text-white backdrop-blur-md transition-colors hover:bg-[#163b42]/50"
            >
              <span className="sr-only">{mobileOpen ? "Close menu" : "Open menu"}</span>
              <span className="relative h-4 w-5">
                <span
                  className={`absolute left-0 h-[1.5px] w-5 bg-current transition-all duration-300 ${mobileOpen ? "top-[7px] rotate-45" : "top-0"}`}
                />
                <span
                  className={`absolute left-0 top-[7px] h-[1.5px] w-5 bg-current transition-all duration-300 ${mobileOpen ? "opacity-0" : "opacity-100"}`}
                />
                <span
                  className={`absolute left-0 h-[1.5px] w-5 bg-current transition-all duration-300 ${mobileOpen ? "top-[7px] -rotate-45" : "top-[14px]"}`}
                />
              </span>
            </button>
          </div>
        </div>

        <div
          className={`fixed inset-0 z-[55] bg-[#081f24]/45 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
          onClick={closeMobile}
          aria-hidden="true"
        />

        <nav
          id="mobile-menu-panel"
          aria-label="Mobile navigation"
          className={`fixed inset-x-[4%] top-[calc(env(safe-area-inset-top,0px)+76px)] z-[60] origin-top rounded-[20px] border border-white/15 bg-[rgba(10,38,44,0.88)] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-300 sm:inset-x-auto sm:right-[4%] sm:w-[320px] lg:hidden ${mobileOpen ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-3 scale-[0.98] opacity-0"}`}
        >
          <div className="flex flex-col gap-1">
            {navLinks.map((link, index) => (
              <a
                key={link.label}
                href={link.href}
                onClick={closeMobile}
                className={
                  index === 0
                    ? "rounded-full bg-gradient-to-b from-[#ebac6b] to-[#d5843f] px-4 py-3 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(190,105,45,0.35)]"
                    : "rounded-full px-4 py-3 text-[13px] font-medium text-white/88 transition-colors hover:bg-white/10 hover:text-white"
                }
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>

        {/* Bottom left Content */}
        <div className="intro-element absolute bottom-[8%] left-[4%] z-10 w-[92%] sm:bottom-[8%] sm:w-[56%]">
          <div className="legible">
            <h1 className="font-head text-[clamp(1.9rem,6vw,2.7rem)] font-semibold leading-[1.04] tracking-[-0.025em] text-white sm:text-[clamp(2rem,4.6vw,4rem)]">
              Light Up Every
              <br />
              Celebration.
            </h1>
            <div className="mt-4 hidden h-px w-[76%] bg-gradient-to-r from-white/45 via-white/20 to-transparent sm:block" />
            <p className="mt-4 max-w-[330px] text-[12px] leading-[1.7] text-white/85 sm:mt-5 sm:text-[14px]">
              From family gatherings to grand festivals across Sri Lanka, Dilshan Fireworks creates dazzling displays with safe, hand-picked
              fireworks. We turn every celebration into a night people remember.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2.5 sm:mt-8">
            <a
              href="#packages"
              className="rounded-full bg-gradient-to-b from-[#ebac6b] to-[#d5843f] px-5 py-[10px] text-[10px] font-semibold text-white shadow-[0_6px_18px_rgba(190,105,45,0.35)] transition-transform hover:-translate-y-0.5 sm:text-[11px]"
            >
              Explore Fireworks
            </a>
            <a
              href="#contact"
              className="rounded-full border border-white/30 bg-white/20 px-5 py-[10px] text-[10px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30 sm:text-[11px]"
            >
              Get a Quote
            </a>
          </div>
        </div>

        {/* Top right card */}
        <aside className="intro-element absolute right-[4%] top-[18%] z-20 hidden w-[184px] rounded-[14px] bg-[#f8faf7] p-3 shadow-[0_10px_30px_rgba(6,28,34,0.25)] sm:block lg:w-[210px]">
          <div className="overflow-hidden rounded-[8px]">
            <Image
              src="/images/hero.png"
              alt="Astronaut portrait"
              width={200}
              height={112}
              className="h-[96px] w-full object-cover object-[54%_38%] lg:h-[110px]"
            />
          </div>
          <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#4d9c99] text-white shadow-[0_3px_10px_rgba(6,28,34,0.3)]">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current stroke-2">
              <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="mt-3 px-0.5 text-[10px] leading-[1.5] text-[#33484f] lg:text-[12px]">
            From intimate family gatherings to grand village festivals, every display is tailored to your moment with safe, brilliant fireworks.
          </p>
        </aside>

        {/* Bottom rignt corner */}
        <aside className="intro-element absolute right-[4%] top-[42%] z-20 hidden w-[176px] rounded-[14px] border border-white/25 bg-white/15 p-5 backdrop-blur-md sm:bottom-[16%] sm:top-auto sm:block sm:w-[224px] sm:p-6">
          <p className="text-[30px] font-semibold leading-none tracking-tight text-white legible lg:text-[40px]">100+</p>
          <p className="mt-3 text-[10px] leading-[1.55] text-white/90 legible lg:text-[12px]">
            Celebrations lit up across Sri Lanka with safe, spectacular fireworks.
          </p>
          <a href="#contact" className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-semibold text-white legible lg:text-[12px]">
            Get a Quote
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current stroke-2">
              <path d="M4 12h15m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </aside>

        <div className="intro-element absolute bottom-[5%] right-[4%] z-20 flex gap-2">
          {socials.map((social) => (
            <a
              key={social.label}
              href="#social"
              aria-label={social.label}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/65 sm:h-9 sm:w-9"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current sm:h-[18px] sm:w-[18px]">
                <path d={social.path} />
              </svg>
            </a>
          ))}
        </div>
      </section>
    </CinematicIntro>
  );
}
