const logos = [
  { file: 'excellsior.png', alt: 'ExCELLsior',                           href: 'https://excelscior.uc.pt/',       cls: 'footer__logo-card--excellsior' },
  { file: 'cnc.svg',        alt: 'CNC',                                  href: 'https://cnc.uc.pt/en',            cls: '' },
  { file: 'cibb.svg',       alt: 'CIBB',                                 href: 'https://cibb.uc.pt/en',           cls: '' },
  { file: 'bih.svg',        alt: 'Berlin Institute of Health',           href: 'https://www.bihealth.org/en/',    cls: 'footer__logo-card--bih' },
  { file: 'charite.svg',    alt: 'Charité – Universitätsmedizin Berlin', href: 'https://www.charite.de/en/',      cls: '' },
]

export default function Footer() {
  return (
    <div className="footer" style={{ marginTop: 36 }}>
      <div className="footer__logos">
        <div className="footer__label">Funded by</div>
        {logos.map(({ file, alt, href, cls }) => (
          <a key={file} href={href} target="_blank" rel="noreferrer" className={`footer__logo-card ${cls}`}>
            <img src={`${import.meta.env.BASE_URL}logos/${file}`} alt={alt} />
          </a>
        ))}
      </div>
    </div>
  )
}
