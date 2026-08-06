import type { LegalSection } from '@/lib/legal/terms';

export function LegalSections({ sections }: { sections: LegalSection[] }) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.title} className="info-page__block">
          <h2 className="section-title">{section.title}</h2>
          {section.paragraphs.map((p, i) => (
            <p key={`${section.title}-p-${i}`} className="info-page__copy">
              {p}
            </p>
          ))}
          {section.bullets?.length ? (
            <ul className="info-page__list">
              {section.bullets.map((item, i) => (
                <li key={`${section.title}-b-${i}`}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </>
  );
}
