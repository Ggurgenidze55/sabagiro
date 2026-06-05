'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { SectionDivider } from '@/components/SectionDivider';
import { INSTAGRAM_URL } from '@/lib/social';

const PILLARS = [
  {
    label: 'Night',
    text: 'Late hours. Low light. No compromise on sound — techno, electro, and the edges in between.',
  },
  {
    label: 'Concrete',
    text: 'Brutalist space — raw walls, warehouse scale, open air when the season allows.',
  },
  {
    label: 'Sound',
    text: 'Built for the room. Focus on the floor, not the feed.',
  },
] as const;

export function AboutPageContent() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      root.querySelectorAll('.about-reveal').forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );

    root.querySelectorAll('.about-reveal').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92) {
        el.classList.add('is-visible');
      } else {
        observer.observe(el);
      }
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="about-page" ref={rootRef}>
      <header className="about-hero about-reveal">
        <div className="about-hero__mark" aria-hidden="true">
          <Image
            src="/club/sabagiro-logo-2.png"
            alt=""
            width={200}
            height={119}
            className="about-hero__logo"
            priority
          />
        </div>
        <h1 className="page-title about-hero__title">ABOUT</h1>
        <p className="about-hero__tagline">
          <em>Night</em> · Concrete · Sound
        </p>
        <p className="page-lead about-hero__lead">Tbilisi · Georgia · Underground</p>
        <SectionDivider className="section-divider--first" />
      </header>

      <section className="about-block about-reveal" aria-labelledby="about-story">
        <h2 className="section-title" id="about-story">
          The room
        </h2>
        <p className="about-copy">
          Sabagiro is an underground club in Tbilisi — a brutalist venue for warehouse nights and open-air
          seasons. We keep the program tight, the door clear, and the system honest: buy a ticket, get a QR,
          walk in.
        </p>
        <p className="about-copy about-copy--muted">
          Doors 23:00. Exact pin shared with ticket holders before each event. No dress code theatre — respect
          the space, the crew, and the people on the floor.
        </p>
      </section>

      <section className="about-pillars" aria-label="What we stand for">
        <ul className="about-pillars__list">
          {PILLARS.map((pillar, i) => (
            <li
              key={pillar.label}
              className="about-pillar about-reveal"
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <SectionDivider index={i + 1} />
              <h3 className="about-pillar__label">{pillar.label}</h3>
              <p className="about-pillar__text">{pillar.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="about-block about-reveal" aria-labelledby="about-tickets">
        <SectionDivider />
        <h2 className="section-title" id="about-tickets">
          Tickets
        </h2>
        <p className="about-copy">
          Events and tiers live on the site. Verified accounts unlock checkout; each paid or complimentary ticket
          ships to email with a QR for the door.
        </p>
        <div className="about-cta">
          <Link href="/events" className="btn">
            BROWSE EVENTS
          </Link>
          <Link href="/location" className="btn btn--ghost">
            LOCATION
          </Link>
          <Link href="/contact" className="btn btn--ghost">
            CONTACT
          </Link>
        </div>
      </section>

      <footer className="about-foot about-reveal">
        <a
          href={INSTAGRAM_URL}
          className="about-foot__link"
          target="_blank"
          rel="noopener noreferrer"
        >
          @sabagirolisi
        </a>
        <span className="about-foot__sep" aria-hidden="true">
          ·
        </span>
        <Link href="/" className="about-foot__link">
          Home
        </Link>
      </footer>
    </div>
  );
}
