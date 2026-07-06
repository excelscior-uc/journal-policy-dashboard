import CollapsibleHomeSection from './CollapsibleHomeSection'

const OPERATORS = [
  {
    name: 'Yazid Zalai',
    orcid: '0009-0006-0550-5974',
    org: 'Berlin Institute of Health at Charité – Universitätsmedizin Berlin',
    addr: 'Charitéplatz 1, 10117 Berlin, Germany',
    href: 'https://www.bihealth.org/en/',
    email: 'yazid.zalai.yazid@gmail.com',
    responsible: false,
  },
  {
    name: 'Teresa Cunha-Oliveira',
    orcid: '0000-0002-7382-0339',
    org: 'Instituto de Investigação Clínica e Biomédica de Coimbra (CIBB), Universidade de Coimbra',
    addr: 'Coimbra, Portugal',
    href: 'https://cibb.uc.pt/en',
    email: 'teresa.oliveira@cnc.uc.pt',
    responsible: true,
  },
]

const CONTACT_EMAIL = OPERATORS.find((o) => o.responsible).email

const PROJECT_LINKS = [
  {
    label: 'Source code',
    text: 'github.com/excelscior-uc/journal-policy-dashboard',
    href: 'https://github.com/excelscior-uc/journal-policy-dashboard',
    note: 'GNU GPL v3.0 or later',
  },
  {
    label: 'Data & analysis',
    text: 'osf.io/tcyxg',
    href: 'https://osf.io/tcyxg/overview',
  },
  {
    label: 'Archived release',
    text: 'doi.org/10.5281/zenodo.20084061',
    href: 'https://doi.org/10.5281/zenodo.20084061',
  },
]

export default function Impressum() {
  return (
    <CollapsibleHomeSection
      sectionClassName="impressum-section"
      panelClassName="impressum-section__body"
      headingId="impressum-heading"
      panelId="impressum-panel"
      title="Impressum & Contact"
      defaultOpen={false}
    >
      <p>
        Legal notice pursuant to § 5 DDG (Digitale-Dienste-Gesetz) and § 18 (2) MStV. This dashboard is a
        non-commercial academic research project operated jointly by the authors below.
      </p>

      <h4 className="impressum-section__subhead">Operators</h4>
      <ul className="impressum-section__ops">
        {OPERATORS.map((o) => (
          <li key={o.orcid} className="impressum-section__op">
            <div className="impressum-section__op-name">
              {o.name}
              {o.responsible && (
                <span className="impressum-section__badge">responsible for content</span>
              )}
            </div>
            <div className="impressum-section__op-org">
              <a href={o.href} target="_blank" rel="noreferrer">{o.org}</a>
            </div>
            <div className="impressum-section__op-addr">{o.addr}</div>
            <div className="impressum-section__op-email">
              Email: <a href={`mailto:${o.email}`}>{o.email}</a>
            </div>
            <div className="impressum-section__op-orcid">
              ORCID:{' '}
              <a href={`https://orcid.org/${o.orcid}`} target="_blank" rel="noreferrer">{o.orcid}</a>
            </div>
          </li>
        ))}
      </ul>

      <h4 className="impressum-section__subhead">Contact</h4>
      <p>
        Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>

      <h4 className="impressum-section__subhead">Project & source</h4>
      <div className="impressum-section__cards">
        {PROJECT_LINKS.map((p) => (
          <a
            key={p.href}
            href={p.href}
            target="_blank"
            rel="noreferrer"
            className="impressum-section__card"
          >
            <span className="impressum-section__card-label">{p.label}</span>
            <span className="impressum-section__card-url">{p.text}</span>
            {p.note && <span className="impressum-section__card-note">{p.note}</span>}
          </a>
        ))}
      </div>

      <h4 className="impressum-section__subhead">Disclaimer</h4>
      <p>
        The content of this dashboard is provided for research and educational purposes with the greatest possible
        care, but no guarantee is given as to its accuracy, completeness, or timeliness. Figure classifications are
        produced automatically and may contain errors. External links point to third-party sites for whose content
        the respective operators are solely responsible.
      </p>
    </CollapsibleHomeSection>
  )
}
